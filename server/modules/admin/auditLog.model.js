import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: ['login', 'logout', 'register', 'password_reset', 'profile_update',
            'verification_approve', 'verification_reject', 'user_suspend',
            'user_activate', 'emergency_broadcast', 'report_generated'],
    },
    details: String,
    ip: String,
    deviceId: String,
}, {
    timestamps: true,
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
