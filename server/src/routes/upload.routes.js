import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// ── Storage config ─────────────────────────────────────────────────────────────
const makeStorage = (subfolder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.resolve('uploads', subfolder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  });

const videoUpload = multer({
  storage: makeStorage('videos'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/mkv', 'video/x-matroska'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only video files (mp4, webm, mkv) are allowed'));
  },
});

const pdfUpload = multer({
  storage: makeStorage('pdfs'),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Invalid file format. Allowed: PDF, Word (doc/docx), ZIP, Text, or Images.'));
  },
});

const imageUpload = multer({
  storage: makeStorage('images'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// ── Endpoints ─────────────────────────────────────────────────────────────────
router.post('/video', protect, adminOnly, (req, res, next) => {
  videoUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // Return a URL the client can use
    const url = `/uploads/videos/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: req.file.size });
  });
});

router.post('/pdf', protect, adminOnly, (req, res, next) => {
  pdfUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `/uploads/pdfs/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: req.file.size });
  });
});

router.post('/image', protect, adminOnly, (req, res) => {
  imageUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `/uploads/images/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: req.file.size });
  });
});

// Student-accessible: upload payment screenshot for bank transfer
router.post('/screenshot', protect, (req, res) => {
  imageUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `/uploads/images/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: req.file.size });
  });
});

// Delete uploaded file
router.delete('/file', protect, adminOnly, (req, res) => {
  const { filepath } = req.body;
  if (!filepath || !filepath.startsWith('/uploads/')) {
    return res.status(400).json({ message: 'Invalid path' });
  }
  const abs = path.resolve(filepath.slice(1)); // remove leading /
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
  res.json({ message: 'Deleted' });
});

export default router;
