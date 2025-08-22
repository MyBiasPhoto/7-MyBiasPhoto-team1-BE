import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../../common/utils/prisma.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidates = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env'),
];

let loadedEnv = null;
for (const p of envCandidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedEnv = p;
    break;
  }
}
console.log('[ENV] loaded from:', loadedEnv);

const REQUIRED = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET'];
for (const k of REQUIRED) {
  if (!process.env[k]) throw new Error(`Missing env ${k}`);
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const MAX_UPLOAD_MB = Number(process.env.S3_MAX_UPLOAD_MB || 10);
const CACHE_SECONDS = Number(process.env.S3_CACHE_SECONDS || 60 * 60 * 24 * 365);
const EXPIRES = Number(process.env.S3_PRESIGN_EXPIRES) || 60;

// 값 동일 해야 함
const MONTHLY_LIMIT = 35;

function nowMY() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

async function getMonthlyStatus(userId) {
  const { month, year } = nowMY();
  const rec = await prisma.cardCreationLimit.findUnique({
    where: { userId_month_year: { userId: Number(userId), month, year } },
  });
  const created = rec?.created || 0;
  const remaining = Math.max(MONTHLY_LIMIT - created, 0);
  return { created, remaining, limit: MONTHLY_LIMIT };
}

router.get('/quota', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId 필요' });
    const monthly = await getMonthlyStatus(userId);
    return res.json({ monthly });
  } catch (e) {
    console.error('[quota ERROR]', e);
    return res.status(500).json({ message: 'quota 조회 실패' });
  }
});

router.delete('/object', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ message: 'key 필요' });

    const allowedPrefix = process.env.S3_UPLOAD_PREFIX || 'photocards/';
    if (!String(key).startsWith(allowedPrefix)) {
      return res.status(400).json({ message: '허용된 prefix만 삭제 가능' });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: String(key),
      })
    );
    return res.status(204).end();
  } catch (e) {
    console.error('[delete object ERROR]', e);
    return res.status(500).json({ message: '삭제 실패' });
  }
});

router.get('/s3-url', async (req, res) => {
  try {
    const { contentType, size, sha256, userId } = req.query;
    const sizeNum = Number(size || 0);

    if (!userId) {
      return res.status(400).json({ message: 'userId 필요' });
    }

    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ message: 'contentType=image/* 필요' });
    }
    if (!sizeNum || Number.isNaN(sizeNum)) {
      return res.status(400).json({ message: '파일 크기(size)가 필요' });
    }
    if (sizeNum > MAX_UPLOAD_MB * 1024 * 1024) {
      return res.status(413).json({ message: `파일이 너무 큽니다 (최대 ${MAX_UPLOAD_MB}MB)` });
    }
    const monthly = await getMonthlyStatus(userId);
    if (monthly.remaining <= 0) {
      return res.status(409).json({
        message: '이번 달 생성 한도를 초과했습니다.',
        monthly,
      });
    }

    console.log(
      '[presign] ct=',
      contentType,
      'region=',
      process.env.AWS_REGION,
      'bucket=',
      process.env.S3_BUCKET
    );

    console.log(
      '[presign] has keys?',
      !!process.env.AWS_ACCESS_KEY_ID,
      !!process.env.AWS_SECRET_ACCESS_KEY
    );

    const ext = contentType.split('/')[1] || 'bin';
    const prefix = process.env.S3_UPLOAD_PREFIX || 'photocards/';

    const baseName = sha256
      ? `${sha256}.${ext}`
      : `${Date.now()}-${crypto.randomUUID?.() || crypto.randomBytes(16).toString('hex')}.${ext}`;

    const key = `${prefix}${baseName}`;
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // 같은 키가 이미 있으면 업로드 생략하고 URL만 반환
    if (sha256) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
        return res.json({ alreadyExists: true, key, publicUrl });
      } catch (e) {
        // 404(없음)
        if (e?.$metadata?.httpStatusCode && e.$metadata.httpStatusCode !== 404) {
          console.warn('[HeadObject warn]', e?.name || e);
        }
      }
    }

    const cmd = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      CacheControl: `public, max-age=${CACHE_SECONDS}, immutable`,
    });

    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: EXPIRES });

    return res.json({ uploadUrl, key, publicUrl, alreadyExists: false });
  } catch (err) {
    console.error('[presign ERROR]', err);
    return res.status(500).json({
      name: err.name || 'Error',
      message: err.message || '프리사인드 URL 생성 실패',
      code: err.Code || err.code,
      env: {
        loadedFrom: loadedEnv,
        region: !!process.env.AWS_REGION,
        bucket: !!process.env.S3_BUCKET,
        akid: !!process.env.AWS_ACCESS_KEY_ID,
        secret: !!process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
});

export default router;
