import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import donorRoutes from './modules/donor/donor.routes.js';
import requestRoutes from './modules/request/request.routes.js';
import hospitalRoutes from './modules/hospital/hospital.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import feedbackRoutes from './modules/feedback/feedback.routes.js';
import locationRoutes from './modules/location/location.routes.js';

// Middleware imports
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

// ─── Global Middleware ────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/location', locationRoutes);

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'BloodLink API is running', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

export default app;
