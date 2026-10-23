import React, { useState } from 'react';
import {
  Download,
  Link2,
  Check,
  MoreVertical,
} from 'lucide-react';
import {
  ChatSession,
  Language,
  SidebarView,
  UI_STRINGS,
  copyToClipboard,
} from '../utils/chatUtils';

interface HeaderProps {
  sidebarOpen: boolean;
  language: Language;
  activeView: SidebarView;
  activeSession: ChatSession | null;
  onToggleSidebar: () => void;
  onNewChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  activeView,
  activeSession,
}) => {
  const t = UI_STRINGS[language];
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (activeView !== 'chat') {
    return null;
  }

  const isChatActive = Boolean(activeSession && activeSession.messages.length > 0);

  const handleExportChat = () => {
    if (!activeSession) return;

    let md = `# ${activeSession.title}\n`;
    md += `*Diekspor dari Gemini (${new Date().toLocaleString()})*\n\n---\n\n`;

    if (activeSession.messages.length === 0) {
      md += `*(Percakapan kosong)*\n`;
    } else {
      for (const msg of activeSession.messages) {
        const speaker = msg.role === 'user' ? 'RuangFokus' : 'Gemini';
        md += `### ${speaker}\n\n${msg.content}\n\n---\n\n`;
      }
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeSession.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'gemini_chat'}.md`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
      setMenuOpen(false);
    }, 1500);
  };

  const handleCopyShareLink = async () => {
    const ok = await copyToClipboard(window.location.href);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
        setMenuOpen(false);
      }, 1500);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-5 py-2.5 bg-transparent pointer-events-none">
      {/* Left spacer (Slim rail or expanded sidebar handles the top-left Gemini icon) */}
      <div />

      {/* Right Zone: Matches image_5cf14dc2.png (vertical 3-dots in active chat) and image_50b2ea6b.png (buttons in empty state) */}
      <div className="flex items-center gap-2 shrink-0 pointer-events-auto">
        {isChatActive ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Opsi percakapan"
              title="Opsi percakapan"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#c4c7c5] hover:text-white hover:bg-[#1e1f24] transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-[#1e1f25] border border-[#2f313a] shadow-2xl z-50 p-1.5 space-y-0.5">
                  <button
                    onClick={handleExportChat}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e3e3e3] hover:bg-[#2a2c34] transition-colors cursor-pointer"
                  >
                    {downloaded ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-[#9aa0a6]" />
                    )}
                    <span>{t.downloadApp}</span>
                  </button>
                  <button
                    onClick={handleCopyShareLink}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e3e3e3] hover:bg-[#2a2c34] transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5 text-[#9aa0a6]" />
                    )}
                    <span>{t.shareLink}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={handleExportChat}
              aria-label={t.downloadApp}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1e1f24] hover:bg-[#282a30] border border-[#2c2e35] text-xs font-medium text-[#e3e3e3] transition-colors cursor-pointer whitespace-nowrap"
            >
              {downloaded ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#c4c7c5]" />
              )}
              <span>{t.downloadApp}</span>
            </button>

            <button
              onClick={handleCopyShareLink}
              aria-label={t.shareLink}
              title={t.shareLink}
              className="p-2 rounded-full bg-[#1e1f24] hover:bg-[#282a30] border border-[#2c2e35] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
            </button>
          </>
        )}
      </div>
    </header>
  );
};
