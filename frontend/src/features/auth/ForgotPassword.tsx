import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Landmark, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../api/authService';
import { useToastStore } from '../../store/toastStore';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    setResetToken(null);
    try {
      const response = await forgotPassword(data.email);
      if (response.success) {
        addToast('Password reset token generated! Check server logs.', 'success');
        if (response.data) {
          setResetToken(response.data);
        }
      } else {
        addToast(response.message || 'Failed to request reset token.', 'error');
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
            <h2 className="text-xl font-semibold text-white">Forgot Password</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Enter your email address and we will generate a secure reset token in the console for simulation.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  disabled={isLoading}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                    errors.email
                      ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                      : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:from-indigo-700 active:to-blue-700 disabled:opacity-50 transition-all duration-150 shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Requesting Token...</span>
                </>
              ) : (
                <span>Request Reset Token</span>
              )}
            </button>
          </form>

          {/* Local Simulated Token Display */}
          {resetToken && (
            <div className="mt-6 p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/30 text-slate-300">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                Simulated Reset Details
              </p>
              <p className="text-xs mb-3 font-medium">
                Copy the token below and use it on the Reset Password page.
              </p>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] break-all select-all flex justify-between items-center text-indigo-300">
                {resetToken}
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  to="/reset-password"
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Proceed to Reset &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
