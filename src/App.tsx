import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Sparkles, UserCheck, Beer, Map, Lock } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from './firebase';

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

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'invitation');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().heroImageUrl) {
          setHeroImage(docSnap.data().heroImageUrl);
        }
      } catch (err) {
        console.error("Erro ao buscar imagem:", err);
      }
    };
    fetchSettings();
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
    } catch (err) {
      console.error('Error adding document: ', err);
      setError('Ocorreu um erro ao enviar seu RSVP. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#fcf9f0] text-[#1c1c17] min-h-screen pb-24 font-body selection:bg-[#c5a059] selection:text-white">
      {/* Decorative Top Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#f1eee5] to-transparent -z-10"></div>

      <main className="max-w-md mx-auto px-4 py-8 md:py-12">
        
        {/* Invitation Card (Hero) */}
        <section className="mb-16 flex justify-center relative group">
          {/* Subtle glow behind the card */}
          <div className="absolute inset-0 bg-[#c5a059]/20 blur-3xl rounded-full scale-90 opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>
          
          <div className="relative w-full aspect-[9/16] max-h-[800px] bg-stone-900 shadow-2xl overflow-hidden border-[10px] border-[#fcf9f0] ring-1 ring-[#d1c5b4] rounded-sm z-10">
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
            <div className="absolute top-10 left-0 w-full text-center z-20 px-4 flex flex-col items-center">
              <h2 className="serif-heading text-xl md:text-2xl text-[#e9c176] tracking-[0.25em] uppercase mb-5 drop-shadow-md">
                Save The Date
              </h2>
              
              {/* Date Symbol */}
              <div className="mb-3 w-24 h-24 rounded-full border-[1.5px] border-[#e9c176] bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center text-[#ffdea5] shadow-2xl">
                <span className="text-3xl serif-heading leading-none mb-1">01</span>
                <span className="w-10 h-[1px] bg-[#e9c176]/60"></span>
                <span className="text-lg tracking-[0.2em] leading-none mt-1 ml-1">05</span>
              </div>

              <h1 className="script-font text-6xl md:text-7xl text-[#ffdea5] drop-shadow-2xl leading-none mt-2">
                Aniver Renata
              </h1>
            </div>

            {/* Countdown Timer */}
            <div className="absolute top-[60%] left-0 w-full -translate-y-1/2 z-20 flex justify-center gap-2 md:gap-4 px-4">
              <div className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[70px] border border-[#e9c176]/30 shadow-xl">
                <span className="text-2xl md:text-3xl serif-heading text-[#ffdea5]">{timeLeft.days}</span>
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#e9c176] mt-1">Dias</span>
              </div>
              <div className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[70px] border border-[#e9c176]/30 shadow-xl">
                <span className="text-2xl md:text-3xl serif-heading text-[#ffdea5]">{timeLeft.hours}</span>
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#e9c176] mt-1">Horas</span>
              </div>
              <div className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[70px] border border-[#e9c176]/30 shadow-xl">
                <span className="text-2xl md:text-3xl serif-heading text-[#ffdea5]">{timeLeft.minutes}</span>
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#e9c176] mt-1">Min</span>
              </div>
              <div className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[70px] border border-[#e9c176]/30 shadow-xl">
                <span className="text-2xl md:text-3xl serif-heading text-[#ffdea5]">{timeLeft.seconds}</span>
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#e9c176] mt-1">Seg</span>
              </div>
            </div>

            {/* Bottom Info Box */}
            <div className="absolute bottom-6 left-5 right-5 bg-[#fcf9f0]/95 backdrop-blur-md p-6 border border-[#c5a059]/40 shadow-2xl z-20">
              <p className="font-body font-bold text-[#775a19] tracking-widest uppercase text-sm text-center mb-2">
                Vamos comemorar juntos!
              </p>
              <p className="font-body text-[#4e4639] text-[10px] uppercase tracking-widest text-center mb-6">
                Programe sua agenda e compareça
              </p>

              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4 justify-center">
                  <Beer className="text-[#775a19] w-7 h-7 stroke-[1.5]" />
                  <p className="font-bold text-[#1c1c17] text-sm md:text-base uppercase tracking-wider">
                    Data: 01/05/2026
                  </p>
                </div>
                <div className="flex items-center gap-4 justify-center">
                  <MapPin className="text-[#775a19] w-7 h-7 stroke-[1.5]" />
                  <p className="font-bold text-[#1c1c17] text-sm md:text-base uppercase tracking-wider">
                    Local: Sítio do Honório
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Details & RSVP */}
        <div className="space-y-12">
          {/* Location Details */}
          <section className="text-center px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f1eee5] text-[#775a19] mb-4 border border-[#d1c5b4]">
              <Map size={24} strokeWidth={1.5} />
            </div>
            <h3 className="serif-heading text-2xl text-[#775a19] mb-3">Como Chegar</h3>
            <p className="text-[#4e4639] text-sm leading-relaxed mb-6">
              O Sítio do Honório é um refúgio cercado pela natureza. Preparamos um mapa para facilitar sua chegada.
            </p>
            
            <div className="w-full rounded-xl overflow-hidden shadow-md border border-[#d1c5b4] bg-white">
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

          <hr className="border-[#d1c5b4]/50 w-24 mx-auto" />

          {/* RSVP Form Section */}
          <section className="bg-[#f6f3ea] p-8 rounded-2xl relative overflow-hidden border border-[#d1c5b4]/30 shadow-sm" id="rsvp">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Sparkles size={100} />
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <h3 className="serif-heading text-3xl text-[#775a19] mb-3">
                  Confirme sua Presença
                </h3>
                <p className="text-[#4e4639] text-sm">
                  Sua presença tornará este dia ainda mais especial.
                </p>
              </div>

              {isSubmitted ? (
                <div className="bg-white p-8 rounded-xl text-center border border-[#c5a059]/30 shadow-sm">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#bcf0ae]/30 text-[#3b6934] mb-4">
                    <UserCheck size={32} />
                  </div>
                  <h4 className="serif-heading text-2xl text-[#775a19] mb-2">
                    Obrigado por confirmar!
                  </h4>
                  <p className="text-[#4e4639] text-sm">
                    Sua resposta foi registrada com sucesso. Mal podemos esperar para celebrar com você.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[#775a19] font-bold text-[10px] uppercase tracking-widest ml-1">
                        Nome
                      </label>
                      <input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white border border-[#d1c5b4]/50 rounded-lg px-4 py-3.5 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent focus:outline-none transition-all placeholder:text-[#a39a8a] text-sm"
                        placeholder="Seu nome"
                        type="text"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#775a19] font-bold text-[10px] uppercase tracking-widest ml-1">
                        Sobrenome
                      </label>
                      <input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white border border-[#d1c5b4]/50 rounded-lg px-4 py-3.5 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent focus:outline-none transition-all placeholder:text-[#a39a8a] text-sm"
                        placeholder="Seu sobrenome"
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white p-5 rounded-lg border border-[#d1c5b4]/50 hover:border-[#c5a059]/50 transition-colors cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        name="attending"
                        checked={formData.attending}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-[#d1c5b4] text-[#3b6934] focus:ring-[#3b6934] cursor-pointer accent-[#3b6934]"
                        id="check-in"
                        type="checkbox"
                      />
                    </div>
                    <label
                      className="text-[#1c1c17] text-sm cursor-pointer flex-1 select-none font-medium"
                      htmlFor="check-in"
                    >
                      Sim, estarei presente para celebrar!
                    </label>
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                      {error}
                    </div>
                  )}

                  <button
                    disabled={isSubmitting}
                    className="w-full bg-[#775a19] hover:bg-[#5d4201] text-white font-bold py-4 rounded-lg uppercase tracking-[0.2em] text-xs shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                    type="submit"
                  >
                    {isSubmitting ? 'Enviando...' : 'Confirmar RSVP'}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#fcf9f0]/80 backdrop-blur-xl border-t border-[#d1c5b4]/30">
        <a
          className="flex flex-col items-center justify-center text-[#775a19] scale-105 transition-all duration-200"
          href="#"
        >
          <Sparkles size={22} className="mb-1" strokeWidth={1.5} />
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
            Convite
          </span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-[#7f7667] hover:text-[#775a19] transition-all duration-200"
          href="#local"
        >
          <MapPin size={22} className="mb-1" strokeWidth={1.5} />
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
            Local
          </span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-[#7f7667] hover:text-[#775a19] transition-all duration-200"
          href="#rsvp"
        >
          <UserCheck size={22} className="mb-1" strokeWidth={1.5} />
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
            RSVP
          </span>
        </a>
        <Link
          className="flex flex-col items-center justify-center text-[#7f7667] hover:text-[#775a19] transition-all duration-200"
          to="/admin"
        >
          <Lock size={22} className="mb-1" strokeWidth={1.5} />
          <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
            Admin
          </span>
        </Link>
      </nav>
    </div>
  );
}
