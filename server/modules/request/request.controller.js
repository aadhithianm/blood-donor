import requestService from './request.service.js';
import { sendSuccess } from '../../utils/response.js';

export const createRequest = async (req, res, next) => {
    try {
        const result = await requestService.createRequest(req.user._id, req.body);
        sendSuccess(res, { statusCode: 201, message: 'Request created', data: result });
    } catch (error) {
        next(error);
    }
};

export const getRequest = async (req, res, next) => {
    try {
        const request = await requestService.getRequestById(req.params.id);
        sendSuccess(res, { data: request });
    } catch (error) {
        next(error);
    }
};

export const acceptRequest = async (req, res, next) => {
    try {
        const result = await requestService.acceptRequest(req.params.id, req.user._id);
        sendSuccess(res, { message: 'Request accepted', data: result });
    } catch (error) {
        next(error);
    }
};

export const completeRequest = async (req, res, next) => {
    try {
        const request = await requestService.completeRequest(req.params.id, req.user._id);
        sendSuccess(res, { message: 'Request completed', data: request });
    } catch (error) {
        next(error);
    }
};

export const getMyRequests = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await requestService.getMyRequests(req.user._id, parseInt(page), parseInt(limit));
        sendSuccess(res, { data: result.requests, pagination: result.pagination });
    } catch (error) {
        next(error);
    }
};

export const getDonorFeed = async (req, res, next) => {
    try {
        const result = await requestService.getDonorFeed(req.user);
        sendSuccess(res, { data: result });
    } catch (error) {
        next(error);
    }
};

export const getDonorHistory = async (req, res, next) => {
    try {
        const requests = await requestService.getDonorHistory(req.user._id);
        sendSuccess(res, { count: requests.length, data: requests });
    } catch (error) {
        next(error);
    }
};
