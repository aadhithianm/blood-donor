import { useGetMyRequestsQuery } from '../../request/requestApi';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Droplets, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';
import { useEffect } from 'react';

const statusConfig = {
    pending: { badge: 'badge-warning', icon: Clock, label: 'Pending' },
    accepted: { badge: 'badge-info', icon: CheckCircle, label: 'Accepted' },
    'in-progress': { badge: 'badge-info', icon: AlertTriangle, label: 'In Progress' },
    completed: { badge: 'badge-success', icon: CheckCircle, label: 'Completed' },
    expired: { badge: 'badge-danger', icon: XCircle, label: 'Expired' },
    cancelled: { badge: 'badge-neutral', icon: XCircle, label: 'Cancelled' },
};

const RequestHistoryPage = () => {
    const { data, isLoading, refetch } = useGetMyRequestsQuery({});
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;
        const handleRefetch = () => refetch();
        
        socket.on('request_accepted', handleRefetch);
        socket.on('request_completed', handleRefetch);
        socket.on('request_expired', handleRefetch);
        
        return () => {
            socket.off('request_accepted', handleRefetch);
            socket.off('request_completed', handleRefetch);
            socket.off('request_expired', handleRefetch);
        };
    }, [socket, refetch]);

    const requests = data?.data || [];

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Request History</h1>

            {requests.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                    <Droplets className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No requests yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req, i) => {
                        const config = statusConfig[req.status] || statusConfig.pending;
                        return (
                            <motion.div
                                key={req._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card p-5 flex flex-col gap-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center font-bold text-red-400">
                                            {req.bloodGroup}
                                        </div>
                                        <div>
                                            <p className="font-medium">{req.unitsNeeded} unit{req.unitsNeeded > 1 ? 's' : ''} of {req.bloodGroup}</p>
                                            <p className="text-sm text-zinc-500">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-zinc-500 hidden sm:inline">{req.unitsFulfilled}/{req.unitsNeeded} fulfilled</span>
                                        <span className={`badge ${config.badge}`}>{config.label}</span>
                                    </div>
                                </div>
                                
                                {req.assignedDonors && req.assignedDonors.length > 0 && ['accepted', 'in-progress', 'completed'].includes(req.status) && (
                                    <div className="pt-4 border-t border-zinc-800 space-y-3">
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Matched Donors</h4>
                                        <div className="flex flex-col gap-2">
                                            {req.assignedDonors.map(assignment => {
                                                const donor = assignment.donorId;
                                                return donor ? (
                                                    <div key={assignment._id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                                                        <div>
                                                            <p className="font-bold text-sm text-zinc-200">{donor.name} <span className="text-xs font-normal text-zinc-500 ml-1">({assignment.status})</span></p>
                                                            <p className="text-xs text-zinc-500">{donor.mobile || 'No contact provided'}</p>
                                                        </div>
                                                        {donor.mobile && ['accepted', 'in-progress'].includes(assignment.status) && (
                                                            <a href={`tel:${donor.mobile}`} className="mt-2 sm:mt-0 btn-outline py-1.5 px-3 text-xs flex items-center justify-center gap-2 border-green-500/20 text-green-400 hover:bg-green-500/10">
                                                                Call Donor
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RequestHistoryPage;
