import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, getDoc, addDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { LogIn, LogOut, Users, CheckCircle, XCircle, Image as ImageIcon, Save, UserPlus, Trash2 } from 'lucide-react';

interface RSVP {
  id: string;
  firstName: string;
  lastName: string;
  attending: boolean;
  createdAt: any;
}

interface AdminEmail {
  id: string;
  email: string;
}

export default function Admin() {
  // Simple Auth State
  const [loggedInEmail, setLoggedInEmail] = useState(localStorage.getItem('adminEmail') || '');
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data State
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
  const [error, setError] = useState('');

  // Settings State
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [imageSaveMessage, setImageSaveMessage] = useState('');

  // Admin Emails State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // New RSVP State
  const [newRsvpFirstName, setNewRsvpFirstName] = useState('');
  const [newRsvpLastName, setNewRsvpLastName] = useState('');
  const [newRsvpAttending, setNewRsvpAttending] = useState(true);
  const [isAddingRsvp, setIsAddingRsvp] = useState(false);

  useEffect(() => {
    if (!loggedInEmail) return;

    // Fetch RSVPs
    const qRsvps = query(collection(db, 'rsvps'), orderBy('createdAt', 'desc'));
    const unsubscribeRsvps = onSnapshot(
      qRsvps,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as RSVP[];
        setRsvps(data);
        setError('');
      },
      (err) => {
        console.error(err);
        setError('Ocorreu um erro ao carregar os dados.');
      }
    );

    // Fetch Admin Emails
    const qAdmins = query(collection(db, 'adminEmails'), orderBy('email', 'asc'));
    const unsubscribeAdmins = onSnapshot(
      qAdmins,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AdminEmail[];
        setAdminEmails(data);
      },
      (err) => {
        console.error(err);
      }
    );

    // Fetch current image URL
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'invitation');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().heroImageUrl) {
          setHeroImageUrl(docSnap.data().heroImageUrl);
        }
      } catch (err) {
        console.error("Erro ao buscar configurações:", err);
      }
    };
    fetchSettings();

    return () => {
      unsubscribeRsvps();
      unsubscribeAdmins();
    };
  }, [loggedInEmail]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    const email = loginInput.toLowerCase().trim();

    // Master Admin
    if (email === 'adrianorosa1@hotmail.com') {
      setLoggedInEmail(email);
      localStorage.setItem('adminEmail', email);
      setIsLoggingIn(false);
      return;
    }

    // Check if email is in adminEmails collection
    try {
      const q = query(collection(db, 'adminEmails'), where('email', '==', email));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setLoggedInEmail(email);
        localStorage.setItem('adminEmail', email);
      } else {
        setLoginError('E-mail não autorizado para acessar o painel.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Erro ao verificar e-mail. Tente novamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setLoggedInEmail('');
    localStorage.removeItem('adminEmail');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setHeroImageUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingImage(true);
    setImageSaveMessage('');
    try {
      await setDoc(doc(db, 'settings', 'invitation'), { heroImageUrl }, { merge: true });
      setImageSaveMessage('Imagem atualizada com sucesso!');
      setTimeout(() => setImageSaveMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setImageSaveMessage('Erro ao salvar imagem.');
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setIsAddingAdmin(true);
    try {
      await addDoc(collection(db, 'adminEmails'), {
        email: newAdminEmail.toLowerCase().trim()
      });
      setNewAdminEmail('');
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar e-mail.');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdminEmail = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este e-mail da lista de administradores?')) return;
    try {
      await deleteDoc(doc(db, 'adminEmails', id));
    } catch (err) {
      console.error(err);
      alert('Erro ao remover e-mail.');
    }
  };

  const handleAddRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRsvpFirstName.trim() || !newRsvpLastName.trim()) return;
    
    setIsAddingRsvp(true);
    try {
      await addDoc(collection(db, 'rsvps'), {
        firstName: newRsvpFirstName,
        lastName: newRsvpLastName,
        attending: newRsvpAttending,
        createdAt: new Date(),
      });
      setNewRsvpFirstName('');
      setNewRsvpLastName('');
      setNewRsvpAttending(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar convidado.');
    } finally {
      setIsAddingRsvp(false);
    }
  };

  const handleDeleteRsvp = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este convidado?')) return;
    try {
      await deleteDoc(doc(db, 'rsvps', id));
    } catch (err) {
      console.error(err);
      alert('Erro ao remover convidado.');
    }
  };

  if (!loggedInEmail) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-body">
        <div className="bg-neutral-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#c5a059]/30">
          <h1 className="serif-heading text-3xl text-[#e9c176] mb-2">Painel ADM</h1>
          <p className="text-neutral-400 mb-6">
            Digite seu e-mail para acessar o painel.
          </p>
          
          {loginError && (
            <div className="bg-red-950/50 border border-red-900/50 text-red-400 px-4 py-3 rounded mb-4 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Seu E-mail"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#c5a059]/30 focus:outline-none focus:ring-2 focus:ring-[#c5a059] bg-neutral-950 text-white placeholder:text-neutral-600"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex items-center justify-center gap-2 w-full bg-[#c5a059] hover:bg-[#b38f4a] text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-70"
            >
              <LogIn size={20} />
              {isLoggingIn ? 'Verificando...' : 'Acessar Painel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const attendingCount = rsvps.filter((r) => r.attending).length;
  const notAttendingCount = rsvps.filter((r) => !r.attending).length;

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 font-body text-white">
      <div className="max-w-4xl mx-auto pb-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-neutral-900 p-4 rounded-xl shadow-sm border border-[#c5a059]/30 gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
            <Users className="text-[#e9c176]" size={28} />
            <h1 className="serif-heading text-2xl text-[#e9c176]">Painel ADM</h1>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 w-full md:w-auto">
            <a href="/" className="text-sm text-[#c5a059] hover:text-[#e9c176] transition-colors font-bold">
              ← Voltar ao Convite
            </a>
            <span className="text-sm text-neutral-400 hidden md:inline">{loggedInEmail}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-950/50 border border-red-900/50 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-neutral-900 p-6 rounded-xl shadow-sm border border-[#c5a059]/30 text-center">
            <h3 className="text-neutral-400 text-sm uppercase tracking-widest mb-2">Total de Respostas</h3>
            <p className="text-4xl font-bold text-[#e9c176]">{rsvps.length}</p>
          </div>
          <div className="bg-neutral-900 p-6 rounded-xl shadow-sm border border-[#c5a059]/30 text-center">
            <h3 className="text-neutral-400 text-sm uppercase tracking-widest mb-2">Confirmados</h3>
            <p className="text-4xl font-bold text-green-400 flex items-center justify-center gap-2">
              <CheckCircle size={28} /> {attendingCount}
            </p>
          </div>
          <div className="bg-neutral-900 p-6 rounded-xl shadow-sm border border-[#c5a059]/30 text-center">
            <h3 className="text-neutral-400 text-sm uppercase tracking-widest mb-2">Não Vão</h3>
            <p className="text-4xl font-bold text-red-400 flex items-center justify-center gap-2">
              <XCircle size={28} /> {notAttendingCount}
            </p>
          </div>
        </div>

        {/* Detailed List */}
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-[#c5a059]/30 overflow-hidden mb-8">
          <div className="p-6 border-b border-[#c5a059]/30 bg-neutral-950">
            <h2 className="serif-heading text-xl text-[#e9c176] mb-4">Respostas Detalhadas</h2>
            
            {/* Add RSVP Form */}
            <form onSubmit={handleAddRsvp} className="flex flex-col md:flex-row gap-3 bg-neutral-900 p-4 rounded-lg border border-[#c5a059]/20">
              <input
                type="text"
                placeholder="Nome"
                value={newRsvpFirstName}
                onChange={(e) => setNewRsvpFirstName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-[#c5a059]/30 focus:outline-none focus:ring-2 focus:ring-[#c5a059] bg-neutral-950 text-white placeholder:text-neutral-600 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Sobrenome"
                value={newRsvpLastName}
                onChange={(e) => setNewRsvpLastName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-[#c5a059]/30 focus:outline-none focus:ring-2 focus:ring-[#c5a059] bg-neutral-950 text-white placeholder:text-neutral-600 text-sm"
                required
              />
              <select
                value={newRsvpAttending ? 'true' : 'false'}
                onChange={(e) => setNewRsvpAttending(e.target.value === 'true')}
                className="px-3 py-2 rounded-lg border border-[#c5a059]/30 focus:outline-none focus:ring-2 focus:ring-[#c5a059] bg-neutral-950 text-white text-sm"
              >
                <option value="true">Confirmado</option>
                <option value="false">Não vai</option>
              </select>
              <button
                type="submit"
                disabled={isAddingRsvp}
                className="flex items-center justify-center gap-2 bg-[#c5a059] hover:bg-[#b38f4a] text-black font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-70 text-sm whitespace-nowrap"
              >
                <UserPlus size={16} />
                {isAddingRsvp ? 'Adicionando...' : 'Adicionar'}
              </button>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950 border-b border-[#c5a059]/30">
                  <th className="px-3 py-3 font-bold text-[#e9c176] text-xs uppercase tracking-wider whitespace-nowrap">Nome</th>
                  <th className="px-3 py-3 font-bold text-[#e9c176] text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 font-bold text-[#e9c176] text-xs uppercase tracking-wider whitespace-nowrap">Data</th>
                  <th className="px-3 py-3 font-bold text-[#e9c176] text-xs uppercase tracking-wider whitespace-nowrap text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-neutral-400">
                      Nenhuma resposta recebida ainda.
                    </td>
                  </tr>
                ) : (
                  rsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 transition-colors">
                      <td className="px-3 py-3 font-medium text-white text-sm whitespace-nowrap">
                        {rsvp.firstName} {rsvp.lastName}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {rsvp.attending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/30 text-green-400 border border-green-800/50 text-[10px] font-bold uppercase tracking-wide">
                            <CheckCircle size={12} /> Confirmado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-800/50 text-[10px] font-bold uppercase tracking-wide">
                            <XCircle size={12} /> Não vai
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-neutral-400 whitespace-nowrap">
                        {rsvp.createdAt?.toDate ? rsvp.createdAt.toDate().toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Agora'}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteRsvp(rsvp.id)}
                          className="text-red-400 hover:text-red-300 p-1 rounded transition-colors inline-flex"
                          title="Excluir Convidado"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Image Management Section */}
        <div className="bg-neutral-900 p-6 rounded-xl shadow-sm border border-[#c5a059]/30 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="text-[#e9c176]" size={24} />
            <h2 className="serif-heading text-xl text-[#e9c176]">Imagem do Convite</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-4">
            Faça o upload da imagem que você deseja exibir no topo do convite.
          </p>
          <form onSubmit={handleSaveImage} className="flex flex-col gap-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#c5a059]/30 border-dashed rounded-lg cursor-pointer bg-neutral-950 hover:bg-neutral-900 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <ImageIcon className="w-8 h-8 mb-3 text-[#c5a059]" />
                <p className="mb-2 text-sm text-neutral-400"><span className="font-bold text-[#e9c176]">Clique para fazer upload</span> ou arraste a imagem</p>
                <p className="text-xs text-neutral-500">PNG, JPG ou GIF</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
            <button
              type="submit"
              disabled={isSavingImage || !heroImageUrl}
              className="flex items-center justify-center gap-2 bg-[#c5a059] hover:bg-[#b38f4a] text-black font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-70 w-full md:w-auto md:self-end"
            >
              <Save size={18} />
              {isSavingImage ? 'Salvando...' : 'Salvar Imagem'}
            </button>
          </form>
          {imageSaveMessage && (
            <p className="mt-3 text-sm font-medium text-green-400">{imageSaveMessage}</p>
          )}
          {heroImageUrl && (
            <div className="mt-4">
              <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">Pré-visualização:</p>
              <div className="w-full max-w-sm h-48 rounded-lg overflow-hidden border border-[#c5a059]/30">
                <img src={heroImageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>

        {/* Admin Emails Section */}
        <div className="bg-neutral-900 p-6 rounded-xl shadow-sm border border-[#c5a059]/30">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="text-[#e9c176]" size={24} />
            <h2 className="serif-heading text-xl text-[#e9c176]">Acesso ao Painel</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-4">
            Adicione os e-mails das pessoas que também poderão acessar este painel de administração.
          </p>
          
          <form onSubmit={handleAddAdminEmail} className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="email"
              placeholder="E-mail do novo administrador"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-[#c5a059]/30 focus:outline-none focus:ring-2 focus:ring-[#c5a059] bg-neutral-950 text-white placeholder:text-neutral-600"
              required
            />
            <button
              type="submit"
              disabled={isAddingAdmin}
              className="flex items-center justify-center gap-2 bg-[#c5a059] hover:bg-[#b38f4a] text-black font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-70"
            >
              <UserPlus size={18} />
              {isAddingAdmin ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>

          <div className="border border-[#c5a059]/30 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950 border-b border-[#c5a059]/30">
                  <th className="p-3 font-bold text-[#e9c176] text-sm uppercase tracking-wider">E-mail</th>
                  <th className="p-3 font-bold text-[#e9c176] text-sm uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-800 bg-neutral-900">
                  <td className="p-3 text-sm text-white break-all">adrianorosa1@hotmail.com <span className="text-xs text-[#c5a059] ml-2 font-bold whitespace-nowrap">(Admin Principal)</span></td>
                  <td className="p-3 text-right"></td>
                </tr>
                {adminEmails.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50">
                    <td className="p-3 text-sm text-white break-all">{item.email}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRemoveAdminEmail(item.id)}
                        className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
