import HospitalProfile from './hospital.model.js';
import DonorProfile from '../donor/donor.model.js';
import User from '../auth/auth.model.js';
import { BloodRequest } from '../request/request.model.js';
import { AppError } from '../../utils/response.js';

class HospitalService {
    async getProfile(userId) {
        const profile = await HospitalProfile.findOne({ userId }).populate('userId', 'name email location');
        if (!profile) throw new AppError('Hospital profile not found', 404);
        return profile;
    }

    async createOrUpdateProfile(userId, data) {
        let profile = await HospitalProfile.findOne({ userId });
        if (profile) {
            Object.assign(profile, data);
            await profile.save();
        } else {
            profile = await HospitalProfile.create({
                userId,
                hospitalName: data.hospitalName,
                inventory: [
                    { bloodGroup: 'A+', units: 0 },
                    { bloodGroup: 'A-', units: 0 },
                    { bloodGroup: 'B+', units: 0 },
                    { bloodGroup: 'B-', units: 0 },
                    { bloodGroup: 'AB+', units: 0 },
                    { bloodGroup: 'AB-', units: 0 },
                    { bloodGroup: 'O+', units: 0 },
                    { bloodGroup: 'O-', units: 0 },
                ],
            });
        }
        return profile;
    }

    async uploadLicense(userId, licenseUrl) {
        let profile = await HospitalProfile.findOne({ userId });
        if (!profile) throw new AppError('Create a hospital profile first', 400);
        profile.licenseUrl = licenseUrl;
        profile.verificationStatus = 'pending';
        await profile.save();
        return profile;
    }

    async getPendingDonors(userId) {
        const hospital = await HospitalProfile.findOne({ userId }).populate('userId', 'location');
        if (!hospital) throw new AppError('Hospital profile not found', 404);
        if (hospital.verificationStatus !== 'approved') {
            throw new AppError('Hospital must be verified first', 403);
        }

        const hospitalDistrict = hospital.userId?.location?.district;
        const donors = await DonorProfile.find({ verificationStatus: 'pending' })
            .populate({
                path: 'userId',
                match: hospitalDistrict ? { 'location.district': hospitalDistrict } : {},
                select: 'name email mobile location',
            });

        return donors.filter((d) => d.userId !== null);
    }

    async verifyDonor(hospitalUserId, donorProfileId, action) {
        const hospital = await HospitalProfile.findOne({ userId: hospitalUserId });
        if (!hospital || hospital.verificationStatus !== 'approved') {
            throw new AppError('Only verified hospitals can verify donors', 403);
        }

        const donor = await DonorProfile.findById(donorProfileId);
        if (!donor) throw new AppError('Donor profile not found', 404);

        donor.verificationStatus = action === 'approve' ? 'approved' : 'rejected';
        donor.verifiedBy = hospitalUserId;
        donor.verifiedAt = new Date();
        await donor.save();

        return donor;
    }

    async getInventory(userId) {
        const profile = await HospitalProfile.findOne({ userId });
        if (!profile) throw new AppError('Hospital profile not found', 404);
        return profile.inventory;
    }

    async updateInventory(userId, bloodGroup, units) {
        const profile = await HospitalProfile.findOne({ userId });
        if (!profile) throw new AppError('Hospital profile not found', 404);

        const item = profile.inventory.find((i) => i.bloodGroup === bloodGroup);
        if (item) {
            item.units = units;
            item.lastUpdated = new Date();
        } else {
            profile.inventory.push({ bloodGroup, units, lastUpdated: new Date() });
        }
        await profile.save();
        return profile.inventory;
    }

    async createBulkRequest(userId, requests) {
        const hospital = await HospitalProfile.findOne({ userId });
        if (!hospital || hospital.verificationStatus !== 'approved') {
            throw new AppError('Only verified hospitals can create bulk requests', 403);
        }

        const user = await User.findById(userId);
        const created = [];

        for (const req of requests) {
            const request = await BloodRequest.create({
                requesterId: userId,
                bloodGroup: req.bloodGroup,
                unitsNeeded: req.unitsNeeded,
                urgency: req.urgency || 'urgent',
                location: user.location,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min for bulk
            });
            created.push(request);
        }

        return created;
    }
}

export default new HospitalService();
