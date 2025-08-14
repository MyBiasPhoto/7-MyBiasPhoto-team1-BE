import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import KakaoStrategy from 'passport-kakao';
import UserRepository from '../user/repository.js';
import 'dotenv/config';

const userRepo = new UserRepository();

async function upsertSocialUser({ provider, providerId, email, nickname }) {
  let user = await userRepo.findByProvider(provider, providerId);
  if (user) return user;

  if (email) {
    const byEmail = await userRepo.findUserByEmail(email);
    if (byEmail) {
      user = await userRepo.linkProvider(byEmail.id, { provider, providerId });
      return user;
    }
  }

  const safeEmail = email || `${provider}_${providerId}@no-email.local`;
  const nick = nickname || (email ? email.split('@')[0] : `${provider}_${providerId}`);
  const created = await userRepo.createUser({
    email: safeEmail,
    password: null,
    nickname: nick,
    provider,
    providerId,
  });

  return await userRepo.findUserById(created.id);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value ?? null;
        const nickname = profile.displayName;
        const user = await upsertSocialUser({
          provider: 'GOOGLE',
          providerId: String(profile.id),
          email,
          nickname,
        });
        return done(null, { id: user.id, nickname: user.nickname, points: user.points });
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Kakao
// passport.use(
//   new KakaoStrategy(
//     {
//       clientID: process.env.KAKAO_CLIENT_ID,
//       clientSecret: process.env.KAKAO_CLIENT_SECRET,
//       callbackURL: process.env.KAKAO_CALLBACK_URL,
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const email = profile._json?.kakao_account?.email ?? null;
//         const nickname =
//           profile.displayName ||
//           profile.username ||
//           profile._json?.kakao_account?.profile?.nickname ||
//           'KakaoUser';
//         const user = await upsertSocialUser({
//           provider: 'KAKAO',
//           providerId: String(profile.id),
//           email,
//           nickname,
//         });
//         return done(null, { id: user.id, nickname: user.nickname, points: user.points });
//       } catch (err) {
//         return done(err);
//       }
//     }
//   )
// );

export default passport;
