import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshJWT,
  parseExpiresToMs,
  REFRESH_TTL,
  verifyRefreshJWT,
} from '../../common/utils/jwt.js';
import { throwApiError } from '../../common/utils/throwApiErrors.js';
import { generateOpaqueId, generateOpaqueToken } from '../../common/utils/opaque.js';

const STRATEGY = (process.env.REFRESH_STRATEGY ?? 'rotation').toLowerCase(); // 'rotation' | 'sliding' | 'both'
const IS_BOTH = STRATEGY === 'both';
const REFRESH_TTL_MS = parseExpiresToMs(REFRESH_TTL);

class AuthService {
  constructor(authRepository, userRepository) {
    this.authRepository = authRepository;
    this.userRepository = userRepository;
  }

  createUser = async ({ email, password, nickname }) => {
    const existingUser = await this.userRepository.findUserByEmail(email);
    if (existingUser) throwApiError('AUTH_EMAIL_TAKEN', '이미 등록된 이메일 주소 입니다.', 409);

    const hashedPassword = await bcrypt.hash(password, 14);

    const newUser = await this.userRepository.createUser({
      email,
      password: hashedPassword,
      nickname,
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  };

  login = async ({ email, password: passwordInput, ctx, preferredStrategy }) => {
    const existingUser = await this.userRepository.findUserByEmail(email);
    if (!existingUser)
      throwApiError('AUTH_EMAIL_NOT_FOUND', '등록되지 않은 이메일 주소 입니다.', 404);

    const { password: storedPassword } = existingUser;
    const isMatch = await bcrypt.compare(passwordInput, storedPassword);
    if (!isMatch) throwApiError('AUTH_INVALID_CREDENTIALS', '비밀번호가 일치하지 않습니다.', 401);

    const user = {
      id: existingUser.id,
      nickname: existingUser.nickname,
      points: existingUser.points,
    };
    const accessToken = generateAccessToken(user);
    const mode = IS_BOTH ? (preferredStrategy === 'sliding' ? 'sliding' : 'rotation') : STRATEGY;

    if (mode === 'rotation') {
      const { token: refreshToken, jti } = generateRefreshJWT(user);
      await this.authRepository.saveRotationRT({
        userId: user.id,
        jti,
        refreshToken,
        userAgent: ctx?.userAgent,
        ip: ctx?.ip,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      });
      return { user, accessToken, refreshToken };
    }

    // Sliding
    const refreshToken = generateOpaqueToken();
    const opaqueId = generateOpaqueId();
    await this.authRepository.saveSlidingRT({
      userId: user.id,
      opaqueId,
      refreshToken,
      userAgent: ctx?.userAgent,
      ip: ctx?.ip,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    return { user, accessToken, refreshToken, opaqueId };
  };

  refresh = async ({ refreshTokenRaw, opaqueId, ctx }) => {
    if (!refreshTokenRaw) {
      throwApiError('AUTH_RT_MISSING', 'refreshToken이 존재하지 않습니다.', 401);
    }

    if (IS_BOTH) {
      const isJWT = refreshTokenRaw.split('.').length === 3;
      return isJWT
        ? this._refreshRotation({ refreshTokenRaw, ctx })
        : this._refreshSliding({ refreshTokenRaw, opaqueId, ctx });
    }

    return STRATEGY === 'rotation'
      ? this._refreshRotation({ refreshTokenRaw, ctx })
      : this._refreshSliding({ refreshTokenRaw, opaqueId, ctx });
  };

  // Rotation
  _refreshRotation = async ({ refreshTokenRaw, ctx }) => {
    let decoded;
    try {
      decoded = verifyRefreshJWT(refreshTokenRaw);
    } catch {
      throwApiError('AUTH_RT_INVALID', '유효하지 않은 refreshToken입니다.', 401);
    }

    const record = await this.authRepository.findByJti(decoded.jti);
    // 토큰 탈취 의심 시 모든 세션 폐기
    if (!record || record.revoked) {
      await this.authRepository.revokeAllByUser(decoded.id);
      throwApiError(
        'AUTH_RT_REUSE',
        'refreshToken 재사용이 감지되어 모든 세션이 만료되었습니다.',
        401
      );
    }

    const match = await this.authRepository.isSameRawToken(record.hashed, refreshTokenRaw);
    if (!match) {
      await this.authRepository.revokeAllByUser(decoded.id);
      throwApiError(
        'AUTH_RT_TAMPER',
        'refreshToken 서명 불일치가 감지되어 모든 세션이 만료되었습니다.',
        401
      );
    }

    const user = { id: decoded.id, nickname: decoded.nickname, points: decoded.points };
    const accessToken = generateAccessToken(user);
    const { token: newRT, jti: newJti } = generateRefreshJWT(user);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await this.authRepository.rotateRTAtomic({
      oldId: record.id,
      userId: user.id,
      newJti,
      newToken: newRT,
      userAgent: ctx?.userAgent,
      ip: ctx?.ip,
      expiresAt,
    });

    return { user, accessToken, refreshToken: newRT };
  };

  //Sliding 토큰 고정, 만료 연장
  _refreshSliding = async ({ refreshTokenRaw, opaqueId }) => {
    if (!opaqueId) throwApiError('AUTH_OPAQUE_MISSING', 'opaqueId가 누락되었습니다.', 400);

    const record = await this.authRepository.findByOpaqueId(opaqueId);
    if (!record || record.revoked)
      throwApiError('AUTH_SESSION_INVALID', '유효하지 않은 세션입니다.', 401);

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.authRepository.revokeById(record.id);
      throwApiError('AUTH_SESSION_EXPIRED', '세션이 만료되었습니다.', 401);
    }

    const match = await this.authRepository.isSameRawToken(record.hashed, refreshTokenRaw);
    if (!match) {
      await this.authRepository.revokeAllByUser(record.userId);
      throwApiError(
        'AUTH_SESSION_REUSE',
        '세션 재사용이 감지되어 모든 세션이 만료되었습니다.',
        401
      );
    }

    // 만료 연장
    await this.authRepository.updateSlidingOnUse(record.id, { extendsMs: REFRESH_TTL_MS });

    const userRow = await this.userRepository.findUserById(record.userId);
    const user = { id: userRow.id, nickname: userRow.nickname, points: userRow.points };
    const accessToken = generateAccessToken(user);

    return { user, accessToken, refreshToken: refreshTokenRaw, opaqueId };
  };

  logout = async ({ refreshTokenRaw, jti, opaqueId }) => {
    if (STRATEGY === 'rotation') {
      if (!refreshTokenRaw || !jti) return;
      await this.authRepository.revokeByJti(jti);
      return;
    }
    if (!opaqueId) return;
    const rec = await this.authRepository.findByOpaqueId(opaqueId);
    if (rec) await this.authRepository.revokeById(rec.id);
  };

  issueTokensForUser = async (userPayload, { ctx, preferredStrategy }) => {
    const user = { id: userPayload.id, nickname: userPayload.nickname, points: userPayload.points };
    const accessToken = generateAccessToken(user);
    const mode = IS_BOTH ? (preferredStrategy === 'sliding' ? 'sliding' : 'rotation') : STRATEGY;

    if (mode === 'rotation') {
      const { token: refreshToken, jti } = generateRefreshJWT(user);
      await this.authRepository.saveRotationRT({
        userId: user.id,
        jti,
        refreshToken,
        userAgent: ctx?.userAgent,
        ip: ctx?.ip,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      });
      return { user, accessToken, refreshToken };
    }
    const refreshToken = generateOpaqueToken();
    const opaqueId = generateOpaqueId();
    await this.authRepository.saveSlidingRT({
      userId: user.id,
      opaqueId,
      refreshToken,
      userAgent: ctx?.userAgent,
      ip: ctx?.ip,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    return { user, accessToken, refreshToken, opaqueId };
  };
}

export default AuthService;
