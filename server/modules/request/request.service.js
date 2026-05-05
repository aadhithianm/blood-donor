import { BloodRequest, DonorAssignment } from './request.model.js';
import User from '../auth/auth.model.js';
import Notification from '../notification/notification.model.js';
import { AppError } from '../../utils/response.js';
import { getIO } from '../../sockets/index.js';
import { requestExpiryQueue } from '../../config/queue.js';

const COMPATIBILITY_MATRIX = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
};

const CAN_DONATE_TO = {
    'A+': ['A+', 'AB+'],
    'A-': ['A+', 'A-', 'AB+', 'AB-'],
    'B+': ['B+', 'AB+'],
    'B-': ['B+', 'B-', 'AB+', 'AB-'],
    'AB+': ['AB+'],
    'AB-': ['AB+', 'AB-'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
};

class RequestService {
    async createRequest(requesterId, data) {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes by default, or map from urgency

        const hospital = await User.findById(requesterId);

        const request = await BloodRequest.create({
            requesterId,
            bloodGroup: data.bloodGroup,
            unitsNeeded: data.unitsNeeded,
            patientName: data.patientName,
            contactNumber: data.contactNumber,
            reasonForRequest: data.reasonForRequest,
            customReason: data.customReason,
            urgency: data.urgency || 'normal',
            proofDocumentUrl: data.proofDocumentUrl,
            location: {
                type: 'Point',
                coordinates: [data.longitude, data.latitude],
                formattedAddress: data.formattedAddress,
                district: data.district,
            },
            notes: data.notes,
            expiresAt,
        });

        // Schedule auto-expiry job (15 min)
        try {
            await requestExpiryQueue.add(
                'expire-request',
                { requestId: request._id.toString() },
                { delay: 15 * 60 * 1000 }
            );
        } catch (err) {
            console.warn('Failed to schedule expiry job:', err.message);
        }

        // Find compatible, available, verified donors in the same district
        const eligibleDonors = await this.findMatchingDonors(data.bloodGroup, data.district);

        // Create Notifications for each matched donor
        const notifications = eligibleDonors.map(donor => {
            // Simulated Email Sending hook
            if (donor.notificationPrefs?.email !== false) {
                console.log(`✉️ [Placeholder] Sending Email Notification to ${donor.name} for ${data.bloodGroup} in ${data.district}`);
            }

            return {
                userId: donor._id,
                type: 'emergency',
                title: `Emergency Blood Request`,
                body: `${hospital.name} urgently needs ${data.bloodGroup} blood for ${data.patientName}.`,
                metadata: {
                    requestId: request._id,
                    hospitalName: hospital.name,
                    bloodGroup: data.bloodGroup,
                    urgency: request.urgency
                }
            };
        });

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // Broadcast to nearby donors via Socket.io
        try {
            const io = getIO();
            const roomName = `city:${data.district.toLowerCase()}`;
            console.log(`🔌 Broadcasting emergency to ${roomName} for ${eligibleDonors.length} matched donors`);
            
            io.to(roomName).emit('emergency_request_created', {
                id: request._id,
                hospitalName: hospital?.name || 'A nearby hospital',
                bloodGroup: data.bloodGroup,
                unitsNeeded: data.unitsNeeded,
                urgency: data.urgency,
                location: data.formattedAddress || data.district,
                expiresAt,
            });
        } catch (err) {
            console.warn('Socket broadcast failed:', err.message);
        }

        return { request, matchedDonors: eligibleDonors.length };
    }

    async findMatchingDonors(requestedBloodGroup, district) {
        const compatibleGroups = COMPATIBILITY_MATRIX[requestedBloodGroup] || [requestedBloodGroup];
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        const donors = await User.find({
            role: 'donor',
            isSuspended: false,
            availability: true,
            bloodGroup: { $in: compatibleGroups },
            'location.district': district,
            $or: [
                { lastDonationDate: { $exists: false } },
                { lastDonationDate: null },
                { lastDonationDate: { $lte: sixtyDaysAgo } }
            ]
        }).select('name email location notificationPrefs');

        return donors;
    }

    async acceptRequest(requestId, donorId) {
        const request = await BloodRequest.findById(requestId);
        if (!request) throw new AppError('Request not found', 404);
        if (request.status === 'expired' || request.status === 'completed') {
            throw new AppError(`Request already ${request.status}`, 400);
        }
        if (request.unitsFulfilled >= request.unitsNeeded) {
            throw new AppError('All units already fulfilled', 400);
        }

        const existingAssignment = await DonorAssignment.findOne({
            requestId,
            donorId,
            status: { $nin: ['cancelled', 'reassigned'] },
        });

        if (existingAssignment) {
            throw new AppError('Already assigned to this request', 400);
        }

        const donor = await User.findById(donorId);
        const assignment = await DonorAssignment.create({
            requestId,
            donorId,
            status: 'accepted',
            acceptedAt: new Date(),
            startLocation: donor.location || {},
        });

        request.assignedDonors.push(assignment._id);
        if (request.status === 'pending') request.status = 'accepted';
        await request.save();

        // Notify requester (Hospital)
        try {
            await Notification.create({
                userId: request.requesterId,
                type: 'update',
                title: 'Donor Accepted Request',
                body: `${donor.name} has accepted your blood request for ${request.bloodGroup}.`,
                metadata: { requestId, donorId }
            });

            const io = getIO();
            io.to(`user:${request.requesterId}`).emit('request_accepted', {
                requestId,
                donorId,
                donorName: donor.name,
                assignmentId: assignment._id,
            });
        } catch (err) {
            console.warn('Socket emit failed:', err.message);
        }

        return { request, assignment };
    }

    async completeRequest(requestId, donorId) {
        const assignment = await DonorAssignment.findOne({ requestId, donorId, status: { $in: ['accepted', 'in-progress'] } });
        if (!assignment) throw new AppError('Assignment not found', 404);

        assignment.status = 'completed';
        assignment.completedAt = new Date();
        await assignment.save();

        const request = await BloodRequest.findById(requestId);
        request.unitsFulfilled += 1;
        if (request.unitsFulfilled >= request.unitsNeeded) {
            request.status = 'completed';
        }
        await request.save();

        // Give donor trust score bump (+10 points for completion), mark unavailable, set next available
        const donor = await User.findById(donorId);
        if (donor) {
            donor.trustScore = Math.min(100, (donor.trustScore || 50) + 10);
            donor.availability = false;
            donor.lastDonationDate = new Date();
            donor.nextEligibleDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // +60 days
            await donor.save();
        }

        // Notify both parties
        try {
            const io = getIO();
            io.to(`user:${request.requesterId}`).emit('request_completed', {
                requestId,
                donorId,
                unitsFulfilled: request.unitsFulfilled,
                unitsNeeded: request.unitsNeeded,
            });
        } catch (err) {
            console.warn('Socket emit failed:', err.message);
        }

        return request;
    }

    async getRequestById(requestId) {
        const request = await BloodRequest.findById(requestId)
            .populate('requesterId', 'name email mobile location')
            .populate({
                path: 'assignedDonors',
                populate: { path: 'donorId', select: 'name bloodGroup location trustScore' },
            });
        if (!request) throw new AppError('Request not found', 404);
        return request;
    }

    async getMyRequests(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [requests, total] = await Promise.all([
            BloodRequest.find({ requesterId: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'assignedDonors',
                    populate: { path: 'donorId', select: 'name mobile location trustScore' },
                }),
            BloodRequest.countDocuments({ requesterId: userId }),
        ]);
        return {
            requests,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    async getDonorFeed(user) {
        if (!user.bloodGroup) return [];
        
        const canDonateTo = CAN_DONATE_TO[user.bloodGroup] || [user.bloodGroup];
        const district = user.location?.district;

        const query = {
            status: { $in: ['pending', 'accepted'] },
            bloodGroup: { $in: canDonateTo },
        };

        if (district) {
            query['location.district'] = district;
        }

        const requests = await BloodRequest.find(query)
            .sort({ urgency: -1, createdAt: -1 })
            .limit(50)
            .populate('requesterId', 'name formattedAddress')
            .lean();

        // Filter out requests where the donor has already accepted
        return requests.map(req => {
            req.isAcceptedByMe = req.assignedDonors?.some(d => d.donorId?.toString() === user._id.toString());
            return req;
        });
    }

    async getDonorHistory(donorId) {
        // Find all requests where this donor is in the assignedDonors list
        // and the status is accepted, in-progress or completed
        const requests = await BloodRequest.find({
            status: { $in: ['accepted', 'in-progress', 'completed'] }
        })
        .populate('requesterId', 'name mobile location')
        .populate({
            path: 'assignedDonors',
            match: { donorId: donorId }, // filter the populated array to only this donor's assignment
            populate: { path: 'donorId', select: 'name mobile location trustScore' }
        })
        .sort({ createdAt: -1 })
        .lean();
        
        // Filter out requests where this donor wasn't actually assigned
        // The above query gets all requests, but we only want ones where assignedDonors has a match
        const myRequests = requests.filter(req => req.assignedDonors && req.assignedDonors.length > 0);
        
        return myRequests;
    }

    async expireRequest(requestId) {
        const request = await BloodRequest.findById(requestId);
        if (!request || request.status === 'completed') return;

        request.status = 'expired';
        await request.save();

        // Cancel all pending assignments
        await DonorAssignment.updateMany(
            { requestId, status: { $in: ['pending', 'accepted'] } },
            { status: 'cancelled' }
        );

        try {
            const io = getIO();
            io.to(`user:${request.requesterId}`).emit('request_expired', { requestId });
        } catch (err) {
            console.warn('Socket emit failed:', err.message);
        }
    }
}

export default new RequestService();
