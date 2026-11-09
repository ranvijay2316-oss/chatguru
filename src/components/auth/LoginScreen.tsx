import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Bot
} from 'lucide-react';
import { StaffMember } from '../../types';

interface LoginScreenProps {
  staffList: StaffMember[];
  onLoginSuccess: (staff: StaffMember, rememberMe: boolean) => void;
  botName?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  staffList,
  onLoginSuccess,
  botName,
}) => {
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    setTimeout(() => {
      // Find staff matching username, email, or id
      const matched = staffList.find(
        (s) =>
          (s.username && s.username.toLowerCase() === cleanUser) ||
          (s.email && s.email.toLowerCase() === cleanUser) ||
          s.id.toLowerCase() === cleanUser ||
          s.name.toLowerCase() === cleanUser
      );

      if (matched) {
        const expectedPass = matched.password || matched.pin || 'admin123';
        if (cleanPass === expectedPass || (cleanUser === 'admin' && cleanPass === 'admin123')) {
          setIsLoading(false);
          onLoginSuccess(matched, rememberMe);
          return;
        }
      }

      // Fallback for default super admin if list is empty or reset
      if (cleanUser === 'admin' && cleanPass === 'admin123') {
        const adminStaff: StaffMember = staffList[0] || {
          id: 'staff_1',
          name: 'Admin',
          email: 'admin@telegrambot.com',
          username: 'admin',
          password: 'admin123',
          role: 'super_admin',
          active: true,
          assignedChatsCount: 0,
          lastLoginAt: 'Active Now',
        };
        setIsLoading(false);
        onLoginSuccess(adminStaff, rememberMe);
        return;
      }

      setIsLoading(false);
      setErrorMessage('Invalid User ID or Password. Please verify your credentials or use the Quick Access buttons below.');
    }, 300);
  };

  const handleQuickLogin = (role: 'admin' | 'agent') => {
    if (role === 'admin') {
      setUsernameInput('admin');
      setPasswordInput('admin123');
      setErrorMessage(null);
      const admin = staffList.find((s) => s.username === 'admin' || s.role === 'super_admin') || staffList[0];
      if (admin) {
        onLoginSuccess(admin, true);
      }
    } else {
      setUsernameInput('agent');
      setPasswordInput('agent123');
      setErrorMessage(null);
      const agent = staffList.find((s) => s.username === 'agent' || s.role === 'support_agent') || staffList[1] || staffList[0];
      if (agent) {
        onLoginSuccess(agent, true);
      }
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-slate-900 select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Brand Header */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-sky-400/20 blur-xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Bot className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-xl font-black tracking-tight text-white">
            {botName || 'TeleBot Studio & Admin Suite'}
          </h2>
          <p className="text-xs text-sky-100 font-medium mt-1">
            Secure Staff &amp; Administrator Login Portal
          </p>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2.5 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="flex-1 leading-snug">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID Field */}
            <div>
              <label className="text-xs font-black text-slate-900 block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>User ID / Username</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter User ID (e.g. admin)"
                  className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-black text-slate-900 block mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-600" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full text-xs font-bold pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Credentials Box */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-2 text-center uppercase tracking-wider">
              Quick One-Click Staff Login:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-300 hover:border-purple-300 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 group-hover:text-purple-900">
                    Super Admin
                  </span>
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  admin / admin123
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('agent')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 group-hover:text-emerald-900">
                    Support Agent
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  agent / agent123
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
