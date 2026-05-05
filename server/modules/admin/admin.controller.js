import adminService from './admin.service.js';
import User from '../auth/auth.model.js';
import { sendSuccess } from '../../utils/response.js';

// ── User Management ───────────────────────────────────────────
export const getUsers = async (req, res, next) => {
    try {
        const { page, limit, role, search, status } = req.query;
        const result = await adminService.getUsers({ page: parseInt(page) || 1, limit: parseInt(limit) || 20, role, search, status });
        sendSuccess(res, { data: result.users, pagination: result.pagination });
    } catch (e) { next(e); }
};

export const exportUsers = async (req, res, next) => {
    try {
        const { role, status, search } = req.query;
        const users = await adminService.exportUsers({ role, status, search });
        const csvHeader = 'Name,Email,Role,Status,Joined\n';
        const csvRows = users.map(u =>
            `"${u.name}","${u.email}","${u.role}","${u.isSuspended ? 'Suspended' : 'Active'}","${new Date(u.createdAt).toLocaleDateString()}"`
        ).join('\n');
        res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=bloodlink-users.csv' });
        res.send(csvHeader + csvRows);
    } catch (e) { next(e); }
};

export const getDuplicateAccounts = async (req, res, next) => {
    try {
        // Find users sharing the same mobile number (potential duplicates)
        const dups = await User.aggregate([
            { $match: { mobile: { $exists: true, $ne: '' } } },
            { $group: { _id: '$mobile', count: { $sum: 1 }, users: { $push: { id: '$_id', name: '$name', email: '$email' } } } },
            { $match: { count: { $gt: 1 } } },
        ]);
        sendSuccess(res, { data: dups });
    } catch (e) { next(e); }
};

export const updateUser = async (req, res, next) => {
    try {
        const user = await adminService.updateUser(req.params.id, req.body);
        sendSuccess(res, { message: 'User updated', data: user });
    } catch (e) { next(e); }
};

export const deleteUser = async (req, res, next) => {
    try {
        await adminService.deleteUser(req.params.id);
        sendSuccess(res, { message: 'User deleted' });
    } catch (e) { next(e); }
};

export const suspendUser = async (req, res, next) => {
    try {
        const user = await adminService.suspendUser(req.params.id);
        sendSuccess(res, { message: 'User suspended', data: user });
    } catch (e) { next(e); }
};

export const activateUser = async (req, res, next) => {
    try {
        const user = await adminService.activateUser(req.params.id);
        sendSuccess(res, { message: 'User activated', data: user });
    } catch (e) { next(e); }
};

export const getUserNotes = async (req, res, next) => {
    try {
        const user = await adminService.getUserNotes(req.params.id);
        sendSuccess(res, { data: user });
    } catch (e) { next(e); }
};

export const updateUserNotes = async (req, res, next) => {
    try {
        const { notes } = req.body;
        const user = await adminService.updateUserNotes(req.params.id, notes || '');
        sendSuccess(res, { message: 'Notes saved', data: user });
    } catch (e) { next(e); }
};

export const updateUserVerification = async (req, res, next) => {
    try {
        const { isEmailVerified, isVerified } = req.body;
        const user = await adminService.updateUserVerification(req.params.id, isEmailVerified, isVerified);
        sendSuccess(res, { message: 'Verification status updated', data: user });
    } catch (e) { next(e); }
};

// ── Donor Management ──────────────────────────────────────────
export const getDonors = async (req, res, next) => {
    try {
        const { page, limit, bloodGroup, availability, verificationStatus, lastDonationFrom, lastDonationTo, sort } = req.query;
        const result = await adminService.getDonors({
            page: parseInt(page) || 1, limit: parseInt(limit) || 20,
            bloodGroup, availability, verificationStatus, lastDonationFrom, lastDonationTo, sort,
        });
        sendSuccess(res, { data: result.donors, pagination: result.pagination });
    } catch (e) { next(e); }
};

export const getDonorLeaderboard = async (req, res, next) => {
    try {
        const data = await adminService.getDonorLeaderboard();
        sendSuccess(res, { data });
    } catch (e) { next(e); }
};

export const verifyDonor = async (req, res, next) => {
    try {
        const donor = await adminService.verifyDonor(req.params.id, 'approve');
        sendSuccess(res, { message: 'Donor verified', data: donor });
    } catch (e) { next(e); }
};

export const rejectDonor = async (req, res, next) => {
    try {
        const donor = await adminService.verifyDonor(req.params.id, 'reject');
        sendSuccess(res, { message: 'Donor rejected', data: donor });
    } catch (e) { next(e); }
};

// ── Request Management ────────────────────────────────────────
export const getRequests = async (req, res, next) => {
    try {
        const { page, limit, urgency, bloodGroup, status, district, sort } = req.query;
        const result = await adminService.getRequests({
            page: parseInt(page) || 1, limit: parseInt(limit) || 20,
            urgency, bloodGroup, status, district, sort,
        });
        sendSuccess(res, { data: result.requests, pagination: result.pagination });
    } catch (e) { next(e); }
};

export const findMatchingDonors = async (req, res, next) => {
    try {
        const { request, donors } = await adminService.findMatchingDonors(req.params.id);
        sendSuccess(res, { data: { request, donors } });
    } catch (e) { next(e); }
};

export const notifyMatchingDonors = async (req, res, next) => {
    try {
        const result = await adminService.notifyMatchingDonors(req.params.id);
        sendSuccess(res, { message: `Notified ${result.notified} donors`, data: result });
    } catch (e) { next(e); }
};

// ── Hospital Management ───────────────────────────────────────
export const getPendingHospitals = async (req, res, next) => {
    try {
        const hospitals = await adminService.getPendingHospitals();
        sendSuccess(res, { data: hospitals });
    } catch (e) { next(e); }
};

export const getAllHospitals = async (req, res, next) => {
    try {
        const { page, limit, verificationStatus, search } = req.query;
        const result = await adminService.getAllHospitals({ page: parseInt(page) || 1, limit: parseInt(limit) || 20, verificationStatus, search });
        sendSuccess(res, { data: result.hospitals, pagination: result.pagination });
    } catch (e) { next(e); }
};

export const verifyHospital = async (req, res, next) => {
    try {
        const { action } = req.body;
        const hospital = await adminService.verifyHospital(req.params.id, action);
        sendSuccess(res, { message: `Hospital ${action}d`, data: hospital });
    } catch (e) { next(e); }
};

export const blockHospital = async (req, res, next) => {
    try {
        const hospital = await adminService.blockHospital(req.params.id);
        sendSuccess(res, { message: 'Hospital blocked', data: hospital });
    } catch (e) { next(e); }
};

export const unblockHospital = async (req, res, next) => {
    try {
        const hospital = await adminService.unblockHospital(req.params.id);
        sendSuccess(res, { message: 'Hospital unblocked', data: hospital });
    } catch (e) { next(e); }
};

// ── Emergency Broadcast ───────────────────────────────────────
export const emergencyBroadcast = async (req, res, next) => {
    try {
        const { message, scope, city } = req.body;
        const result = await adminService.emergencyBroadcast(message, scope, city);
        sendSuccess(res, { message: 'Broadcast sent', data: result });
    } catch (e) { next(e); }
};

// ── Analytics & Inventory ─────────────────────────────────────
export const getAnalytics = async (req, res, next) => {
    try {
        const data = await adminService.getAnalytics();
        sendSuccess(res, { data });
    } catch (e) { next(e); }
};

export const getBloodInventory = async (req, res, next) => {
    try {
        const data = await adminService.getBloodInventory();
        sendSuccess(res, { data });
    } catch (e) { next(e); }
};

// ── Feedback / Complaints ─────────────────────────────────────
export const getFeedback = async (req, res, next) => {
    try {
        const { page, limit, reportType, minRating, maxRating } = req.query;
        const result = await adminService.getFeedback({ page: parseInt(page) || 1, limit: parseInt(limit) || 20, reportType, minRating, maxRating });
        sendSuccess(res, { data: result.feedback, pagination: result.pagination });
    } catch (e) { next(e); }
};

export const getFeedbackStats = async (req, res, next) => {
    try {
        const data = await adminService.getFeedbackStats();
        sendSuccess(res, { data });
    } catch (e) { next(e); }
};

// ── Reports ───────────────────────────────────────────────────
export const generateReport = async (req, res, next) => {
    try {
        const { type = 'pdf', dateFrom, dateTo, bloodGroup, district, status, groupBy } = req.query;
        const buffer = await adminService.generateReport({ type, dateFrom, dateTo, bloodGroup, district, status, groupBy });
        if (type === 'excel') {
            res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename=bloodlink-report.xlsx' });
        } else {
            res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=bloodlink-report.pdf' });
        }
        res.send(buffer);
    } catch (e) { next(e); }
};

export const getReportStats = async (req, res, next) => {
    try {
        const { dateFrom, dateTo, bloodGroup, district, status } = req.query;
        const data = await adminService.getReportStats({ dateFrom, dateTo, bloodGroup, district, status });
        sendSuccess(res, { data });
    } catch (e) { next(e); }
};

// ── System Health ─────────────────────────────────────────────
export const getSystemHealth = async (req, res, next) => {
    try {
        const data = await adminService.getSystemHealth();
        sendSuccess(res, { data });
    } catch (e) { next(e); }
};

// ── Audit Logs ────────────────────────────────────────────────
export const getAuditLogs = async (req, res, next) => {
    try {
        const { page, limit, action } = req.query;
        const result = await adminService.getAuditLogs({ page: parseInt(page) || 1, limit: parseInt(limit) || 50, action });
        sendSuccess(res, { data: result.logs, pagination: result.pagination });
    } catch (e) { next(e); }
};
