import hospitalService from './hospital.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getProfile = async (req, res, next) => {
    try {
        const profile = await hospitalService.getProfile(req.user._id);
        sendSuccess(res, { data: profile });
    } catch (error) { next(error); }
};

export const updateProfile = async (req, res, next) => {
    try {
        const profile = await hospitalService.createOrUpdateProfile(req.user._id, req.body);
        sendSuccess(res, { message: 'Profile updated', data: profile });
    } catch (error) { next(error); }
};

export const uploadLicense = async (req, res, next) => {
    try {
        if (!req.file) return sendSuccess(res, { statusCode: 400, message: 'No file uploaded' });
        const profile = await hospitalService.uploadLicense(req.user._id, req.file.path);
        sendSuccess(res, { message: 'License uploaded. Pending verification.', data: profile });
    } catch (error) { next(error); }
};

export const getPendingDonors = async (req, res, next) => {
    try {
        const donors = await hospitalService.getPendingDonors(req.user._id);
        sendSuccess(res, { data: donors });
    } catch (error) { next(error); }
};

export const verifyDonor = async (req, res, next) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const donor = await hospitalService.verifyDonor(req.user._id, req.params.id, action);
        sendSuccess(res, { message: `Donor ${action}d`, data: donor });
    } catch (error) { next(error); }
};

export const getInventory = async (req, res, next) => {
    try {
        const inventory = await hospitalService.getInventory(req.user._id);
        sendSuccess(res, { data: inventory });
    } catch (error) { next(error); }
};

export const updateInventory = async (req, res, next) => {
    try {
        const { bloodGroup, units } = req.body;
        const inventory = await hospitalService.updateInventory(req.user._id, bloodGroup, units);
        sendSuccess(res, { message: 'Inventory updated', data: inventory });
    } catch (error) { next(error); }
};

export const createBulkRequest = async (req, res, next) => {
    try {
        const requests = await hospitalService.createBulkRequest(req.user._id, req.body.requests);
        sendSuccess(res, { statusCode: 201, message: `${requests.length} requests created`, data: requests });
    } catch (error) { next(error); }
};
