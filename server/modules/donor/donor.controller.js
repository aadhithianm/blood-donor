import donorService from './donor.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getProfile = async (req, res, next) => {
    try {
        const profile = await donorService.getProfile(req.user._id);
        sendSuccess(res, { data: profile });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const profile = await donorService.createOrUpdateProfile(req.user._id, req.body);
        sendSuccess(res, { message: 'Profile updated', data: profile });
    } catch (error) {
        next(error);
    }
};

export const uploadCertificate = async (req, res, next) => {
    try {
        if (!req.file) {
            return sendSuccess(res, { statusCode: 400, message: 'No file uploaded' });
        }
        const profile = await donorService.uploadCertificate(req.user._id, req.file.path);
        sendSuccess(res, { message: 'Certificate uploaded. Pending verification.', data: profile });
    } catch (error) {
        next(error);
    }
};

export const toggleAvailability = async (req, res, next) => {
    try {
        const { availability } = req.body;
        const profile = await donorService.toggleAvailability(req.user._id, availability);
        sendSuccess(res, { message: `Availability set to ${availability}`, data: profile });
    } catch (error) {
        next(error);
    }
};

export const getDashboard = async (req, res, next) => {
    try {
        const data = await donorService.getDashboard(req.user._id);
        sendSuccess(res, { data });
    } catch (error) {
        next(error);
    }
};
