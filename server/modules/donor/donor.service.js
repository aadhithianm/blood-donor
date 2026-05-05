import DonorProfile from './donor.model.js';
import User from '../auth/auth.model.js';
import { AppError } from '../../utils/response.js';

class DonorService {
    async getProfile(userId) {
        let profile = await DonorProfile.findOne({ userId }).populate('userId', 'name email mobile profilePicture location trustScore');
        if (!profile) {
            profile = await DonorProfile.create({ userId });
            profile = await profile.populate('userId', 'name email mobile profilePicture location trustScore');
        }
        return profile;
    }

    async createOrUpdateProfile(userId, data) {
        let profile = await DonorProfile.findOne({ userId });
        if (profile) {
            // Blood group locked post-verification
            if (profile.verificationStatus === 'approved' && data.bloodGroup) {
                delete data.bloodGroup;
            }
            Object.assign(profile, data);
            await profile.save();
        } else {
            profile = await DonorProfile.create({ userId, ...data });
        }
        return profile;
    }

    async uploadCertificate(userId, certUrl) {
        let profile = await DonorProfile.findOne({ userId });
        if (!profile) {
            profile = await DonorProfile.create({ userId });
        }
        profile.medCertUrl = certUrl;
        profile.verificationStatus = 'pending';
        await profile.save();
        return profile;
    }

    async toggleAvailability(userId, availability) {
        const profile = await DonorProfile.findOne({ userId });
        if (!profile) throw new AppError('Donor profile not found', 404);

        if (profile.verificationStatus !== 'approved') {
            throw new AppError('Only verified donors can change availability', 403);
        }

        if (profile.isOnCooldown() && availability === 'available') {
            throw new AppError(
                `On cooldown until ${profile.cooldownUntil.toLocaleDateString()}. Cannot mark as available.`,
                400
            );
        }

        profile.availability = availability;
        await profile.save();
        return profile;
    }

    async getDashboard(userId) {
        let profile = await DonorProfile.findOne({ userId });
        if (!profile) {
            profile = await DonorProfile.create({ userId });
        }

        const user = await User.findById(userId);
        const nextEligibleDate = user.nextEligibleDate && user.nextEligibleDate > new Date() 
            ? user.nextEligibleDate 
            : (profile.cooldownUntil && profile.cooldownUntil > new Date() ? profile.cooldownUntil : null);

        return {
            profile,
            trustScore: user.trustScore,
            nextEligibleDate,
            badges: profile.badges,
            streaks: profile.streaks,
            totalDonations: profile.totalDonations,
        };
    }

    async findNearbyVerifiedDonors(bloodGroup, location, radiusKm = 50) {
        const donors = await DonorProfile.find({
            bloodGroup,
            availability: 'available',
            verificationStatus: 'approved',
        }).populate({
            path: 'userId',
            match: {
                isSuspended: false,
                'location.coordinates': {
                    $nearSphere: {
                        $geometry: { type: 'Point', coordinates: [location.longitude, location.latitude] },
                        $maxDistance: radiusKm * 1000,
                    },
                },
            },
            select: 'name location trustScore',
        });

        return donors.filter((d) => d.userId !== null);
    }
}

export default new DonorService();
