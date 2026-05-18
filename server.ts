import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Sunucu yapılandırması başlatılıyor...
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini AI entegrasyonu (Google AI SDK)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

  // API Routes
  app.get("/api/firebase-config", (req, res) => {
    let config = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID,
    };

    if (!config.apiKey || !config.projectId) {
      try {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        if (fs.existsSync(configPath)) {
          const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
          config = {
            apiKey: config.apiKey || fileConfig.apiKey,
            authDomain: config.authDomain || fileConfig.authDomain,
            projectId: config.projectId || fileConfig.projectId,
            storageBucket: config.storageBucket || fileConfig.storageBucket,
            messagingSenderId: config.messagingSenderId || fileConfig.messagingSenderId,
            appId: config.appId || fileConfig.appId,
            firestoreDatabaseId: config.firestoreDatabaseId || fileConfig.firestoreDatabaseId,
          };
        }
      } catch (e) {
        console.error("Config dosyası okuma hatası:", e);
      }
    }
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

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ analysis: response.text() });
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

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt
      });

      const chat = model.startChat({
        history: history ? history.map((h: any) => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.parts[0].text }]
        })).slice(-10) : [],
      });

      const result = await chat.sendMessage(question);
      const response = await result.response;
      res.json({ answer: response.text() });
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

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }]
      });
      
      const response = await result.response;
      const text = response.text();
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Ritual generation error:", error);
      res.status(500).json({ error: "Ritüel oluşturulamadı." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ASTROVERA running on http://localhost:${PORT}`);
  });
}

startServer();
