import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  UserX,
  Plus,
  Key,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  Lock,
  User,
  Users,
  AlertTriangle,
  BadgeCheck,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { StaffMember, StaffRole } from '../../types';

interface StaffPanelProps {
  staffList: StaffMember[];
  currentStaff: StaffMember;
  onSelectStaff: (staff: StaffMember) => void;
  onUpdateStaffList: (staffList: StaffMember[]) => void;
}

export const StaffPanel: React.FC<StaffPanelProps> = ({
  staffList,
  currentStaff,
  onSelectStaff,
  onUpdateStaffList,
}) => {
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<StaffRole>('support_agent');
  const [phoneInput, setPhoneInput] = useState('');
  const [pinInput, setPinInput] = useState('1234');
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const getRoleLabel = (role: StaffRole) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin (Full Access)';
      case 'support_agent':
        return 'Support Agent (CRM & Chats)';
      case 'marketing_manager':
        return 'Marketing Manager (Broadcasts & Builder)';
    }
  };

  const getRoleBadgeStyle = (role: StaffRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'support_agent':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'marketing_manager':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const generatedUsername = usernameInput.trim().toLowerCase() || nameInput.trim().toLowerCase().replace(/\s+/g, '_');
    const generatedPassword = passwordInput.trim() || 'pass123';

    const newStaff: StaffMember = {
      id: `staff_${Date.now()}`,
      name: nameInput.trim(),
      email: emailInput.trim() || `${nameInput.toLowerCase().replace(/\s+/g, '.')}@vikrantexchange.com`,
      username: generatedUsername,
      password: generatedPassword,
      role: roleInput,
      phone: phoneInput.trim() || '+91 98000 00000',
      active: true,
      assignedChatsCount: 0,
      lastLoginAt: 'Never',
      pin: pinInput.trim() || '1234',
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000000)}?w=100&auto=format&fit=crop&q=80`,
    };

    onUpdateStaffList([...staffList, newStaff]);
    setNameInput('');
    setUsernameInput('');
    setPasswordInput('');
    setEmailInput('');
    setPhoneInput('');
    setIsAddingStaff(false);
    showToast(`Staff member "${newStaff.name}" added with User ID: ${generatedUsername}`);
  };

  const handleToggleActive = (staffId: string) => {
    if (staffId === currentStaff.id) {
      showToast('Cannot deactivate the currently active staff profile.');
      return;
    }
    const updated = staffList.map((s) =>
      s.id === staffId ? { ...s, active: !s.active } : s
    );
    onUpdateStaffList(updated);
    showToast('Staff status updated.');
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white border-2 border-emerald-500 text-slate-900 px-4 py-2.5 rounded-lg shadow-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider font-mono">
              Role-Based Staff Access Control (RBAC)
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Employees &amp; Staff Login Panel</h2>
          <p className="text-xs text-slate-700">
            Manage multi-agent roles, assign customer conversations, and control access permissions across your team.
          </p>
        </div>

        <button
          onClick={() => setIsAddingStaff(!isAddingStaff)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAddingStaff ? 'Cancel' : 'Add New Staff Member'}</span>
        </button>
      </div>

      {/* Currently Active Staff Bar */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-sky-50 p-4 rounded-xl border-2 border-sky-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center font-extrabold text-base border-2 border-sky-400 shrink-0">
            {currentStaff.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">{currentStaff.name}</span>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                LOGGED IN NOW
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Role: <strong className="text-slate-900">{getRoleLabel(currentStaff.role)}</strong> · {currentStaff.email}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          Chats Handled: <strong className="text-slate-900 font-bold">{currentStaff.assignedChatsCount}</strong>
        </div>
      </div>

      {/* Add Staff Form (Collapsible) */}
      {isAddingStaff && (
        <form onSubmit={handleAddStaff} className="bg-white p-5 rounded-xl border-2 border-sky-300 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>Create Employee Account</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Role Access Setup</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">User ID / Login Username *</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.toLowerCase().trim())}
                placeholder="e.g. rahul_v or agent2"
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">Login Password *</label>
              <input
                type="text"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="e.g. securePass123"
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">Official Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="rahul@telegrambot.com"
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">Assigned Role</label>
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as StaffRole)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="support_agent">Support Agent (CRM Chats Only)</option>
                <option value="marketing_manager">Marketing Manager (Broadcast &amp; Builder)</option>
                <option value="super_admin">Super Admin (Full System Access)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">Phone Number</label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingStaff(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Save &amp; Activate Staff
            </button>
          </div>
        </form>
      )}

      {/* Staff Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {staffList.map((staff) => {
          const isCurrent = staff.id === currentStaff.id;
          const displayUsername = staff.username || staff.name.toLowerCase().replace(/\s+/g, '_');
          const displayPassword = staff.password || 'admin123';
          const isPasswordVisible = !!visiblePasswords[staff.id];

          return (
            <div
              key={staff.id}
              className={`bg-white rounded-xl border-2 p-4 flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'border-sky-500 shadow-md ring-2 ring-sky-100'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-extrabold uppercase ${getRoleBadgeStyle(staff.role)}`}>
                    {staff.role.replace('_', ' ')}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${staff.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {staff.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">{staff.name}</h4>
                    <p className="text-[11px] text-slate-600 truncate">{staff.email}</p>
                  </div>
                </div>

                {/* Login Credentials Box */}
                <div className="mb-3 bg-sky-50/60 p-2.5 rounded-lg border border-sky-200 space-y-1.5 text-[11px]">
                  <div className="text-[10px] font-bold text-sky-900 uppercase tracking-wide flex items-center gap-1">
                    <Key className="w-3 h-3 text-sky-600" />
                    <span>Login Credentials</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-sky-100">
                    <span className="text-slate-500 font-medium">User ID:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-slate-900">{displayUsername}</span>
                      <button
                        onClick={() => copyToClipboard(displayUsername, 'User ID')}
                        title="Copy User ID"
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-sky-100">
                    <span className="text-slate-500 font-medium">Password:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-slate-900">
                        {isPasswordVisible ? displayPassword : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(staff.id)}
                        title={isPasswordVisible ? 'Hide password' : 'Show password'}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(displayPassword, 'Password')}
                        title="Copy Password"
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-800">
                  <div className="flex items-center justify-between">
                    <span>Chats Handled:</span>
                    <strong className="text-slate-900 font-bold">{staff.assignedChatsCount}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Login:</span>
                    <span className="text-slate-700">{staff.lastLoginAt}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                {isCurrent ? (
                  <div className="w-full py-1.5 text-center text-xs font-bold text-sky-700 bg-sky-50 rounded-lg border border-sky-200">
                    Active Profile
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectStaff(staff)}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Switch To Staff</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={() => handleToggleActive(staff.id)}
                  title={staff.active ? 'Deactivate staff' : 'Activate staff'}
                  className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 border border-slate-200"
                >
                  {staff.active ? <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> : <UserX className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role-Based Permissions Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-sky-600" />
          <span>Role Permissions Matrix</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-1">
            <span className="font-bold text-purple-900 block">👑 Super Admin</span>
            <p className="text-slate-800 text-[11px] leading-relaxed">
              Unrestricted access to all modules: Telegram Bot Token gateway, Webhook setup, Push Broadcasts, Bot Builder, CRM inbox, and Staff access configuration.
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-1">
            <span className="font-bold text-emerald-900 block">🎧 Support Agent (CRM Focus)</span>
            <p className="text-slate-800 text-[11px] leading-relaxed">
              Dedicated Customer Chat Inbox, unseen/seen message management, customer activity timeline, sending VIP WhatsApp IDs, and handling inquiries.
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
            <span className="font-bold text-amber-900 block">📢 Marketing Manager</span>
            <p className="text-slate-800 text-[11px] leading-relaxed">
              Access to Mass Push Broadcasts, Cricket BLAST match templates, Bot Builder posters &amp; buttons, and conversion funnel analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
