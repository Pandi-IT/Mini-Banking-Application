import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { updateProfile, uploadProfilePicture } from '../../api/userService';
import { changePassword } from '../../api/authService';
import { User as UserIcon, Shield, ShieldCheck, Camera, Lock, Eye, EyeOff } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(50, 'Name must be under 50 characters'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ['confirmNewPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export const Profile: React.FC = () => {
  const { user, token, refreshToken, setSession } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onUpdateProfile = async (data: ProfileFormValues) => {
    setIsLoadingProfile(true);
    try {
      const response = await updateProfile(data.fullName);
      if (response.success && response.data && token && refreshToken) {
        setSession(response.data, token, refreshToken);
        addToast('Profile updated successfully!', 'success');
      } else {
        addToast(response.message || 'Failed to update profile.', 'error');
      }
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Update failed.', 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const onChangePasswordSubmit = async (data: PasswordFormValues) => {
    setIsLoadingPassword(true);
    try {
      const response = await changePassword(data.currentPassword, data.newPassword);
      if (response.success) {
        addToast('Password changed successfully!', 'success');
        resetPasswordForm();
      } else {
        addToast(response.message || 'Failed to change password.', 'error');
      }
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Password change failed.', 'error');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file.', 'warning');
      return;
    }

    try {
      const response = await uploadProfilePicture(file);
      if (response.success && response.data && token && refreshToken) {
        setSession(response.data, token, refreshToken);
        addToast('Profile picture uploaded successfully!', 'success');
      } else {
        addToast(response.message || 'Avatar upload failed.', 'error');
      }
    } catch (error: any) {
      addToast(error.response?.data?.message || 'File upload failed.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 md:px-0 pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Your Profile</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your identity and authentication security settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <div className="md:col-span-1 backdrop-blur-md bg-slate-900/30 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="relative group">
            {user?.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt="avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center font-extrabold text-3xl text-indigo-400">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition-colors duration-150 shadow-md">
              <Camera className="w-4 h-4" />
              <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
            </label>
          </div>

          <h2 className="text-lg font-bold text-white mt-4">{user?.fullName}</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>

          <div className="w-full border-t border-slate-800/60 my-5" />

          <div className="flex flex-col w-full gap-3 text-left">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-indigo-400" />
              <div className="text-xs">
                <p className="font-semibold text-slate-400">Role Authority</p>
                <p className="text-white font-bold tracking-wider mt-0.5 uppercase">{user?.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-xs">
                <p className="font-semibold text-slate-400">Account Status</p>
                <p className="text-emerald-400 font-bold tracking-wide mt-0.5 uppercase">
                  {user?.enabled ? 'Active / Verified' : 'Suspended'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile and Password Form Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Profile</h3>
            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    disabled={isLoadingProfile}
                    placeholder="John Doe"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                      profileErrors.fullName
                        ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                        : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                    }`}
                    {...registerProfile('fullName')}
                  />
                </div>
                {profileErrors.fullName && (
                  <p className="text-xs text-rose-400 mt-1.5 font-medium">{profileErrors.fullName.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoadingProfile}
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm text-white disabled:opacity-50 transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoadingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
            <form onSubmit={handleSubmitPassword(onChangePasswordSubmit)} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={isLoadingPassword}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                      passwordErrors.currentPassword
                        ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                        : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                    }`}
                    {...registerPassword('currentPassword')}
                  />
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-rose-400 mt-1.5 font-medium">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={isLoadingPassword}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                      passwordErrors.newPassword
                        ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                        : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                    }`}
                    {...registerPassword('newPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-xs text-rose-400 mt-1.5 font-medium">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={isLoadingPassword}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/40 border transition-all duration-200 outline-none ${
                      passwordErrors.confirmNewPassword
                        ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500/25'
                        : 'border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10'
                    }`}
                    {...registerPassword('confirmNewPassword')}
                  />
                </div>
                {passwordErrors.confirmNewPassword && (
                  <p className="text-xs text-rose-400 mt-1.5 font-medium">{passwordErrors.confirmNewPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoadingPassword}
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm text-white disabled:opacity-50 transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoadingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;
