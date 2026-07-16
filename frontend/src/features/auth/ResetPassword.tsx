import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Landmark, ArrowLeft, Key } from 'lucide-react';
import { resetPassword } from '../../api/authService';
import { useToastStore } from '../../store/toastStore';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    setIsLoading(true);
    try {
      const response = await resetPassword(data.token, data.newPassword);
      if (response.success) {
        addToast('Password has been reset successfully! Please sign in.', 'success');
        navigate('/login');
      } else {
        addToast(response.message || 'Failed to reset password. Token might be invalid.', 'error');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Connection error.';
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#030712] overflow-hidden px-4 select-none">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 mb-3 shadow-md shadow-indigo-500/20">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">BankEase Portal</h1>
        </div>

        {/* Card Form */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-semibold text-white">Reset Password</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Enter the reset token that you copied from the forgot password simulation and type your new password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Token */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Reset Token
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  disabled={isLoading}
                  placeholder="Paste token here"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                    errors.token
                      ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                      : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                  }`}
                  {...register('token')}
                />
              </div>
              {errors.token && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.token.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  disabled={isLoading}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                    errors.newPassword
                      ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                      : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                  }`}
                  {...register('newPassword')}
                />
              </div>
              {errors.newPassword && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  disabled={isLoading}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                    errors.confirmPassword
                      ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                      : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                  }`}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:from-indigo-700 active:to-blue-700 disabled:opacity-50 transition-all duration-150 shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
