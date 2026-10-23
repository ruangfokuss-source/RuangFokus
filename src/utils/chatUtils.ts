export type Language = 'id' | 'en';

export type SidebarView =
  | 'chat'
  | 'collections'
  | 'images'
  | 'scheduled'
  | 'customize'
  | 'videos'
  | 'notebooks';

export type ModelTier = 'flash-lite' | 'flash' | 'pro' | 'argon' | 'fast';

export interface AttachmentItem {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thought?: string;
  model?: string;
  status?: 'sending' | 'streaming' | 'complete' | 'error';
  error?: string;
  savedToCollection?: boolean;
  attachments?: AttachmentItem[];
  generatedImages?: string[];
  groundingMetadata?: {
    webSearchQueries?: string[];
    sources?: { title: string; url: string }[];
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: ModelTier;
  mode: 'chat' | 'task';
  thinkingLevel: 'off' | 'low' | 'medium' | 'high';
  searchGrounding: boolean;
  messages: ChatMessage[];
  pinned?: boolean;
}

export interface CollectionItem {
  id: string;
  title: string;
  content: string;
  sourceSessionId: string;
  createdAt: number;
  category: 'code' | 'note' | 'prompt';
}

export interface NotebookItem {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface ScheduledTaskItem {
  id: string;
  title: string;
  prompt: string;
  scheduleLabel: string;
  active: boolean;
  lastRunAt?: number;
}

export const UI_STRINGS = {
  id: {
    newChat: 'Percakapan baru',
    collections: 'Koleksi',
    images: 'Gambar',
    scheduled: 'Dijadwalkan',
    customize: 'Sesuaikan',
    videos: 'Video',
    notebookHeader: 'Notebook',
    newNotebook: 'Notebook baru',
    allChats: 'Semua',
    searchPlaceholder: 'Cari percakapan...',
    greeting: 'Sebaiknya kita mulai dari mana?',
    taskGreeting: 'Tugas apa yang ingin kita selesaikan hari ini?',
    askGemini: 'Minta Gemini',
    askGeminiTask: 'Jelaskan langkah tugas atau otomatisasi...',
    modeChat: 'Percakapan',
    modeTask: 'Tugas',
    downloadApp: 'Download percakapan',
    shareLink: 'Salin tautan',
    thinking: 'Gemini sedang berpikir...',
    thoughtProcess: 'Proses berpikir',
    copy: 'Salin',
    copied: 'Disalin',
    listen: 'Dengarkan',
    stopAudio: 'Hentikan suara',
    saveToCollection: 'Simpan ke Koleksi',
    savedToCollection: 'Tersimpan di Koleksi',
    regenerate: 'Buat ulang respons',
    retry: 'Coba lagi',
    attachFile: 'Tambahkan berkas atau gambar',
    voiceInput: 'Gunakan mikrofon',
    stopVoice: 'Hentikan rekaman',
    transcribing: 'Mentranskripsi suara...',
    send: 'Kirim pesan',
    stopGenerating: 'Hentikan respons',
    customInstructionsTitle: 'Sesuaikan Gemini',
    customInstructionsDesc: 'Berikan instruksi khusus atau konteks peran yang akan selalu diingat oleh Gemini di setiap percakapan.',
    saveChanges: 'Simpan perubahan',
    collectionsDesc: 'Respons, potongan kode, dan catatan penting yang Anda simpan dari percakapan.',
    imagesDesc: 'Galeri gambar yang Anda unggah dan analisis bersama Gemini serta ide prompt visual.',
    videosDesc: 'Studio skrip video, storyboard, dan prompt animasi MP4 / 3D.',
    scheduledDesc: 'Jadwalkan prompt otomatis atau jalankan rutinitas tugas harian Anda.',
    notebooksDesc: 'Ruang kerja dokumen panjang dan catatan riset terstruktur bersama Gemini.',
    runNow: 'Jalankan di Chat',
    delete: 'Hapus',
    emptyCollections: 'Belum ada item yang disimpan. Klik menu opsi (...) pada respons Gemini untuk menyimpan ke Koleksi.',
    disclaimer: 'Gemini adalah AI dan dapat membuat kesalahan.',
  },
  en: {
    newChat: 'New chat',
    collections: 'Collections',
    images: 'Images',
    scheduled: 'Scheduled',
    customize: 'Customize',
    videos: 'Videos',
    notebookHeader: 'Notebook',
    newNotebook: 'New notebook',
    allChats: 'All',
    searchPlaceholder: 'Search conversations...',
    greeting: 'Where should we start?',
    taskGreeting: 'What task should we accomplish today?',
    askGemini: 'Ask Gemini',
    askGeminiTask: 'Describe a multi-step task or workflow...',
    modeChat: 'Chat',
    modeTask: 'Tasks',
    downloadApp: 'Export chat',
    shareLink: 'Copy link',
    thinking: 'Gemini is thinking...',
    thoughtProcess: 'Thought process',
    copy: 'Copy',
    copied: 'Copied',
    listen: 'Listen',
    stopAudio: 'Stop audio',
    saveToCollection: 'Save to Collections',
    savedToCollection: 'Saved in Collections',
    regenerate: 'Regenerate response',
    retry: 'Retry',
    attachFile: 'Upload files or images',
    voiceInput: 'Use microphone',
    stopVoice: 'Stop recording',
    transcribing: 'Transcribing audio...',
    send: 'Send message',
    stopGenerating: 'Stop generating',
    customInstructionsTitle: 'Customize Gemini',
    customInstructionsDesc: 'Provide custom instructions or background context that Gemini will follow across all conversations.',
    saveChanges: 'Save changes',
    collectionsDesc: 'Saved responses, code snippets, and key notes bookmarked from your conversations.',
    imagesDesc: 'Gallery of uploaded images analyzed with Gemini and visual generation prompts.',
    videosDesc: 'Video script studio, storyboards, and 3D MP4 animation prompt templates.',
    scheduledDesc: 'Manage scheduled routine prompts and run automated workflows on demand.',
    notebooksDesc: 'Long-form scratchpad documents and structured research notebooks.',
    runNow: 'Run in Chat',
    delete: 'Delete',
    emptyCollections: 'No saved items yet. Click the bookmark icon on any Gemini response to save it here.',
    disclaimer: 'Gemini may display inaccurate info, including about people, so double-check its responses.',
  },
};

export const MODEL_OPTIONS: {
  id: ModelTier;
  label: string;
  menuTitle: string;
  subtitle: { id: string; en: string };
  badge: string;
}[] = [
  {
    id: 'flash-lite',
    label: 'Flash-Lite',
    menuTitle: '3.5 Flash-Lite',
    subtitle: {
      id: 'Jawaban tercepat',
      en: 'Fastest responses',
    },
    badge: '3.5 Flash-Lite',
  },
  {
    id: 'flash',
    label: 'Flash',
    menuTitle: '3.8 Flash',
    subtitle: {
      id: 'Bantuan serbaguna',
      en: 'All-around help',
    },
    badge: '3.8 Flash',
  },
  {
    id: 'pro',
    label: 'Pro',
    menuTitle: '3.1 Pro',
    subtitle: {
      id: 'Penalaran yang canggih',
      en: 'Advanced reasoning',
    },
    badge: '3.1 Pro',
  },
  {
    id: 'argon',
    label: 'Argon',
    menuTitle: '4 Argon',
    subtitle: {
      id: 'Tugas kompleks',
      en: 'Complex tasks',
    },
    badge: '4 Argon',
  },
];

export const INITIAL_DEMO_SESSIONS: ChatSession[] = [
  {
    id: 'session-initial-empty',
    title: 'Percakapan baru',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model: 'flash',
    mode: 'chat',
    thinkingLevel: 'low',
    searchGrounding: false,
    messages: [],
  },
  {
    id: 'session-hist-coding',
    title: 'Jasa Pembuatan dan Perbaikan Koding',
    createdAt: Date.now() - 3600 * 1000 * 0.5,
    updatedAt: Date.now() - 3600 * 1000 * 0.5,
    model: 'pro',
    mode: 'chat',
    thinkingLevel: 'medium',
    searchGrounding: false,
    messages: [
      {
        id: 'm-cod-1',
        role: 'user',
        content: 'Bantu perbaiki dan maksimalkan kode chatbot AI saya agar bebas bug dan memiliki UI/UX setara standar industri.',
        timestamp: Date.now() - 3600 * 1000 * 0.5,
      },
      {
        id: 'm-cod-2',
        role: 'assistant',
        model: 'pro',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 0.5 + 3000,
        content:
          'Siap! Saya dapat membantu mengevaluasi arsitektur kode Anda, memperbaiki bug *streaming SSE* maupun *state management*, serta menyempurnakan antarmuka pengguna (UI/UX) agar responsif dan modern.',
      },
    ],
  },
  {
    id: 'session-hist-0',
    title: 'Sapaan Awal',
    createdAt: Date.now() - 3600 * 1000 * 1,
    updatedAt: Date.now() - 3600 * 1000 * 1,
    model: 'flash',
    mode: 'chat',
    thinkingLevel: 'low',
    searchGrounding: false,
    messages: [
      {
        id: 'm-001',
        role: 'user',
        content: 'halo AI',
        timestamp: Date.now() - 3600 * 1000 * 1,
      },
      {
        id: 'm-002',
        role: 'assistant',
        model: 'flash',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 1 + 2000,
        content: 'Halo! Ada yang bisa kubantu hari ini?',
      },
    ],
  },
  {
    id: 'session-hist-1',
    title: 'Pertanyaan Konteks Lokasi Indonesia',
    createdAt: Date.now() - 3600 * 1000 * 2,
    updatedAt: Date.now() - 3600 * 1000 * 2,
    model: 'pro',
    mode: 'chat',
    thinkingLevel: 'low',
    searchGrounding: true,
    messages: [
      {
        id: 'm-101',
        role: 'user',
        content: 'Bagaimana pembagian zona waktu dan karakteristik geografis utama kepulauan Indonesia untuk sistem logistik nasional?',
        timestamp: Date.now() - 3600 * 1000 * 2,
      },
      {
        id: 'm-102',
        role: 'assistant',
        model: 'pro',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 2 + 5000,
        content: `Indonesia memiliki karakteristik geografis kepulauan yang membentang sepanjang **5.120 km** dari barat ke timur dan terbagi menjadi **3 zona waktu utama**:

### 1. Pembagian Zona Waktu
* **WIB (UTC+7)**: Sumatera, Jawa, Kalimantan Barat, dan Kalimantan Tengah.
* **WITA (UTC+8)**: Kalimantan Selatan, Kalimantan Timur, Kalimantan Utara, Sulawesi, Bali, NTB, dan NTT.
* **WIT (UTC+9)**: Maluku, Maluku Utara, dan seluruh wilayah Papua.

### 2. Implikasi Arsitektur Logistik & Sistem Informasi
Dalam perancangan perangkat lunak logistik nasional, seluruh timestamp wajib disimpan dalam **UTC (ISO-8601)** pada basis data dan dikonversi di sisi klien sesuai koordinat titik distribusi.`,
      },
    ],
  },
  {
    id: 'session-hist-higgs',
    title: 'Overview of Higgsfield AI',
    createdAt: Date.now() - 3600 * 1000 * 5,
    updatedAt: Date.now() - 3600 * 1000 * 5,
    model: 'pro',
    mode: 'chat',
    thinkingLevel: 'low',
    searchGrounding: false,
    messages: [
      {
        id: 'm-h1',
        role: 'user',
        content: 'Jelaskan apa itu Higgsfield AI dan keunggulan utamanya dalam pembuatan video AI.',
        timestamp: Date.now() - 3600 * 1000 * 5,
      },
      {
        id: 'm-h2',
        role: 'assistant',
        model: 'pro',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 5 + 3000,
        content:
          '**Higgsfield AI** adalah platform generatif video berbasis AI yang berfokus pada kontrol gerakan kamera sinematik, konsistensi karakter, dan pembuatan konten visual berkecepatan tinggi untuk kreator maupun sutradara digital.',
      },
    ],
  },
  {
    id: 'session-hist-trans',
    title: 'Penolakan Penerjemahan Teks AI',
    createdAt: Date.now() - 3600 * 1000 * 8,
    updatedAt: Date.now() - 3600 * 1000 * 8,
    model: 'flash',
    mode: 'chat',
    thinkingLevel: 'low',
    searchGrounding: false,
    messages: [
      {
        id: 'm-tr1',
        role: 'user',
        content: 'Mengapa terkadang model AI menolak menerjemahkan potongan teks tertentu?',
        timestamp: Date.now() - 3600 * 1000 * 8,
      },
      {
        id: 'm-tr2',
        role: 'assistant',
        model: 'flash',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 8 + 2500,
        content:
          'Hal tersebut biasanya terjadi apabila teks sumber memicu filter keamanan otomatis atau apabila instruksi sistem belum membedakan antara permintaan terjemahan literal dan eksekusi perintah (prompt injection). Tambahkan konteks eksplisit bahwa teks tersebut adalah kutipan yang hanya perlu diterjemahkan.',
      },
    ],
  },
  {
    id: 'session-hist-vid',
    title: 'Video Siap Ditonton',
    createdAt: Date.now() - 3600 * 1000 * 10,
    updatedAt: Date.now() - 3600 * 1000 * 10,
    model: 'pro',
    mode: 'chat',
    thinkingLevel: 'low',
    searchGrounding: false,
    messages: [
      {
        id: 'm-v1',
        role: 'user',
        content: 'Buatkan konsep video pembuka acara dokumenter berdurasi 15 detik.',
        timestamp: Date.now() - 3600 * 1000 * 10,
      },
      {
        id: 'm-v2',
        role: 'assistant',
        model: 'pro',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 10 + 3000,
        content:
          'Video pembuka 15 detik dapat dibuka dengan *aerial drone shot* saat matahari terbit (0–5 dtk), dilanjutkan *close-up* aktivitas utama dalam *slow motion* (5–10 dtk), dan diakhiri dengan tipografi judul minimalis di tengah layar (10–15 dtk).',
      },
    ],
  },
  {
    id: 'session-hist-2',
    title: 'Panduan Membuat Animasi 3D MP4',
    createdAt: Date.now() - 3600 * 1000 * 12,
    updatedAt: Date.now() - 3600 * 1000 * 12,
    model: 'pro',
    mode: 'chat',
    thinkingLevel: 'medium',
    searchGrounding: false,
    messages: [
      {
        id: 'm-201',
        role: 'user',
        content: 'Berikan langkah dan struktur prompt terbaik untuk membuat animasi 3D sinematik berformat MP4.',
        timestamp: Date.now() - 3600 * 1000 * 12,
      },
      {
        id: 'm-202',
        role: 'assistant',
        model: 'pro',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 12 + 4000,
        content: `Untuk menghasilkan video animasi 3D MP4 yang konsisten dan sinematik, gunakan formula **Subjek + Gerakan Kamera + Pencahayaan + Material Render**:

\`\`\`text
Cinematic 3D animation of a miniature futuristic library floating in warm golden hour clouds, smooth orbital camera pan at 24fps, soft volumetric lighting, Octane render style, shallow depth of field, 16:9 aspect ratio.
\`\`\`

### Tips Ekspor MP4 Berkualitas Tinggi
1. **Frame Rate**: Gunakan \`24fps\` untuk nuansa film atau \`60fps\` untuk gerakan UI interaktif.
2. **Codec**: Gunakan **H.264 (High Profile)** dengan bitrate \`15–25 Mbps\` untuk resolusi 1080p.`,
      },
    ],
  },
  {
    id: 'session-hist-takwa',
    title: 'Virtual Attire Change to Baju Takwa',
    createdAt: Date.now() - 3600 * 1000 * 18,
    updatedAt: Date.now() - 3600 * 1000 * 18,
    model: 'flash',
    mode: 'chat',
    thinkingLevel: 'low',
    searchGrounding: false,
    messages: [
      {
        id: 'm-tk1',
        role: 'user',
        content: 'Bagaimana prompt untuk mengganti pakaian pada foto potret menjadi baju takwa putih rapi dengan pencahayaan studio?',
        timestamp: Date.now() - 3600 * 1000 * 18,
      },
      {
        id: 'm-tk2',
        role: 'assistant',
        model: 'flash',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 18 + 3000,
        content:
          'Gunakan prompt: *"Pertahankan wajah, ekspresi, dan pencahayaan asli subjek; ubah pakaian menjadi baju koko/takwa putih bersih berkerah tegak dengan tekstur kain katun halus, pencahayaan studio lembut."*',
      },
    ],
  },
  {
    id: 'session-hist-lomba',
    title: 'Strategi Menang Lomba Foto Pesantren',
    createdAt: Date.now() - 3600 * 1000 * 22,
    updatedAt: Date.now() - 3600 * 1000 * 22,
    model: 'pro',
    mode: 'chat',
    thinkingLevel: 'low',
    searchGrounding: false,
    messages: [
      {
        id: 'm-lb1',
        role: 'user',
        content: 'Apa saja kunci utama agar karya fotografi human interest di lingkungan pesantren menonjol di mata juri?',
        timestamp: Date.now() - 3600 * 1000 * 22,
      },
      {
        id: 'm-lb2',
        role: 'assistant',
        model: 'pro',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 22 + 3000,
        content:
          'Fokus pada **emosi autentik (candid)**, pencahayaan alami *golden hour* (selepas Subuh atau menjelang Maghrib), serta komposisi berlapis (*foreground-midground-background*) yang bercerita tanpa perlu rekayasa pose.',
      },
    ],
  },
  {
    id: 'session-hist-3',
    title: 'SOP Divisi Fotografi Pesantren',
    createdAt: Date.now() - 3600 * 1000 * 28,
    updatedAt: Date.now() - 3600 * 1000 * 28,
    model: 'flash',
    mode: 'task',
    thinkingLevel: 'low',
    searchGrounding: false,
    messages: [
      {
        id: 'm-301',
        role: 'user',
        content: 'Susunkan kerangka SOP standar untuk tim dokumentasi dan fotografi kegiatan harian serta acara besar pesantren.',
        timestamp: Date.now() - 3600 * 1000 * 28,
      },
      {
        id: 'm-302',
        role: 'assistant',
        model: 'flash',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 28 + 3500,
        content: `Berikut adalah **Standar Operasional Prosedur (SOP) Divisi Dokumentasi & Fotografi**:

### 1. Pra-Kegiatan (Persiapan)
* **Checklist Peralatan H-1**: Baterai penuh (minimal 2 cadangan), kartu memori kosong yang telah di-backup, dan lensa bersih.
* **Briefing Shot-List**: Tentukan momen wajib (pembukaan, sambutan tokoh, interaksi santri, foto bersama).

### 2. Saat Kegiatan (Eksekusi)
* Patuhi adab dan zona pengambilan gambar tanpa mengganggu kekhusyukan acara.
* Gunakan mode *Silent Shutter* saat sesi pengajian atau doa berlangsung.

### 3. Pasca-Kegiatan (Arsip & Publikasi)
* Struktur penamaan folder: \`YYYY-MM-DD_NamaKegiatan_Fotografer\`.
* Seleksi dan kurasi maksimal **2 jam** setelah acara untuk rilis media sosial.`,
      },
    ],
  },
  {
    id: 'session-hist-santri',
    title: 'Kata-Kata Santri untuk Orang Tua',
    createdAt: Date.now() - 3600 * 1000 * 36,
    updatedAt: Date.now() - 3600 * 1000 * 36,
    model: 'flash',
    mode: 'chat',
    thinkingLevel: 'low',
    searchGrounding: false,
    messages: [
      {
        id: 'm-sn1',
        role: 'user',
        content: 'Buatkan ungkapan menyentuh hati dari seorang santri untuk kedua orang tuanya di rumah.',
        timestamp: Date.now() - 3600 * 1000 * 36,
      },
      {
        id: 'm-sn2',
        role: 'assistant',
        model: 'flash',
        status: 'complete',
        timestamp: Date.now() - 3600 * 1000 * 36 + 2000,
        content:
          '*"Ayah, Ibu, setiap lembar kitab yang kubaca di pondok ini adalah doa yang kurangkai agar kelak menjadi cahaya dan kebanggaan untuk kalian berdua."*',
      },
    ],
  },
];

export type SSEEventPayload =
  | { type: 'chunk'; text: string; activeModel?: string }
  | { type: 'thought'; text: string }
  | { type: 'image'; dataUrl: string }
  | { type: 'grounding'; metadata: ChatMessage['groundingMetadata'] }
  | { type: 'error'; error: string }
  | { type: 'done' };

/**
 * Safely parses a single SSE line ('data: {...}') without swallowing server error payloads.
 */
export function parseSSELine(line: string): SSEEventPayload | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const jsonStr = trimmed.slice(5).trim();
  if (!jsonStr) return null;

  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
      return null;
    }
    return parsed as SSEEventPayload;
  } catch {
    return null;
  }
}

/**
 * Cleanly trims and compacts chat history if character length exceeds max.
 */
export function compactHistory(
  messages: ChatMessage[],
  maxChars = 180000,
  keepRecent = 6
): ChatMessage[] {
  const validMessages = messages.filter(
    (m) => m.status !== 'error' && (m.content?.trim() || (m.attachments && m.attachments.length > 0))
  );
  const totalChars = validMessages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
  if (totalChars <= maxChars || validMessages.length <= keepRecent + 1) {
    return validMessages;
  }

  const keepCount = Math.min(keepRecent, validMessages.length);
  const recent = validMessages.slice(-keepCount);
  const older = validMessages.slice(0, -keepCount);

  const condensedOverview = older
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content.slice(0, 160)}${m.content.length > 160 ? '...' : ''}`)
    .join('\n');

  const summaryMessage: ChatMessage = {
    id: 'summary-' + Date.now(),
    role: 'user',
    content: `[Ringkasan konteks percakapan sebelumnya]:\n${condensedOverview}`,
    timestamp: Date.now() - 1000,
  };

  return [summaryMessage, ...recent];
}

/**
 * Groups sessions by relative dates (Today, Previous 7 Days, Older)
 */
export function groupSessionsByDate(sessions: ChatSession[]): Record<string, ChatSession[]> {
  const groups: Record<string, ChatSession[]> = {
    Today: [],
    'Previous 7 Days': [],
    Older: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  for (const session of sessions) {
    if (session.updatedAt >= todayStart) {
      groups.Today.push(session);
    } else if (session.updatedAt >= weekStart) {
      groups['Previous 7 Days'].push(session);
    } else {
      groups.Older.push(session);
    }
  }

  return groups;
}

/**
 * Extracts auto title from user's first prompt
 */
export function generateSessionTitle(prompt: string, fallback = 'Percakapan baru'): string {
  const cleaned = (prompt || '').trim().replace(/^[\W_]+/, '');
  if (!cleaned) return fallback;
  const firstLine = cleaned.split('\n')[0];
  if (firstLine.length <= 42) return firstLine;
  return firstLine.slice(0, 42).trim() + '...';
}

/**
 * Universal clipboard copy helper with legacy fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch {
    return false;
  }
}
