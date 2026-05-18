import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "./firebase-config";
import { 
  Home, 
  Map, 
  Sparkles, 
  User, 
  ChevronRight, 
  Moon, 
  Star, 
  Compass,
  Loader2,
  RefreshCcw
} from "lucide-react";

// STREAMING_CHUNK: Tip tanımlamaları ve yardımcı fonksiyonlar...
type View = "home" | "chart" | "ritual" | "profile";

interface Ritual {
  id: number;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
}

// STREAMING_CHUNK: Yıldız Arka Planı Bileşeni...
const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2,
          speed: Math.random() * 0.05,
          opacity: Math.random()
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // STREAMING_CHUNK: Nebula efekti çizimi...
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      gradient.addColorStop(0, "rgba(124, 58, 237, 0.05)");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        ctx.fillStyle = `rgba(212, 175, 55, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.opacity += star.speed;
        if (star.opacity > 1 || star.opacity < 0) star.speed = -star.speed;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

// STREAMING_CHUNK: Ana Uygulama Bileşeni...
export default function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [formData, setFormData] = useState({ name: "", birthDate: "", birthTime: "" });
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");

  // STREAMING_CHUNK: Daktilo efekti mantığı...
  useEffect(() => {
    if (analysis) {
      let index = 0;
      setTypewriterText("");
      const interval = setInterval(() => {
        if (index < analysis.length) {
          setTypewriterText(prev => prev + analysis.charAt(index));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [analysis]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAnalysis("");
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        setAnalysis(data.error || "Beklenmedik bir hata oluştu.");
      } else {
        setAnalysis(data.analysis);
      }
      setCurrentView("chart");
    } catch (error) {
      console.error("Error:", error);
      setAnalysis("İletişim hatası: Yıldızlarla bağlantı kurulamadı.");
      setCurrentView("chart");
    } finally {
      setIsLoading(false);
    }
  };

  const rituals: Ritual[] = [
    { id: 1, title: "Yeni Ay Ritüeli", description: "Yeni başlangıçlar için 432Hz frekansı ile niyet çalışması.", duration: "15 dk", icon: <Moon className="w-6 h-6" /> },
    { id: 2, title: "Venüs Çakra Uyumu", description: "Kalp çakrasını dengeleyen sevgi meditasyonu.", duration: "20 dk", icon: <Sparkles className="w-6 h-6" /> },
    { id: 3, title: "Merkür Retrosu Korunması", description: "Zihinsel netlik ve koruma için aromaterapi destekli seans.", duration: "10 dk", icon: <Compass className="w-6 h-6" /> },
  ];

  // STREAMING_CHUNK: Arayüz render işlemleri...
  return (
    <div className="relative min-h-screen font-sans selection:bg-gold/30 bg-black overflow-hidden">
      <Starfield />
      
      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 bg-gradient-to-tr from-black via-mystic/5 to-black opacity-60 pointer-events-none"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-mystic/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-gold/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header Section */}
      <header className="relative z-20 pt-8 px-6 lg:px-10 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-gold rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-gold rotate-45 animate-pulse"></div>
          </div>
          <span className="text-2xl font-light tracking-[0.4em] uppercase text-gold">Astrovera</span>
        </div>
        <div className="text-[10px] tracking-widest font-medium hidden sm:block">
          <span className="text-mystic/60 uppercase">KOZMİK DURUM:</span> <span className="text-gold uppercase ml-1">RETRO BİTTİ</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 p-6 pb-32 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {currentView === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20 pt-10 min-h-[70vh]"
            >
              {/* Left Side: Interactive Input */}
              <div className="w-full lg:w-1/2 space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl lg:text-5xl font-extralight text-white leading-tight italic font-serif">
                    Gökyüzündeki en yakın <br/>
                    <span className="text-gold not-italic font-sans font-medium uppercase tracking-tighter">Dostuna Hoş Geldin.</span>
                  </h1>
                  <p className="text-white/40 text-sm max-w-md">Yıldızların kadim bilgeliğiyle hayat yolculuğuna rehberlik etmek için buradayım. Doğum verilerini gir ve kaderinin haritasını çıkaralım.</p>
                </div>

                <div className="glass rounded-[2.5rem] p-8 mystic-glow relative">
                  <div className="corner-border-tl"></div>
                  <div className="corner-border-br"></div>
                  
                  <form onSubmit={handleAnalyze} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-mystic uppercase tracking-widest font-bold ml-1">ADINIZ</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Örn: Selin"
                          className="bg-black/40 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-white placeholder-white/20"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-mystic uppercase tracking-widest font-bold ml-1">DOĞUM SAATİ</label>
                        <input 
                          required
                          type="time" 
                          className="bg-black/40 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-white"
                          value={formData.birthTime}
                          onChange={e => setFormData({ ...formData, birthTime: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[10px] text-mystic uppercase tracking-widest font-bold ml-1">DOĞUM TARİHİ</label>
                        <input 
                          required
                          type="date" 
                          className="bg-black/40 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-white"
                          value={formData.birthDate}
                          onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <button 
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-gold to-gold-dark text-black font-bold py-4 rounded-xl uppercase tracking-widest hover:brightness-110 transition-all transform active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analiz Başlatılıyor...
                        </>
                      ) : (
                        <>
                          Kozmik Analizi Başlat
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Side: Visual Ornament */}
              <div className="hidden lg:flex w-1/2 justify-center items-center">
                <div className="relative w-80 h-80">
                  <div className="absolute inset-0 border-2 border-dashed border-gold/20 rounded-full animate-spin-slow"></div>
                  <div className="absolute inset-8 border border-mystic/20 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Moon className="w-20 h-20 text-gold/40" />
                  </div>
                  <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full"></div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === "chart" && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row items-center justify-center gap-10 pt-8 max-w-5xl mx-auto"
            >
              <div className="w-full lg:w-1/2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif text-gold">Kozmik Analiz</h2>
                  <button 
                    onClick={() => setCurrentView("home")}
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <RefreshCcw className="w-5 h-5 text-gold" />
                  </button>
                </div>

                <div className="glass rounded-[3rem] p-10 min-h-[480px] relative overflow-hidden backdrop-blur-2xl">
                  {/* Glass Morphism Orb Background */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-b from-mystic/10 to-transparent blur-3xl pointer-events-none"></div>
                  
                  {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 py-20 relative z-10">
                      <div className="relative">
                        <div className="w-32 h-32 border-2 border-dashed border-gold/40 rounded-full animate-spin-slow"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Moon className="w-8 h-8 text-gold" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl text-white font-medium">Yıldızlar Bekliyor...</h3>
                        <p className="text-white/40 text-sm mt-2 italic font-serif italic">"Bilgelik, gökyüzünün sessizliğinde gizlidir."</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 relative z-10">
                      <div className="text-[10px] text-mystic uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-mystic rounded-full animate-ping"></span> AI Kozmik Analiz Hazırlandı
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <p className="text-white/80 leading-relaxed font-light font-serif text-lg">
                          {typewriterText}
                          {typewriterText.length < (analysis?.length || 0) && (
                            <span className="inline-block w-1 h-6 bg-gold ml-1 animate-pulse"></span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary / Stats (Visible on desktop) */}
              <div className="w-full lg:w-1/3 grid grid-cols-1 gap-4">
                <div className="glass rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gold/60 uppercase tracking-widest">Kozmik Profil</p>
                      <p className="text-sm font-medium">{formData.name}</p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-xs text-white/40 italic">Bu analiz yıldızların konumuna göre senin ruhsal yansımanı temsil eder.</p>
                  </div>
                </div>
                <div className="glass rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white/60">Paylaş</span>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          )}

          {currentView === "ritual" && (
            <motion.div
              key="ritual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 pt-8"
            >
              <h2 className="text-3xl font-serif gold-gradient mb-8">Günlük Ritüeller</h2>
              
              <div className="space-y-4">
                {rituals.map(ritual => (
                  <div key={ritual.id} className="glass rounded-3xl p-6 flex items-start gap-5 group hover:bg-white/10 transition-colors">
                    <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                      {ritual.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-medium text-white/90">{ritual.title}</h3>
                        <span className="text-[10px] text-gold border border-gold/30 px-2 py-0.5 rounded-full">{ritual.duration}</span>
                      </div>
                      <p className="text-sm text-white/50 font-light">{ritual.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass rounded-3xl p-8 text-center space-y-4">
                <p className="text-gold/80 italic font-serif text-lg">"Gökyüzü senin içinde, sen gökyüzünün içindesin."</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold/30"></div>)}
                </div>
              </div>
            </motion.div>
          )}

          {currentView === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8 pt-8"
            >
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-2 border-gold mx-auto mb-4 p-1">
                  <div className="w-full h-full rounded-full bg-mystic/20 flex items-center justify-center">
                    <User className="w-10 h-10 text-gold" />
                  </div>
                </div>
                <h3 className="text-xl font-medium">{formData.name || "Kozmik Yolcu"}</h3>
                <p className="text-white/40 text-xs tracking-widest mt-1 uppercase">Aura Seviyesi: Gümüş</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-4 text-center">
                  <p className="text-2xl font-serif text-gold">12</p>
                  <p className="text-[10px] uppercase text-white/40 tracking-tighter">Analiz Yapıldı</p>
                </div>
                <div className="glass rounded-2xl p-4 text-center">
                  <p className="text-2xl font-serif text-mystic">5</p>
                  <p className="text-[10px] uppercase text-white/40 tracking-tighter">Ritüel Tamamlandı</p>
                </div>
              </div>

              <ul className="space-y-3">
                {["Kozmik Bildirimler", "Cihaza Kaydet (PWA)", "Bize Ulaş", "Gizlilik Politikası"].map(item => (
                  <li key={item} className="glass rounded-2xl px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-sm font-light text-white/80">{item}</span>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </li>
                ))}
              </ul>

              <button className="w-full py-4 text-white/30 text-xs uppercase tracking-widest hover:text-white/60 transition-colors">
                Çıkış Yap
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* STREAMING_CHUNK: Sabit Alt Navigasyon... */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pointer-events-none">
        <div className="max-w-md mx-auto glass rounded-[2.5rem] p-3 flex justify-around items-center border-t border-white/10 pointer-events-auto shadow-2xl backdrop-blur-3xl bg-black">
          <NavBtn 
            active={currentView === "home"} 
            onClick={() => setCurrentView("home")} 
            icon={<Home className="w-5 h-5" />} 
            label="Evim" 
          />
          <NavBtn 
            active={currentView === "chart"} 
            onClick={() => setCurrentView("chart")} 
            icon={<Compass className="w-5 h-5" />} 
            label="Haritan" 
          />
          <NavBtn 
            active={currentView === "ritual"} 
            onClick={() => setCurrentView("ritual")} 
            icon={<Sparkles className="w-5 h-5" />} 
            label="Ritüel" 
          />
          <NavBtn 
            active={currentView === "profile"} 
            onClick={() => setCurrentView("profile")} 
            icon={<User className="w-5 h-5" />} 
            label="Profil" 
          />
        </div>
      </nav>
    </div>
  );
}

// STREAMING_CHUNK: Navigasyon Buton Bileşeni...
function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${active ? "text-gold" : "text-white/30 hover:text-white/60"}`}
    >
      {active && (
        <motion.div 
          layoutId="nav-bg"
          className="absolute inset-0 bg-gold/10 rounded-2xl"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className="relative z-10 transition-transform duration-300 translate-y-0 active:scale-90">
        {icon}
      </div>
      <span className={`relative z-10 text-[9px] uppercase tracking-widest mt-1 transition-opacity ${active ? "opacity-100" : "opacity-0 h-0"}`}>
        {label}
      </span>
    </button>
  );
}
