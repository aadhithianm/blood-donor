import mongoose from 'mongoose';
import os from 'os';
import User from '../auth/auth.model.js';
import DonorProfile from '../donor/donor.model.js';
import HospitalProfile from '../hospital/hospital.model.js';
import { BloodRequest, DonorAssignment } from '../request/request.model.js';
import Feedback from '../feedback/feedback.model.js';
import AuditLog from './auditLog.model.js';
import Notification from '../notification/notification.model.js';
import { AppError } from '../../utils/response.js';
import { getIO } from '../../sockets/index.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

class AdminService {

    // ─── Dashboard Analytics (Enhanced) ──────────────────────
    async getAnalytics() {
        const [
            usersByRole,
            bloodGroupDemand,
            fulfillmentRate,
            recentRequests,
            totalUsers,
            totalDonationsAgg,
            pendingHospitals,
            activeDonors,
            donorStatusBreakdown,
            requestStatusBreakdown,
            trendData,
        ] = await Promise.all([
            User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
            BloodRequest.aggregate([
                { $group: { _id: '$bloodGroup', count: { $sum: 1 }, totalUnits: { $sum: '$unitsNeeded' } } },
                { $sort: { totalUnits: -1 } },
            ]),
            BloodRequest.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    },
                },
                { $sort: { _id: -1 } }, { $limit: 12 },
            ]),
            BloodRequest.find().sort({ createdAt: -1 }).limit(10).populate('requesterId', 'name'),
            User.countDocuments(),
            DonorProfile.aggregate([{ $group: { _id: null, total: { $sum: '$totalDonations' } } }]),
            HospitalProfile.countDocuments({ verificationStatus: 'pending' }),
            DonorProfile.countDocuments({ isAvailable: true }),
            // Donor breakdown: available / on-cooldown / unavailable / pending-verification
            DonorProfile.aggregate([
                { $group: { _id: '$availability', count: { $sum: 1 } } },
            ]),
            // Request status breakdown
            BloodRequest.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            // 30-day daily trend
            BloodRequest.aggregate([
                { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        requests: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        // Blood inventory — critical groups (available donors per blood group)
        const inventoryRaw = await DonorProfile.aggregate([
            { $match: { availability: 'available' } },
            { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        ]);
        const inventoryMap = Object.fromEntries(inventoryRaw.map(i => [i._id, i.count]));
        const ALL_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
        const criticalGroups = ALL_GROUPS.filter(g => (inventoryMap[g] || 0) < 3);

        return {
            usersByRole, bloodGroupDemand, fulfillmentRate, recentRequests,
            totalUsers, totalDonations: totalDonationsAgg[0]?.total || 0,
            pendingHospitals, activeDonors,
            donorStatusBreakdown, requestStatusBreakdown,
            trendData, criticalGroups, inventoryMap,
        };
    }

    // ─── Blood Inventory ──────────────────────────────────────
    async getBloodInventory() {
        return DonorProfile.aggregate([
            { $match: { availability: 'available' } },
            { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
            { $sort: { count: 1 } },
        ]);
    }

    // ─── Donor Management ────────────────────────────────────
    async getDonors({ page = 1, limit = 20, bloodGroup, availability, verificationStatus, lastDonationFrom, lastDonationTo, sort = '-totalDonations' }) {
        const filter = {};
        if (bloodGroup) filter.bloodGroup = bloodGroup;
        if (availability) filter.availability = availability;
        if (verificationStatus) filter.verificationStatus = verificationStatus;
        if (lastDonationFrom || lastDonationTo) {
            filter.lastDonationDate = {};
            if (lastDonationFrom) filter.lastDonationDate.$gte = new Date(lastDonationFrom);
            if (lastDonationTo) filter.lastDonationDate.$lte = new Date(lastDonationTo);
        }
        const skip = (page - 1) * limit;
        const [donors, total] = await Promise.all([
            DonorProfile.find(filter).sort(sort).skip(skip).limit(limit)
                .populate('userId', 'name email mobile isSuspended createdAt'),
            DonorProfile.countDocuments(filter),
        ]);
        return { donors, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async getDonorLeaderboard() {
        return DonorProfile.find({ totalDonations: { $gt: 0 } })
            .sort({ totalDonations: -1 })
            .limit(10)
            .populate('userId', 'name email');
    }

    async verifyDonor(donorId, action) {
        const donor = await DonorProfile.findById(donorId);
        if (!donor) throw new AppError('Donor profile not found', 404);
        donor.verificationStatus = action === 'approve' ? 'approved' : 'rejected';
        donor.verifiedAt = new Date();
        await donor.save();
        try {
            getIO().to(`user:${donor.userId}`).emit('donor:verified', {
                status: donor.verificationStatus,
                message: action === 'approve'
                    ? 'Your donor profile has been verified! You are now eligible to receive donation requests.'
                    : 'Your donor verification was rejected. Please update your profile and reapply.',
            });
        } catch (_) { }
        return donor;
    }

    // ─── Request Management ───────────────────────────────────
    async getRequests({ page = 1, limit = 20, urgency, bloodGroup, status, district, sort = '-createdAt' }) {
        const filter = {};
        if (urgency) filter.urgency = urgency;
        if (bloodGroup) filter.bloodGroup = bloodGroup;
        if (status) filter.status = status;
        if (district) filter['location.district'] = { $regex: district, $options: 'i' };
        const skip = (page - 1) * limit;
        const [requests, total] = await Promise.all([
            BloodRequest.find(filter).sort(sort).skip(skip).limit(limit)
                .populate('requesterId', 'name email mobile'),
            BloodRequest.countDocuments(filter),
        ]);
        return { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async findMatchingDonors(requestId) {
        const request = await BloodRequest.findById(requestId);
        if (!request) throw new AppError('Request not found', 404);
        const donors = await DonorProfile.find({
            bloodGroup: request.bloodGroup,
            availability: 'available',
            verificationStatus: 'approved',
        }).limit(20).populate('userId', 'name email mobile location');
        return { request, donors };
    }

    async notifyMatchingDonors(requestId) {
        const { request, donors } = await this.findMatchingDonors(requestId);
        const io = getIO();
        donors.forEach(donor => {
            io.to(`user:${donor.userId._id}`).emit('request:emergency_match', {
                requestId: request._id,
                bloodGroup: request.bloodGroup,
                urgency: request.urgency,
                message: `Emergency ${request.bloodGroup} blood needed near you. Can you help?`,
            });
        });
        const notifications = donors.map(d => ({
            userId: d.userId._id,
            type: 'emergency',
            channel: 'in-app',
            title: `Urgent: ${request.bloodGroup} Blood Needed`,
            body: `An emergency blood request near you needs ${request.unitsNeeded} unit(s) of ${request.bloodGroup}.`,
        }));
        if (notifications.length > 0) await Notification.insertMany(notifications);
        return { notified: donors.length };
    }

    // ─── User Management ─────────────────────────────────────
    async getUsers({ page = 1, limit = 20, role, search, status }) {
        const filter = {};
        if (role) filter.role = role;
        if (status === 'suspended') filter.isSuspended = true;
        if (status === 'active') filter.isSuspended = false;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments(filter),
        ]);
        return { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async exportUsers({ role, status, search }) {
        const filter = {};
        if (role) filter.role = role;
        if (status === 'suspended') filter.isSuspended = true;
        if (status === 'active') filter.isSuspended = false;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        return User.find(filter).sort({ createdAt: -1 }).limit(5000).lean();
    }

    async updateUser(userId, data) {
        const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true });
        if (!user) throw new AppError('User not found', 404);
        return user;
    }

    async deleteUser(userId) {
        const user = await User.findByIdAndDelete(userId);
        if (!user) throw new AppError('User not found', 404);
        await DonorProfile.deleteOne({ userId });
        await HospitalProfile.deleteOne({ userId });
        return user;
    }

    async suspendUser(userId) {
        const user = await User.findByIdAndUpdate(userId, { $set: { isSuspended: true } }, { new: true });
        if (!user) throw new AppError('User not found', 404);
        try { getIO().to(`user:${userId}`).emit('user:suspended', { message: 'Your account has been suspended.' }); } catch (_) { }
        return user;
    }

    async activateUser(userId) {
        const user = await User.findByIdAndUpdate(userId, { $set: { isSuspended: false } }, { new: true });
        if (!user) throw new AppError('User not found', 404);
        try { getIO().to(`user:${userId}`).emit('user:activated', { message: 'Your account has been reactivated.' }); } catch (_) { }
        return user;
    }

    async getUserNotes(userId) {
        const user = await User.findById(userId).select('name email adminNotes');
        if (!user) throw new AppError('User not found', 404);
        return user;
    }

    async updateUserNotes(userId, notes) {
        const user = await User.findByIdAndUpdate(userId, { $set: { adminNotes: notes } }, { new: true }).select('name email adminNotes');
        if (!user) throw new AppError('User not found', 404);
        return user;
    }

    async updateUserVerification(userId, isEmailVerified, isVerified) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);
        
        const wasUnverified = !user.isVerified;
        
        if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;
        if (isVerified !== undefined) user.isVerified = isVerified;
        
        await user.save();
        
        if (wasUnverified && user.isVerified) {
            try {
                getIO().to(`user:${userId}`).emit('verification_approved', {
                    message: 'Your account has been manually verified by an administrator!'
                });
            } catch (_) {}
            
            await Notification.create({
                userId, type: 'verification', channel: 'in-app',
                title: 'Account Verified',
                body: 'An administrator has manually verified your account.'
            });
        }
        return user;
    }

    // ─── Hospital Management ──────────────────────────────────
    async getPendingHospitals() {
        return HospitalProfile.find({ verificationStatus: 'pending' })
            .populate('userId', 'name email createdAt');
    }

    async getAllHospitals({ page = 1, limit = 20, verificationStatus, search }) {
        const filter = {};
        if (verificationStatus) filter.verificationStatus = verificationStatus;
        if (search) {
            filter.$or = [
                { hospitalName: { $regex: search, $options: 'i' } },
                { licenceNumber: { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [hospitals, total] = await Promise.all([
            HospitalProfile.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
                .populate('userId', 'name email isSuspended'),
            HospitalProfile.countDocuments(filter),
        ]);
        return { hospitals, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async verifyHospital(hospitalProfileId, action) {
        const hospital = await HospitalProfile.findById(hospitalProfileId);
        if (!hospital) throw new AppError('Hospital not found', 404);
        hospital.verificationStatus = action === 'approve' ? 'approved' : 'rejected';
        hospital.verifiedAt = new Date();
        await hospital.save();
        try {
            getIO().to(`user:${hospital.userId}`).emit('hospital:verified', {
                status: hospital.verificationStatus,
                message: action === 'approve'
                    ? 'Your hospital has been verified and is now listed on BloodLink.'
                    : 'Your hospital verification was rejected.',
            });
        } catch (_) { }
        await Notification.create({
            userId: hospital.userId,
            type: 'system', channel: 'in-app',
            title: action === 'approve' ? 'Hospital Verified' : 'Verification Rejected',
            body: action === 'approve'
                ? 'Your hospital has been approved and is now active on BloodLink.'
                : 'Your hospital application was rejected. Please review and reapply.',
        });
        return hospital;
    }

    async blockHospital(hospitalProfileId) {
        const hospital = await HospitalProfile.findById(hospitalProfileId);
        if (!hospital) throw new AppError('Hospital not found', 404);
        await User.findByIdAndUpdate(hospital.userId, { $set: { isSuspended: true } });
        try { getIO().to(`user:${hospital.userId}`).emit('user:suspended', { message: 'Your hospital account has been blocked.' }); } catch (_) { }
        return hospital;
    }

    async unblockHospital(hospitalProfileId) {
        const hospital = await HospitalProfile.findById(hospitalProfileId);
        if (!hospital) throw new AppError('Hospital not found', 404);
        await User.findByIdAndUpdate(hospital.userId, { $set: { isSuspended: false } });
        try { getIO().to(`user:${hospital.userId}`).emit('user:activated', { message: 'Your hospital account has been unblocked.' }); } catch (_) { }
        return hospital;
    }

    // ─── Emergency Broadcast ──────────────────────────────────
    async emergencyBroadcast(message, scope = 'all', city = null) {
        try {
            const io = getIO();
            const data = { type: 'emergency', message, timestamp: new Date() };
            scope === 'city' && city ? io.to(`room:${city}`).emit('emergency:broadcast', data) : io.emit('emergency:broadcast', data);
        } catch (_) { }
        const filter = { isSuspended: false };
        if (scope === 'city' && city) filter['location.district'] = city;
        const users = await User.find(filter).select('_id');
        if (users.length > 0) {
            await Notification.insertMany(users.map(u => ({
                userId: u._id, type: 'emergency', channel: 'in-app',
                title: 'Emergency Broadcast', body: message,
            })));
        }
        return { notifiedUsers: users.length };
    }

    // ─── Feedback / Complaints ────────────────────────────────
    async getFeedback({ page = 1, limit = 20, reportType, minRating, maxRating }) {
        const filter = {};
        if (reportType && reportType !== 'all') filter.reportType = reportType;
        if (minRating) filter.rating = { ...filter.rating, $gte: Number(minRating) };
        if (maxRating) filter.rating = { ...filter.rating, $lte: Number(maxRating) };
        const skip = (page - 1) * limit;
        const [feedback, total] = await Promise.all([
            Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
                .populate('fromUserId', 'name email')
                .populate('toUserId', 'name email')
                .populate('requestId', 'bloodGroup urgency'),
            Feedback.countDocuments(filter),
        ]);
        return { feedback, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async getFeedbackStats() {
        const [byType, avgRating, totalReports] = await Promise.all([
            Feedback.aggregate([{ $group: { _id: '$reportType', count: { $sum: 1 } } }]),
            Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
            Feedback.countDocuments({ reportType: { $ne: 'none' } }),
        ]);
        return { byType, avgRating: avgRating[0]?.avg || 0, totalReports };
    }

    // ─── System Health ────────────────────────────────────────
    async getSystemHealth() {
        const dbState = mongoose.connection.readyState;
        const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
        let socketClients = 0;
        try { socketClients = getIO().engine.clientsCount; } catch (_) { }
        return {
            db: { status: dbStatus[dbState] || 'unknown', state: dbState },
            server: {
                uptime: Math.floor(process.uptime()),
                memoryUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                memoryTotalMB: Math.round(os.totalmem() / 1024 / 1024),
                cpuCount: os.cpus().length,
                nodeVersion: process.version,
            },
            sockets: { connectedClients: socketClients },
            timestamp: new Date(),
        };
    }

    // ─── Advanced Reports ─────────────────────────────────────
    async generateReport({ type = 'pdf', dateFrom, dateTo, bloodGroup, district, status, groupBy }) {
        const filter = {};
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }
        if (bloodGroup) filter.bloodGroup = bloodGroup;
        if (status) filter.status = status;
        if (district) filter['location.district'] = { $regex: district, $options: 'i' };
        return type === 'excel' ? this.generateExcelReport(filter, groupBy) : this.generatePDFReport(filter);
    }

    async getReportStats({ dateFrom, dateTo, bloodGroup, district, status }) {
        const filter = {};
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }
        if (bloodGroup) filter.bloodGroup = bloodGroup;
        if (status) filter.status = status;
        if (district) filter['location.district'] = { $regex: district, $options: 'i' };

        const [total, completed, avgUnits, byBloodGroup, byDistrict] = await Promise.all([
            BloodRequest.countDocuments(filter),
            BloodRequest.countDocuments({ ...filter, status: 'completed' }),
            BloodRequest.aggregate([{ $match: filter }, { $group: { _id: null, avg: { $avg: '$unitsNeeded' } } }]),
            BloodRequest.aggregate([{ $match: filter }, { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
            BloodRequest.aggregate([{ $match: filter }, { $group: { _id: '$location.district', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
        ]);

        return {
            total, completed,
            successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            avgUnitsPerRequest: Math.round(avgUnits[0]?.avg || 0),
            byBloodGroup, byDistrict,
        };
    }

    async generatePDFReport(filter) {
        const requests = await BloodRequest.find(filter)
            .populate('requesterId', 'name email')
            .sort({ createdAt: -1 }).limit(500);
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        return new Promise((resolve) => {
            doc.on('data', c => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.fontSize(20).text('BloodLink — Request Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
            doc.moveDown();
            doc.fontSize(9).font('Helvetica-Bold').text('Blood Group | Units | Status | Urgency | District | Requester | Date', { underline: true });
            doc.font('Helvetica').moveDown(0.5);
            requests.forEach(req => {
                doc.text(`${req.bloodGroup} | ${req.unitsNeeded} units | ${req.status} | ${req.urgency} | ${req.location?.district || 'N/A'} | ${req.requesterId?.name || 'N/A'} | ${req.createdAt.toLocaleDateString()}`);
            });
            doc.end();
        });
    }

    async generateExcelReport(filter, groupBy) {
        const requests = await BloodRequest.find(filter)
            .populate('requesterId', 'name email')
            .sort({ createdAt: -1 }).limit(1000);
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Blood Requests');
        sheet.columns = [
            { header: 'Blood Group', key: 'bloodGroup', width: 14 },
            { header: 'Units Needed', key: 'unitsNeeded', width: 14 },
            { header: 'Units Fulfilled', key: 'unitsFulfilled', width: 14 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Urgency', key: 'urgency', width: 12 },
            { header: 'District', key: 'district', width: 20 },
            { header: 'Requester', key: 'requester', width: 25 },
            { header: 'Date', key: 'date', width: 18 },
        ];
        requests.forEach(req => {
            sheet.addRow({
                bloodGroup: req.bloodGroup, unitsNeeded: req.unitsNeeded,
                unitsFulfilled: req.unitsFulfilled, status: req.status,
                urgency: req.urgency, district: req.location?.district || 'N/A',
                requester: req.requesterId?.name || 'N/A',
                date: req.createdAt.toLocaleDateString(),
            });
        });
        return workbook.xlsx.writeBuffer();
    }

    // ─── Audit Logs ───────────────────────────────────────────
    async getAuditLogs({ page = 1, limit = 50, action }) {
        const skip = (page - 1) * limit;
        const filter = action ? { action } : {};
        const [logs, total] = await Promise.all([
            AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
                .populate('userId', 'name email role'),
            AuditLog.countDocuments(filter),
        ]);
        return { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
}

export default new AdminService();
