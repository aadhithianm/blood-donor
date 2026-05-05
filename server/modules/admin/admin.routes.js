import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { roleGuard } from '../../middlewares/roleGuard.middleware.js';
import { validate } from '../auth/auth.validation.js';
import { broadcastSchema, verifyHospitalSchema } from './admin.validation.js';
import { auditAction } from '../../middlewares/auditLog.middleware.js';

const router = Router();
router.use(authenticate);
router.use(roleGuard('admin'));

// ── User Management ───────────────────────────────────────────
router.get('/users', adminController.getUsers);
router.get('/users/export', adminController.exportUsers);
router.get('/users/duplicates', adminController.getDuplicateAccounts);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id',
    auditAction('user_delete', (req) => `Deleted user ${req.params.id}`),
    adminController.deleteUser);
router.patch('/users/:id/suspend',
    auditAction('user_suspend', (req) => `Suspended user ${req.params.id}`),
    adminController.suspendUser);
router.patch('/users/:id/activate',
    auditAction('user_activate', (req) => `Activated user ${req.params.id}`),
    adminController.activateUser);
router.get('/users/:id/notes', adminController.getUserNotes);
router.patch('/users/:id/notes', adminController.updateUserNotes);
router.put('/users/:id/verification',
    auditAction('user_verification', (req) => `Updated verification for ${req.params.id}`),
    adminController.updateUserVerification);

// ── Donor Management ──────────────────────────────────────────
router.get('/donors', adminController.getDonors);
router.get('/donors/leaderboard', adminController.getDonorLeaderboard);
router.patch('/donors/:id/verify',
    auditAction('verification_approve', (req) => `Donor ${req.params.id} verified`),
    adminController.verifyDonor);
router.patch('/donors/:id/reject',
    auditAction('verification_reject', (req) => `Donor ${req.params.id} rejected`),
    adminController.rejectDonor);

// ── Blood Requests Management ─────────────────────────────────
router.get('/requests', adminController.getRequests);
router.get('/requests/:id/donors', adminController.findMatchingDonors);
router.post('/requests/:id/notify',
    auditAction('emergency_broadcast', (req) => `Notified donors for request ${req.params.id}`),
    adminController.notifyMatchingDonors);

// ── Hospital Verification ─────────────────────────────────────
router.get('/hospitals/pending', adminController.getPendingHospitals);
router.get('/hospitals', adminController.getAllHospitals);
router.put('/hospitals/:id/verify',
    validate(verifyHospitalSchema),
    auditAction('verification_approve', (req) => `Hospital ${req.params.id}: ${req.body.action}`),
    adminController.verifyHospital);
router.patch('/hospitals/:id/block',
    auditAction('user_suspend', (req) => `Hospital ${req.params.id} blocked`),
    adminController.blockHospital);
router.patch('/hospitals/:id/unblock',
    auditAction('user_activate', (req) => `Hospital ${req.params.id} unblocked`),
    adminController.unblockHospital);

// ── Emergency Broadcast ───────────────────────────────────────
router.post('/broadcast',
    validate(broadcastSchema),
    auditAction('emergency_broadcast', (req) => req.body.message?.slice(0, 100)),
    adminController.emergencyBroadcast);

// ── Analytics & Inventory ─────────────────────────────────────
router.get('/analytics', adminController.getAnalytics);
router.get('/blood-inventory', adminController.getBloodInventory);

// ── Advanced Reports ──────────────────────────────────────────
router.get('/reports/stats', adminController.getReportStats);
router.get('/reports',
    auditAction('report_generated', (req) => `type=${req.query.type || 'pdf'}`),
    adminController.generateReport);

// ── Feedback / Complaints ─────────────────────────────────────
router.get('/feedback', adminController.getFeedback);
router.get('/feedback/stats', adminController.getFeedbackStats);

// ── System Health ─────────────────────────────────────────────
router.get('/health', adminController.getSystemHealth);

// ── Audit Logs ────────────────────────────────────────────────
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
