import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResetPasswordMutation } from '../authApi';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

const schema = z.object({
    password: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [resetPassword, { isLoading }] = useResetPasswordMutation();
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

    const onSubmit = async (data) => {
        try {
            setError('');
            await resetPassword({ token, password: data.password }).unwrap();
            setDone(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.data?.message || 'Reset failed');
        }
    };

    if (done) {
        return (
            <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Password reset!</h2>
                <p className="text-zinc-500 text-sm">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-1">Reset password</h2>
            <p className="text-zinc-500 text-sm mb-6">Enter your new password</p>
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                    <input {...register('password')} type="password" placeholder="New password" className="input-field pl-11" />
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}

                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                    <input {...register('confirmPassword')} type="password" placeholder="Confirm password" className="input-field pl-11" />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}

                <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    Reset Password
                </button>
            </form>
        </div>
    );
};

export default ResetPasswordPage;
