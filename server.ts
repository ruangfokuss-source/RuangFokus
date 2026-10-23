import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Map UI model aliases ('flash-lite', 'flash', 'pro', 'argon', 'fast') or explicit IDs to ordered fallback chains
export function getModelFallbackChain(requestedModel: string): string[] {
  const normalized = (requestedModel || '').toLowerCase().trim();
  if (
    normalized === 'pro' ||
    normalized === 'argon' ||
    normalized === 'gemini-4-argon'
  ) {
    return ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'];
  }
  if (
    normalized === 'fast' ||
    normalized === 'flash-lite' ||
    normalized === 'gemini-3.1-flash-lite'
  ) {
    return ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  }
  return ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    timestamp: Date.now(),
  });
});

// Models endpoint
app.get('/api/models', (_req, res) => {
  res.json({
    defaultModel: 'pro',
    models: [
      {
        id: 'pro',
        apiModel: 'gemini-3.8-flash',
        name: 'Pro',
        fullName: 'Gemini Pro (Deep Reasoning)',
        description: 'Penalaran mendalam untuk analisis, koding, dan tugas kompleks',
      },
      {
        id: 'flash',
        apiModel: 'gemini-3.8-flash',
        name: 'Flash',
        fullName: 'Gemini 3.8 Flash',
        description: 'Cepat dan cerdas untuk percakapan sehari-hari & pencarian web',
      },
      {
        id: 'fast',
        apiModel: 'gemini-3.1-flash-lite',
        name: 'Fast',
        fullName: 'Gemini 3.1 Flash Lite',
        description: 'Respons instan dengan latensi sangat rendah',
      },
    ],
  });
});

// Chat Streaming Endpoint (SSE) with automatic multi-model fallback
app.post('/api/chat/stream', async (req, res) => {
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(500).json({
      error: 'GEMINI_API_KEY belum dikonfigurasi di Settings > Secrets.',
    });
  }

  const {
    messages = [],
    model = 'pro',
    systemInstruction,
    thinkingLevel = 'low',
    searchGrounding = false,
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array tidak boleh kosong.' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendSSE = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Normalize client messages into Gemini contents format
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') continue;

      const parts: any[] = [];

      if (Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.dataUrl && typeof att.dataUrl === 'string' && att.dataUrl.startsWith('data:')) {
            const matches = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              const mimeType = matches[1];
              const base64Data = matches[2];

              if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
                parts.push({
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                });
              } else {
                try {
                  const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
                  parts.push({
                    text: `\n[Lampiran Berkas: ${att.name || 'document'}]\n\`\`\`\n${decoded.slice(0, 45000)}\n\`\`\`\n`,
                  });
                } catch {
                  parts.push({
                    text: `[Lampiran Berkas: ${att.name || 'document'}]`,
                  });
                }
              }
            }
          }
        }
      }

      if (msg.content && String(msg.content).trim().length > 0) {
        parts.push({ text: String(msg.content) });
      } else if (parts.length > 0) {
        parts.push({ text: 'Analisis lampiran ini.' });
      }

      if (parts.length > 0) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts,
        });
      }
    }

    if (contents.length === 0) {
      sendSSE({ type: 'error', error: 'Tidak ada pesan valid untuk diproses.' });
      res.end();
      return;
    }

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
    const lastUserText = String(lastUserMessage?.content || '').toLowerCase();
    const isImageStudioPrompt =
      lastUserText.includes('ubah potret') ||
      lastUserText.includes('ubah subjek') ||
      lastUserText.includes('ubah orang') ||
      lastUserText.includes('ubah foto') ||
      lastUserText.includes('buat gambar') ||
      lastUserText.includes('buatkan gambar') ||
      lastUserText.includes('lukisan cat minyak') ||
      lastUserText.includes('impresionis') ||
      lastUserText.includes('sitkom') ||
      lastUserText.includes('nano banana') ||
      lastUserText.includes('[rasio aspek:') ||
      lastUserText.includes('patung marmer') ||
      lastUserText.includes('zen futuristik') ||
      lastUserText.includes('bunga musim semi') ||
      lastUserText.includes('boneka rajut') ||
      lastUserText.includes('peri hutan') ||
      lastUserText.includes('pencicip anggur') ||
      lastUserText.includes('arcade era 90') ||
      lastUserText.includes('hollywood');

    const fallbackChain = getModelFallbackChain(model);
    let lastError: any = null;
    let streamSucceeded = false;

    for (let i = 0; i < fallbackChain.length; i++) {
      const candidateModel = fallbackChain[i];
      try {
        const effectiveSystemInstruction = isImageStudioPrompt
          ? `${
              systemInstruction || ''
            }\n[PENTING - MODE STUDIO GAMBAR GEMINI (NANO BANANA) AKTIF]: Sistem kanvas visual Gemini telah merender dan menampilkan gambar hasil transformasi/kreasi secara langsung di atas pesan ini untuk pengguna. JANGAN PERNAH mengatakan bahwa Anda adalah model teks atau tidak bisa membuat/mengedit gambar. Sampaikan secara langsung dan hangat bahwa gambar telah berhasil dibuat (misalnya: "Berikut adalah hasil transformasi potret Anda..." atau "Berikut adalah gambar yang Anda minta..."), lalu jelaskan secara singkat (2-3 kalimat padat) detail artistik, sapuan kuas, pencahayaan, dan suasana visual yang diterapkan pada subjek di dalam foto tersebut.`
          : systemInstruction ||
            'Anda adalah Google Gemini, asisten AI yang cerdas, ramah, akurat, dan terstruktur. Gunakan format Markdown yang bersih dan mudah dibaca.';

        const config: any = {
          systemInstruction: effectiveSystemInstruction,
          temperature: 0.7,
        };

        // Enable Google Search Grounding if requested and supported
        if (searchGrounding && !isImageStudioPrompt && candidateModel === 'gemini-3.8-flash') {
          config.tools = [{ googleSearch: {} }];
        }

        // Configure Thinking Level safely for Gemini 3.8 Flash (keep low for image studio so response starts immediately)
        if (candidateModel === 'gemini-3.8-flash' && thinkingLevel && thinkingLevel !== 'off') {
          config.thinkingConfig = {
            thinkingLevel: isImageStudioPrompt
              ? ThinkingLevel.LOW
              : thinkingLevel === 'high'
              ? ThinkingLevel.HIGH
              : thinkingLevel === 'medium'
              ? ThinkingLevel.MEDIUM
              : ThinkingLevel.LOW,
          };
        }

        const responseStream = await ai.models.generateContentStream({
          model: candidateModel,
          contents,
          config,
        });

        let emittedTextCount = 0;
        let accumulatedThoughts = '';
        let sentGrounding = false;

        for await (const chunk of responseStream) {
          const candidate = chunk.candidates?.[0];

          if (candidate?.groundingMetadata && !sentGrounding) {
            const gm = candidate.groundingMetadata;
            const sources = (gm.groundingChunks || [])
              .map((c: any) => c.web)
              .filter(Boolean)
              .map((w: any) => ({
                title: w.title || w.uri,
                url: w.uri,
              }));

            if (sources.length > 0 || (gm.webSearchQueries && gm.webSearchQueries.length > 0)) {
              sendSSE({
                type: 'grounding',
                metadata: {
                  webSearchQueries: gm.webSearchQueries || [],
                  sources,
                },
              });
              sentGrounding = true;
            }
          }

          let chunkTextEmitted = false;
          if (candidate?.content?.parts && candidate.content.parts.length > 0) {
            for (const part of candidate.content.parts) {
              if ((part as any).inlineData?.data && (part as any).inlineData?.mimeType?.startsWith('image/')) {
                sendSSE({
                  type: 'image',
                  dataUrl: `data:${(part as any).inlineData.mimeType};base64,${(part as any).inlineData.data}`,
                });
              } else if ((part as any).thought && part.text) {
                accumulatedThoughts += part.text;
                sendSSE({ type: 'thought', text: part.text });
              } else if (part.text) {
                emittedTextCount += part.text.length;
                chunkTextEmitted = true;
                sendSSE({ type: 'chunk', text: part.text, activeModel: candidateModel });
              }
            }
          }

          // Fallback to chunk.text getter if parts didn't emit standard text
          if (!chunkTextEmitted && chunk.text) {
            emittedTextCount += chunk.text.length;
            sendSSE({ type: 'chunk', text: chunk.text, activeModel: candidateModel });
          }
        }

        // If the model only emitted thoughts and 0 regular text, use the thoughts or retry next model
        if (emittedTextCount === 0 && accumulatedThoughts.trim().length > 0) {
          sendSSE({ type: 'chunk', text: accumulatedThoughts.trim(), activeModel: candidateModel });
          emittedTextCount = accumulatedThoughts.trim().length;
        }

        if (emittedTextCount > 0) {
          streamSucceeded = true;
          break;
        } else {
          throw new Error(`Model ${candidateModel} returned an empty stream.`);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Stream] Model ${candidateModel} failed (${err?.message || err}). Trying next fallback...`);
        // Brief pause before trying next fallback model
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    if (!streamSucceeded) {
      const errMsg =
        lastError?.message ||
        'Layanan AI sedang mengalami lonjakan trafik tinggi. Silakan coba kirim ulang pesan Anda.';
      sendSSE({ type: 'error', error: errMsg });
    } else {
      sendSSE({ type: 'done' });
    }
    res.end();
  } catch (error: any) {
    console.error('Fatal error during chat stream:', error);
    sendSSE({
      type: 'error',
      error: error?.message || 'Terjadi kesalahan saat memproses respons dari Gemini.',
    });
    res.end();
  }
});

// Text-to-Speech (TTS) endpoint
app.post('/api/tts', async (req, res) => {
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' });
  }

  const { text, voice = 'Kore' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Teks diperlukan untuk pembuatan suara.' });
  }

  try {
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[#*_~>]/g, '')
      .slice(0, 1200)
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'Tidak ada teks yang dapat dibacakan.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Gagal menghasilkan audio dari Gemini TTS.' });
    }

    res.json({
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ error: err?.message || 'Gagal menghasilkan suara.' });
  }
});

// Audio Transcription endpoint
app.post('/api/transcribe', async (req, res) => {
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' });
  }

  const { audioData, mimeType = 'audio/webm' } = req.body;
  if (!audioData) {
    return res.status(400).json({ error: 'audioData diperlukan.' });
  }

  try {
    const cleanBase64 = audioData.replace(/^data:[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: 'Transkripsikan ucapan audio ini secara akurat. Hanya kembalikan teks hasil transkripsi tanpa komentar tambahan.',
          },
        ],
      },
    });

    res.json({ text: (response.text || '').trim() });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: err?.message || 'Gagal mentranskripsi audio.' });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Google Gemini Clone Workspace running at http://localhost:${PORT}`);
  });
}

// Only start listening if not imported by a test runner
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
