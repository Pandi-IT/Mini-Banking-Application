import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { logoutUser } from '../api/authService';
import { Landmark, LayoutDashboard, User, ShieldAlert, LogOut, Menu, X, ArrowLeftRight } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // Ignored for logout safety
    } finally {
      clearSession();
      addToast('Signed out successfully.', 'info');
      navigate('/login');
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['USER', 'ADMIN'],
    },
    {
      name: 'Transactions',
      path: '/transactions',
      icon: <ArrowLeftRight className="w-5 h-5" />,
      roles: ['USER', 'ADMIN'],
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <User className="w-5 h-5" />,
      roles: ['USER', 'ADMIN'],
    },
    {
      name: 'Admin Panel',
      path: '/admin',
      icon: <ShieldAlert className="w-5 h-5" />,
      roles: ['ADMIN'],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col md:flex-row select-none">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Landmark className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-white text-base">BankEase</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-400 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/60 md:bg-slate-900/40 border-r border-slate-800 md:translate-x-0 transition-transform duration-200 ease-in-out md:static flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-500 shadow-md shadow-indigo-500/10">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">BankEase</span>
          </div>

          {/* User Profile Mini Card */}
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 mb-6">
              {user.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border border-slate-800"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  {user.role}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-6 border-t border-slate-800/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-rose-950/20 hover:border-rose-900/30 border border-transparent transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-[calc(100vh-3.5rem)] md:min-h-screen md:max-h-screen overflow-y-auto md:p-8">
        {children}
      </main>
    </div>
  );
};
