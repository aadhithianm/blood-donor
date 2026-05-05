import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useGetAdminUsersQuery, useDeleteAdminUserMutation,
    useSuspendUserMutation, useActivateUserMutation,
    useGetUserNotesQuery, useUpdateUserNotesMutation,
    useUpdateAdminUserMutation, useUpdateUserVerificationMutation
} from '../adminApi';
import { useToast } from '../../../hooks/useToast';
import { SkeletonTableRow } from '../../../components/Skeletons';
import { store } from '../../../app/store';
import {
    Users, Search, Download, Plus, X, Save, Loader2,
    ChevronLeft, ChevronRight, Trash2, ShieldOff, ShieldCheck,
    Eye, Pencil, AlertTriangle, SlidersHorizontal,
} from 'lucide-react';

const ROLE_STYLE = {
    admin:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    donor:     { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    requester: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    hospital:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
};

/* ── Small Confirm Dialog ──────────────────────────────────── */
const ConfirmModal = ({ title, message, confirmLabel, danger, onConfirm, onCancel, loading }) => (
    <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: danger ? '#ef4444' : '#22c55e' }} />
            </div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>Cancel</button>
                <button onClick={onConfirm} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
                    style={{ background: danger ? '#dc2626' : '#22c55e', color: '#fff' }}>
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{confirmLabel}
                </button>
            </div>
        </motion.div>
    </motion.div>
);

/* ── Create / Edit User Modal ──────────────────────────────── */
const UserFormModal = ({ user, onClose, onSaved }) => {
    const [updateUser, { isLoading: updating }] = useUpdateAdminUserMutation();
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        mobile: user?.mobile || '',
        role: user?.role || 'donor',
    });
    const toast = useToast();
    const isEditMode = !!user;

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
        try {
            if (isEditMode) {
                await updateUser({ id: user._id, ...form }).unwrap();
                toast.success('User updated successfully');
            }
            onSaved?.();
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Action failed');
        }
    };

    const Field = ({ label, name, type = 'text', options }) => (
        <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</label>
            {options ? (
                <select value={form[name]} onChange={set(name)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)', color: 'var(--text-primary)' }}>
                    {options.map(o => <option key={o} value={o} className="bg-gray-900">{o}</option>)}
                </select>
            ) : (
                <input type={type} value={form[name]} onChange={set(name)} required={name === 'name' || name === 'email'}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)', color: 'var(--text-primary)' }} />
            )}
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div initial={{ y: 24, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, scale: 0.96 }}
                className="w-full max-w-md rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                        {isEditMode ? 'Edit User' : 'Create User'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <Field label="Full Name" name="name" />
                    <Field label="Email" name="email" type="email" />
                    <Field label="Mobile" name="mobile" type="tel" />
                    <Field label="Role" name="role" options={['donor', 'requester', 'hospital', 'admin']} />
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                            style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={updating}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg,#dc2626,#e11d48)', color: '#fff' }}>
                            {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {isEditMode ? 'Save Changes' : 'Create'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

/* ── User Detail Drawer ────────────────────────────────────── */
const UserDrawer = ({ user, onClose }) => {
    const { data: notesData } = useGetUserNotesQuery(user._id);
    const [updateNotes, { isLoading: savingNotes }] = useUpdateUserNotesMutation();
    const [updateVerification, { isLoading: updatingVerif }] = useUpdateUserVerificationMutation();
    const [notes, setNotes] = useState('');
    const [notesDirty, setNotesDirty] = useState(false);
    const toast = useToast();

    const currentNotes = notesData?.data?.adminNotes || '';
    const displayNotes = notesDirty ? notes : currentNotes;

    const onNotesChange = (v) => { setNotes(v); setNotesDirty(true); };
    const handleSaveNotes = async () => {
        try {
            await updateNotes({ id: user._id, notes }).unwrap();
            toast.success('Notes saved');
            setNotesDirty(false);
        } catch { toast.error('Failed to save notes'); }
    };

    const toggleStatus = async (field, currentValue) => {
        try {
            await updateVerification({ id: user._id, [field]: !currentValue }).unwrap();
            toast.success('Verification status updated');
        } catch { toast.error('Failed to update verification'); }
    };



    const rs = ROLE_STYLE[user.role] || ROLE_STYLE.donor;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40" onClick={onClose}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                onClick={e => e.stopPropagation()}
                className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto flex flex-col"
                style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--bg-ghost-border)' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 shrink-0" style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}>
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>User Details</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {/* Profile section */}
                <div className="p-5 space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                            {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                                style={{ background: rs.bg, color: rs.color }}>{user.role}</span>
                        </div>
                    </div>

                    {/* Info rows */}
                    {[
                        ['Email', user.email],
                        ['Mobile', user.mobile || '—'],
                        ['Status', user.isSuspended ? 'Suspended' : 'Active'],
                        ['Joined', new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })]
                    ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-sm py-2" style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                            <span className="font-medium" style={{ color: value === 'Suspended' ? '#ef4444' : 'var(--text-primary)' }}>{value}</span>
                        </div>
                    ))}

                    {/* Verification Controls */}
                    <div className="pt-2 pb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Verification overrides</label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 rounded-xl" style={{ border: '1px solid var(--bg-ghost-border)', background: 'var(--bg-input)' }}>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Email Verified</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bypass OTP verification</p>
                                </div>
                                <button onClick={() => toggleStatus('isEmailVerified', user.isEmailVerified)} disabled={updatingVerif}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${user.isEmailVerified ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                                    {user.isEmailVerified ? 'Verified' : 'Verify'}
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl" style={{ border: '1px solid var(--bg-ghost-border)', background: 'var(--bg-input)' }}>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Medical Verified</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Required for donors</p>
                                </div>
                                <button onClick={() => toggleStatus('isVerified', user.isVerified)} disabled={updatingVerif}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${user.isVerified ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                                    {user.isVerified ? 'Verified' : 'Verify'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="pt-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                            Private Admin Notes
                        </label>
                        <textarea rows={4} value={displayNotes} onChange={e => onNotesChange(e.target.value)}
                            placeholder="Add private notes about this user…"
                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)', color: 'var(--text-primary)' }} />
                        {notesDirty && (
                            <button onClick={handleSaveNotes} disabled={savingNotes}
                                className="mt-2 w-full py-2 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg,#dc2626,#e11d48)', color: '#fff' }}>
                                {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save Notes
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ── UsersPage ─────────────────────────────────────────────── */
const UsersPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');
    const [drawerId, setDrawerId] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [exporting, setExporting] = useState(false);
    const toast = useToast();

    const { data, isLoading, refetch } = useGetAdminUsersQuery({ page, limit: 15, role, search, status });
    const [deleteUser, { isLoading: deleting }] = useDeleteAdminUserMutation();
    const [suspendUser, { isLoading: suspending }] = useSuspendUserMutation();
    const [activateUser, { isLoading: activating }] = useActivateUserMutation();

    const users = data?.data || [];
    const pagination = data?.pagination;

    const handleConfirm = async () => {
        if (!confirm) return;
        try {
            if (confirm.type === 'delete') { await deleteUser(confirm.id).unwrap(); toast.success(`${confirm.name} deleted`); }
            if (confirm.type === 'suspend') { await suspendUser(confirm.id).unwrap(); toast.error(`${confirm.name} suspended`); }
            if (confirm.type === 'activate') { await activateUser(confirm.id).unwrap(); toast.success(`${confirm.name} activated`); }
            setConfirm(null);
        } catch { toast.error('Action failed'); }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams({ ...(role && { role }), ...(status && { status }), ...(search && { search }) });
            const token = store.getState()?.auth?.accessToken || '';
            const res = await fetch(`/api/admin/users/export?${params}`, {
                credentials: 'include',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'bloodlink-users.csv'; a.click();
            URL.revokeObjectURL(url);
            toast.success('CSV exported');
        } catch { toast.error('Export failed'); }
        setExporting(false);
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Users</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{pagination?.total ?? '—'} registered users</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} disabled={exporting}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                        style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Export CSV
                    </button>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search name or email…"
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)', color: 'var(--text-primary)' }} />
                </div>
                {/* Role filter */}
                {['', 'donor', 'requester', 'hospital', 'admin'].map(r => {
                    const rs = ROLE_STYLE[r];
                    return (
                        <button key={r} onClick={() => { setRole(r); setPage(1); }}
                            className="px-3 py-2 rounded-xl text-xs font-medium cursor-pointer capitalize"
                            style={{ background: role === r ? (rs?.bg || 'linear-gradient(135deg,#dc2626,#e11d48)') : 'var(--bg-ghost)', color: role === r ? (rs?.color || '#fff') : 'var(--text-secondary)', border: `1px solid ${role === r ? (rs?.color + '40' || '#dc2626') : 'var(--bg-ghost-border)'}` }}>
                            {r || 'All Roles'}
                        </button>
                    );
                })}
                {/* Status filter */}
                {['', 'active', 'suspended'].map(s => (
                    <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                        className="px-3 py-2 rounded-xl text-xs font-medium cursor-pointer capitalize"
                        style={{ background: status === s && s ? 'var(--bg-ghost)' : 'transparent', color: s === 'suspended' ? '#ef4444' : s === 'active' ? '#22c55e' : 'var(--text-muted)', border: `1px solid ${status === s && s ? 'var(--bg-input-border)' : 'var(--bg-ghost-border)'}` }}>
                        {s || 'All Status'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--bg-ghost-border)', background: 'var(--bg-surface)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--bg-ghost-border)', background: 'var(--bg-ghost)' }}>
                                {['User', 'Role', 'Mobile', 'Status', 'Joined', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} cols={6} />)
                                : users.map((user, i) => {
                                    const rs = ROLE_STYLE[user.role] || ROLE_STYLE.donor;
                                    return (
                                        <motion.tr key={user._id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                                            className="cursor-pointer hover:bg-[var(--bg-ghost)] transition-colors"
                                            onClick={() => setDrawerId(user._id)}
                                            style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                                        style={{ background: rs.bg, color: rs.color }}>
                                                        {user.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-semibold px-2 py-1 rounded-full capitalize"
                                                    style={{ background: rs.bg, color: rs.color }}>{user.role}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{user.mobile || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-semibold px-2 py-1 rounded-full"
                                                    style={{ background: user.isSuspended ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: user.isSuspended ? '#ef4444' : '#22c55e' }}>
                                                    {user.isSuspended ? 'Suspended' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-1">
                                                    {/* View */}
                                                    <button title="View details" onClick={(e) => { e.stopPropagation(); setDrawerId(user._id); }}
                                                        className="p-1.5 rounded-lg cursor-pointer hover:opacity-80"
                                                        style={{ color: 'var(--text-muted)', background: 'var(--bg-ghost)' }}>
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    {/* Edit */}
                                                    <button title="Edit user" onClick={() => setEditUser(user)}
                                                        className="p-1.5 rounded-lg cursor-pointer hover:opacity-80"
                                                        style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.08)' }}>
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    {/* Suspend / Activate */}
                                                    {user.isSuspended ? (
                                                        <button title="Activate" onClick={() => setConfirm({ type: 'activate', id: user._id, name: user.name })}
                                                            className="p-1.5 rounded-lg cursor-pointer hover:opacity-80"
                                                            style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}>
                                                            <ShieldCheck className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <button title="Suspend" onClick={() => setConfirm({ type: 'suspend', id: user._id, name: user.name })}
                                                            className="p-1.5 rounded-lg cursor-pointer hover:opacity-80"
                                                            style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
                                                            <ShieldOff className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {/* Delete */}
                                                    <button title="Delete user" onClick={() => setConfirm({ type: 'delete', id: user._id, name: user.name })}
                                                        className="p-1.5 rounded-lg cursor-pointer hover:opacity-80"
                                                        style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            }
                            {!isLoading && users.length === 0 && (
                                <tr><td colSpan={6} className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No users found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                            className="p-2 rounded-lg cursor-pointer disabled:opacity-40"
                            style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {/* Page number pills */}
                        {Array.from({ length: Math.min(pagination.pages, 5) }).map((_, i) => {
                            const p = i + 1;
                            return (
                                <button key={p} onClick={() => setPage(p)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                                    style={{ background: page === p ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'var(--bg-ghost)', color: page === p ? '#fff' : 'var(--text-secondary)', border: `1px solid ${page === p ? '#dc2626' : 'var(--bg-ghost-border)'}` }}>
                                    {p}
                                </button>
                            );
                        })}
                        <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                            className="p-2 rounded-lg cursor-pointer disabled:opacity-40"
                            style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modals & Drawers */}
            <AnimatePresence>
                {drawerId && users.find(u => u._id === drawerId) && <UserDrawer user={users.find(u => u._id === drawerId)} onClose={() => setDrawerId(null)} />}
                {editUser && <UserFormModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => refetch()} />}
                {confirm && (
                    <ConfirmModal
                        title={confirm.type === 'delete' ? 'Delete User' : confirm.type === 'suspend' ? 'Suspend User' : 'Activate User'}
                        message={
                            confirm.type === 'delete' ? `Permanently delete "${confirm.name}"? This cannot be undone.` :
                            confirm.type === 'suspend' ? `Suspend "${confirm.name}"? They won't be able to log in.` :
                            `Reactivate "${confirm.name}"'s account?`
                        }
                        confirmLabel={confirm.type === 'delete' ? 'Delete' : confirm.type === 'suspend' ? 'Suspend' : 'Activate'}
                        danger={confirm.type !== 'activate'}
                        onConfirm={handleConfirm}
                        onCancel={() => setConfirm(null)}
                        loading={deleting || suspending || activating}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default UsersPage;
