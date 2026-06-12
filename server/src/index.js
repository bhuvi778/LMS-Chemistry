import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import enrollRoutes from './routes/enroll.routes.js';
import adminRoutes from './routes/admin.routes.js';
import contentRoutes from './routes/content.routes.js';
import categoryRoutes from './routes/category.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import liveClassRoutes from './routes/liveClass.routes.js';
import courseContentRoutes from './routes/courseContent.routes.js';
import courseSubjectRoutes from './routes/courseSubject.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import testRoutes from './routes/test.routes.js';
import bankTransferRoutes from './routes/bankTransfer.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import subscriberRoutes from './routes/subscriber.routes.js';
import ebookRoutes from './routes/ebook.routes.js';
import enquiryRoutes from './routes/enquiry.routes.js';
import feedRoutes from './routes/feed.routes.js';
import popupRoutes from './routes/popup.routes.js';
import chatRoutes from './routes/chat.routes.js';
import doubtRoutes from './routes/doubt.routes.js';
import { notFound, errorHandler } from './middleware/error.js';
import { attachLiveSocket } from './liveSocket.js';
import { startNotificationScheduler } from './services/notificationScheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Serve uploaded files (videos, PDFs)
// __dirname = server/src → go one level up to server/uploads (where multer saves files)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (_req, res) => res.json({ ok: true, service: 'Ace2Examz LMS API' }));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enroll', enrollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/live', liveClassRoutes);
app.use('/api/course-content', courseContentRoutes);
app.use('/api/subjects', courseSubjectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/bank-transfer', bankTransferRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/popups', popupRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/doubts', doubtRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chemprep_lms';

const server = http.createServer(app);
attachLiveSocket(server);

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    try {
      const User = mongoose.model('User');
      const res = await User.updateMany(
        { isEmailVerified: { $exists: false } },
        { $set: { isEmailVerified: true } }
      );
      if (res.modifiedCount > 0) {
        console.log(`[Migration] Set isEmailVerified: true for ${res.modifiedCount} existing users.`);
      }
    } catch (err) {
      console.error('[Migration] Failed to migrate user verification status:', err.message);
    }
    server.listen(PORT, () => {
      console.log(`🚀 API + WebRTC on http://localhost:${PORT}`);
      startNotificationScheduler();
    });
  })
  .catch((err) => {
    console.error('❌ Mongo connection failed:', err.message);
    process.exit(1);
  });

export default app;

