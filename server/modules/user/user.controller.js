import userService from './user.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getProfile = async (req, res, next) => {
    try {
        const user = await userService.getProfile(req.user._id);
        sendSuccess(res, { data: user });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const user = await userService.updateProfile(req.user._id, req.body);
        sendSuccess(res, { message: 'Profile updated', data: user });
    } catch (error) {
        next(error);
    }
};

export const updateLocation = async (req, res, next) => {
    try {
        const user = await userService.updateLocation(req.user._id, req.body);
        sendSuccess(res, { message: 'Location updated', data: user });
    } catch (error) {
        next(error);
    }
};

export const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return sendSuccess(res, { statusCode: 400, message: 'No file uploaded' });
        }
        const user = await userService.updateAvatar(req.user._id, req.file.path);
        sendSuccess(res, { message: 'Avatar updated', data: user });
    } catch (error) {
        next(error);
    }
};
