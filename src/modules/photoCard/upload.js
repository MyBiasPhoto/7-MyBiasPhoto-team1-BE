import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 백엔드에 upload 폴더 생성됨 그곳에 포토카드 생성 사진 들어감
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // uploads 폴더에 저장
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

const router = express.Router();

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일이 없습니다.' });
  }
  res.json({
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
  });
});

export default router;
