import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Sunucu yapılandırması başlatılıyor...
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini AI entegrasyonu (Modern SDK)
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const { name, birthDate, birthTime } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sen ASTROVERA platformunun kadim bilgi uzmanı ve profesyonel astrologusun. 
        Kullanıcı Bilgileri: Ad: ${name}, Doğum Tarihi: ${birthDate}, Doğum Saati: ${birthTime}.
        Lütfen bu bilgilere göre mistik, lüks ve samimi bir dille kısa ama etkileyici bir burç ve gökyüzü analizi yap.
        Yanıtın büyüleyici ve ilham verici olsun. Yanıtı Türkçe ver.`,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      if (error?.status === 429 || error?.message?.includes("429")) {
        return res.status(429).json({ error: "Günlük kozmik iletişim kotanız doldu. Lütfen yarın tekrar deneyin." });
      }
      res.status(500).json({ error: "Kozmik bir bağlantı sorunu oluştu. Lütfen tekrar deneyin." });
    }
  });

  app.post("/api/ask-oracle", async (req, res) => {
    try {
      const { question, chartData, name } = req.body;
      
      const systemPrompt = `Sen ASTROVERA'nın kadim "Kahin"isin. Astroloji, yıldızname ve kadim göksel sırlar konusunda uzmansın. 
      Kullanıcının adı: ${name}. 
      Kullanıcının natal harita yerleşimleri: ${JSON.stringify(chartData)}.
      
      Görevin:
      1. Kullanıcının sorusuna kendi haritasındaki yerleşimleri (gezegen burçları ve evleri) kullanarak astrolojik ve yıldızname temelli bir yanıt ver.
      2. Dilin mistik, bilge, samimi ve "düşünen/üretken" bir yapay zeka tonunda olsun.
      3. Basit cevaplar verme; gökyüzünün derinliklerinden gelen ilham verici, düşündürücü yorumlar yap.
      4. Yanıtı Türkçe ver.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: question,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      res.json({ answer: response.text });
    } catch (error: any) {
      console.error("Oracle Error:", error);
      res.status(500).json({ error: "Kahin şu an derin bir meditasyonda. Lütfen biraz sonra tekrar sor." });
    }
  });

  // STREAMING_CHUNK: Vite middleware kurulumu...
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

  // STREAMING_CHUNK: Sunucu 3000 portunda dinleniyor...
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ASTROVERA running on http://localhost:${PORT}`);
  });
}

startServer();
