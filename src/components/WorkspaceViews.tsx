import React, { useState, useRef } from 'react';
import {
  LayoutGrid,
  Clock,
  BookOpen,
  Play,
  Trash2,
  Plus,
  Check,
  Copy,
  Sparkles,
  ArrowUp,
  ChevronDown,
  Mic,
  Search,
  X,
} from 'lucide-react';
import {
  AttachmentItem,
  ChatSession,
  CollectionItem,
  Language,
  MODEL_OPTIONS,
  ModelTier,
  NotebookItem,
  ScheduledTaskItem,
  SidebarView,
  UI_STRINGS,
  copyToClipboard,
} from '../utils/chatUtils';
import {
  NanoBananaImageIcon,
  ExpandComposerIcon,
  AspectRatioShapeIcon,
  GeminiCustomizeIcon,
  GeminiVideoIcon,
} from './GeminiSparkleIcon';
import { compressImageFile } from '../utils/imageStudioUtils';

interface WorkspaceViewsProps {
  view: Exclude<SidebarView, 'chat'>;
  language: Language;
  sessions: ChatSession[];
  collections: CollectionItem[];
  scheduledTasks: ScheduledTaskItem[];
  notebooks: NotebookItem[];
  activeNotebookId: string | null;
  customInstructions: string;
  searchGrounding: boolean;
  thinkingLevel: 'off' | 'low' | 'medium' | 'high';
  onDeleteCollection: (id: string) => void;
  onAddScheduledTask: (title: string, prompt: string, scheduleLabel: string) => void;
  onToggleScheduledTask: (id: string) => void;
  onDeleteScheduledTask: (id: string) => void;
  onSaveCustomInstructions: (
    instructions: string,
    search: boolean,
    thinking: 'off' | 'low' | 'medium' | 'high'
  ) => void;
  onUpdateNotebook: (id: string, title: string, content: string) => void;
  onDeleteNotebook: (id: string) => void;
  onCreateNotebook: () => void;
  onSelectNotebook: (id: string) => void;
  onRunPromptInChat: (prompt: string, attachments?: AttachmentItem[]) => void;
  onPreviewImage: (url: string) => void;
}

interface ImageTemplateItem {
  id: string;
  label: string;
  image: string;
  modalDescription: string;
  prompt: string;
  grayscale?: boolean;
  sitcomBadge?: boolean;
}

// Template Set 1 (Matches image_b35cf25c.png & image_f9ad5165.png: Sitkom, Mekar, Zen, Cat, Marmer)
const IMAGE_TEMPLATES_SET_1: ImageTemplateItem[] = [
  {
    id: 'sitkom',
    label: 'Sitkom',
    sitcomBadge: true,
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    modalDescription:
      'Imajinasikan diri Anda sebagai bintang tamu di acara sitkom TV era 80-an.',
    prompt:
      'Ubah foto ini menjadi adegan pembuka acara sitkom TV keluarga tahun 1980-an di dapur retro penuh warna hangat dengan teks kredit kuning "GUEST STAR" di bagian bawah.',
  },
  {
    id: 'mekar',
    label: 'Mekar',
    image:
      'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=600&q=80',
    modalDescription:
      'Imajinasikan diri Anda dikelilingi buket bunga protea yang mekar indah.',
    prompt:
      'Imajinasikan subjek berada di dalam studio florist artistik memegang buket bunga protea dan dedaunan tropis yang sedang mekar dengan pencahayaan alami yang lembut.',
  },
  {
    id: 'zen',
    label: 'Zen',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    modalDescription:
      'Imajinasikan diri Anda berada di taman zen futuristik.',
    prompt:
      'Imajinasikan diri Anda berada di taman zen futuristik tanpa gravitasi sambil merapikan pasir zen bercahaya biru dengan pemandangan bulan di balik jendela pesawat ruang angkasa.',
  },
  {
    id: 'cat',
    label: 'Cat',
    image:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    modalDescription:
      'Imajinasikan diri Anda dalam lukisan cat minyak impresionis yang penuh warna.',
    prompt:
      'Ubah potret menjadi lukisan cat minyak impresionis bertekstur tebal dengan sapuan kuas ekspresif dan suasana jalanan kota yang cerah.',
  },
  {
    id: 'marmer',
    label: 'Marmer',
    image:
      'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=600&q=80',
    modalDescription:
      'Imajinasikan diri Anda sebagai patung marmer klasik di museum seni.',
    prompt:
      'Imajinasikan subjek sebagai patung pahatan marmer putih klasik bergaya Yunani-Romawi yang dipajang di tengah galeri museum seni dengan pencahayaan sorot dramatis.',
  },
];

// Template Set 2 (Matches image_3fc15c69.png: Somelier, Elven, Boneka, Arcade, Hollywood)
const IMAGE_TEMPLATES_SET_2: ImageTemplateItem[] = [
  {
    id: 'somelier',
    label: 'Somelier',
    image:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    modalDescription:
      'Imajinasikan diri Anda sebagai somelier profesional di ruang anggur klasik.',
    prompt:
      'Buat gambar potret sinematik seorang somelier profesional di ruang bawah tanah penyimpanan anggur klasik dengan pencahayaan hangat dramatis, detail fotorealistis 8k.',
  },
  {
    id: 'elven',
    label: 'Elven',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    modalDescription:
      'Imajinasikan diri Anda sebagai ksatria pemanah Elven di hutan legendaris.',
    prompt:
      'Buat gambar karakter pemanah Elven di hutan kuno bercahaya keemasan saat matahari terbenam, kostum kulit detail tinggi, atmosfer fantasi epik.',
  },
  {
    id: 'boneka',
    label: 'Boneka',
    image:
      'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80',
    modalDescription:
      'Imajinasikan diri Anda berubah menjadi boneka plushie rajut yang menggemaskan.',
    prompt:
      'Buat gambar boneka plushie bulat lucu bertekstur rajut lembut di atas tempat tidur yang nyaman dengan lampu bokeh hangat di latar belakang.',
  },
  {
    id: 'arcade',
    label: 'Arcade',
    image:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
    modalDescription:
      'Imajinasikan diri Anda berada di ruang game arcade neon tahun 80-an.',
    prompt:
      'Buat gambar potret seseorang tersenyum di tengah ruang mesin game retro arcade yang dipenuhi lampu neon biru dan magenta bergaya tahun 80-an.',
  },
  {
    id: 'hollywood',
    label: 'Hollywood',
    grayscale: true,
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    modalDescription:
      'Imajinasikan diri Anda dalam potret hitam-putih klasik bintang Hollywood.',
    prompt:
      'Buat gambar potret hitam-putih klasik bergaya bintang film Hollywood era keemasan mengenakan tuksedo rapi dengan pencahayaan studio kontras tinggi.',
  },
];

const VIDEO_TEMPLATES = [
  {
    id: 'cinematic3d',
    label: 'Animasi 3D',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    prompt:
      'Buatkan konsep video animasi 3D MP4 sinematik 24fps beserta storyboard kamera dan pencahayaan volumetrik.',
  },
  {
    id: 'cyberpunk',
    label: 'Neon Kota',
    image:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    prompt:
      'Buatkan skenario video sinematik perjalanan malam di kota futuristik berlampu neon saat hujan.',
  },
  {
    id: 'drone',
    label: 'Drone Alam',
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    prompt:
      'Buatkan storyboard video aerial drone FPV melintasi pegunungan berkabut dan lembah hijau saat matahari terbit.',
  },
  {
    id: 'documentary',
    label: 'Dokumenter',
    image:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80',
    prompt:
      'Buatkan naskah dan daftar shot video dokumenter pendek bergaya sinematik dengan narasi yang menyentuh.',
  },
  {
    id: 'timelapse',
    label: 'Timelapse',
    image:
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=400&q=80',
    prompt:
      'Buatkan konsep video hyperlapse transisi siang ke malam di pusat kota metropolitan modern.',
  },
];

export const WorkspaceViews: React.FC<WorkspaceViewsProps> = ({
  view,
  language,
  sessions,
  collections,
  scheduledTasks,
  notebooks,
  activeNotebookId,
  customInstructions,
  searchGrounding,
  thinkingLevel,
  onDeleteCollection,
  onAddScheduledTask,
  onToggleScheduledTask,
  onDeleteScheduledTask,
  onSaveCustomInstructions,
  onUpdateNotebook,
  onDeleteNotebook,
  onCreateNotebook,
  onSelectNotebook,
  onRunPromptInChat,
  onPreviewImage,
}) => {
  const t = UI_STRINGS[language];

  // Local state for Image Studio ("Buat gambar" matching all 5 reference screenshots)
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAttachments, setImageAttachments] = useState<AttachmentItem[]>([]);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [imageModel, setImageModel] = useState<ModelTier>('flash');
  const [imageModelOpen, setImageModelOpen] = useState(false);
  const [showThinkingSubmenu, setShowThinkingSubmenu] = useState(false);
  const [imageThinking, setImageThinking] = useState<'low' | 'medium' | 'high'>('low');
  const [imageAspect, setImageAspect] = useState<
    'Rasio aspek' | '1:1' | '9:16' | '3:4' | '4:3' | '16:9'
  >('Rasio aspek');
  const [aspectOpen, setAspectOpen] = useState(false);

  // Template Set Pagination (Set 0 = Sitkom/Mekar/Zen/Cat/Marmer, Set 1 = Somelier/Elven/Boneka/Arcade/Hollywood)
  const [templateSetIndex, setTemplateSetIndex] = useState<0 | 1>(0);
  // Active Template Modal (Matches image_f9ad5165.png)
  const [selectedTemplateModal, setSelectedTemplateModal] =
    useState<ImageTemplateItem | null>(null);

  const composerFileInputRef = useRef<HTMLInputElement | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);

  // Local state for Video Studio ("Buat video")
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [videoAspect, setVideoAspect] = useState<'16:9' | '9:16'>('16:9');
  const [videoAspectOpen, setVideoAspectOpen] = useState(false);

  // Local state for Collections search & filter
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'code' | 'note'>('all');
  const [collectionSearch, setCollectionSearch] = useState('');

  // Local state for Customize view ("Sesuaikan")
  const [draftInstructions, setDraftInstructions] = useState(customInstructions);
  const [draftSearch, setDraftSearch] = useState(searchGrounding);
  const [draftThinking, setDraftThinking] = useState(thinkingLevel);
  const [savedMemories, setSavedMemories] = useState<string[]>([
    'Gunakan Bahasa Indonesia yang lugas, terstruktur, dan ramah.',
    'Sertakan contoh kode yang bersih dan siap produksi saat membahas pemrograman.',
    'Format poin-poin penting menggunakan daftar atau tabel Markdown.',
  ]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [addingMemory, setAddingMemory] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Local state for Scheduled Task creation
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPrompt, setNewTaskPrompt] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('Setiap hari · 08:00');

  const handleCopyItem = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const uploadedImages = sessions.flatMap((s) =>
    s.messages.flatMap((m) =>
      (m.attachments || [])
        .filter((a) => a.type.startsWith('image/') && a.dataUrl)
        .map((a) => ({
          name: a.name,
          dataUrl: a.dataUrl,
          sessionTitle: s.title,
          timestamp: m.timestamp,
        }))
    )
  );

  // ============================================================================
  // 1. GAMBAR ("Buat gambar" — Matches image_f9ad5165, image_b35cf25c, image_d34122c9, image_d5da615a, image_e2202fa8)
  // ============================================================================
  if (view === 'images') {
    const activeTemplates =
      templateSetIndex === 0 ? IMAGE_TEMPLATES_SET_1 : IMAGE_TEMPLATES_SET_2;
    const previewMiniSet =
      templateSetIndex === 0 ? IMAGE_TEMPLATES_SET_2 : IMAGE_TEMPLATES_SET_1;
    const activeModelObj =
      MODEL_OPTIONS.find((m) => m.id === imageModel) || MODEL_OPTIONS[1];

    const handleImageSubmit = () => {
      if (!imagePrompt.trim() && imageAttachments.length === 0) return;
      const ratioNote =
        imageAspect !== 'Rasio aspek' ? ` [Rasio aspek: ${imageAspect}]` : '';
      const promptText =
        imagePrompt.trim() ||
        ' Analisis gambar ini dan buatkan variasi konsep visual Nano Banana.';
      onRunPromptInChat(`${promptText}${ratioNote}`, imageAttachments);
    };

    const handleComposerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const fileList = Array.from(files);
      e.target.value = '';
      for (const file of fileList) {
        const compressed = await compressImageFile(file);
        if (compressed.dataUrl) {
          setImageAttachments((prev) => [...prev, compressed]);
        }
      }
    };

    const handleModalPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedTemplateModal) return;

      const chosenTemplate = selectedTemplateModal;
      e.target.value = '';
      setSelectedTemplateModal(null);

      const compressed = await compressImageFile(file);
      if (compressed.dataUrl) {
        setImageAttachments([compressed]);
        setImagePrompt(chosenTemplate.prompt);
      }
    };

    return (
      <div
        className="min-h-full w-full flex flex-col items-center justify-center px-4 py-10 select-none relative overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 52% 44% at 50% 54%, rgba(28, 43, 82, 0.45) 0%, rgba(11, 12, 16, 0) 75%)',
        }}
      >
        {/* Hidden File Inputs for "+" Button and Modal "Pilih foto" Button */}
        <input
          ref={composerFileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleComposerFileUpload}
          className="hidden"
        />
        <input
          ref={modalFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleModalPhotoSelected}
          className="hidden"
        />

        <div className="w-full max-w-[680px] mx-auto flex flex-col items-center">
          {/* Top Nano Banana Emblem with yellow banana inside rounded square */}
          <div className="mb-3 text-[#e3e3e3]">
            <NanoBananaImageIcon className="w-6 h-6" yellowAccent />
          </div>

          {/* Main Heading: "Buat gambar" */}
          <h1 className="text-[28px] sm:text-[33px] font-normal tracking-tight text-[#e3e3e3] text-center mb-2">
            {language === 'id' ? 'Buat gambar' : 'Create images'}
          </h1>

          {/* Subtitle: "Coba template atau jelaskan ide di percakapan. Buat dengan Nano Banana." */}
          <p className="text-[13.5px] text-[#c4c7c5] text-center mb-7">
            {language === 'id'
              ? 'Coba template atau jelaskan ide di percakapan. Buat dengan Nano Banana.'
              : 'Try a template or describe your idea in chat. Created with Nano Banana.'}
          </p>

          {/* Multi-Row Dark Composer Box */}
          <div className="w-full rounded-[26px] bg-[#1e1f22] border border-[#2c2d32] px-4 pt-3.5 pb-3 shadow-2xl space-y-2.5">
            {/* Attached Photo Preview inside Composer if user uploaded via "+" or "Pilih foto" */}
            {imageAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-1">
                {imageAttachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-2xl overflow-hidden border border-[#3c4043] bg-[#131314] flex items-center gap-2 pr-2"
                  >
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-11 h-11 object-cover rounded-xl"
                    />
                    <span className="text-xs text-[#e3e3e3] max-w-[140px] truncate">
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setImageAttachments((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      aria-label="Hapus foto"
                      className="p-1 text-[#9aa0a6] hover:text-white rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Row 1: Textarea + Expand Double-Triangle Badge matching image_d5da615a.png */}
            <div className="flex items-start justify-between gap-2">
              <textarea
                rows={imageExpanded ? 3 : 1}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleImageSubmit();
                  }
                }}
                placeholder={
                  language === 'id'
                    ? 'Deskripsikan gambar Anda'
                    : 'Describe your image'
                }
                className="flex-1 resize-none bg-transparent text-[15px] text-[#e3e3e3] placeholder:text-[#c4c7c5] focus:outline-none leading-relaxed"
              />
              <button
                type="button"
                onClick={() => setImageExpanded(!imageExpanded)}
                aria-label="Perluas kotak teks"
                className="cursor-pointer shrink-0 mt-0.5"
              >
                <ExpandComposerIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Row 2: "+" + "[ Gambar ]" Pill on Left (image_e2202fa8.png), "Flash v" + Mic/Send on Right (image_d5da615a.png) */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => composerFileInputRef.current?.click()}
                  aria-label="Tambahkan foto referensi"
                  title="Unggah foto"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#c4c7c5] hover:text-white hover:bg-[#2a2b2f] transition-colors cursor-pointer"
                >
                  <Plus className="w-[18px] h-[18px]" />
                </button>

                {/* Exact "[ Gambar ]" Pill Badge matching close-up image_e2202fa8.png */}
                <button
                  type="button"
                  onClick={() => composerFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#333537] hover:bg-[#3c3e42] text-[13px] font-medium text-[#e3e3e3] transition-colors cursor-pointer"
                >
                  <NanoBananaImageIcon className="w-4 h-4 text-[#e3e3e3]" />
                  <span>{t.images}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Model Selector Dropdown matching close-up image_d5da615a.png */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setImageModelOpen(!imageModelOpen);
                      setShowThinkingSubmenu(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#e3e3e3] transition-colors cursor-pointer ${
                      imageModelOpen ? 'bg-[#2d2f31]' : 'hover:bg-[#2a2b2f]'
                    }`}
                  >
                    <span>{activeModelObj.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#c4c7c5] transition-transform duration-150 ${
                        imageModelOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {imageModelOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setImageModelOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1.5 w-[235px] rounded-[20px] bg-[#1e1f20] border border-[#2d2e30] shadow-2xl z-50 py-2">
                        {MODEL_OPTIONS.map((opt) => {
                          const isSelected = opt.id === imageModel;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setImageModel(opt.id);
                                setImageModelOpen(false);
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
                          onClick={() =>
                            setShowThinkingSubmenu(!showThinkingSubmenu)
                          }
                          className="w-full flex items-center justify-between pl-10 pr-4 py-2 text-left text-[12.5px] font-medium text-[#e3e3e3] hover:bg-[#2a2b2e] transition-colors cursor-pointer"
                        >
                          <span>
                            {language === 'id'
                              ? 'Tingkat penalaran'
                              : 'Thinking level'}
                          </span>
                          <span className="text-[10px] text-[#c4c7c5]">▸</span>
                        </button>

                        {showThinkingSubmenu && (
                          <div className="px-3 pt-1 pb-1 flex items-center justify-end gap-1">
                            {(['low', 'medium', 'high'] as const).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => {
                                  setImageThinking(lvl);
                                  setImageModelOpen(false);
                                }}
                                className={`px-2.5 py-1 rounded-full text-[11px] capitalize cursor-pointer ${
                                  imageThinking === lvl
                                    ? 'bg-[#8ab4f8] text-[#0b0c10] font-semibold'
                                    : 'bg-[#2a2b2e] text-[#c4c7c5] hover:text-white'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleImageSubmit}
                  aria-label="Input suara atau kirim"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#c4c7c5] hover:text-white hover:bg-[#2a2b2f] transition-colors cursor-pointer"
                >
                  {imagePrompt.trim() || imageAttachments.length > 0 ? (
                    <ArrowUp className="w-4 h-4 text-[#8ab4f8]" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Row 3: Full-width "[ Rasio aspek v ]" Pill Button + Left-Aligned Dropdown matching image_d34122c9.png */}
            <div className="relative pt-0.5">
              <button
                type="button"
                onClick={() => setAspectOpen(!aspectOpen)}
                className="w-full py-2 px-4 rounded-full border border-[#35373c] bg-[#1b1c1f] hover:bg-[#24262a] flex items-center justify-center gap-2 text-xs font-medium text-[#e3e3e3] transition-colors cursor-pointer"
              >
                <AspectRatioShapeIcon ratio={imageAspect} />
                <span>{imageAspect}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#c4c7c5] transition-transform duration-150 ${
                    aspectOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Left-aligned Rasio aspek Popover matching image_d34122c9.png */}
              {aspectOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAspectOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 w-[156px] rounded-[18px] bg-[#1e1f20] border border-[#2d2e30] shadow-2xl z-50 py-2 px-1.5">
                    <div className="px-2.5 py-1.5 text-[11.5px] text-[#c4c7c5]">
                      Rasio aspek
                    </div>
                    {(['1:1', '9:16', '3:4', '4:3', '16:9'] as const).map(
                      (ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => {
                            setImageAspect(ratio);
                            setAspectOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            imageAspect === ratio
                              ? 'bg-[#2d2f31] text-white font-medium'
                              : 'text-[#e3e3e3] hover:bg-[#28292c]'
                          }`}
                        >
                          <span className="w-4 flex items-center justify-center">
                            <AspectRatioShapeIcon ratio={ratio} />
                          </span>
                          <span>{ratio}</span>
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row of 5 Portrait Template Cards + 2x2 Mini Collage Switcher matching image_b35cf25c.png & image_3fc15c69.png */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {activeTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateModal(tpl)}
                className="group relative w-[104px] h-[138px] rounded-[26px] overflow-hidden bg-[#1e1f22] focus:outline-none cursor-pointer shadow-lg transition-transform duration-200 hover:scale-[1.03]"
              >
                <img
                  src={tpl.image}
                  alt={tpl.label}
                  className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                    tpl.grayscale ? 'grayscale contrast-125' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                {tpl.sitcomBadge && (
                  <span className="absolute bottom-7 left-3 text-[7px] font-extrabold tracking-wider text-amber-300 uppercase drop-shadow">
                    GUEST STAR
                  </span>
                )}
                <span className="absolute bottom-3 left-3 right-2 text-left text-[12px] font-medium text-white tracking-tight truncate">
                  {tpl.label}
                </span>
              </button>
            ))}

            {/* 6th Item: Interactive 2x2 Mini Collage Grid (Clicks to cycle between Template Set 1 & Set 2!) */}
            <button
              type="button"
              onClick={() =>
                setTemplateSetIndex((prev) => (prev === 0 ? 1 : 0))
              }
              aria-label="Lihat template lainnya"
              title="Tampilkan koleksi template lainnya"
              className="w-[104px] h-[138px] grid grid-cols-2 gap-1.5 content-center cursor-pointer group focus:outline-none"
            >
              {previewMiniSet.slice(0, 4).map((mini) => (
                <div
                  key={mini.id}
                  className="w-full h-[63px] rounded-[18px] overflow-hidden bg-[#1e1f22] shadow-md group-hover:scale-[1.03] transition-transform"
                >
                  <img
                    src={mini.image}
                    alt={mini.label}
                    className={`w-full h-full object-cover ${
                      mini.grayscale ? 'grayscale contrast-125' : ''
                    }`}
                  />
                </div>
              ))}
            </button>
          </div>

          {/* Uploaded Conversation Images (if any exist) */}
          {uploadedImages.length > 0 && (
            <div className="w-full mt-10 pt-6 border-t border-[#1f2024] space-y-3">
              <h2 className="text-xs font-medium text-[#9aa0a6]">
                {language === 'id'
                  ? 'Gambar dari Percakapan Anda'
                  : 'Images from Your Conversations'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {uploadedImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onPreviewImage(img.dataUrl)}
                    className="group rounded-2xl overflow-hidden bg-[#1e1f22] border border-[#2c2d32] text-left cursor-pointer"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="p-2">
                      <div className="text-[11px] text-[#e3e3e3] truncate">
                        {img.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TEMPLATE PREVIEW MODAL matching image_f9ad5165.png ("Pilih foto" & "Batal") */}
        {selectedTemplateModal && (
          <div
            onClick={() => setSelectedTemplateModal(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={selectedTemplateModal.label}
              className="w-full max-w-[348px] rounded-[28px] bg-[#1e1f20] border border-[#2d2e30] p-4 shadow-2xl flex flex-col"
            >
              {/* Top Rounded Template Preview Image */}
              <div className="w-full h-[215px] rounded-[20px] overflow-hidden bg-[#131314]">
                <img
                  src={selectedTemplateModal.image}
                  alt={selectedTemplateModal.label}
                  className={`w-full h-full object-cover ${
                    selectedTemplateModal.grayscale ? 'grayscale contrast-125' : ''
                  }`}
                />
              </div>

              {/* Left-aligned Description Copy matching image_f9ad5165.png */}
              <div className="mt-4 mb-4 space-y-1 text-[13.5px] font-medium text-[#e3e3e3] leading-snug">
                <p>{selectedTemplateModal.modalDescription}</p>
                <p>
                  {language === 'id'
                    ? 'Tambahkan foto dan lihat perubahannya.'
                    : 'Add a photo and see the transformation.'}
                </p>
              </div>

              {/* Primary Pill Button: "Pilih foto" */}
              <button
                type="button"
                onClick={() => modalFileInputRef.current?.click()}
                className="w-full py-2.5 rounded-full bg-[#131314] hover:bg-[#28292c] text-xs font-medium text-[#e3e3e3] text-center transition-colors cursor-pointer"
              >
                {language === 'id' ? 'Pilih foto' : 'Choose photo'}
              </button>

              {/* Secondary Button: "Batal" */}
              <button
                type="button"
                onClick={() => setSelectedTemplateModal(null)}
                className="w-full py-2.5 mt-1 rounded-full hover:bg-[#28292c]/60 text-xs font-medium text-[#e3e3e3] text-center transition-colors cursor-pointer"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 2. VIDEO ("Buat video" — Authentic Gemini / Veo Studio layout)
  // ============================================================================
  if (view === 'videos') {
    const handleVideoSubmit = () => {
      const topic =
        videoPrompt.trim() ||
        'Animasi sinematik 3D perjalanan luar angkasa dengan pencahayaan dramatis';
      const fullPrompt = `${topic} (Format Video Veo: Rasio aspek ${videoAspect})`;
      onRunPromptInChat(fullPrompt);
    };

    return (
      <div
        className="min-h-full w-full flex flex-col items-center justify-center px-4 py-10 select-none relative overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 52% 44% at 50% 54%, rgba(28, 43, 82, 0.45) 0%, rgba(11, 12, 16, 0) 75%)',
        }}
      >
        <div className="w-full max-w-[680px] mx-auto flex flex-col items-center">
          <div className="mb-3 text-[#e3e3e3]">
            <GeminiVideoIcon className="w-6 h-6" />
          </div>

          <h1 className="text-[28px] sm:text-[33px] font-normal tracking-tight text-[#e3e3e3] text-center mb-2">
            {language === 'id' ? 'Buat video' : 'Create videos'}
          </h1>

          <p className="text-[13.5px] text-[#c4c7c5] text-center mb-7">
            {language === 'id'
              ? 'Coba template adegan atau jelaskan ide video Anda di percakapan. Buat dengan Veo.'
              : 'Try a scene template or describe your video idea in chat. Created with Veo.'}
          </p>

          <div className="w-full rounded-[26px] bg-[#1e1f22] border border-[#2c2d32] px-4 pt-3.5 pb-3 shadow-2xl space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <textarea
                rows={videoExpanded ? 3 : 1}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleVideoSubmit();
                  }
                }}
                placeholder={
                  language === 'id'
                    ? 'Deskripsikan video Anda'
                    : 'Describe your video'
                }
                className="flex-1 resize-none bg-transparent text-[15px] text-[#e3e3e3] placeholder:text-[#c4c7c5] focus:outline-none leading-relaxed"
              />
              <button
                type="button"
                onClick={() => setVideoExpanded(!videoExpanded)}
                aria-label="Perluas kotak teks"
                className="cursor-pointer shrink-0 mt-0.5"
              >
                <ExpandComposerIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setVideoPrompt(
                      'Buatkan skenario & prompt video sinematik 3D MP4 dengan transisi kamera halus'
                    )
                  }
                  aria-label="Tambah referensi video"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#c4c7c5] hover:text-white hover:bg-[#2a2b2f] transition-colors cursor-pointer"
                >
                  <Plus className="w-[18px] h-[18px]" />
                </button>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#333537] text-[13px] font-medium text-[#e3e3e3]">
                  <GeminiVideoIcon className="w-4 h-4" />
                  <span>{t.videos}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1.5 rounded-full text-xs font-medium text-[#e3e3e3]">
                  Pro
                </span>
                <button
                  type="button"
                  onClick={handleVideoSubmit}
                  aria-label="Buat video"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#c4c7c5] hover:text-white hover:bg-[#2a2b2f] transition-colors cursor-pointer"
                >
                  {videoPrompt.trim() ? (
                    <ArrowUp className="w-4 h-4 text-[#8ab4f8]" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="relative pt-0.5">
              <button
                type="button"
                onClick={() => setVideoAspectOpen(!videoAspectOpen)}
                className="w-full py-2 px-4 rounded-full border border-[#35373c] bg-[#1b1c1f] hover:bg-[#24262a] flex items-center justify-center gap-2 text-xs font-medium text-[#e3e3e3] transition-colors cursor-pointer"
              >
                <AspectRatioShapeIcon ratio={videoAspect} />
                <span>Rasio aspek ({videoAspect})</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#c4c7c5]" />
              </button>

              {videoAspectOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setVideoAspectOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 w-[156px] rounded-[18px] bg-[#1e1f20] border border-[#2d2e30] shadow-2xl z-50 py-2 px-1.5">
                    <div className="px-2.5 py-1.5 text-[11.5px] text-[#c4c7c5]">
                      Rasio aspek
                    </div>
                    {(['16:9', '9:16'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => {
                          setVideoAspect(ratio);
                          setVideoAspectOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs text-[#e3e3e3] hover:bg-[#28292c] cursor-pointer"
                      >
                        <span className="w-4 flex items-center justify-center">
                          <AspectRatioShapeIcon ratio={ratio} />
                        </span>
                        <span>{ratio}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {VIDEO_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setVideoPrompt(tpl.prompt)}
                onDoubleClick={() => onRunPromptInChat(tpl.prompt)}
                className="group relative w-[104px] h-[138px] rounded-[26px] overflow-hidden bg-[#1e1f22] focus:outline-none cursor-pointer shadow-lg transition-transform duration-200 hover:scale-[1.03]"
              >
                <img
                  src={tpl.image}
                  alt={tpl.label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <span className="absolute bottom-3 left-3 right-2 text-left text-[12px] font-medium text-white tracking-tight truncate">
                  {tpl.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. KOLEKSI (Authentic Gemini Collections / Saved Items View)
  // ============================================================================
  if (view === 'collections') {
    const filteredCollections = collections.filter((item) => {
      if (collectionFilter !== 'all' && item.category !== collectionFilter) return false;
      if (!collectionSearch.trim()) return true;
      const q = collectionSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    });

    return (
      <div className="max-w-[780px] mx-auto px-4 md:px-6 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 text-[#e3e3e3]">
              <LayoutGrid className="w-5 h-5 text-[#e3e3e3]" />
              <h1 className="text-2xl font-normal tracking-tight">{t.collections}</h1>
            </div>
            <p className="text-xs text-[#9aa0a6]">{t.collectionsDesc}</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              placeholder={language === 'id' ? 'Cari di Koleksi...' : 'Search Collections...'}
              className="w-full bg-[#1e1f22] text-xs text-[#e3e3e3] pl-9 pr-4 py-2 rounded-full border border-[#2c2d32] focus:outline-none focus:border-[#8ab4f8]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              { id: 'all', label: language === 'id' ? 'Semua' : 'All' },
              { id: 'code', label: language === 'id' ? 'Kode & Teknis' : 'Code' },
              { id: 'note', label: language === 'id' ? 'Catatan' : 'Notes' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCollectionFilter(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                collectionFilter === tab.id
                  ? 'bg-[#e3e3e3] text-[#0b0c10]'
                  : 'bg-[#1e1f22] text-[#c4c7c5] hover:bg-[#28292d]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredCollections.length === 0 ? (
          <div className="p-10 rounded-[26px] bg-[#1e1f22] text-center space-y-3">
            <p className="text-xs text-[#9aa0a6] max-w-md mx-auto leading-relaxed">
              {t.emptyCollections}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCollections.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-[24px] bg-[#1e1f22] hover:bg-[#232428] transition-colors flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#e3e3e3] truncate">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyItem(item.id, item.content)}
                        aria-label={t.copy}
                        className="p-1.5 rounded-full text-[#9aa0a6] hover:text-white hover:bg-[#2c2e33] cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCollection(item.id)}
                        aria-label={t.delete}
                        className="p-1.5 rounded-full text-[#9aa0a6] hover:text-rose-400 hover:bg-[#2c2e33] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#c4c7c5] line-clamp-4 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8e918f] pt-2 border-t border-[#2a2b30]">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <button
                    type="button"
                    onClick={() => onRunPromptInChat(item.content)}
                    className="text-[#8ab4f8] hover:underline cursor-pointer"
                  >
                    {language === 'id' ? 'Buka di percakapan' : 'Open in chat'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 4. DIJADWALKAN (Authentic Gemini Scheduled Actions View)
  // ============================================================================
  if (view === 'scheduled') {
    const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskTitle.trim() || !newTaskPrompt.trim()) return;
      onAddScheduledTask(newTaskTitle.trim(), newTaskPrompt.trim(), newTaskTime);
      setNewTaskTitle('');
      setNewTaskPrompt('');
    };

    return (
      <div className="max-w-[740px] mx-auto px-4 md:px-6 py-10 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-[#e3e3e3]">
            <Clock className="w-5 h-5 text-[#e3e3e3]" />
            <h1 className="text-2xl font-normal tracking-tight">{t.scheduled}</h1>
          </div>
          <p className="text-xs text-[#9aa0a6]">{t.scheduledDesc}</p>
        </div>

        <form
          onSubmit={handleAdd}
          className="p-4 rounded-[26px] bg-[#1e1f22] border border-[#2c2d32] space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={
                language === 'id' ? 'Judul tindakan terjadwal...' : 'Scheduled action title...'
              }
              className="sm:col-span-2 bg-[#16171a] text-xs text-[#e3e3e3] px-4 py-2.5 rounded-full border border-[#2c2d32] focus:outline-none focus:border-[#8ab4f8]"
            />
            <input
              type="text"
              value={newTaskTime}
              onChange={(e) => setNewTaskTime(e.target.value)}
              placeholder="Setiap hari · 08:00"
              className="bg-[#16171a] text-xs text-[#e3e3e3] px-4 py-2.5 rounded-full border border-[#2c2d32] focus:outline-none focus:border-[#8ab4f8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskPrompt}
              onChange={(e) => setNewTaskPrompt(e.target.value)}
              placeholder={
                language === 'id'
                  ? 'Minta Gemini menjalankan tugas berulang...'
                  : 'Ask Gemini to run a recurring task...'
              }
              className="flex-1 bg-[#16171a] text-xs text-[#e3e3e3] px-4 py-2.5 rounded-full border border-[#2c2d32] focus:outline-none focus:border-[#8ab4f8]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#0b0c10] text-xs font-medium shrink-0 cursor-pointer"
            >
              {language === 'id' ? 'Jadwalkan' : 'Schedule'}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {scheduledTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-[24px] bg-[#1e1f22] flex items-center justify-between gap-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-[#e3e3e3]">{task.title}</span>
                  <span className="text-[#8e918f]">·</span>
                  <span className="text-[#8ab4f8] tabular-nums">{task.scheduleLabel}</span>
                </div>
                <p className="text-xs text-[#9aa0a6] truncate">{task.prompt}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onRunPromptInChat(task.prompt)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#28292d] hover:bg-[#32343a] text-xs font-medium text-[#e3e3e3] cursor-pointer"
                >
                  <Play className="w-3 h-3 text-[#8ab4f8]" />
                  <span>{t.runNow}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleScheduledTask(task.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer ${
                    task.active
                      ? 'bg-[#1c352d] text-[#6dd58c]'
                      : 'bg-[#28292d] text-[#8e918f]'
                  }`}
                >
                  {task.active ? 'Aktif' : 'Jeda'}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteScheduledTask(task.id)}
                  aria-label={t.delete}
                  className="p-1.5 text-[#9aa0a6] hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 5. SESUAIKAN (Authentic Gemini Saved Info & Custom Instructions View)
  // ============================================================================
  if (view === 'customize') {
    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      onSaveCustomInstructions(draftInstructions, draftSearch, draftThinking);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    };

    const handleAddMemory = () => {
      if (!newMemoryText.trim()) return;
      const updated = [newMemoryText.trim(), ...savedMemories];
      setSavedMemories(updated);
      setDraftInstructions(updated.join('\n'));
      setNewMemoryText('');
      setAddingMemory(false);
    };

    return (
      <div className="max-w-[720px] mx-auto px-4 md:px-6 py-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 text-[#e3e3e3]">
              <GeminiCustomizeIcon className="w-5 h-5 text-[#e3e3e3]" />
              <h1 className="text-2xl font-normal tracking-tight">
                {language === 'id'
                  ? 'Info yang Anda minta agar diingat Gemini'
                  : 'Info you asked Gemini to save'}
              </h1>
            </div>
            <p className="text-xs text-[#9aa0a6] leading-relaxed">
              {t.customInstructionsDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAddingMemory(!addingMemory)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#0b0c10] text-xs font-medium shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'id' ? 'Tambahkan' : 'Add'}</span>
          </button>
        </div>

        {addingMemory && (
          <div className="p-4 rounded-[24px] bg-[#1e1f22] border border-[#2c2d32] flex items-center gap-2">
            <input
              type="text"
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMemory();
              }}
              placeholder={
                language === 'id'
                  ? 'Contoh: Saya seorang software engineer yang menggunakan TypeScript...'
                  : 'e.g., I am a software engineer using TypeScript...'
              }
              autoFocus
              className="flex-1 bg-transparent text-xs text-[#e3e3e3] px-2 py-1 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddMemory}
              className="px-4 py-1.5 rounded-full bg-[#28292d] hover:bg-[#35373d] text-xs text-[#e3e3e3] cursor-pointer"
            >
              Simpan
            </button>
          </div>
        )}

        <div className="space-y-2">
          {savedMemories.map((mem, idx) => (
            <div
              key={idx}
              className="px-5 py-3.5 rounded-[22px] bg-[#1e1f22] flex items-center justify-between gap-3"
            >
              <span className="text-xs text-[#e3e3e3] leading-relaxed">{mem}</span>
              <button
                type="button"
                onClick={() =>
                  setSavedMemories((prev) => prev.filter((_, i) => i !== idx))
                }
                aria-label="Hapus info"
                className="p-1.5 text-[#9aa0a6] hover:text-rose-400 rounded-full cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSave}
          className="p-5 rounded-[26px] bg-[#1e1f22] space-y-4"
        >
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#e3e3e3]">
              {language === 'id'
                ? 'Instruksi Sistem Lengkap'
                : 'Complete System Instructions'}
            </label>
            <textarea
              rows={4}
              value={draftInstructions}
              onChange={(e) => setDraftInstructions(e.target.value)}
              className="w-full bg-[#141517] text-xs text-[#e3e3e3] p-3.5 rounded-2xl border border-[#2c2d32] focus:outline-none focus:border-[#8ab4f8] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#141517] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-[#e3e3e3]">
                  Google Search Grounding
                </div>
                <div className="text-[11px] text-[#8e918f]">
                  {language === 'id'
                    ? 'Sertakan kutipan web terkini'
                    : 'Include live web citations'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={draftSearch}
                onChange={(e) => setDraftSearch(e.target.checked)}
                className="w-4 h-4 accent-[#8ab4f8] cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[#141517] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-[#e3e3e3]">
                  {language === 'id' ? 'Kedalaman Penalaran' : 'Thinking Depth'}
                </div>
                <div className="text-[11px] text-[#8e918f]">ThinkingConfig</div>
              </div>
              <select
                value={draftThinking}
                onChange={(e) => setDraftThinking(e.target.value as any)}
                className="bg-[#1e1f22] text-xs text-[#e3e3e3] px-3 py-1.5 rounded-full border border-[#2c2d32]"
              >
                <option value="off">Off</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            {savedToast && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Tersimpan' : 'Saved'}</span>
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#0b0c10] text-xs font-medium transition-colors cursor-pointer"
            >
              {t.saveChanges}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ============================================================================
  // 6. NOTEBOOK (Authentic Gemini / NotebookLM Workspace View)
  // ============================================================================
  const currentNotebook =
    notebooks.find((n) => n.id === activeNotebookId) || notebooks[0] || null;

  return (
    <div className="max-w-[860px] mx-auto px-4 md:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-[#e3e3e3]">
            <BookOpen className="w-5 h-5 text-[#e3e3e3]" />
            <h1 className="text-2xl font-normal tracking-tight">{t.notebookHeader}</h1>
          </div>
          <p className="text-xs text-[#9aa0a6]">{t.notebooksDesc}</p>
        </div>

        <button
          type="button"
          onClick={onCreateNotebook}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1e1f22] hover:bg-[#28292d] text-xs font-medium text-[#e3e3e3] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#8ab4f8]" />
          <span>{t.newNotebook}</span>
        </button>
      </div>

      {currentNotebook ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            {notebooks.map((nb) => (
              <div
                key={nb.id}
                onClick={() => onSelectNotebook(nb.id)}
                className={`group flex items-center justify-between px-4 py-2.5 rounded-full text-xs cursor-pointer transition-colors ${
                  nb.id === currentNotebook.id
                    ? 'bg-[#1e1f22] text-white font-medium'
                    : 'text-[#9aa0a6] hover:bg-[#1a1b1e] hover:text-white'
                }`}
              >
                <span className="truncate">{nb.title}</span>
                {notebooks.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotebook(nb.id);
                    }}
                    aria-label={t.delete}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8e918f] hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="md:col-span-3 p-6 rounded-[26px] bg-[#1e1f22] space-y-4">
            <input
              type="text"
              value={currentNotebook.title}
              onChange={(e) =>
                onUpdateNotebook(
                  currentNotebook.id,
                  e.target.value,
                  currentNotebook.content
                )
              }
              className="w-full bg-transparent text-lg font-medium text-[#e3e3e3] border-b border-[#2c2d32] pb-2.5 focus:outline-none focus:border-[#8ab4f8]"
            />
            <textarea
              rows={11}
              value={currentNotebook.content}
              onChange={(e) =>
                onUpdateNotebook(
                  currentNotebook.id,
                  currentNotebook.title,
                  e.target.value
                )
              }
              placeholder={
                language === 'id'
                  ? 'Tulis draf catatan, riset, atau dokumentasi proyek Anda di sini...'
                  : 'Write your research notes, drafts, or project documentation here...'
              }
              className="w-full bg-[#141517] text-xs text-[#e3e3e3] p-4 rounded-2xl border border-[#2c2d32] focus:outline-none focus:border-[#8ab4f8] leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  {
                    label: 'Ringkasan Eksekutif',
                    action: 'Buatkan ringkasan eksekutif dari catatan ini:',
                  },
                  {
                    label: 'Panduan Belajar & FAQ',
                    action: 'Buatkan daftar FAQ dan poin panduan belajar dari catatan ini:',
                  },
                ].map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      onRunPromptInChat(
                        `${chip.action}\n\n# ${currentNotebook.title}\n${currentNotebook.content}`
                      )
                    }
                    className="px-3.5 py-1.5 rounded-full bg-[#28292d] hover:bg-[#32343a] text-[11px] text-[#e3e3e3] cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  onRunPromptInChat(
                    `Analisis dan kembangkan catatan Notebook saya berikut ini:\n\n# ${currentNotebook.title}\n${currentNotebook.content}`
                  )
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#0b0c10] text-xs font-medium cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {language === 'id'
                    ? 'Bahas bersama Gemini'
                    : 'Discuss with Gemini'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
