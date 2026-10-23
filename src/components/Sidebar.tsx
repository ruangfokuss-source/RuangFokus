import React, { useState } from 'react';
import {
  SquarePen,
  Search,
  PanelLeft,
  LayoutGrid,
  Clock,
  Plus,
  Filter,
  Pin,
  Edit2,
  Trash2,
  Check,
  X,
  Settings,
  Globe,
} from 'lucide-react';
import {
  ChatSession,
  Language,
  SidebarView,
  UI_STRINGS,
  NotebookItem,
} from '../utils/chatUtils';
import {
  GeminiSparkleIcon,
  NanoBananaImageIcon,
  GeminiCustomizeIcon,
  GeminiVideoIcon,
} from './GeminiSparkleIcon';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  activeView: SidebarView;
  isOpen: boolean;
  language: Language;
  notebooks: NotebookItem[];
  activeNotebookId: string | null;
  onToggleSidebar: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onSelectView: (view: SidebarView) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  onToggleLanguage: () => void;
  onCreateNotebook: () => void;
  onSelectNotebook: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  activeView,
  isOpen,
  language,
  notebooks,
  activeNotebookId,
  onToggleSidebar,
  onSelectSession,
  onNewChat,
  onSelectView,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onToggleLanguage,
  onCreateNotebook,
  onSelectNotebook,
}) => {
  const t = UI_STRINGS[language];
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPinnedOnly, setFilterPinnedOnly] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const populatedSessions = sessions.filter(
    (s) => s.messages.length > 0 || s.title !== 'Percakapan baru'
  );

  const filteredSessions = populatedSessions.filter((s) => {
    if (filterPinnedOnly && !s.pinned) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const isNewChatSelected =
    activeView === 'chat' &&
    sessions.find((s) => s.id === activeSessionId)?.messages.length === 0;

  const navItems: { id: SidebarView; label: string; icon: React.ReactNode }[] = [
    {
      id: 'collections',
      label: t.collections,
      icon: <LayoutGrid className="w-[17px] h-[17px]" />,
    },
    {
      id: 'images',
      label: t.images,
      icon: <NanoBananaImageIcon className="w-[17px] h-[17px]" />,
    },
    {
      id: 'scheduled',
      label: t.scheduled,
      icon: <Clock className="w-[17px] h-[17px]" />,
    },
    {
      id: 'customize',
      label: t.customize,
      icon: <GeminiCustomizeIcon className="w-[17px] h-[17px]" />,
    },
    {
      id: 'videos',
      label: t.videos,
      icon: <GeminiVideoIcon className="w-[17px] h-[17px]" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop when Full Sidebar is open */}
      {isOpen && (
        <div
          onClick={onToggleSidebar}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SLIM ICON RAIL (Matches image_5cf14dc2.png when sidebar is collapsed) */}
      <aside
        aria-label="Navigasi Ringkas Gemini"
        className={`fixed top-0 bottom-0 left-0 z-40 w-[52px] bg-[#0b0c10] flex flex-col items-center justify-between py-3 select-none transition-opacity duration-150 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center w-full">
          <button
            onClick={onToggleSidebar}
            aria-label="Buka sidebar"
            title="Buka menu navigasi"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1e1f24] transition-colors cursor-pointer mb-4"
          >
            <GeminiSparkleIcon className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center gap-1.5 w-full">
            <button
              onClick={onNewChat}
              aria-label={t.newChat}
              title={t.newChat}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isNewChatSelected
                  ? 'bg-[#1e1f22] text-white'
                  : 'text-[#c4c7c5] hover:text-white hover:bg-[#1e1f24]'
              }`}
            >
              <SquarePen className="w-[17px] h-[17px]" />
            </button>

            <button
              onClick={() => {
                setSearchOpen(true);
                onToggleSidebar();
              }}
              aria-label={t.searchPlaceholder}
              title={t.searchPlaceholder}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#c4c7c5] hover:text-white hover:bg-[#1e1f24] transition-colors cursor-pointer"
            >
              <Search className="w-[17px] h-[17px]" />
            </button>

            <button
              onClick={() => onSelectView('collections')}
              aria-label={t.collections}
              title={t.collections}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                activeView === 'collections'
                  ? 'bg-[#1e1f22] text-white'
                  : 'text-[#c4c7c5] hover:text-white hover:bg-[#1e1f24]'
              }`}
            >
              <LayoutGrid className="w-[17px] h-[17px]" />
            </button>

            <button
              onClick={() => onSelectView('images')}
              aria-label={t.images}
              title={t.images}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                activeView === 'images'
                  ? 'bg-[#1e1f22] text-white'
                  : 'text-[#c4c7c5] hover:text-white hover:bg-[#1e1f24]'
              }`}
            >
              <NanoBananaImageIcon className="w-[17px] h-[17px]" />
            </button>

            <button
              onClick={() => onSelectView('scheduled')}
              aria-label={t.scheduled}
              title={t.scheduled}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                activeView === 'scheduled'
                  ? 'bg-[#1e1f22] text-white'
                  : 'text-[#c4c7c5] hover:text-white hover:bg-[#1e1f24]'
              }`}
            >
              <Clock className="w-[17px] h-[17px]" />
            </button>

            <button
              onClick={() => onSelectView('customize')}
              aria-label={t.customize}
              title={t.customize}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                activeView === 'customize'
                  ? 'bg-[#1e1f22] text-white'
                  : 'text-[#c4c7c5] hover:text-white hover:bg-[#1e1f24]'
              }`}
            >
              <GeminiCustomizeIcon className="w-[17px] h-[17px]" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2.5 w-full">
          <button
            onClick={() => onSelectView('customize')}
            aria-label={t.customize}
            title={t.customize}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#c4c7c5] hover:text-white hover:bg-[#1e1f24] transition-colors cursor-pointer"
          >
            <Settings className="w-[17px] h-[17px]" />
          </button>

          <button
            onClick={onToggleSidebar}
            aria-label="Profil RuangFokus"
            title="RuangFokus · Pro"
            className="w-7 h-7 rounded-full bg-[#24262d] border border-[#3c4043] flex items-center justify-center text-[11px] font-semibold text-[#e3e3e3] hover:border-[#8ab4f8] transition-colors cursor-pointer overflow-hidden"
          >
            <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#3b78e7] to-[#8ab4f8] flex items-center justify-center text-white text-[10px] font-bold">
              R
            </span>
          </button>
        </div>
      </aside>

      {/* EXPANDED 268PX LEFT SIDEBAR (Matches image_3fc15c69.png & image_50b2ea6b.png) */}
      <aside
        aria-label="Sidebar Navigasi Gemini"
        className={`fixed top-0 bottom-0 left-0 z-50 w-[268px] bg-[#131314] border-r border-[#1f2024] flex flex-col select-none transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand & Action Icons */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 text-left focus:outline-none cursor-pointer group"
          >
            <GeminiSparkleIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-[15px] font-medium tracking-tight text-[#e3e3e3] whitespace-nowrap">
              Gemini
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label={t.searchPlaceholder}
              title={t.searchPlaceholder}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                searchOpen
                  ? 'bg-[#282a2e] text-white'
                  : 'text-[#c4c7c5] hover:text-white hover:bg-[#1e1f22]'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleSidebar}
              aria-label="Tutup sidebar"
              title="Ciutkan sidebar"
              className="p-1.5 rounded-full text-[#c4c7c5] hover:text-white hover:bg-[#1e1f22] transition-colors cursor-pointer"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {searchOpen && (
          <div className="px-3 py-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8e918f] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                autoFocus
                className="w-full bg-[#1e1f22] text-[#e3e3e3] text-xs pl-8 pr-7 py-2 rounded-full border border-[#2d2f36] focus:outline-none focus:border-[#8ab4f8]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8e918f] hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Fixed "Percakapan baru" Row matching image_3fc15c69.png */}
        <div className="px-2.5 pt-1 pb-0.5">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2 rounded-full text-[13px] transition-colors cursor-pointer ${
              isNewChatSelected
                ? 'bg-[#1e1f22] text-[#e3e3e3] font-medium'
                : 'text-[#c4c7c5] hover:bg-[#1a1b1e] hover:text-[#e3e3e3]'
            }`}
          >
            <SquarePen className="w-[17px] h-[17px] shrink-0" />
            <span className="truncate whitespace-nowrap">{t.newChat}</span>
          </button>
        </div>

        {/* Scrollable Middle Area: Workspace Links + Notebooks + Recent Conversations */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-3">
          {/* Navigation Links (Koleksi, Gambar, Dijadwalkan, Sesuaikan, Video) matching image_3fc15c69.png */}
          <nav aria-label="Menu Fitur Gemini" className="space-y-0.5">
            {navItems.map((item) => {
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2 rounded-full text-[13px] transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1e1f22] text-[#e3e3e3] font-medium'
                      : 'text-[#c4c7c5] hover:bg-[#1a1b1e] hover:text-[#e3e3e3]'
                  }`}
                >
                  <span className={isSelected ? 'text-[#e3e3e3]' : 'text-[#c4c7c5]'}>
                    {item.icon}
                  </span>
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Notebook Section */}
          <div className="pt-2">
            <div className="px-3.5 py-1 text-[11px] font-medium text-[#9aa0a6]">
              {t.notebookHeader}
            </div>
            <button
              onClick={onCreateNotebook}
              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-[13px] transition-colors cursor-pointer ${
                activeView === 'notebooks'
                  ? 'bg-[#1e1f22] text-[#e3e3e3] font-medium'
                  : 'text-[#c4c7c5] hover:bg-[#1a1b1e] hover:text-[#e3e3e3]'
              }`}
            >
              <Plus className="w-[17px] h-[17px] text-[#c4c7c5] shrink-0" />
              <span className="truncate whitespace-nowrap">{t.newNotebook}</span>
            </button>

            {notebooks.length > 0 && (
              <div className="mt-0.5 space-y-0.5">
                {notebooks.slice(0, 3).map((nb) => (
                  <button
                    key={nb.id}
                    onClick={() => onSelectNotebook(nb.id)}
                    className={`w-full flex items-center gap-2.5 pl-9 pr-3.5 py-1.5 rounded-full text-left text-xs transition-colors cursor-pointer ${
                      activeView === 'notebooks' && activeNotebookId === nb.id
                        ? 'bg-[#1e1f22] text-[#e3e3e3] font-medium'
                        : 'text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#1a1b1e]'
                    }`}
                  >
                    <span className="truncate">{nb.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Conversations ("Semua") matching image_3fc15c69.png */}
          <div className="pt-1">
            <div className="flex items-center justify-between px-3.5 py-1">
              <span className="text-[11px] font-medium text-[#9aa0a6]">
                {t.allChats}
              </span>
              <button
                onClick={() => setFilterPinnedOnly(!filterPinnedOnly)}
                aria-label="Filter percakapan yang disematkan"
                title={filterPinnedOnly ? 'Tampilkan semua' : 'Hanya yang disematkan'}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  filterPinnedOnly
                    ? 'text-[#8ab4f8] bg-[#242731]'
                    : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-0.5 space-y-0.5">
              {filteredSessions.map((session) => {
                const isActive = activeView === 'chat' && session.id === activeSessionId;
                const isEditing = editingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group relative flex items-center justify-between px-3.5 py-2 rounded-full text-[12.5px] cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#1e1f22] text-[#e3e3e3] font-medium'
                        : 'text-[#c4c7c5] hover:bg-[#1a1b1e] hover:text-[#e3e3e3]'
                    }`}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(session.id, e);
                          if (e.key === 'Escape') setEditingSessionId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="bg-[#131314] text-white text-xs px-2 py-0.5 rounded border border-[#8ab4f8] focus:outline-none w-full"
                      />
                    ) : (
                      <span className="truncate pr-1 leading-snug">{session.title}</span>
                    )}

                    {/* Hover Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={(e) => handleSaveRename(session.id, e)}
                            aria-label="Simpan judul"
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSessionId(null);
                            }}
                            aria-label="Batal"
                            className="p-1 text-rose-400 hover:text-rose-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePinSession(session.id);
                            }}
                            aria-label={session.pinned ? 'Lepas sematan' : 'Sematkan'}
                            className={`p-1 hover:text-[#8ab4f8] ${
                              session.pinned ? 'text-[#8ab4f8]' : 'text-[#8e918f]'
                            }`}
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleStartRename(session, e)}
                            aria-label="Ubah nama percakapan"
                            className="p-1 text-[#8e918f] hover:text-white"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            aria-label="Hapus percakapan"
                            className="p-1 text-[#8e918f] hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredSessions.length === 0 && (
                <div className="px-3.5 py-4 text-[11px] text-[#8e918f]">
                  {searchQuery
                    ? language === 'id'
                      ? 'Tidak ada percakapan yang cocok.'
                      : 'No matching chats.'
                    : language === 'id'
                    ? 'Belum ada riwayat percakapan.'
                    : 'No recent conversations.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom User Profile & Settings Bar matching "RuangFokus / Pro" in image_3fc15c69.png */}
        <div className="px-3.5 py-2.5 border-t border-[#1f2024] bg-[#131314] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#24262d] border border-[#3c4043] flex items-center justify-center shrink-0">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#3b78e7] to-[#8ab4f8] flex items-center justify-center text-white text-[10px] font-bold">
                R
              </span>
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-xs font-medium text-[#e3e3e3] truncate">
                RuangFokus
              </div>
              <div className="text-[10px] text-[#9aa0a6]">Pro</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleLanguage}
              aria-label="Ganti Bahasa ID/EN"
              title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-[#9aa0a6] hover:text-white hover:bg-[#1e1f22] transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{language}</span>
            </button>
            <button
              onClick={() => onSelectView('customize')}
              aria-label={t.customize}
              title={t.customize}
              className="p-1.5 rounded-full text-[#c4c7c5] hover:text-white hover:bg-[#1e1f22] transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
