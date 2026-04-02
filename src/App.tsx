import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Sparkles, UserCheck, Beer, Map, Lock, Clock } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from './firebase';
import confetti from 'canvas-confetti';

export default function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    attending: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1516483638261-f40af5ee22dd?q=80&w=2127&auto=format&fit=crop');
  const [coolerImage, setCoolerImage] = useState('https://storage.googleapis.com/aistudio-user-uploads-us-east1/660416/20250402T121758957Z/cooler.png');

  const calculateTimeLeft = () => {
    const targetDate = new Date('2026-05-01T12:00:00');
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isEventStarted, setIsEventStarted] = useState(false);
  const [isParabensTime, setIsParabensTime] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const targetDate = new Date('2026-05-01T12:00:00');
      const parabensStart = new Date('2026-05-01T18:00:00');
      const parabensEnd = new Date('2026-05-01T18:01:00');
      const now = new Date();

      if (now >= targetDate) {
        setIsEventStarted(true);
      } else {
        setIsEventStarted(false);
        setTimeLeft(calculateTimeLeft());
      }

      if (now >= parabensStart && now < parabensEnd) {
        setIsParabensTime(true);
      } else {
        setIsParabensTime(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'invitation');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.heroImageUrl) {
            setHeroImage(data.heroImageUrl);
          }
          if (data.coolerImageUrl) {
            setCoolerImage(data.coolerImageUrl);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar configurações:", err);
      }
    };
    fetchSettings();

    // Initial fireworks effect
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'rsvps'), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        attending: formData.attending,
        createdAt: serverTimestamp(),
      });
      setIsSubmitted(true);
      
      // Side confetti cannons on success
      const end = Date.now() + 2 * 1000;
      const colors = ['#c5a059', '#ffffff', '#e9c176'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

    } catch (err) {
      console.error('Error adding document: ', err);
      setError('Ocorreu um erro ao enviar seu RSVP. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen pb-24 font-body selection:bg-[#c5a059] selection:text-white">
      {/* Decorative Top Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-neutral-900 to-transparent -z-10"></div>

      <main className="max-w-md mx-auto px-4 py-8 md:py-12">
        
        {/* Invitation Card (Hero) */}
        <section className="mb-16 flex justify-center relative group">
          {/* Subtle glow behind the card */}
          <div className="absolute inset-0 bg-[#c5a059]/20 blur-3xl rounded-full scale-90 opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>
          
          <div className="relative w-full min-h-[650px] h-[85vh] max-h-[850px] bg-stone-900 shadow-2xl overflow-hidden border-[10px] border-[#fcf9f0] ring-1 ring-[#d1c5b4] rounded-sm z-10">
            {/* Outer Gold Border */}
            <div className="absolute inset-1 border-[1.5px] border-[#c5a059] z-20 pointer-events-none"></div>
            {/* Inner Gold Border */}
            <div className="absolute inset-2 border border-[#c5a059]/50 z-20 pointer-events-none"></div>

            {/* Background Image */}
            <img
              alt="Renata celebrando"
              className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
              src={heroImage}
              referrerPolicy="no-referrer"
            />

            {/* Top Gradient for Text Readability */}
            <div className="absolute top-0 left-0 w-full h-3/5 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10"></div>

            {/* Top Text */}
            <div className="absolute top-4 left-0 w-full text-center z-20 px-4 flex flex-col items-center">
              <h2 className="serif-heading text-lg md:text-xl text-[#e9c176] tracking-[0.25em] uppercase mb-3 drop-shadow-md">
                Save The Date
              </h2>
              
              {/* Date Symbol */}
              <div className="mb-2 w-20 h-20 rounded-full border-[1.5px] border-[#e9c176] bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center text-[#ffdea5] shadow-2xl">
                <span className="text-2xl serif-heading leading-none mb-1">01</span>
                <span className="w-8 h-[1px] bg-[#e9c176]/60"></span>
                <span className="text-sm tracking-[0.2em] leading-none mt-1 ml-1">05</span>
              </div>

              <h1 className="script-font text-5xl md:text-6xl drop-shadow-2xl leading-none mt-1 animate-shine-text">
                Aniver Renata
              </h1>
            </div>

            {/* Countdown Timer or Parabens Message */}
            {isParabensTime ? (
              <div className="absolute bottom-[35%] md:bottom-[40%] left-0 w-full z-20 flex justify-center px-4">
                <div className="bg-black/80 backdrop-blur-md border border-[#c5a059] p-6 rounded-xl shadow-2xl text-center animate-pulse">
                  <h2 className="serif-heading text-xl md:text-2xl text-[#e9c176] mb-2">Vamos cantar parabéns para você agora!</h2>
                  <Sparkles className="inline-block text-[#ffdea5]" size={32} />
                </div>
              </div>
            ) : !isEventStarted ? (
              <div className="absolute bottom-[35%] md:bottom-[40%] left-0 w-full z-20 flex justify-center gap-2 md:gap-4 px-4">
                <div className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[70px] border border-[#e9c176]/30 shadow-xl animate-shine-border">
                  <span className="text-2xl md:text-3xl serif-heading text-[#ffdea5]">{timeLeft.days}</span>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#e9c176] mt-1">Dias</span>
                </div>
                <div className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[70px] border border-[#e9c176]/30 shadow-xl animate-shine-border" style={{ animationDelay: '1.2s' }}>
                  <span className="text-2xl md:text-3xl serif-heading text-[#ffdea5]">{timeLeft.hours}</span>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#e9c176] mt-1">Horas</span>
                </div>
                <div className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[70px] border border-[#e9c176]/30 shadow-xl animate-shine-border" style={{ animationDelay: '1.4s' }}>
                  <span className="text-2xl md:text-3xl serif-heading text-[#ffdea5]">{timeLeft.minutes}</span>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#e9c176] mt-1">Min</span>
                </div>
                <div className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[70px] border border-[#e9c176]/30 shadow-xl animate-shine-border" style={{ animationDelay: '1.6s' }}>
                  <span className="text-2xl md:text-3xl serif-heading text-[#ffdea5]">{timeLeft.seconds}</span>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#e9c176] mt-1">Seg</span>
                </div>
              </div>
            ) : null}

            {/* Bottom Info Box */}
            <div className="absolute bottom-3 left-4 right-4 bg-black/80 backdrop-blur-md p-4 border border-[#c5a059]/40 shadow-2xl z-20">
              <p className="font-body font-bold text-[#e9c176] tracking-widest uppercase text-xs text-center mb-1">
                Vamos comemorar juntos!
              </p>
              <p className="font-body text-neutral-300 text-[9px] uppercase tracking-widest text-center mb-3">
                Programe sua agenda e compareça
              </p>

              <div className="flex flex-col gap-2 max-w-[200px] mx-auto">
                <div className="flex items-center gap-3 justify-start">
                  <Calendar className="text-[#e9c176] w-5 h-5 stroke-[1.5] shrink-0" />
                  <p className="font-bold text-white text-xs md:text-sm uppercase tracking-wider">
                    Data: 01/05/2026
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-start">
                  <Clock className="text-[#e9c176] w-5 h-5 stroke-[1.5] shrink-0" />
                  <p className="font-bold text-white text-xs md:text-sm uppercase tracking-wider">
                    Horário: 16:00hs
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-start">
                  <MapPin className="text-[#e9c176] w-5 h-5 stroke-[1.5] shrink-0" />
                  <p className="font-bold text-white text-xs md:text-sm uppercase tracking-wider">
                    Local: Sítio do Honório
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-start mt-1">
                  <img 
                    src={coolerImage} 
                    alt="Cooler" 
                    className="w-5 h-5 object-contain -rotate-12 drop-shadow-lg shrink-0" 
                    referrerPolicy="no-referrer" 
                  />
                  <p className="font-bold text-[#e9c176] text-xs md:text-sm uppercase tracking-wider">
                    Open Cooler
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Details & RSVP */}
        <div className="space-y-12">
          {/* RSVP Form Section */}
          <section className="bg-neutral-900 p-8 rounded-2xl relative overflow-hidden border border-[#c5a059]/30 shadow-sm" id="rsvp">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Sparkles size={100} />
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <h3 className="serif-heading text-3xl text-[#e9c176] mb-3">
                  Confirme sua Presença
                </h3>
                <p className="text-neutral-400 text-sm">
                  Sua presença tornará este dia ainda mais especial.
                </p>
              </div>

              {isSubmitted ? (
                <div className="bg-neutral-950 p-8 rounded-xl text-center border border-[#c5a059]/30 shadow-sm">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#bcf0ae]/10 text-[#5c9e52] mb-4">
                    <UserCheck size={32} />
                  </div>
                  <h4 className="serif-heading text-2xl text-[#e9c176] mb-2">
                    Obrigado por confirmar!
                  </h4>
                  <p className="text-neutral-400 text-sm">
                    Sua resposta foi registrada com sucesso. Mal podemos esperar para celebrar com você.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[#e9c176] font-bold text-[10px] uppercase tracking-widest ml-1">
                        Nome
                      </label>
                      <input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-neutral-950 border border-[#c5a059]/30 rounded-lg px-4 py-3.5 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent focus:outline-none transition-all placeholder:text-neutral-600 text-white text-sm"
                        placeholder="Seu nome"
                        type="text"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#e9c176] font-bold text-[10px] uppercase tracking-widest ml-1">
                        Sobrenome
                      </label>
                      <input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-neutral-950 border border-[#c5a059]/30 rounded-lg px-4 py-3.5 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent focus:outline-none transition-all placeholder:text-neutral-600 text-white text-sm"
                        placeholder="Seu sobrenome"
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-neutral-950 p-5 rounded-lg border border-[#c5a059]/30 hover:border-[#c5a059] transition-colors cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        name="attending"
                        checked={formData.attending}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-neutral-700 bg-neutral-900 text-[#c5a059] focus:ring-[#c5a059] cursor-pointer accent-[#c5a059]"
                        id="check-in"
                        type="checkbox"
                      />
                    </div>
                    <label
                      className="text-white text-sm cursor-pointer flex-1 select-none font-medium"
                      htmlFor="check-in"
                    >
                      Sim, estarei presente para celebrar!
                    </label>
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm text-center bg-red-950/50 p-3 rounded-lg border border-red-900/50">
                      {error}
                    </div>
                  )}

                  <button
                    disabled={isSubmitting}
                    className="w-full bg-[#c5a059] hover:bg-[#b38f4a] text-black font-bold py-4 rounded-lg uppercase tracking-[0.2em] text-xs shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                    type="submit"
                  >
                    {isSubmitting ? 'Enviando...' : 'Confirmar RSVP'}
                  </button>
                </form>
              )}
            </div>
          </section>

          <hr className="border-[#c5a059]/30 w-24 mx-auto" />

          {/* Location Details */}
          <section className="text-center px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 text-[#e9c176] mb-4 border border-[#c5a059]/30">
              <Map size={24} strokeWidth={1.5} />
            </div>
            <h3 className="serif-heading text-2xl text-[#e9c176] mb-3">Como Chegar</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              O Sítio do Honório é um refúgio cercado pela natureza. Preparamos um mapa para facilitar sua chegada.
            </p>
            
            <div className="w-full rounded-xl overflow-hidden shadow-md border border-[#c5a059]/30 bg-neutral-900">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!4v1775083858759!6m8!1m7!1sSscnbQfssEJAPI11bczYJw!2m2!1d-21.69676751136075!2d-43.0789804187288!3f0.2798825395250226!4f-0.18426403253498336!5f0.7820865974627469" 
                width="100%" 
                height="350" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Local do Evento"
              ></iframe>
            </div>
          </section>
        </div>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 grid grid-cols-3 items-start px-2 pb-6 pt-3 bg-[#c5a059] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border-t border-[#e9c176]/50">
        <a
          className="flex flex-col items-center justify-start text-white hover:text-black transition-all duration-200 px-1 text-center"
          href="#"
        >
          <Sparkles size={22} className="mb-1 shrink-0" strokeWidth={1.5} />
          <span className="font-sans text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-tight break-words w-full">
            Convite
          </span>
        </a>
        <a
          className="flex flex-col items-center justify-start text-white hover:text-black transition-all duration-200 px-1 text-center"
          href="#rsvp"
        >
          <UserCheck size={22} className="mb-1 shrink-0" strokeWidth={1.5} />
          <span className="font-sans text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-tight break-words w-full">
            RSVP
          </span>
        </a>
        <Link
          className="flex flex-col items-center justify-start text-white hover:text-black transition-all duration-200 px-1 text-center"
          to="/admin"
        >
          <Lock size={22} className="mb-1 shrink-0" strokeWidth={1.5} />
          <span className="font-sans text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-tight break-words w-full">
            Admin
          </span>
        </Link>
      </nav>
    </div>
  );
}
