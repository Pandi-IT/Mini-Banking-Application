import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, Landmark } from 'lucide-react';
import { registerUser } from '../../api/authService';
import { useToastStore } from '../../store/toastStore';

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(50, 'Name must be under 50 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await registerUser(data.fullName, data.email, data.password);
      if (response.success) {
        addToast('Registration successful! Please sign in.', 'success');
        navigate('/login');
      } else {
        addToast(response.message || 'Registration failed.', 'error');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Registration failed. Connection error.';
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
        className="relative z-10 w-full max-w-md my-8"
      >
        {/* Brand Title */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 mb-2 shadow-md shadow-indigo-500/20">
            <Landmark className="w-5.5 h-5.5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">BankEase Portal</h1>
        </div>

        {/* Card Form */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-5">Create Account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  disabled={isLoading}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                    errors.fullName
                      ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                      : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                  }`}
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-rose-400 mt-1 font-medium">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
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
                <p className="text-xs text-rose-400 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                    errors.password
                      ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                      : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-400 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                    errors.confirmPassword
                      ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                      : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                  }`}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-400 mt-1 font-medium">{errors.confirmPassword.message}</p>
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          {/* Login Redirect */}
          <p className="text-slate-400 text-center text-xs mt-5 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
