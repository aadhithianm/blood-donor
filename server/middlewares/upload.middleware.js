import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const createUploader = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'pdf']) => {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: `bloodlink/${folder}`,
            allowed_formats: allowedFormats,
            resource_type: 'auto',
        },
    });

    return multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    });
};

export const uploadMedCert = createUploader('medical-certificates');
export const uploadLicense = createUploader('hospital-licenses');
export const uploadAvatar = createUploader('avatars', ['jpg', 'jpeg', 'png']);

export default createUploader;
