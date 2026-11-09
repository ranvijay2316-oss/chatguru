import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Send,
  UserPlus,
  Phone,
  Clock,
  Tag,
  CheckCircle2,
  X,
  MessageSquare,
  Sparkles,
  Shield,
  Copy,
  Check,
  Eye,
  EyeOff,
  Calendar,
  Activity,
  History,
  UserCheck,
  Flame,
  ArrowRight,
  Download,
  ExternalLink,
  Share2,
  FileText
} from 'lucide-react';
import { UserSubscriber, ChatMessage, StaffMember, UserActivityItem } from '../../types';

interface CrmUsersTabProps {
  users: UserSubscriber[];
  onUpdateUsers: (users: UserSubscriber[]) => void;
  selectedUser: UserSubscriber | null;
  onSelectUser: (user: UserSubscriber | null) => void;
  onSendAdminMessage: (userId: string, text: string) => void;
  messages: ChatMessage[];
  currentStaff?: StaffMember;
  staffList?: StaffMember[];
}

export const CrmUsersTab: React.FC<CrmUsersTabProps> = ({
  users,
  onUpdateUsers,
  selectedUser,
  onSelectUser,
  onSendAdminMessage,
  messages,
  currentStaff,
  staffList = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unseen' | 'seen' | 'vip' | 'new' | 'existing' | 'has_phone'>('all');
  const [replyText, setReplyText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSearch, setExportSearch] = useState('');
  const [activeTabInDrawer, setActiveTabInDrawer] = useState<'chat' | 'activity'>('chat');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // New Lead Form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserTg, setNewUserTg] = useState('');
  const [newUserType, setNewUserType] = useState<'new' | 'existing' | 'vip'>('new');
  const [newUserSource, setNewUserSource] = useState<'telegram_bot' | 'web_portal' | 'whatsapp'>('telegram_bot');

  const totalUnseenCount = users.filter((u) => (u.unreadCount || 0) > 0).length;
  const usersWithPhones = users.filter((u) => !!u.phone && u.phone.trim().length > 0);
  const existingClientsCount = users.filter((u) => u.customerType === 'existing').length;

  // Auto-scroll messages thread when new messages arrive
  useEffect(() => {
    if (activeTabInDrawer === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUser, activeTabInDrawer]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      u.telegramId.includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    if (filterType === 'unseen') return (u.unreadCount || 0) > 0;
    if (filterType === 'seen') return !u.unreadCount || u.unreadCount === 0;
    if (filterType === 'existing') return u.customerType === 'existing';
    if (filterType === 'vip') return u.customerType === 'vip';
    if (filterType === 'new') return u.customerType === 'new' || u.customerType === 'lead';
    if (filterType === 'has_phone') return !!u.phone && u.phone.trim().length > 0;
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleToggleSeen = (userId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = users.map((u) => {
      if (u.id === userId) {
        const isCurrentlyUnseen = (u.unreadCount || 0) > 0;
        const newUnread = isCurrentlyUnseen ? 0 : 1;
        const newTimeline = [...(u.activityTimeline || [])];
        newTimeline.push({
          id: `act_${Date.now()}`,
          timestamp: 'Just now',
          action: isCurrentlyUnseen
            ? `Marked SEEN by staff ${currentStaff?.name || 'Admin'}`
            : `Marked UNSEEN for follow-up`,
          type: 'admin_reply',
        });
        return {
          ...u,
          unreadCount: newUnread,
          activityTimeline: newTimeline,
        };
      }
      return u;
    });
    onUpdateUsers(updated);
    if (selectedUser?.id === userId) {
      const active = updated.find((u) => u.id === userId);
      if (active) onSelectUser(active);
    }
  };

  const handleAssignStaff = (userId: string, staffId: string) => {
    const assignedStaff = staffList.find((s) => s.id === staffId);
    const updated = users.map((u) => {
      if (u.id === userId) {
        const newTimeline = [...(u.activityTimeline || [])];
        newTimeline.push({
          id: `act_${Date.now()}`,
          timestamp: 'Just now',
          action: `Chat assigned to ${assignedStaff ? assignedStaff.name : 'Unassigned'}`,
          type: 'admin_reply',
        });
        return {
          ...u,
          assignedStaffId: staffId,
          assignedStaffName: assignedStaff?.name || 'Unassigned',
          activityTimeline: newTimeline,
        };
      }
      return u;
    });
    onUpdateUsers(updated);
    if (selectedUser?.id === userId) {
      const active = updated.find((u) => u.id === userId);
      if (active) onSelectUser(active);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedUser) return;
    onSendAdminMessage(selectedUser.id, replyText.trim());

    // Auto mark seen and log activity timeline
    const updated = users.map((u) => {
      if (u.id === selectedUser.id) {
        const newTimeline = [...(u.activityTimeline || [])];
        newTimeline.push({
          id: `act_${Date.now()}`,
          timestamp: 'Just now',
          action: `Staff ${currentStaff?.name || 'Admin'} sent reply: "${replyText.trim()}"`,
          type: 'admin_reply',
        });
        return {
          ...u,
          unreadCount: 0,
          lastActiveAt: 'Just now',
          activityTimeline: newTimeline,
        };
      }
      return u;
    });
    onUpdateUsers(updated);
    if (selectedUser) {
      const active = updated.find((u) => u.id === selectedUser.id);
      if (active) onSelectUser(active);
    }
    setReplyText('');
  };

  // Export Numbers Functions
  const handleDownloadCsv = () => {
    const rows = [
      ['Telegram ID', 'Customer Name', 'Username', 'Phone Number', 'Customer Type', 'Joined Date', 'Last Active'],
      ...usersWithPhones.map((u) => [
        u.telegramId,
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.username}"`,
        `"${u.phone || ''}"`,
        u.customerType,
        `"${u.joinedAt}"`,
        `"${u.lastActiveAt}"`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_shared_numbers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTxt = () => {
    const lines = usersWithPhones.map((u) => `${u.phone} - ${u.name} (${u.username})`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer_phone_numbers_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAllNumbers = (delimiter: string) => {
    const numbersList = usersWithPhones.map((u) => (u.phone || '').trim()).filter(Boolean);
    const textToCopy = numbersList.join(delimiter);
    navigator.clipboard.writeText(textToCopy);
    setCopiedId('bulk_numbers');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const currentDay = days[now.getDay()];
    const currentDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newUser: UserSubscriber = {
      id: `usr_${Date.now()}`,
      telegramId: Math.floor(100000000 + Math.random() * 900000000).toString(),
      name: newUserName.trim(),
      username: newUserTg.startsWith('@') ? newUserTg : `@${newUserTg || 'client'}`,
      customerType: newUserType,
      phone: newUserPhone || '+91 98000 00000',
      isPhoneVerified: !!newUserPhone,
      joinedAt: `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      firstChatDate: currentDate,
      firstChatDay: currentDay,
      lastActiveAt: 'Just now',
      totalInteractions: 1,
      lastClickedButton: 'Manual CRM Entry',
      tags: ['Manual Lead', newUserType === 'vip' ? 'VIP' : 'Direct Lead'],
      status: 'active',
      avatarColor: newUserType === 'vip' ? '#F59E0B' : '#0284C7',
      notes: `Registered via ${newUserSource.replace('_', ' ')}. Added by ${currentStaff?.name || 'Staff'}.`,
      unreadCount: 1,
      assignedStaffId: currentStaff?.id || 'staff_1',
      assignedStaffName: currentStaff?.name || 'Vikrant Sharma',
      registrationSource: newUserSource,
      activityTimeline: [
        {
          id: `act_${Date.now()}`,
          timestamp: 'Just now',
          action: `Customer profile registered in CRM via ${newUserSource.replace('_', ' ')}`,
          type: 'start',
        },
      ],
    };

    onUpdateUsers([newUser, ...users]);
    setNewUserName('');
    setNewUserPhone('');
    setNewUserTg('');
    setIsAddingUser(false);
    onSelectUser(newUser);
  };

  const cannedReplies = [
    'Hello! How can our support team assist you today?',
    'Here is your 10% First Deposit Bonus Code: WINFIX10',
    'Click here to connect directly with our WhatsApp manager: https://walink.online/r/newid',
    'Your deposit has been verified! Good luck with the match.',
    'Sir, please check your VIP ID credentials sent via WhatsApp desk.',
  ];

  const filteredExportUsers = usersWithPhones.filter(
    (u) =>
      u.name.toLowerCase().includes(exportSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(exportSearch.toLowerCase()) ||
      (u.phone && u.phone.includes(exportSearch))
  );

  return (
    <div className="space-y-3.5 text-slate-900">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name, @username, phone, or Telegram ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-semibold placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Filters & Export Button */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-300 text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setFilterType('unseen')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'unseen'
                  ? 'bg-rose-600 text-white shadow-xs font-black'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Unseen ({totalUnseenCount})</span>
            </button>
            <button
              onClick={() => setFilterType('seen')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                filterType === 'seen'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Seen
            </button>
            <button
              onClick={() => setFilterType('has_phone')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'has_phone'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <Phone className="w-3 h-3" />
              <span>With Phone ({usersWithPhones.length})</span>
            </button>
            <button
              onClick={() => setFilterType('existing')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                filterType === 'existing'
                  ? 'bg-sky-600 text-white shadow-xs font-black'
                  : 'text-sky-800 hover:text-sky-900'
              }`}
            >
              Existing ({existingClientsCount})
            </button>
            <button
              onClick={() => setFilterType('vip')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                filterType === 'vip'
                  ? 'bg-amber-500 text-white shadow-xs font-black'
                  : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              VIPs
            </button>
          </div>

          {/* Export Numbers Option for Admin */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer"
            title="Export all phone numbers shared by users"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Numbers ({usersWithPhones.length})</span>
          </button>

          {/* Add Customer Button */}
          <button
            onClick={() => setIsAddingUser(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Export Numbers Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-300 shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  <span>Shared Customer Numbers Directory</span>
                  <span className="text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                    {usersWithPhones.length} verified numbers
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  All phone numbers automatically shared by users from their Telegram IDs or registration forms.
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Export / Copy Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download TXT</span>
              </button>

              <button
                onClick={() => handleCopyAllNumbers('\n')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-black rounded-lg transition-colors cursor-pointer"
              >
                {copiedId === 'bulk_numbers' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-sky-600" />
                )}
                <span>Copy 1 Per Line</span>
              </button>

              <button
                onClick={() => handleCopyAllNumbers(', ')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-lg transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Copy Comma Separated</span>
              </button>
            </div>

            {/* Search within export numbers */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={exportSearch}
                onChange={(e) => setExportSearch(e.target.value)}
                placeholder="Search by customer name, phone number or @username..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold"
              />
            </div>

            {/* Numbers Table Preview */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-900 font-black">
                  <tr>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Verified Phone</th>
                    <th className="py-2.5 px-3">Joined Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExportUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-500 font-medium">
                        No customer phone numbers match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredExportUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <div>{u.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{u.username}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 text-xs">
                          {u.phone}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {u.firstChatDate || u.joinedAt}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopy(`num_${u.id}`, u.phone || '')}
                              title="Copy number"
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              {copiedId === `num_${u.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {u.phone && (
                              <a
                                href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Open WhatsApp chat"
                                className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
              <span className="font-mono font-semibold">
                Showing {filteredExportUsers.length} of {usersWithPhones.length} numbers
              </span>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAddUserSubmit}
            className="bg-white rounded-xl max-w-md w-full border border-slate-300 p-5 shadow-2xl space-y-4 text-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-600" />
                <span>Register New Customer</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">
                Full Customer Name
              </label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Ace Sabol"
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Telegram Username
                </label>
                <input
                  type="text"
                  value={newUserTg}
                  onChange={(e) => setNewUserTg(e.target.value)}
                  placeholder="@Acesabol"
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Customer Segment
                </label>
                <select
                  value={newUserType}
                  onChange={(e) => setNewUserType(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="new">New Customer</option>
                  <option value="existing">Existing Customer</option>
                  <option value="vip">VIP High Roller</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+351 966 768 745"
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Acquisition Source
                </label>
                <select
                  value={newUserSource}
                  onChange={(e) => setNewUserSource(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="telegram_bot">Telegram Bot (/start)</option>
                  <option value="web_portal">Web Portal</option>
                  <option value="whatsapp">WhatsApp Desk</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Save &amp; Open Chat
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main CRM Workspace: Full Height Responsive Split View */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-175px)] min-h-[620px]">
        {/* Left Panel: Customer Directory List (Fitted cleanly, NO horizontal scroll) */}
        <div
          className={`${
            selectedUser ? 'hidden lg:flex lg:w-1/2 xl:w-5/12' : 'w-full flex'
          } flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden`}
        >
          {/* Table Header Summary */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
              <span>Customer Directory</span>
              <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                {filteredUsers.length}
              </span>
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">
              Click any customer to open chat
            </span>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-slate-800 font-black z-10">
                <tr>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-2 text-center">First Chat</th>
                  <th className="py-2.5 px-2 text-center">Segment</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-900">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-500 font-semibold">
                      No customers match your filter or search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    const hasUnread = (user.unreadCount || 0) > 0;
                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-50/90 border-l-4 border-sky-600' : ''
                        } ${hasUnread ? 'bg-rose-50/40' : ''}`}
                        onClick={() => onSelectUser(user)}
                      >
                        {/* Customer Info */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-xs"
                                style={{ backgroundColor: user.avatarColor || '#0284C7' }}
                              >
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                              {hasUnread && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-mono text-[9px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                                  {user.unreadCount}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 truncate block max-w-[140px]">
                                  {user.name}
                                </span>
                                {hasUnread && (
                                  <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono truncate max-w-[180px]">
                                <span>{user.username}</span>
                                {user.phone && (
                                  <>
                                    <span>·</span>
                                    <span className="text-emerald-700 font-bold">{user.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* First Chat Day */}
                        <td className="py-3 px-2 text-center">
                          <span className="font-bold text-slate-800 text-[11px] block">
                            {user.firstChatDay || 'Today'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {user.firstChatDate || 'Just now'}
                          </span>
                        </td>

                        {/* Segment Badge */}
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase border inline-block ${
                              user.customerType === 'vip'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : user.customerType === 'new'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-sky-100 text-sky-900 border-sky-300'
                            }`}
                          >
                            {user.customerType}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => handleToggleSeen(user.id, e)}
                              title={hasUnread ? 'Mark as Seen' : 'Mark as Unseen'}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                hasUnread
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {hasUnread ? (
                                <Eye className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectUser(user);
                              }}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-black transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Chat</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Spacious Full-Height Chat & Customer Intel Pane */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden text-slate-900">
            {/* Header: Customer Profile Bar with Quick Phone Copy & Seen Toggle */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center justify-between gap-3">
                {/* Left: Avatar + Customer Name + Username */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs ring-2 ring-white"
                    style={{ backgroundColor: selectedUser.avatarColor || '#0284C7' }}
                  >
                    {selectedUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900 truncate">
                        {selectedUser.name}
                      </h4>
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        {selectedUser.customerType}
                      </span>
                      {selectedUser.phone && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Phone Verified</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 font-mono flex items-center gap-2 mt-0.5">
                      <span>{selectedUser.username}</span>
                      <span>·</span>
                      <span>ID: {selectedUser.telegramId}</span>
                      {selectedUser.phone && (
                        <>
                          <span>·</span>
                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {selectedUser.phone}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedUser.phone && (
                    <button
                      onClick={() => handleCopy('header_phone', selectedUser.phone || '')}
                      title="Copy customer phone"
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      {copiedId === 'header_phone' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-black">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span>Copy Phone</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleSeen(selectedUser.id)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
                      (selectedUser.unreadCount || 0) > 0
                        ? 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{(selectedUser.unreadCount || 0) > 0 ? 'Mark as Seen' : 'Marked Seen'}</span>
                  </button>

                  <button
                    onClick={() => onSelectUser(null)}
                    title="Close chat pane"
                    className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Day of First Chat & Activity Stat Bar */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mt-2.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">First Chat Day:</span>
                    <strong className="text-slate-900 font-black text-xs">
                      {selectedUser.firstChatDay || 'Sunday'}, {selectedUser.firstChatDate || selectedUser.joinedAt}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Activity &amp; Interactions:</span>
                    <strong className="text-slate-900 font-black text-xs">
                      {selectedUser.totalInteractions || 1} Actions · {selectedUser.lastActiveAt}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Assigned Agent:</span>
                    <strong className="text-slate-900 font-black text-xs">
                      {selectedUser.assignedStaffName || currentStaff?.name || 'Admin'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Switch View: Live Chat vs Activity Timeline */}
              <div className="flex items-center gap-1.5 mt-2.5">
                {(() => {
                  const selectedUserMessages = messages.filter((m) => {
                    if (!selectedUser) return false;
                    // If message explicitly has userId
                    if (m.userId) {
                      return m.userId === selectedUser.id || m.userId === `tg_${selectedUser.telegramId}`;
                    }
                    // If message has telegramId
                    if (m.telegramId && selectedUser.telegramId) {
                      return String(m.telegramId) === String(selectedUser.telegramId);
                    }
                    // If contact card has phone number
                    if (m.isContactCard && m.contactData?.phoneNumber && selectedUser.phone) {
                      const cleanMsgPhone = m.contactData.phoneNumber.replace(/[^0-9]/g, '');
                      const cleanUserPhone = selectedUser.phone.replace(/[^0-9]/g, '');
                      return !!cleanMsgPhone && !!cleanUserPhone && (cleanMsgPhone === cleanUserPhone || cleanMsgPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanMsgPhone));
                    }
                    // If message text includes "Shared contact: [phone]"
                    if (m.text && m.text.includes('Shared contact:') && selectedUser.phone) {
                      const cleanTextPhone = m.text.replace(/[^0-9]/g, '');
                      const cleanUserPhone = selectedUser.phone.replace(/[^0-9]/g, '');
                      return !!cleanTextPhone && !!cleanUserPhone && (cleanTextPhone === cleanUserPhone || cleanTextPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanTextPhone));
                    }
                    return false;
                  });

                  return (
                    <button
                      onClick={() => setActiveTabInDrawer('chat')}
                      className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeTabInDrawer === 'chat'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-200/80 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Live Messages ({selectedUserMessages.length})</span>
                    </button>
                  );
                })()}
                <button
                  onClick={() => setActiveTabInDrawer('activity')}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTabInDrawer === 'activity'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-200/80 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Activity Trail ({selectedUser.activityTimeline?.length || 3})</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Live Chat Thread */}
            {activeTabInDrawer === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50/70">
                {/* Scrollable Message List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="text-center my-1">
                    <span className="text-[10px] bg-white border border-slate-300 text-slate-700 px-3 py-1 rounded-full font-mono font-bold shadow-2xs">
                      {selectedUser.name}'s Conversation Stream · End-to-End Live Sync
                    </span>
                  </div>

                  {(() => {
                    const selectedUserMessages = messages.filter((m) => {
                      if (!selectedUser) return false;
                      // If message explicitly has userId
                      if (m.userId) {
                        return m.userId === selectedUser.id || m.userId === `tg_${selectedUser.telegramId}`;
                      }
                      // If message has telegramId
                      if (m.telegramId && selectedUser.telegramId) {
                        return String(m.telegramId) === String(selectedUser.telegramId);
                      }
                      // If contact card has phone number
                      if (m.isContactCard && m.contactData?.phoneNumber && selectedUser.phone) {
                        const cleanMsgPhone = m.contactData.phoneNumber.replace(/[^0-9]/g, '');
                        const cleanUserPhone = selectedUser.phone.replace(/[^0-9]/g, '');
                        return !!cleanMsgPhone && !!cleanUserPhone && (cleanMsgPhone === cleanUserPhone || cleanMsgPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanMsgPhone));
                      }
                      // If message text includes "Shared contact: [phone]"
                      if (m.text && m.text.includes('Shared contact:') && selectedUser.phone) {
                        const cleanTextPhone = m.text.replace(/[^0-9]/g, '');
                        const cleanUserPhone = selectedUser.phone.replace(/[^0-9]/g, '');
                        return !!cleanTextPhone && !!cleanUserPhone && (cleanTextPhone === cleanUserPhone || cleanTextPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanTextPhone));
                      }
                      return false;
                    });

                    if (selectedUserMessages.length === 0) {
                      return (
                        <div className="text-center py-12 px-4 bg-white/80 border border-slate-200 rounded-2xl m-2 shadow-2xs space-y-2">
                          <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                            <MessageSquare className="w-6 h-6" />
                          </div>
                          <h5 className="text-xs font-black text-slate-900">
                            No messages from {selectedUser.name} yet
                          </h5>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                            When this customer messages on Telegram or when you send an official reply below, their personal chat stream will be stored and displayed here.
                          </p>
                        </div>
                      );
                    }

                    return selectedUserMessages.map((m) => {
                    const isAdmin = m.sender === 'admin';
                    const isUser = m.sender === 'user';
                    const isCommand = m.text?.startsWith('/');
                    const isContact = m.isContactCard || (m.text && m.text.includes('Shared contact:'));

                    // Render Verified Contact Card
                    if (isContact) {
                      const phoneNumber =
                        m.contactData?.phoneNumber ||
                        (m.text ? m.text.replace('📱 Shared contact:', '').trim() : selectedUser.phone || '');

                      return (
                        <div key={m.id} className="flex justify-start my-2">
                          <div className="max-w-md w-full bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-sm text-slate-900 space-y-2.5">
                            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                  <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-black text-xs text-slate-900 block">
                                    {m.contactData?.firstName
                                      ? `${m.contactData.firstName} ${m.contactData.lastName || ''}`.trim()
                                      : (m.userName || selectedUser.name)}
                                  </span>
                                  <span className="text-[10px] text-emerald-800 font-mono font-bold block">
                                    Verified Phone via Telegram ID
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 font-bold">
                                {m.timestamp}
                              </span>
                            </div>

                            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                              <span className="text-sm font-black font-mono text-emerald-900 tracking-wider">
                                {phoneNumber}
                              </span>
                              <button
                                onClick={() => handleCopy(`msg_phone_${m.id}`, phoneNumber)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copiedId === `msg_phone_${m.id}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-2 pt-0.5">
                              <a
                                href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                              >
                                <span>Message on WhatsApp</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <a
                                href={`tel:${phoneNumber}`}
                                className="py-1 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-slate-600" />
                                <span>Call</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Render Telegram Command Chip (e.g. /start)
                    if (isUser && isCommand) {
                      return (
                        <div key={m.id} className="flex justify-start my-1.5">
                          <div className="bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            <span className="font-mono text-sky-800 font-extrabold">{m.text}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{m.timestamp}</span>
                          </div>
                        </div>
                      );
                    }

                    // Render Standard User Message
                    if (isUser) {
                      return (
                        <div key={m.id} className="flex justify-start">
                          <div className="max-w-[85%] bg-white border border-slate-200 text-slate-900 p-3 rounded-2xl rounded-tl-xs shadow-xs text-xs font-medium space-y-1">
                            <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                            <span className="text-[10px] text-slate-500 font-mono font-bold block text-left">
                              {selectedUser.name} · {m.timestamp}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // Render Admin Reply
                    if (isAdmin) {
                      return (
                        <div key={m.id} className="flex justify-end">
                          <div className="max-w-[85%] bg-slate-900 text-white p-3 rounded-2xl rounded-tr-xs shadow-md text-xs font-medium space-y-1">
                            <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                            <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-300 font-mono font-bold pt-0.5">
                              <span className="bg-sky-700/60 px-1.5 py-0.2 rounded text-white">
                                {currentStaff ? currentStaff.name : 'Staff Agent'}
                              </span>
                              <span>·</span>
                              <span>{m.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Render Bot Automated Message
                    return (
                      <div key={m.id} className="flex justify-start my-2">
                        <div className="max-w-[88%] bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs text-slate-900 space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold border-b border-slate-100 pb-1">
                            <span className="flex items-center gap-1 text-sky-700">
                              <Sparkles className="w-3 h-3" />
                              <span>Bot Automated Flow</span>
                            </span>
                            <span>{m.timestamp}</span>
                          </div>

                          {m.imageUrl && m.imageUrl.trim().length > 0 && (
                            <img
                              src={m.imageUrl}
                              alt="Poster"
                              className="w-full max-h-40 object-cover rounded-xl border border-slate-200"
                            />
                          )}

                          {m.text && (
                            <p className="text-xs whitespace-pre-wrap leading-relaxed font-semibold">
                              {m.text}
                            </p>
                          )}

                          {m.buttons && m.buttons.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {m.buttons.map((btn) => (
                                <span
                                  key={btn.id}
                                  className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800"
                                >
                                  {btn.emoji} {btn.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
                <div ref={messagesEndRef} />
              </div>

                {/* Canned Quick Replies Chips */}
                <div className="px-3 py-1.5 border-t border-slate-200 bg-white overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0">
                    Quick Replies:
                  </span>
                  {cannedReplies.map((canned, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReplyText(canned)}
                      className="text-[11px] font-bold bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-sky-800 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-sky-300 whitespace-nowrap transition-colors shadow-2xs cursor-pointer shrink-0"
                    >
                      {canned.slice(0, 32)}...
                    </button>
                  ))}
                </div>

                {/* PINNED BOTTOM REPLY INPUT BAR */}
                <div className="p-3 border-t border-slate-200 bg-white space-y-1.5 shrink-0 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Replying as:</span>
                      <strong className="text-slate-900 font-black">
                        {currentStaff ? currentStaff.name : 'Vikrant Sharma'}
                      </strong>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Press Enter ↵ to send instantly
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      placeholder={`Type reply to ${selectedUser.name}...`}
                      className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-bold placeholder:text-slate-500 placeholder:font-normal"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Customer Activity Trail */}
            {activeTabInDrawer === 'activity' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                  <h5 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sky-600" />
                    <span>Customer Behavioral Telemetry</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Registration Portal:</span>
                      <strong className="text-slate-900 font-black uppercase">
                        {selectedUser.registrationSource || 'telegram_bot'}
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Last Clicked Action:</span>
                      <strong className="text-slate-900 font-black truncate block">
                        {selectedUser.lastClickedButton || '👤 Existing Customer'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h6 className="font-black text-xs text-slate-900 flex items-center justify-between">
                    <span>Chronological User Timeline</span>
                    <span className="text-[10px] text-slate-500 font-mono">Real-time sync</span>
                  </h6>

                  <div className="relative border-l-2 border-sky-300 ml-3 space-y-3">
                    {(selectedUser.activityTimeline || [
                      { id: '1', timestamp: selectedUser.joinedAt, action: 'User pressed /start on Telegram bot', type: 'start' },
                      { id: '2', timestamp: 'Today', action: `Clicked button "${selectedUser.lastClickedButton || 'Existing Customer'}"`, type: 'button' },
                      { id: '3', timestamp: 'Today', action: 'Customer conversation active', type: 'message' },
                    ]).map((item, idx) => (
                      <div key={item.id || idx} className="relative pl-5 group">
                        <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-sky-600 border-2 border-white shadow-2xs" />
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-mono text-slate-500 block font-bold mb-0.5">
                            {item.timestamp}
                          </span>
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {item.action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assign to another staff member */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="text-xs font-black text-slate-900 block">
                    Reassign Customer to Staff Member:
                  </label>
                  <select
                    value={selectedUser.assignedStaffId || 'staff_2'}
                    onChange={(e) => handleAssignStaff(selectedUser.id, e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {staffList.length > 0 ? (
                      staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role.replace('_', ' ')})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="staff_1">Vikrant Sharma (Super Admin)</option>
                        <option value="staff_2">Rahul Verma (Support Agent)</option>
                        <option value="staff_3">Priya Singh (Support Agent)</option>
                        <option value="staff_4">Amit Patel (Marketing Manager)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs">
            <div className="max-w-xs space-y-2">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-black text-sm text-slate-900">No Customer Selected</h4>
              <p className="text-xs text-slate-600 font-medium">
                Select a customer from the directory on the left to review their live messages, verified phone number, and reply instantly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
