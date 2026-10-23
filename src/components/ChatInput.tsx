import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Mic,
  MicOff,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  X,
  FileCode,
  Loader2,
  Check,
} from 'lucide-react';
import {
  AttachmentItem,
  Language,
  ModelTier,
  MODEL_OPTIONS,
  UI_STRINGS,
} from '../utils/chatUtils';
import { compressImageFile } from '../utils/imageStudioUtils';

interface ChatInputProps {
  variant: 'centered' | 'bottom';
  language: Language;
  model: ModelTier;
  mode: 'chat' | 'task';
  isStreaming: boolean;
  onSendMessage: (content: string, attachments: AttachmentItem[]) => void;
  onStopStreaming: () => void;
  onSelectModel: (model: ModelTier) => void;
  onSelectMode: (mode: 'chat' | 'task') => void;
  onScrollToBottom?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  variant,
  language,
  model,
  mode,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onSelectModel,
  onSelectMode,
  onScrollToBottom,
}) => {
  const t = UI_STRINGS[language];
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const activeModelOption = MODEL_OPTIONS.find((m) => m.id === model) || MODEL_OPTIONS[0];

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isStreaming) return;
    if (!prompt.trim() && attachments.length === 0) return;

    onSendMessage(prompt.trim(), attachments);
    setPrompt('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    for (const file of fileList) {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file);
        if (compressed.dataUrl) {
          setAttachments((prev) => [...prev, compressed]);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            setAttachments((prev) => [
              ...prev,
              {
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size,
                dataUrl,
              },
            ]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleToggleVoice = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size > 0) {
          setIsTranscribing(true);
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioData: base64Audio, mimeType: 'audio/webm' }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.text) {
                  setPrompt((prev) => (prev ? `${prev} ${data.text}` : data.text));
                }
              }
            } catch (err) {
              console.error('Voice transcription failed:', err);
            } finally {
              setIsTranscribing(false);
            }
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setIsRecording(false);
    }
  };

  const hasContent = prompt.trim().length > 0 || attachments.length > 0;

  return (
    <div
      className={
        variant === 'centered'
          ? 'w-full max-w-[680px] mx-auto px-4'
          : 'sticky bottom-0 z-20 w-full px-4 md:px-6 pb-3.5 pt-2 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/95 to-transparent'
      }
    >
      <div className={variant === 'centered' ? 'w-full' : 'max-w-[720px] mx-auto'}>
        {/* Centered Circular Down-Arrow Button right above bottom input dock (matches image_5cf14dc2.png) */}
        {variant === 'bottom' && (
          <div className="flex justify-center mb-3">
            <button
              type="button"
              onClick={onScrollToBottom}
              aria-label="Gulir ke bawah"
              title="Gulir ke bawah"
              className="w-8 h-8 rounded-full bg-[#1e1f22] hover:bg-[#2a2b2f] text-[#e3e3e3] flex items-center justify-center shadow-md transition-colors cursor-pointer"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Attached Files Preview Strip */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-3 py-2 rounded-2xl bg-[#18191e] border border-[#282a32]">
            {attachments.map((att, idx) => (
              <div
                key={`${att.name}-${idx}`}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-[#22242b] text-xs text-[#e3e3e3]"
              >
                {att.type.startsWith('image/') ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-7 h-7 object-cover rounded-lg"
                  />
                ) : (
                  <FileCode className="w-4 h-4 text-[#8ab4f8]" />
                )}
                <span className="truncate max-w-[140px] text-[11px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  aria-label="Hapus lampiran"
                  className="p-1 text-[#9aa0a6] hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Gemini Pill Input Container */}
        <div className="relative flex items-end gap-2 px-3.5 py-2.5 rounded-[28px] bg-[#1e1f22] hover:bg-[#222327] focus-within:bg-[#232429] transition-colors">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.py,.ts,.tsx,.js,.jsx,.json,.md,.txt,.csv,.sql,.html,.css"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Left "+" Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            aria-label={t.attachFile}
            title={t.attachFile}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#c4c7c5] hover:text-white hover:bg-[#2e3038] transition-colors shrink-0 cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Auto-growing Multi-line Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={
              isRecording
                ? t.stopVoice
                : isTranscribing
                ? t.transcribing
                : mode === 'task'
                ? t.askGeminiTask
                : t.askGemini
            }
            className="flex-1 resize-none bg-transparent py-1.5 px-1 text-[15px] text-[#e3e3e3] placeholder:text-[#c4c7c5]/80 focus:outline-none max-h-44 leading-relaxed"
          />

          {/* Right Controls: Model Selector ("Flash ⌄" / "Pro ⌄") + Stop/Mic/Send */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Model Dropdown matching image_d5da615a.png */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
                aria-label="Pilih model Gemini"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#e3e3e3] transition-colors cursor-pointer whitespace-nowrap ${
                  modelMenuOpen ? 'bg-[#2d2f31]' : 'hover:bg-[#2e3038]'
                }`}
              >
                <span>{activeModelOption.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#c4c7c5] transition-transform duration-150 ${
                    modelMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {modelMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setModelMenuOpen(false)}
                  />
                  <div
                    className={`absolute right-0 ${
                      variant === 'centered' ? 'top-full mt-2' : 'bottom-full mb-2'
                    } w-[235px] bg-[#1e1f20] border border-[#2d2e30] rounded-[20px] shadow-2xl z-50 py-2`}
                  >
                    {MODEL_OPTIONS.map((opt) => {
                      const isSelected = opt.id === model;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            onSelectModel(opt.id);
                            setModelMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#2a2b2e] transition-colors cursor-pointer"
                        >
                          <span className="w-4 flex items-center justify-center shrink-0">
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#e3e3e3]" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-[#e3e3e3] leading-tight">
                              {opt.menuTitle}
                            </div>
                            <div className="text-[11.5px] text-[#9aa0a6] mt-0.5 truncate">
                              {opt.subtitle[language]}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    <div className="my-1.5 border-t border-[#333537]" />

                    <button
                      type="button"
                      onClick={() => setModelMenuOpen(false)}
                      className="w-full flex items-center justify-between pl-10 pr-4 py-2 text-left text-[12.5px] font-medium text-[#e3e3e3] hover:bg-[#2a2b2e] transition-colors cursor-pointer"
                    >
                      <span>
                        {language === 'id' ? 'Tingkat penalaran' : 'Thinking level'}
                      </span>
                      <span className="text-[10px] text-[#c4c7c5]">▸</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Streaming Stop Button (Dark circle with white square inside, matching image_5cf14dc2.png) */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                aria-label={t.stopGenerating}
                title={t.stopGenerating}
                className="w-9 h-9 rounded-full bg-[#2a2b2f] hover:bg-[#35373c] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="w-3 h-3 rounded-[2px] bg-white block" />
              </button>
            ) : (
              <>
                {/* Microphone Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  disabled={isTranscribing}
                  aria-label={isRecording ? t.stopVoice : t.voiceInput}
                  title={isRecording ? t.stopVoice : t.voiceInput}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                      : 'text-[#c4c7c5] hover:text-white hover:bg-[#2e3038]'
                  }`}
                >
                  {isTranscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#8ab4f8]" />
                  ) : isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                {/* Send Button */}
                {hasContent && (
                  <button
                    type="button"
                    onClick={handleSend}
                    aria-label={t.send}
                    title={t.send}
                    className="w-9 h-9 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#0b0c10] flex items-center justify-center transition-transform cursor-pointer active:scale-95"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mode Selector Pills ("Percakapan" | "Tugas") in Empty Centered State */}
        {variant === 'centered' && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => onSelectMode('chat')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                mode === 'chat'
                  ? 'bg-[#282a32] text-[#e3e3e3] border border-[#383b46]'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#191a20]'
              }`}
            >
              {t.modeChat}
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('task')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                mode === 'task'
                  ? 'bg-[#282a32] text-[#e3e3e3] border border-[#383b46]'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#191a20]'
              }`}
            >
              {t.modeTask}
            </button>
          </div>
        )}

        {/* Underlined Footer Disclaimer in Bottom Active State (matches image_5cf14dc2.png) */}
        {variant === 'bottom' && (
          <p className="text-center text-[11px] text-[#c4c7c5] underline decoration-[#c4c7c5]/60 underline-offset-2 mt-2.5">
            {t.disclaimer}
          </p>
        )}
      </div>
    </div>
  );
};
