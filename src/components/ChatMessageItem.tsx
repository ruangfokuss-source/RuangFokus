import React, { useState, useRef } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  MoreHorizontal,
  Volume2,
  VolumeX,
  RotateCcw,
  Bookmark,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCode,
  AlertCircle,
  Download,
  Maximize2,
} from 'lucide-react';
import {
  ChatMessage,
  Language,
  UI_STRINGS,
  copyToClipboard,
} from '../utils/chatUtils';
import { MarkdownRenderer } from './MarkdownRenderer';
import { GeminiLoadingDots } from './GeminiSparkleIcon';

interface ChatMessageItemProps {
  message: ChatMessage;
  language: Language;
  isLastAssistantMessage?: boolean;
  onRegenerate?: () => void;
  onPreviewImage: (url: string) => void;
  onToggleSaveToCollection: (message: ChatMessage) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  language,
  isLastAssistantMessage,
  onRegenerate,
  onPreviewImage,
  onToggleSaveToCollection,
}) => {
  const t = UI_STRINGS[language];
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';
  const hasGeneratedImages = Boolean(
    message.generatedImages && message.generatedImages.length > 0
  );
  const isStoppedMessage =
    message.content.trim() === '*(Dihentikan)*' ||
    message.content.trim() === '*(Stopped)*';
  const isWaitingForFirstToken =
    isStreaming && !message.content.trim() && !hasGeneratedImages;

  const handleCopy = async () => {
    const ok = await copyToClipboard(message.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleTTS = async () => {
    setMoreMenuOpen(false);
    if (isPlayingTTS) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingTTS(false);
      return;
    }

    try {
      setIsGeneratingTTS(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content }),
      });

      if (!res.ok) {
        throw new Error('Gagal memuat suara');
      }

      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlayingTTS(false);
        audio.onerror = () => setIsPlayingTTS(false);
        await audio.play();
        setIsPlayingTTS(true);
      }
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  // USER MESSAGE: Right-aligned dark rounded pill bubble (matches image_5cf14dc2.png)
  if (isUser) {
    return (
      <article className="py-4 px-4 md:px-6">
        <div className="max-w-[720px] mx-auto flex flex-col items-end gap-2">
          {/* User Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {message.attachments.map((att, idx) => {
                const isImg = att.type.startsWith('image/') && att.dataUrl;
                return isImg ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onPreviewImage(att.dataUrl)}
                    className="group relative rounded-2xl overflow-hidden border border-[#2c2e36] bg-[#18191f] cursor-pointer"
                  >
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="max-h-48 w-auto object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  </button>
                ) : (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e1f22] border border-[#2c2e36] text-xs text-[#e3e3e3]"
                  >
                    <FileCode className="w-4 h-4 text-[#8ab4f8]" />
                    <span className="truncate max-w-[180px]">{att.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* User Pill Bubble */}
          {message.content && (
            <div className="bg-[#1e1f22] text-[#e3e3e3] px-5 py-3 rounded-[24px] max-w-[80%] sm:max-w-[72%] text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
        </div>
      </article>
    );
  }

  // AI (GEMINI) MESSAGE: Left-aligned borderless text + 4-icon bar below (matches image_5cf14dc2.png)
  return (
    <article className="py-4 px-4 md:px-6">
      <div className="max-w-[720px] mx-auto flex flex-col items-start">
        {/* Optional Expandable Reasoning / Thought Process */}
        {message.thought && (
          <div className="mb-2 w-full">
            <button
              type="button"
              onClick={() => setIsThinkingOpen(!isThinkingOpen)}
              className="inline-flex items-center gap-1.5 text-xs text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors cursor-pointer py-1"
            >
              {isThinkingOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>{t.thoughtProcess}</span>
            </button>
            {isThinkingOpen && (
              <div className="mt-1.5 p-3.5 rounded-xl bg-[#14151a] border border-[#252730] text-xs text-[#9aa0a6] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {message.thought}
              </div>
            )}
          </div>
        )}

        {/* Diagonal 3-Dot Loading Indicator matching image_5cf14dc2.png */}
        {isWaitingForFirstToken && (
          <div className="py-2">
            <GeminiLoadingDots />
          </div>
        )}

        {/* Generated / Transformed Studio Images (Nano Banana / Buat Gambar Output) */}
        {hasGeneratedImages && (
          <div className="mb-3.5 flex flex-wrap gap-3 w-full">
            {message.generatedImages!.map((imgUrl, idx) => (
              <div
                key={idx}
                className="group relative rounded-[22px] overflow-hidden border border-[#2c2e36] bg-[#14151a] max-w-[360px] sm:max-w-[400px] shadow-xl"
              >
                <img
                  src={imgUrl}
                  alt="Hasil kreasi Gemini"
                  onClick={() => onPreviewImage(imgUrl)}
                  className="w-full h-auto max-h-[440px] object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.015]"
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onPreviewImage(imgUrl)}
                    title={language === 'id' ? 'Perbesar gambar' : 'Expand image'}
                    className="p-2 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-md transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <a
                    href={imgUrl}
                    download={`gemini-artwork-${Date.now()}.jpg`}
                    title={language === 'id' ? 'Download gambar' : 'Download image'}
                    className="p-2 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-md transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Recovery State */}
        {isError ? (
          <div className="w-full p-3.5 rounded-2xl bg-[#1f1619] border border-rose-900/50 text-xs text-rose-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{message.error || message.content}</span>
            </div>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="px-3 py-1.5 rounded-full bg-rose-800/80 hover:bg-rose-700 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.retry}</span>
              </button>
            )}
          </div>
        ) : isStoppedMessage ? (
          <div className="flex items-center gap-3 py-1 text-sm text-[#9aa0a6]">
            <span className="italic">{message.content.replace(/\*/g, '')}</span>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f24] hover:bg-[#2a2c34] border border-[#2f313a] text-xs font-medium text-[#e3e3e3] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8ab4f8]" />
                <span>{t.retry}</span>
              </button>
            )}
          </div>
        ) : (
          /* Main AI Message Text (Clean & Borderless on left) */
          !isWaitingForFirstToken &&
          message.content.trim().length > 0 && (
            <div className="w-full text-[15px] text-[#e3e3e3] leading-relaxed break-words">
              <MarkdownRenderer
                content={message.content}
                isStreaming={isStreaming}
              />
            </div>
          )
        )}

        {/* Web Search Grounding Citations */}
        {message.groundingMetadata?.sources &&
          message.groundingMetadata.sources.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-[#9aa0a6]">
              {message.groundingMetadata.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[#8ab4f8] hover:underline"
                >
                  <span className="truncate max-w-[200px]">{src.title || src.url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          )}

        {/* 4-Icon Action Bar below AI message matching image_5cf14dc2.png: [ThumbsUp] [ThumbsDown] [Copy] [MoreHorizontal] */}
        {!isStreaming && !isError && message.content.trim().length > 0 && (
          <div className="flex items-center gap-1 mt-2 -ml-1.5 text-[#c4c7c5]">
            <button
              type="button"
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              aria-label="Respons bagus"
              title="Respons bagus"
              className={`p-1.5 rounded-full hover:bg-[#1e1f24] transition-colors cursor-pointer ${
                feedback === 'up' ? 'text-[#8ab4f8]' : 'hover:text-white'
              }`}
            >
              <ThumbsUp className="w-[15px] h-[15px]" />
            </button>

            <button
              type="button"
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              aria-label="Respons kurang tepat"
              title="Respons kurang tepat"
              className={`p-1.5 rounded-full hover:bg-[#1e1f24] transition-colors cursor-pointer ${
                feedback === 'down' ? 'text-[#8ab4f8]' : 'hover:text-white'
              }`}
            >
              <ThumbsDown className="w-[15px] h-[15px]" />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              aria-label={t.copy}
              title={t.copy}
              className="p-1.5 rounded-full hover:bg-[#1e1f24] hover:text-white transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-[15px] h-[15px] text-emerald-400" />
              ) : (
                <Copy className="w-[15px] h-[15px]" />
              )}
            </button>

            {/* More (...) Menu for TTS, Save to Koleksi, and Regenerate */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                aria-label="Opsi lainnya"
                title="Opsi lainnya"
                className="p-1.5 rounded-full hover:bg-[#1e1f24] hover:text-white transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-[15px] h-[15px]" />
              </button>

              {moreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMoreMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 w-48 rounded-2xl bg-[#1e1f25] border border-[#2f313a] shadow-2xl z-50 p-1.5 space-y-0.5">
                    <button
                      type="button"
                      onClick={handleToggleTTS}
                      disabled={isGeneratingTTS}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e3e3e3] hover:bg-[#2a2c34] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {isPlayingTTS ? (
                        <VolumeX className="w-3.5 h-3.5 text-[#8ab4f8]" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-[#9aa0a6]" />
                      )}
                      <span>{isPlayingTTS ? t.stopAudio : t.listen}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleSaveToCollection(message);
                        setMoreMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e3e3e3] hover:bg-[#2a2c34] transition-colors cursor-pointer"
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${
                          message.savedToCollection
                            ? 'text-[#8ab4f8] fill-current'
                            : 'text-[#9aa0a6]'
                        }`}
                      />
                      <span>
                        {message.savedToCollection
                          ? t.savedToCollection
                          : t.saveToCollection}
                      </span>
                    </button>

                    {isLastAssistantMessage && onRegenerate && (
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          onRegenerate();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e3e3e3] hover:bg-[#2a2c34] transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#9aa0a6]" />
                        <span>{t.regenerate}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
