import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Edit2,
  Image as ImageIcon,
  Save,
  Check,
  Sparkles,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Eye,
  Upload,
  PhoneCall,
  Bell,
  Smartphone,
  Share2,
  MapPin,
  Laptop,
  RotateCcw,
  AlignLeft,
  CornerDownLeft,
  X,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { BotSettings, InlineButtonConfig, ButtonActionType } from '../../types';
import { telegramApi } from '../../services/telegramApi';

interface BotBuilderTabProps {
  settings: BotSettings;
  onUpdateSettings: (newSettings: BotSettings) => void;
}

const PRESET_EMOJIS = ['👤', '🆕', '📱', '💬', '⚡', '🎁', '💎', '🔥', '🏆', '🎯', '💰', '⭐'];

export const BotBuilderTab: React.FC<BotBuilderTabProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<BotSettings>(settings);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [isAddingButton, setIsAddingButton] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncingDescription, setIsSyncingDescription] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync with parent props if updated externally
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Synchronously update localSettings AND parent settings so no typing is lost
  const updateSettings = (updated: BotSettings) => {
    setLocalSettings(updated);
    onUpdateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // New Button Form State with enhanced action types
  const [buttonForm, setButtonForm] = useState<Partial<InlineButtonConfig>>({
    label: '',
    emoji: '⭐',
    actionType: 'share_contact',
    url: '',
    responseText: '',
    popupText: '',
    webAppUrl: '',
    shareText: '',
  });

  // Pick Poster/Banner from Desktop via FileReader
  const handleDesktopFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP, or GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        updateSettings({
          ...localSettings,
          poster: {
            ...localSettings.poster,
            imageUrl: base64Url,
            showWelcomeBanner: true,
          },
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (confirm('Clear all bot banner, headlines, buttons, and description to a completely clean slate?')) {
      const emptySettings: BotSettings = {
        profile: {
          name: '',
          username: '',
          subtitle: '',
          avatarUrl: '',
          isVerified: false,
          token: localSettings.profile.token || '',
          webhookUrl: '',
        },
        about: {
          title: '',
          descriptionText: '',
          registerUrl: '',
          whatsappUrl1: '',
          whatsappUrl2: '',
        },
        poster: {
          imageUrl: '',
          title: '',
          caption: '',
          description: '',
          showWelcomeBanner: true,
          aspectRatio: '16:9',
        },
        buttons: [],
        quickReplies: ['/start'],
        theme: 'telegram-green',
        soundEnabled: true,
        autoGreetingEnabled: true,
      };
      updateSettings(emptySettings);
    }
  };

  const handleInsertHeadlineSpacing = () => {
    const current = localSettings.poster.title || '';
    updateSettings({
      ...localSettings,
      poster: {
        ...localSettings.poster,
        title: current ? `${current}\n` : '\n',
      },
    });
  };

  const handleInsertDescriptionSpacing = () => {
    const current = localSettings.poster.description || localSettings.poster.caption || '';
    updateSettings({
      ...localSettings,
      poster: {
        ...localSettings.poster,
        description: current ? `${current}\n\n` : '\n\n',
        caption: current ? `${current}\n\n` : '\n\n',
      },
    });
  };

  const handleCopyDescriptionToBio = () => {
    const desc = localSettings.poster.description || localSettings.poster.caption || '';
    updateSettings({
      ...localSettings,
      about: {
        ...localSettings.about,
        descriptionText: desc.slice(0, 512),
        title: localSettings.poster.title.slice(0, 64) || localSettings.about.title,
      },
    });
  };

  const handleSyncToTelegram = async () => {
    if (!localSettings.profile.token || !localSettings.profile.token.trim()) {
      setSyncStatus('⚠️ Please connect your Bot Token first in the "Connect Telegram Bot" tab.');
      return;
    }

    setIsSyncingDescription(true);
    setSyncStatus(null);

    const textToSync = (
      localSettings.about.descriptionText && localSettings.about.descriptionText.trim().length > 0
        ? localSettings.about.descriptionText.trim()
        : `${localSettings.about.title}`
    ).slice(0, 512);

    try {
      const res = await telegramApi.setMyDescription(localSettings.profile.token.trim(), textToSync);
      if (res.ok) {
        if (textToSync) {
          await telegramApi.setMyShortDescription(
            localSettings.profile.token.trim(),
            textToSync.slice(0, 120)
          );
        }
        if (localSettings.profile.name) {
          await telegramApi.setMyName(localSettings.profile.token.trim(), localSettings.profile.name);
        }
        setSyncStatus('✅ Successfully synced to Telegram! (Close and re-open your bot in Telegram to see updated card).');
      } else {
        setSyncStatus(`❌ Telegram returned: ${res.description || 'Failed to update description'}`);
      }
    } catch {
      setSyncStatus('❌ Network error syncing description to Telegram');
    } finally {
      setIsSyncingDescription(false);
    }
  };

  // Buttons CRUD
  const handleStartAddButton = () => {
    setButtonForm({
      label: '',
      emoji: '📱',
      actionType: 'share_contact',
      url: '',
      responseText: 'Thank you! Your verified phone number has been received.',
      popupText: 'Welcome! Your request has been received.',
      webAppUrl: '',
      shareText: '',
    });
    setEditingButtonId(null);
    setIsAddingButton(true);
  };

  const handleStartEditButton = (button: InlineButtonConfig) => {
    setButtonForm({ ...button });
    setEditingButtonId(button.id);
    setIsAddingButton(true);
  };

  const handleSaveButton = () => {
    if (!buttonForm.label?.trim()) return;

    if (editingButtonId) {
      const updatedButtons = localSettings.buttons.map((b) =>
        b.id === editingButtonId
          ? ({ ...b, ...buttonForm } as InlineButtonConfig)
          : b
      );
      updateSettings({ ...localSettings, buttons: updatedButtons });
    } else {
      const newButton: InlineButtonConfig = {
        id: `btn_${Date.now()}`,
        label: buttonForm.label.trim(),
        emoji: buttonForm.emoji || '⭐',
        actionType: (buttonForm.actionType as ButtonActionType) || 'callback',
        url: buttonForm.url?.trim(),
        responseText: buttonForm.responseText?.trim() || '',
        popupText: buttonForm.popupText?.trim() || '',
        webAppUrl: buttonForm.webAppUrl?.trim(),
        shareText: buttonForm.shareText?.trim(),
        order: localSettings.buttons.length,
      };
      updateSettings({
        ...localSettings,
        buttons: [...localSettings.buttons, newButton],
      });
    }

    setIsAddingButton(false);
    setEditingButtonId(null);
  };

  const handleDeleteButton = (id: string) => {
    const updated = localSettings.buttons.filter((b) => b.id !== id);
    updateSettings({ ...localSettings, buttons: updated });
  };

  const handleMoveButton = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localSettings.buttons.length) return;

    const list = [...localSettings.buttons];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    updateSettings({ ...localSettings, buttons: list });
  };

  const showWelcomeBanner = localSettings.poster.showWelcomeBanner !== false;

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>Telegram Bot Customizer &amp; Welcome Banner</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
              Auto-Save Active
            </span>
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Configure your welcome banner, detailed description, and interactive action buttons. All changes save instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-pulse">
              <Check className="w-4 h-4" /> Saved!
            </span>
          )}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Clear all fields to a completely blank slate"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear / Clean Slate</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Welcome Banner with Description Option */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-600" />
              <h3 className="font-black text-sm text-slate-900">
                Welcome Banner with Description
              </h3>
            </div>

            {/* Toggle Enable/Disable Welcome Banner */}
            <button
              onClick={() =>
                updateSettings({
                  ...localSettings,
                  poster: {
                    ...localSettings.poster,
                    showWelcomeBanner: !showWelcomeBanner,
                  },
                })
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                showWelcomeBanner
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
            >
              <span>{showWelcomeBanner ? 'Banner Enabled' : 'Banner Disabled'}</span>
            </button>
          </div>

          {/* Desktop File Picker Zone */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleDesktopFileUpload}
            className="hidden"
          />

          {localSettings.poster.imageUrl && localSettings.poster.imageUrl.trim().length > 0 ? (
            <div className="relative rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-xs">
              <img
                src={localSettings.poster.imageUrl}
                alt="Selected Welcome Banner"
                className="w-full max-h-60 object-contain bg-slate-900"
              />
              <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Welcome Banner Loaded</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {localSettings.poster.imageUrl.startsWith('data:') ? 'Custom image from desktop' : localSettings.poster.imageUrl.slice(0, 35) + '...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold px-3 py-1.5 rounded-lg border border-sky-300 transition-colors cursor-pointer"
                  >
                    Change Picture
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({
                        ...localSettings,
                        poster: { ...localSettings.poster, imageUrl: '' },
                      })
                    }
                    className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1.5 rounded-lg border border-rose-300 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 text-center border-2 border-dashed border-sky-300 hover:border-sky-500 rounded-xl bg-sky-50/40 hover:bg-sky-50 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-slate-900">
                Pick Welcome Banner from Desktop / Computer
              </p>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Click to browse your computer files (PNG, JPG, WEBP, GIF).
              </p>
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-white border border-sky-300 rounded-lg text-xs font-bold text-sky-700 shadow-2xs">
                <span>Browse Computer Files</span>
              </div>
            </div>
          )}

          {/* Spacious Headline Area */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-sky-600" />
                <span>Banner Headline (Title)</span>
              </label>
              <button
                type="button"
                onClick={handleInsertHeadlineSpacing}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer bg-sky-50 px-2 py-0.5 rounded border border-sky-200"
              >
                <CornerDownLeft className="w-3 h-3" />
                <span>+ Add Line Break</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={localSettings.poster.title}
              onChange={(e) =>
                updateSettings({
                  ...localSettings,
                  poster: { ...localSettings.poster, title: e.target.value },
                })
              }
              placeholder="Type your welcome banner headline here..."
              className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 leading-relaxed placeholder:text-slate-500 placeholder:font-normal"
            />
          </div>

          {/* Dedicated Welcome Description Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span>Welcome Description (Multi-Paragraph)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleInsertDescriptionSpacing}
                  className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer bg-sky-50 px-2 py-0.5 rounded border border-sky-200"
                >
                  <CornerDownLeft className="w-3 h-3" />
                  <span>+ Add Paragraph Spacing</span>
                </button>
              </div>
            </div>
            <textarea
              rows={5}
              value={localSettings.poster.description ?? localSettings.poster.caption}
              onChange={(e) => {
                const val = e.target.value;
                updateSettings({
                  ...localSettings,
                  poster: {
                    ...localSettings.poster,
                    description: val,
                    caption: val,
                  },
                });
              }}
              placeholder="Enter your detailed welcome message description here... Multiple lines, paragraphs, and spaces will be preserved exactly for users."
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 leading-relaxed placeholder:text-slate-500 placeholder:font-normal"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <button
                type="button"
                onClick={handleCopyDescriptionToBio}
                className="text-sky-700 hover:underline font-bold"
              >
                Copy this description into Telegram Bio card &rarr;
              </button>
              <span>{((localSettings.poster.description ?? localSettings.poster.caption) || '').length} / 1024 characters</span>
            </div>
          </div>
        </div>

        {/* Section 2: Interactive Buttons & Expanded Action Space */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900">
                Interactive Action Buttons ({localSettings.buttons.length})
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Buttons attached below the welcome banner and messages
              </p>
            </div>
            <button
              onClick={handleStartAddButton}
              className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Button</span>
            </button>
          </div>

          {/* Button List */}
          <div className="space-y-2">
            {localSettings.buttons.length === 0 ? (
              <div className="text-center py-8 px-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                <p className="text-xs font-bold text-slate-800 mb-1">
                  No interactive buttons added yet
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-3">
                  Add buttons like "📱 Auto-Share Phone Number", "💬 Popup Alert Dialog", or WhatsApp desk links.
                </p>
                <button
                  onClick={handleStartAddButton}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Button</span>
                </button>
              </div>
            ) : (
              localSettings.buttons.map((btn, idx) => (
                <div
                  key={btn.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-300 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-400 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0 p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      {btn.emoji || '⭐'}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-900 truncate block">
                        {btn.label}
                      </span>
                      <span className="text-[11px] font-bold text-sky-800 uppercase flex items-center gap-1 mt-0.5">
                        {btn.actionType === 'share_contact' && <PhoneCall className="w-3 h-3 text-emerald-600" />}
                        {btn.actionType === 'popup_alert' && <Bell className="w-3 h-3 text-amber-600" />}
                        {btn.actionType === 'url' && <ExternalLink className="w-3 h-3 text-sky-600" />}
                        {btn.actionType === 'whatsapp' && <Smartphone className="w-3 h-3 text-green-600" />}
                        <span>
                          {btn.actionType === 'share_contact'
                            ? 'Auto-Share Phone Number'
                            : btn.actionType === 'popup_alert'
                            ? 'Popup Alert Dialog'
                            : btn.actionType === 'url'
                            ? 'Website Link'
                            : btn.actionType === 'whatsapp'
                            ? 'WhatsApp Desk'
                            : btn.actionType === 'web_app'
                            ? 'Mini App Webview'
                            : 'Automated Bot Reply'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveButton(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded cursor-pointer"
                      title="Move up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveButton(idx, 'down')}
                      disabled={idx === localSettings.buttons.length - 1}
                      className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded cursor-pointer"
                      title="Move down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleStartEditButton(btn)}
                      className="p-1.5 bg-white border border-slate-300 text-slate-700 hover:text-sky-700 rounded-lg shadow-2xs cursor-pointer ml-1"
                      title="Edit button"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteButton(btn.id)}
                      className="p-1.5 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg shadow-2xs cursor-pointer"
                      title="Delete button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add / Edit Button Modal */}
          {isAddingButton && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-lg w-full border-2 border-slate-300 p-5 shadow-2xl space-y-4 text-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>{editingButtonId ? 'Edit Interactive Button' : 'Create Interactive Button'}</span>
                  </h4>
                  <button
                    onClick={() => setIsAddingButton(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-slate-900 block mb-1">Emoji</label>
                    <input
                      type="text"
                      value={buttonForm.emoji}
                      onChange={(e) => setButtonForm({ ...buttonForm, emoji: e.target.value })}
                      className="w-full text-center text-sm px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-bold text-slate-900 block mb-1">Button Title / Text</label>
                    <input
                      type="text"
                      required
                      value={buttonForm.label}
                      onChange={(e) => setButtonForm({ ...buttonForm, label: e.target.value })}
                      placeholder="e.g. Share Phone Number"
                      className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Emoji presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500">Quick Emojis:</span>
                  {PRESET_EMOJIS.map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setButtonForm({ ...buttonForm, emoji: em })}
                      className="w-6 h-6 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 flex items-center justify-center cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>

                {/* Expanded Action Space Options */}
                <div>
                  <label className="text-xs font-black text-slate-900 block mb-1">
                    Action Type (What happens when tapped)
                  </label>
                  <select
                    value={buttonForm.actionType}
                    onChange={(e) => setButtonForm({ ...buttonForm, actionType: e.target.value as ButtonActionType })}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="share_contact">
                      📱 Share Phone Number (Auto-pushed from Telegram ID - No typing needed)
                    </option>
                    <option value="popup_alert">
                      💬 Popup Alert Dialog (Telegram show_alert native modal)
                    </option>
                    <option value="callback">
                      🤖 Automated Text Reply (Bot sends chat message)
                    </option>
                    <option value="url">
                      🌐 Open Website / Registration Portal URL
                    </option>
                    <option value="whatsapp">
                      📲 WhatsApp Direct Helpdesk Link
                    </option>
                    <option value="web_app">
                      🚀 Telegram Mini App (In-App Webview Modal)
                    </option>
                  </select>
                </div>

                {/* Conditional Inputs */}
                {buttonForm.actionType === 'share_contact' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 space-y-2 text-xs">
                    <span className="font-black text-emerald-900 block flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                      Automatic Phone Number Push via Telegram
                    </span>
                    <p className="text-slate-800 text-[11px] leading-relaxed">
                      When the user clicks this button, Telegram displays a native prompt: <strong>"Share Phone Number with bot?"</strong> Upon approval, their verified mobile number is transmitted automatically from their Telegram account into the CRM inbox.
                    </p>
                    <div>
                      <label className="text-[11px] font-bold text-slate-900 block mb-1">Confirmation Prompt Message</label>
                      <input
                        type="text"
                        value={buttonForm.responseText}
                        onChange={(e) => setButtonForm({ ...buttonForm, responseText: e.target.value })}
                        placeholder="e.g. Thank you! Your verified phone number has been received."
                        className="w-full text-xs px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-slate-900 font-semibold"
                      />
                    </div>
                  </div>
                )}

                {buttonForm.actionType === 'popup_alert' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-2 text-xs">
                    <span className="font-black text-amber-900 block flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-amber-700" />
                      Telegram Native Popup Modal Dialog
                    </span>
                    <p className="text-slate-800 text-[11px] leading-relaxed">
                      Telegram will pop up a modal dialog box on the user's screen with an "OK" button instead of a regular chat message.
                    </p>
                    <div>
                      <label className="text-[11px] font-bold text-slate-900 block mb-1">Popup Dialog Content Text</label>
                      <textarea
                        rows={3}
                        value={buttonForm.popupText}
                        onChange={(e) => setButtonForm({ ...buttonForm, popupText: e.target.value })}
                        placeholder="e.g. Welcome! Your 10% bonus code WINFIX10 is active on deposit."
                        className="w-full text-xs px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 font-semibold leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {(buttonForm.actionType === 'url' || buttonForm.actionType === 'whatsapp') && (
                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">
                      {buttonForm.actionType === 'whatsapp' ? 'WhatsApp Link / Desk URL' : 'Website Destination URL'}
                    </label>
                    <input
                      type="url"
                      value={buttonForm.url}
                      onChange={(e) => setButtonForm({ ...buttonForm, url: e.target.value })}
                      placeholder="https://..."
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    />
                  </div>
                )}

                {buttonForm.actionType === 'callback' && (
                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">Automated Bot Response Text</label>
                    <textarea
                      rows={3}
                      value={buttonForm.responseText}
                      onChange={(e) => setButtonForm({ ...buttonForm, responseText: e.target.value })}
                      placeholder="Type the message that will be sent into the chat..."
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    />
                  </div>
                )}

                {buttonForm.actionType === 'web_app' && (
                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">Telegram WebApp (HTTPS URL)</label>
                    <input
                      type="url"
                      value={buttonForm.webAppUrl}
                      onChange={(e) => setButtonForm({ ...buttonForm, webAppUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddingButton(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveButton}
                    disabled={!buttonForm.label?.trim()}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-black rounded-lg shadow-xs cursor-pointer"
                  >
                    Save Button
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: "What can this bot do?" Intro Card & Telegram Bio */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="font-black text-sm text-slate-900">
              Bot Profile &amp; "What can this bot do?" Card
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              This bio text is shown by Telegram before the user clicks the blue START button.
            </p>
          </div>
          <button
            onClick={handleSyncToTelegram}
            disabled={isSyncingDescription}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSyncingDescription ? 'Syncing...' : 'Sync Card to Telegram'}</span>
          </button>
        </div>

        {syncStatus && (
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900">
            {syncStatus}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-slate-900 block mb-1">
              Bot Display Name
            </label>
            <input
              type="text"
              value={localSettings.profile.name}
              onChange={(e) =>
                updateSettings({
                  ...localSettings,
                  profile: { ...localSettings.profile, name: e.target.value },
                })
              }
              placeholder="e.g. My Official Bot"
              className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-900 block mb-1">
              Card Heading
            </label>
            <input
              type="text"
              value={localSettings.about.title}
              onChange={(e) =>
                updateSettings({
                  ...localSettings,
                  about: { ...localSettings.about, title: e.target.value },
                })
              }
              placeholder="What can this bot do?"
              className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-black text-slate-900 block mb-1">
            Bio &amp; Welcome Description (Shown above START button in Telegram)
          </label>
          <textarea
            rows={5}
            value={localSettings.about.descriptionText}
            onChange={(e) =>
              updateSettings({
                ...localSettings,
                about: { ...localSettings.about, descriptionText: e.target.value },
              })
            }
            placeholder="Type what this bot does... (Telegram sets this via setMyDescription)"
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed placeholder:text-slate-500"
          />
          <div className="text-[11px] text-slate-500 font-mono text-right mt-1">
            {(localSettings.about.descriptionText || '').length} / 512 characters
          </div>
        </div>
      </div>
    </div>
  );
};
