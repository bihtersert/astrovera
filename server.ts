import express from "express";
import path from "path";
import fs from "fs";
let createViteServer: any = null;
if (process.env.NODE_ENV !== "production") {
    import("vite").then(m => { createViteServer = m.createServer; });
}
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

dotenv.config();

const _filename = (typeof import.meta !== 'undefined' && import.meta.url) ? fileURLToPath(import.meta.url) : '';
const _dirname = _filename ? path.dirname(_filename) : (typeof __dirname !== 'undefined' ? __dirname : process.cwd());

export async function createServer() {
  const app = express();
  app.use(express.json());

  // Gemini AI entegrasyonu (Google GenAI SDK - Modern Approach)
  const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  if (!process.env.GEMINI_API_KEY) {
    console.warn("UYARI: GEMINI_API_KEY bulunamadı. AI özellikleri çalışmayabilir.");
  }

// API Routes
  app.get("/api/firebase-config", (req, res) => {
    // Try environment variables first
    let config = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID,
      measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID,
      appUrl: process.env.APP_URL || process.env.VITE_APP_URL,
    };

    // Fallback to local file if essential fields are missing
    if (!config.apiKey || !config.projectId) {
      try {
        const rootPath = process.cwd();
        const paths = [
          path.join(rootPath, "firebase-applet-config.json"),
          path.join(rootPath, "api", "firebase-applet-config.json"),
          path.join(_dirname, "firebase-applet-config.json"),
          path.join(_dirname, "..", "firebase-applet-config.json"),
          path.join(_dirname, "..", "..", "firebase-applet-config.json")
        ];
        
        for (const p of paths) {
          if (fs.existsSync(p)) {
            console.log(`Found config file at: ${p}`);
            const fileConfig = JSON.parse(fs.readFileSync(p, "utf-8"));
            config = {
              apiKey: config.apiKey || fileConfig.apiKey,
              authDomain: config.authDomain || fileConfig.authDomain,
              projectId: config.projectId || fileConfig.projectId,
              storageBucket: config.storageBucket || fileConfig.storageBucket,
              messagingSenderId: config.messagingSenderId || fileConfig.messagingSenderId,
              appId: config.appId || fileConfig.appId,
              firestoreDatabaseId: config.firestoreDatabaseId || fileConfig.firestoreDatabaseId,
              measurementId: config.measurementId || fileConfig.measurementId,
            };
            break;
          }
        }
      } catch (e) {
        console.error("Config fallback error:", e);
      }
    }

    // Security: Log found config (masked) for server logs
    console.log(`Firebase Config Requested. Found keys: ${Object.keys(config).filter(k => !!config[k]).join(', ')}`);
    
    res.json(config);
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { name, birthDate, birthTime, chartData } = req.body;
      
      let prompt = `Sen ASTROVERA platformunun kadim bilgi uzmanı ve profesyonel astrologusun. 
        Kullanıcı Bilgileri: Ad: ${name}, Doğum Tarihi: ${birthDate}, Doğum Saati: ${birthTime}.
        
        Lütfen bu bilgilere ve aşağıdaki natal harita verilerine dayanarak; mistik, lüks, samimi ve derinlemesine yol gösterici bir dille kişiye özel bir "Kozmik Yol Haritası" analizi yap.`;

      if (chartData) {
        prompt += `
        
        Kullanıcının natal harita verileri:
        ${JSON.stringify(chartData)}
        
        Lütfen bu verileri en ince ayrıntısına kadar (Gezegenlerin Burçları, Evleri ve özellikle Gezegenler arasındaki Açıları) harmanlayarak şu başlıklar altında yorumla:
        
        1. **Ruhun Kristal Yansıması (Karakter & Öz-Benlik):** Güneş, Ay ve Yükselen yerleşimlerine göre kişinin karakteristik yapısı ve iç dünyası.
        2. **Kadim Evlerin Fısıltısı (Yaşam Alanları):** Gezegenlerin ev yerleşimlerine göre kariyer, başarı, finansal bolluk ve kişisel gelişim potansiyelleri. Kariyer için 10. ve 6. ev, bolluk için 2. ve 8. ev vurgularına özel parantez aç.
        3. **Kalbin ve Ruhun Aynası (Aşk & İlişkiler):** Venüs, Mars ve 7. ev yerleşimlerine göre duygusal ihtiyaçlar ve ilişki dinamikleri.
        4. **Gök Kubbenin Sırrı (Açılar & Etkileşimler):** Kavuşum, Kare, Üçgen ve Karşıt açıların (aspects) kişi üzerindeki zorlayıcı veya destekleyici etkilerini mistik bir dille açıklayarak çözüm/rehberlik sun.
        5. **Kozmik Potansiyelin Zirvesi:** Bu haritanın vaat ettiği en yüksek kader ve yaşam amacı.
        
        Son olarak, yanıtın en sonuna şu etiketi ekle: [FISILTI]Buraya kullanıcıya özel, günlük/haftalık motivasyon verecek tek cümlelik, mistik bir fısıltı yaz.[/FISILTI]
        
        Diline bir dost samimiyeti, bir bilgenin mistisizmi ve bir sarayın lüks estetiği hakim olsun. Okuyucuyu büyüle ve ona yol göster.`;
      }

      prompt += ` Yanıtı Türkçe ver.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });
      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMsg = error?.message || String(error);
      if (error?.status === 429 || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        return res.status(429).json({ error: "Günlük kozmik iletişim kotanız doldu. Lütfen yarın tekrar deneyin veya bir süre sonra tekrar sorunuz." });
      }
      res.status(500).json({ error: "Kozmik bir bağlantı sorunu oluştu. Lütfen tekrar deneyin." });
    }
  });

  app.post("/api/ask-oracle", async (req, res) => {
    try {
      const { question, chartData, name, history, mood } = req.body;
      const moodText = mood ? `Kullanıcı şu an kendisini ${mood} hissediyor. Yanıtını bu ruh haline duyarlı, empatik ve destekleyici bir tonda ayarla.` : "";

      const systemPrompt = `Sen ASTROVERA'nın kadim "Kahin"isin. Astroloji, yıldızname ve kadim göksel sırlar konusunda evrensel bir bilgeliğe sahipsin. 
      Kullanıcının adı: ${name}. 
      Kullanıcının natal harita yerleşimleri ve açıları: ${JSON.stringify(chartData)}.
      ${moodText}
      Görevin kullanıcının sorusuna derin, mistik ve astrolojik temelli bir yanıt vermektir.`;

      const chat = ai.chats.create({
        model: GEMINI_MODEL,
        config: { systemInstruction: systemPrompt },
        history: history ? history.map((h: any) => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.parts[0].text }]
        })).slice(-10) : [],
      });

      const response = await chat.sendMessage(question);
      res.json({ answer: response.text });
    } catch (error: any) {
      console.error("Oracle Error:", error);
      const errorMsg = error?.message || String(error);
      if (error?.status === 429 || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        return res.status(429).json({ error: "Günlük kozmik iletişim kotanız doldu. Lütfen yarın tekrar deneyin." });
      }
      res.status(500).json({ error: "Kahin şu an derin bir meditasyonda." });
    }
  });

  app.post("/api/generate-ritual", async (req, res) => {
    try {
      const { intent, mood, chartData } = req.body;
      
      const systemPrompt = `Sen ASTROVERA Ritüel Tasarımcısısın. Kullanıcının niyetine ve göksel haritasına göre ona özel, yaratıcı, mistik ve uygulanabilir bir ritüel tasarla.
      Yanıtını şu JSON formatında ver:
      {
        "title": "Ritüel Başlığı",
        "elements": ["Gerekli araç 1", "Gerekli araç 2"],
        "timing": "Ritüel için en iyi zaman açıklaması",
        "steps": ["Adım 1", "Adım 2", "Adım 3"],
        "seal": "Mühürleyici son cümle"
      }`;

      const userPrompt = `Niyet: ${intent}. Ruh Hali: ${mood || 'Belirtilmedi'}. Harita Verileri: ${JSON.stringify(chartData)}.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        }
      });
      
      const text = response.text;
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Ritual generation error:", error);
      const errorMsg = error?.message || String(error);
      if (error?.status === 503 || errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE")) {
        return res.status(503).json({ error: "Gökler şu an çok yoğun. Lütfen birkaç dakika sonra tekrar deneyin." });
      }
      res.status(500).json({ error: "Ritüel oluşturulamadı." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    if (createViteServer) {
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        // Fallback if import is still pending
        const { createServer: cvs } = await import("vite");
        const vite = await cvs({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

// Port and direct execution handling
const PORT = Number(process.env.PORT) || 3000;

// In Vercel, we don't call listen, but in regular Node (Cloud Run), we do.
// We can check if we are in a Vercel/Serverless environment or just run it.
if (process.env.VERCEL === undefined) {
  createServer().then(app => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ASTROVERA running on http://localhost:${PORT}`);
    });
  });
}

export default createServer;
