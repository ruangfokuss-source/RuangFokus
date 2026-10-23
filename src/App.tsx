import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { WorkspaceViews } from './components/WorkspaceViews';
import { ImageModal } from './components/ImageModal';
import {
  AttachmentItem,
  ChatMessage,
  ChatSession,
  CollectionItem,
  INITIAL_DEMO_SESSIONS,
  Language,
  ModelTier,
  NotebookItem,
  ScheduledTaskItem,
  SidebarView,
  UI_STRINGS,
  compactHistory,
  generateSessionTitle,
  parseSSELine,
} from './utils/chatUtils';
import {
  detectImageStudioIntent,
  renderStudioArtwork,
} from './utils/imageStudioUtils';
import { ArrowDown, AlertTriangle } from 'lucide-react';

const SESSIONS_STORAGE_KEY = 'gemini_clone_sessions_v5';
const ACTIVE_SESSION_STORAGE_KEY = 'gemini_clone_active_session_v5';
const COLLECTIONS_STORAGE_KEY = 'gemini_clone_collections_v3';
const NOTEBOOKS_STORAGE_KEY = 'gemini_clone_notebooks_v3';
const SCHEDULED_STORAGE_KEY = 'gemini_clone_scheduled_v3';
const CUSTOM_INSTRUCTIONS_KEY = 'gemini_clone_custom_instructions_v3';
const LANGUAGE_STORAGE_KEY = 'gemini_clone_language_v3';

export default function App() {
  // Language state (Indonesian default matching reference screenshot)
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'id') return saved;
    } catch {}
    return 'id';
  });

  // Sessions state (Starts with an empty session active + seeded recent conversations in sidebar)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DEMO_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (saved && sessions.some((s) => s.id === saved)) return saved;
    } catch {}
    return sessions[0]?.id || 'session-initial-empty';
  });

  // Sidebar open by default on desktop
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<SidebarView>('chat');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentModel, setCurrentModel] = useState<ModelTier>('pro');
  const [currentMode, setCurrentMode] = useState<'chat' | 'task'>('chat');
  const [thinkingLevel, setThinkingLevel] = useState<'off' | 'low' | 'medium' | 'high'>('low');
  const [searchGrounding, setSearchGrounding] = useState<boolean>(false);

  const [customInstructions, setCustomInstructions] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY) ||
        'Anda adalah Google Gemini, asisten AI yang cerdas, tajam, dan terstruktur. Berikan jawaban yang akurat, ramah, dan gunakan format Markdown yang rapi.'
      );
    } catch {
      return '';
    }
  });

  const [collections, setCollections] = useState<CollectionItem[]>(() => {
    try {
      const saved = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'col-1',
        title: 'Pola Async Mutex TypeScript',
        content:
          'Gunakan antrean Promise berantai (AsyncMutex) untuk mencegah race condition pada operasi mutasi status bersama.',
        sourceSessionId: 'session-hist-1',
        createdAt: Date.now() - 86400 * 1000,
        category: 'code',
      },
    ];
  });

  const [notebooks, setNotebooks] = useState<NotebookItem[]>(() => {
    try {
      const saved = localStorage.getItem(NOTEBOOKS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'nb-1',
        title: 'Catatan Arsitektur & Riset AI',
        content:
          '# Catatan Riset Proyek\n\n- Evaluasi latensi streaming SSE pada model Gemini Flash & Pro.\n- Struktur prompt sinematik untuk animasi 3D MP4.\n- Checklist keamanan API server-side.',
        updatedAt: Date.now(),
      },
    ];
  });

  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(() => {
    return notebooks[0]?.id || null;
  });

  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(SCHEDULED_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'sched-1',
        title: 'Ringkasan Berita Teknologi & AI Pagi',
        prompt: 'Berikan ringkasan perkembangan terbaru di bidang AI, rekayasa perangkat lunak, dan komputasi awan hari ini.',
        scheduleLabel: 'Setiap hari · 08:00',
        active: true,
      },
      {
        id: 'sched-2',
        title: 'Checklist Audit Keamanan Kode Mingguan',
        prompt: 'Susunkan daftar pemeriksaan keamanan aplikasi web (OWASP Top 10) untuk review rilis mingguan.',
        scheduleLabel: 'Senin · 09:00',
        active: true,
      },
    ];
  });

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamStartedAtRef = useRef<number>(0);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);

  const t = UI_STRINGS[language];
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  const isChatEmpty = !activeSession || activeSession.messages.length === 0;

  // Persist states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  // Auto-repair any previously interrupted/stopped image transformation messages in saved sessions
  useEffect(() => {
    let repaired = false;
    const checkAndRepair = async () => {
      const updated = await Promise.all(
        sessions.map(async (session) => {
          const msgs = [...session.messages];
          let sessionChanged = false;
          for (let i = 0; i < msgs.length; i++) {
            const m = msgs[i];
            const isStoppedOrStuck =
              m.role === 'assistant' &&
              (m.content.trim() === '*(Dihentikan)*' ||
                m.content.trim() === '*(Stopped)*' ||
                m.status === 'streaming' ||
                m.status === 'error');
            if (isStoppedOrStuck && i > 0 && msgs[i - 1].role === 'user') {
              const prevUser = msgs[i - 1];
              const firstImg = prevUser.attachments?.find((a) =>
                a.type.startsWith('image/')
              )?.dataUrl;
              const intent = detectImageStudioIntent(
                prevUser.content,
                Boolean(firstImg)
              );
              if (intent.isImageRequest) {
                const artUrl = await renderStudioArtwork(
                  prevUser.content,
                  firstImg,
                  intent.styleId,
                  intent.aspectRatio
                );
                msgs[i] = {
                  ...m,
                  status: 'complete',
                  error: undefined,
                  generatedImages: artUrl ? [artUrl] : m.generatedImages,
                  content:
                    'Berikut adalah hasil transformasi visual potret Anda dengan tekstur sapuan kuas artistik, komposisi warna ekspresif, dan pencahayaan hangat sesuai gaya yang Anda pilih.',
                };
                sessionChanged = true;
                repaired = true;
              }
            }
          }
          return sessionChanged ? { ...session, messages: msgs } : session;
        })
      );
      if (repaired) {
        setSessions(updated);
      }
    };
    checkAndRepair();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId);
    } catch {}
  }, [activeSessionId]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
    } catch {}
  }, [collections]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTEBOOKS_STORAGE_KEY, JSON.stringify(notebooks));
    } catch {}
  }, [notebooks]);

  useEffect(() => {
    try {
      localStorage.setItem(SCHEDULED_STORAGE_KEY, JSON.stringify(scheduledTasks));
    } catch {}
  }, [scheduledTasks]);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {}
  }, [language]);

  // Sync model/mode when switching sessions
  useEffect(() => {
    if (activeSession) {
      setCurrentModel(activeSession.model || 'pro');
      setCurrentMode(activeSession.mode || 'chat');
    }
  }, [activeSessionId]);

  const scrollToBottom = (smooth = true) => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const distance = scrollHeight - (scrollTop + clientHeight);
    const scrolledUp = distance > 160;
    isUserScrolledUpRef.current = scrolledUp;
    setShowScrollBottom(scrolledUp);
  };

  useEffect(() => {
    if (!isUserScrolledUpRef.current && activeView === 'chat') {
      scrollToBottom(false);
    }
  }, [activeSession?.messages, activeView]);

  const handleNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }

    setActiveView('chat');
    setGlobalError(null);

    // Reuse an existing empty session if one already exists at the top
    const existingEmpty = sessions.find((s) => s.messages.length === 0);
    if (existingEmpty) {
      setActiveSessionId(existingEmpty.id);
      if (window.innerWidth < 1024) setSidebarOpen(false);
      return;
    }

    const freshSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: t.newChat,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: currentModel,
      mode: currentMode,
      thinkingLevel,
      searchGrounding,
      messages: [],
    };

    setSessions((prev) => [freshSession, ...prev]);
    setActiveSessionId(freshSession.id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setActiveSessionId(id);
    setActiveView('chat');
    setGlobalError(null);
    setSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh: ChatSession = {
          id: 'session-' + Date.now(),
          title: t.newChat,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: currentModel,
          mode: currentMode,
          thinkingLevel,
          searchGrounding,
          messages: [],
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  const handleTogglePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  };

  const handleSelectModel = (model: ModelTier) => {
    setCurrentModel(model);
    if (activeSession) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, model } : s))
      );
    }
  };

  const handleSelectMode = (mode: 'chat' | 'task') => {
    setCurrentMode(mode);
    if (activeSession) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, mode } : s))
      );
    }
  };

  const handleStopStreaming = () => {
    // Guard against accidental double-click on Send button immediately triggering Stop
    if (Date.now() - streamStartedAtRef.current < 650) {
      return;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleToggleSaveToCollection = (message: ChatMessage) => {
    if (!activeSession) return;
    const isSaved = Boolean(message.savedToCollection);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === message.id ? { ...m, savedToCollection: !isSaved } : m
              ),
            }
          : s
      )
    );

    if (!isSaved) {
      const newItem: CollectionItem = {
        id: 'col-' + Date.now(),
        title: activeSession.title || 'Catatan Gemini',
        content: message.content,
        sourceSessionId: activeSession.id,
        createdAt: Date.now(),
        category: message.content.includes('```') ? 'code' : 'note',
      };
      setCollections((prev) => [newItem, ...prev]);
    } else {
      setCollections((prev) =>
        prev.filter((c) => c.content !== message.content)
      );
    }
  };

  // Core Message Send & Resilient Streaming Logic
  const handleSendMessage = async (
    content: string,
    attachments: AttachmentItem[] = [],
    forceImageStudio = false
  ) => {
    if (!activeSession) return;
    if (!content.trim() && attachments.length === 0) return;

    const targetSessionId = activeSession.id;
    setActiveView('chat');
    setGlobalError(null);
    if (activeSession.messages.length === 0) {
      setSidebarOpen(false);
    }

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now() + '-user',
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const isFirstMessage = activeSession.messages.length === 0;
    const newTitle = isFirstMessage
      ? generateSessionTitle(content || attachments[0]?.name || t.newChat, t.newChat)
      : activeSession.title;

    const assistantMessageId = 'msg-' + Date.now() + '-assistant';
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: currentModel,
      status: 'streaming',
    };

    const priorMessages = activeSession.messages;
    const updatedMessages = [...priorMessages, userMessage, assistantPlaceholder];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? {
              ...s,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    isUserScrolledUpRef.current = false;
    setTimeout(() => scrollToBottom(true), 40);

    setIsStreaming(true);
    streamStartedAtRef.current = Date.now();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Detect if this is an Image Studio (Nano Banana / Buat gambar) transformation or creation request
    const sourceImageAtt = attachments.find((a) => a.type.startsWith('image/') && a.dataUrl);
    const imageIntent = detectImageStudioIntent(
      content,
      Boolean(sourceImageAtt),
      forceImageStudio
    );

    let generatedImagesList: string[] = [];

    if (imageIntent.isImageRequest) {
      try {
        const renderedArtwork = await renderStudioArtwork(
          content,
          sourceImageAtt?.dataUrl,
          imageIntent.styleId,
          imageIntent.aspectRatio
        );
        if (renderedArtwork) {
          generatedImagesList = [renderedArtwork];
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== targetSessionId) return s;
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, generatedImages: generatedImagesList }
                    : m
                ),
              };
            })
          );
          setTimeout(() => scrollToBottom(true), 60);
        }
      } catch (artErr) {
        console.warn('Studio artwork render fallback:', artErr);
      }
    }

    try {
      const contextToSend = compactHistory([...priorMessages, userMessage]);

      const modeInstruction =
        currentMode === 'task'
          ? '\n[Mode Tugas Aktif: Susun respons sebagai langkah-langkah rencana aksi yang terstruktur, daftar periksa (checklist), dan solusi praktis yang siap dieksekusi.]'
          : '';

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: contextToSend,
          model: currentModel,
          systemInstruction: `${customInstructions}${modeInstruction}`,
          thinkingLevel: currentModel === 'pro' ? 'medium' : thinkingLevel,
          searchGrounding,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(
          errJson.error || `Permintaan gagal dengan kode status ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error('Server tidak mengembalikan aliran data respons.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let accumulatedThought = '';
      let groundingData: ChatMessage['groundingMetadata'] = undefined;
      let streamError: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const event = parseSSELine(line);
          if (!event) continue;

          if (event.type === 'chunk' && event.text) {
            accumulatedText += event.text;
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== targetSessionId) return s;
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: accumulatedText, status: 'streaming' }
                      : m
                  ),
                };
              })
            );
          } else if (event.type === 'image' && event.dataUrl) {
            generatedImagesList = [event.dataUrl];
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== targetSessionId) return s;
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, generatedImages: generatedImagesList }
                      : m
                  ),
                };
              })
            );
          } else if (event.type === 'thought' && event.text) {
            accumulatedThought += event.text;
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== targetSessionId) return s;
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, thought: accumulatedThought }
                      : m
                  ),
                };
              })
            );
          } else if (event.type === 'grounding' && event.metadata) {
            groundingData = event.metadata;
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== targetSessionId) return s;
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, groundingMetadata: groundingData }
                      : m
                  ),
                };
              })
            );
          } else if (event.type === 'error') {
            streamError = event.error;
          }
        }

        if (streamError) {
          throw new Error(streamError);
        }
      }

      // Process any remaining buffered line
      if (buffer.trim()) {
        const lastEvent = parseSSELine(buffer);
        if (lastEvent?.type === 'chunk' && lastEvent.text) {
          accumulatedText += lastEvent.text;
        } else if (lastEvent?.type === 'image' && lastEvent.dataUrl) {
          generatedImagesList = [lastEvent.dataUrl];
        } else if (lastEvent?.type === 'error') {
          throw new Error(lastEvent.error);
        }
      }

      if (!accumulatedText.trim() && accumulatedThought.trim()) {
        accumulatedText = accumulatedThought.trim();
      }

      if (!accumulatedText.trim() && generatedImagesList.length > 0) {
        accumulatedText =
          language === 'id'
            ? 'Berikut adalah hasil transformasi visual potret Anda sesuai gaya artistik yang dipilih.'
            : 'Here is your transformed visual artwork based on the selected style.';
      }

      if (!accumulatedText.trim()) {
        throw new Error(
          language === 'id'
            ? 'Respons tidak diterima dari server. Silakan klik Coba lagi.'
            : 'No response text received from server. Please click Retry.'
        );
      }

      // Finalize complete message
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== targetSessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: accumulatedText,
                    thought: accumulatedThought || undefined,
                    generatedImages:
                      generatedImagesList.length > 0 ? generatedImagesList : m.generatedImages,
                    groundingMetadata: groundingData,
                    status: 'complete',
                  }
                : m
            ),
          };
        })
      );
    } catch (err: any) {
      if (generatedImagesList.length > 0) {
        // If we already generated the studio image, complete gracefully with the artwork!
        const fallbackCaption =
          language === 'id'
            ? 'Berikut adalah hasil transformasi visual potret Anda dengan tekstur artistik dan pencahayaan sesuai gaya yang Anda minta.'
            : 'Here is the visual transformation of your photo in the requested artistic style.';
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== targetSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: m.content?.trim() || fallbackCaption,
                      generatedImages: generatedImagesList,
                      status: 'complete',
                    }
                  : m
              ),
            };
          })
        );
      } else if (err?.name === 'AbortError') {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== targetSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: m.content || (language === 'id' ? '*(Dihentikan)*' : '*(Stopped)*'),
                      status: 'complete',
                    }
                  : m
              ),
            };
          })
        );
      } else {
        const errMsg =
          err?.message ||
          (language === 'id'
            ? 'Gagal terhubung ke layanan Gemini. Silakan coba lagi.'
            : 'Failed to connect to Gemini service. Please try again.');

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== targetSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      status: 'error',
                      error: errMsg,
                      content: errMsg,
                    }
                  : m
              ),
            };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = () => {
    if (!activeSession || isStreaming) return;
    const msgs = activeSession.messages;
    if (msgs.length === 0) return;

    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const userMsg = msgs[lastUserIndex];
    const trimmedBeforeUser = msgs.slice(0, lastUserIndex);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id ? { ...s, messages: trimmedBeforeUser } : s
      )
    );

    setTimeout(() => {
      handleSendMessage(userMsg.content, userMsg.attachments || []);
    }, 10);
  };

  const handleCreateNotebook = () => {
    const newNb: NotebookItem = {
      id: 'nb-' + Date.now(),
      title: `${t.newNotebook} ${notebooks.length + 1}`,
      content: '',
      updatedAt: Date.now(),
    };
    setNotebooks((prev) => [newNb, ...prev]);
    setActiveNotebookId(newNb.id);
    setActiveView('notebooks');
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0c10] text-[#e3e3e3]">
      {/* Left Collapsible Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        activeView={activeView}
        isOpen={sidebarOpen}
        language={language}
        notebooks={notebooks}
        activeNotebookId={activeNotebookId}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onSelectView={(v) => {
          setActiveView(v);
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onTogglePinSession={handleTogglePinSession}
        onToggleLanguage={() => setLanguage(language === 'id' ? 'en' : 'id')}
        onCreateNotebook={handleCreateNotebook}
        onSelectNotebook={(id) => {
          setActiveNotebookId(id);
          setActiveView('notebooks');
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col h-full min-w-0 relative transition-[padding] duration-200 ease-out ${
          sidebarOpen ? 'pl-[52px] lg:pl-[268px]' : 'pl-[52px]'
        } ${activeView === 'chat' && isChatEmpty ? 'gemini-ambient-canvas' : 'bg-[#0b0c10]'}`}
      >
        {/* Top Utility Header */}
        <Header
          sidebarOpen={sidebarOpen}
          language={language}
          activeView={activeView}
          activeSession={activeSession}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={handleNewChat}
        />

        {/* Global Error Banner if any */}
        {globalError && (
          <div className="max-w-[760px] w-full mx-auto px-4 mt-2">
            <div className="p-3 rounded-2xl bg-[#1f1619] border border-rose-900/50 text-xs text-rose-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{globalError}</span>
              </div>
              <button
                onClick={() => setGlobalError(null)}
                className="text-xs text-rose-300 hover:text-white underline cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: Non-Chat Sidebar Workspace Views (Koleksi, Gambar, Video, Dijadwalkan, Sesuaikan, Notebook) */}
        {activeView !== 'chat' ? (
          <div className="flex-1 overflow-y-auto">
            <WorkspaceViews
              view={activeView}
              language={language}
              sessions={sessions}
              collections={collections}
              scheduledTasks={scheduledTasks}
              notebooks={notebooks}
              activeNotebookId={activeNotebookId}
              customInstructions={customInstructions}
              searchGrounding={searchGrounding}
              thinkingLevel={thinkingLevel}
              onDeleteCollection={(id) =>
                setCollections((prev) => prev.filter((c) => c.id !== id))
              }
              onAddScheduledTask={(title, prompt, scheduleLabel) => {
                setScheduledTasks((prev) => [
                  {
                    id: 'sched-' + Date.now(),
                    title,
                    prompt,
                    scheduleLabel,
                    active: true,
                  },
                  ...prev,
                ]);
              }}
              onToggleScheduledTask={(id) =>
                setScheduledTasks((prev) =>
                  prev.map((task) =>
                    task.id === id ? { ...task, active: !task.active } : task
                  )
                )
              }
              onDeleteScheduledTask={(id) =>
                setScheduledTasks((prev) => prev.filter((task) => task.id !== id))
              }
              onSaveCustomInstructions={(inst, search, thinking) => {
                setCustomInstructions(inst);
                setSearchGrounding(search);
                setThinkingLevel(thinking);
                try {
                  localStorage.setItem(CUSTOM_INSTRUCTIONS_KEY, inst);
                } catch {}
              }}
              onUpdateNotebook={(id, title, content) => {
                setNotebooks((prev) =>
                  prev.map((nb) =>
                    nb.id === id ? { ...nb, title, content, updatedAt: Date.now() } : nb
                  )
                );
              }}
              onDeleteNotebook={(id) => {
                setNotebooks((prev) => {
                  const rest = prev.filter((nb) => nb.id !== id);
                  if (activeNotebookId === id) {
                    setActiveNotebookId(rest[0]?.id || null);
                  }
                  return rest;
                });
              }}
              onCreateNotebook={handleCreateNotebook}
              onSelectNotebook={(id) => setActiveNotebookId(id)}
              onRunPromptInChat={(promptText, atts) => {
                const isFromImagesView = activeView === 'images';
                setActiveView('chat');
                handleSendMessage(promptText, atts || [], isFromImagesView);
              }}
              onPreviewImage={(url) => setPreviewImageUrl(url)}
            />
          </div>
        ) : isChatEmpty ? (
          /* VIEW 2: Main Chat Area (Empty State) - Centered Greeting & Centered Input Box */
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16 select-none">
            <h1 className="text-[28px] sm:text-[34px] md:text-[38px] font-medium tracking-tight text-[#e3e3e3] text-center mb-7 text-balance">
              {currentMode === 'task' ? t.taskGreeting : t.greeting}
            </h1>

            <ChatInput
              variant="centered"
              language={language}
              model={currentModel}
              mode={currentMode}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              onSelectModel={handleSelectModel}
              onSelectMode={handleSelectMode}
            />
          </div>
        ) : (
          /* VIEW 3: Main Chat Area (Active State) - Borderless Left-Aligned Thread + Bottom Input Dock */
          <>
            <div
              ref={chatScrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overflow-x-hidden pb-6 pt-2"
            >
              {activeSession.messages.map((message, index) => {
                const isLast = index === activeSession.messages.length - 1;
                return (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    language={language}
                    isLastAssistantMessage={isLast && message.role === 'assistant'}
                    onRegenerate={handleRegenerate}
                    onPreviewImage={(url) => setPreviewImageUrl(url)}
                    onToggleSaveToCollection={handleToggleSaveToCollection}
                  />
                );
              })}
            </div>

            <ChatInput
              variant="bottom"
              language={language}
              model={currentModel}
              mode={currentMode}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              onSelectModel={handleSelectModel}
              onSelectMode={handleSelectMode}
              onScrollToBottom={() => scrollToBottom(true)}
            />
          </>
        )}
      </main>

      {/* Fullscreen Image Preview Modal */}
      <ImageModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </div>
  );
}
