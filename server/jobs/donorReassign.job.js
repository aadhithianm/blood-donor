import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import { BloodRequest, DonorAssignment } from '../modules/request/request.model.js';
import DonorProfile from '../modules/donor/donor.model.js';
import { getIO } from '../sockets/index.js';

const donorReassignWorker = new Worker(
    'donorReassign',
    async (job) => {
        const { requestId, offlineDonorId } = job.data;
        console.log(`🔄 Reassigning request ${requestId}, offline donor: ${offlineDonorId}`);

        // Mark current assignment as reassigned
        await DonorAssignment.findOneAndUpdate(
            { requestId, donorId: offlineDonorId, status: { $in: ['accepted', 'in-progress'] } },
            { status: 'reassigned' }
        );

        // Mark donor as temporarily unavailable
        await DonorProfile.findOneAndUpdate(
            { userId: offlineDonorId },
            { availability: 'unavailable' }
        );

        const request = await BloodRequest.findById(requestId);
        if (!request || request.status === 'completed' || request.status === 'expired') return;

        // Find next nearest donor
        const existingDonorIds = await DonorAssignment.find({
            requestId,
            status: { $nin: ['cancelled'] },
        }).distinct('donorId');

        const nextDonor = await DonorProfile.findOne({
            bloodGroup: request.bloodGroup,
            availability: 'available',
            verificationStatus: 'approved',
            userId: { $nin: existingDonorIds },
        }).populate('userId', 'name location');

        if (nextDonor && nextDonor.userId) {
            // Create new assignment
            const assignment = await DonorAssignment.create({
                requestId,
                donorId: nextDonor.userId._id,
                status: 'pending',
            });

            request.assignedDonors.push(assignment._id);
            await request.save();

            // Notify requester of reassignment
            try {
                const io = getIO();
                io.to(`user:${request.requesterId}`).emit('request:reassigned', {
                    requestId,
                    newDonorId: nextDonor.userId._id,
                    newDonorName: nextDonor.userId.name,
                });

                // Notify new donor
                io.to(`user:${nextDonor.userId._id}`).emit('new:request', {
                    requestId,
                    bloodGroup: request.bloodGroup,
                    unitsNeeded: request.unitsNeeded,
                    urgency: request.urgency,
                    reassigned: true,
                });
            } catch (err) {
                console.warn('Reassignment socket error:', err.message);
            }
        }

        console.log(`✅ Reassignment complete for request ${requestId}`);
    },
    { connection: redis }
);

donorReassignWorker.on('failed', (job, err) => {
    console.error(`❌ Donor reassign job failed:`, err.message);
});

export default donorReassignWorker;
