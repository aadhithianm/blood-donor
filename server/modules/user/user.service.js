import User from '../auth/auth.model.js';
import { AppError } from '../../utils/response.js';

class UserService {
    async getProfile(userId) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);
        return user;
    }

    async updateProfile(userId, data) {
        const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true });
        if (!user) throw new AppError('User not found', 404);
        return user;
    }

    async updateLocation(userId, locationData) {
        const location = {
            type: 'Point',
            coordinates: [locationData.longitude, locationData.latitude],
            country: locationData.country,
            state: locationData.state,
            district: locationData.district,
            town: locationData.town,
            village: locationData.village,
            formattedAddress: locationData.formattedAddress,
        };

        const user = await User.findByIdAndUpdate(userId, { location }, { new: true });
        if (!user) throw new AppError('User not found', 404);
        return user;
    }

    async updateAvatar(userId, avatarUrl) {
        const user = await User.findByIdAndUpdate(userId, { profilePicture: avatarUrl }, { new: true });
        if (!user) throw new AppError('User not found', 404);
        return user;
    }
}

export default new UserService();
