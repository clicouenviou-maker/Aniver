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

  if (!loggedInEmail) {
    return (
      <div className="min-h-screen bg-[#fcf9f0] flex items-center justify-center p-4 font-body">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#d1c5b4]">
          <h1 className="serif-heading text-3xl text-[#775a19] mb-2">Painel de Controle</h1>
          <p className="text-[#4e4639] mb-6">
            Digite seu e-mail para acessar o painel.
          </p>
          
          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
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
                className="w-full px-4 py-3 rounded-lg border border-[#d1c5b4] focus:outline-none focus:ring-2 focus:ring-[#775a19] bg-[#fcf9f0]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex items-center justify-center gap-2 w-full bg-[#775a19] hover:bg-[#5d4201] text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-70"
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
    <div className="min-h-screen bg-[#fcf9f0] p-4 md:p-8 font-body text-[#1c1c17]">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-[#d1c5b4] gap-4">
          <div className="flex items-center gap-3">
            <Users className="text-[#775a19]" size={28} />
            <h1 className="serif-heading text-2xl text-[#775a19]">Painel de Controle</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#4e4639] hidden md:inline">{loggedInEmail}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Image Management Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d1c5b4] mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="text-[#775a19]" size={24} />
            <h2 className="serif-heading text-xl text-[#775a19]">Imagem do Convite</h2>
          </div>
          <p className="text-sm text-[#4e4639] mb-4">
            Faça o upload da imagem que você deseja exibir no topo do convite.
          </p>
          <form onSubmit={handleSaveImage} className="flex flex-col md:flex-row gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="flex-1 px-4 py-2 rounded-lg border border-[#d1c5b4] focus:outline-none focus:ring-2 focus:ring-[#775a19] bg-[#fcf9f0] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#775a19] file:text-white hover:file:bg-[#5d4201] cursor-pointer"
            />
            <button
              type="submit"
              disabled={isSavingImage || !heroImageUrl}
              className="flex items-center justify-center gap-2 bg-[#775a19] hover:bg-[#5d4201] text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-70"
            >
              <Save size={18} />
              {isSavingImage ? 'Salvando...' : 'Salvar Imagem'}
            </button>
          </form>
          {imageSaveMessage && (
            <p className="mt-3 text-sm font-medium text-green-600">{imageSaveMessage}</p>
          )}
          {heroImageUrl && (
            <div className="mt-4">
              <p className="text-xs text-[#4e4639] mb-2 uppercase tracking-wider">Pré-visualização:</p>
              <div className="w-full max-w-sm h-48 rounded-lg overflow-hidden border border-[#d1c5b4]">
                <img src={heroImageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>

        {/* Admin Emails Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d1c5b4] mb-8">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="text-[#775a19]" size={24} />
            <h2 className="serif-heading text-xl text-[#775a19]">Acesso ao Painel</h2>
          </div>
          <p className="text-sm text-[#4e4639] mb-4">
            Adicione os e-mails das pessoas que também poderão acessar este painel de administração.
          </p>
          
          <form onSubmit={handleAddAdminEmail} className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="email"
              placeholder="E-mail do novo administrador"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-[#d1c5b4] focus:outline-none focus:ring-2 focus:ring-[#775a19] bg-[#fcf9f0]"
              required
            />
            <button
              type="submit"
              disabled={isAddingAdmin}
              className="flex items-center justify-center gap-2 bg-[#775a19] hover:bg-[#5d4201] text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-70"
            >
              <UserPlus size={18} />
              {isAddingAdmin ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>

          <div className="border border-[#d1c5b4] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f6f3ea] border-b border-[#d1c5b4]">
                  <th className="p-3 font-bold text-[#775a19] text-sm uppercase tracking-wider">E-mail</th>
                  <th className="p-3 font-bold text-[#775a19] text-sm uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#f1eee5] bg-[#fcf9f0]">
                  <td className="p-3 text-sm text-[#1c1c17]">adrianorosa1@hotmail.com <span className="text-xs text-[#c5a059] ml-2 font-bold">(Admin Principal)</span></td>
                  <td className="p-3 text-right"></td>
                </tr>
                {adminEmails.map((item) => (
                  <tr key={item.id} className="border-b border-[#f1eee5] last:border-0 hover:bg-[#fcf9f0]">
                    <td className="p-3 text-sm text-[#1c1c17]">{item.email}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRemoveAdminEmail(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d1c5b4] text-center">
            <h3 className="text-[#4e4639] text-sm uppercase tracking-widest mb-2">Total de Respostas</h3>
            <p className="text-4xl font-bold text-[#775a19]">{rsvps.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d1c5b4] text-center">
            <h3 className="text-[#4e4639] text-sm uppercase tracking-widest mb-2">Confirmados</h3>
            <p className="text-4xl font-bold text-green-600 flex items-center justify-center gap-2">
              <CheckCircle size={28} /> {attendingCount}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d1c5b4] text-center">
            <h3 className="text-[#4e4639] text-sm uppercase tracking-widest mb-2">Não Vão</h3>
            <p className="text-4xl font-bold text-red-600 flex items-center justify-center gap-2">
              <XCircle size={28} /> {notAttendingCount}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#d1c5b4] overflow-hidden">
          <div className="p-6 border-b border-[#d1c5b4] bg-[#fcf9f0]">
            <h2 className="serif-heading text-xl text-[#775a19]">Respostas Detalhadas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f6f3ea] border-b border-[#d1c5b4]">
                  <th className="p-4 font-bold text-[#775a19] text-sm uppercase tracking-wider">Nome</th>
                  <th className="p-4 font-bold text-[#775a19] text-sm uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold text-[#775a19] text-sm uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-[#4e4639]">
                      Nenhuma resposta recebida ainda.
                    </td>
                  </tr>
                ) : (
                  rsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="border-b border-[#f1eee5] last:border-0 hover:bg-[#fcf9f0] transition-colors">
                      <td className="p-4 font-medium text-[#1c1c17]">
                        {rsvp.firstName} {rsvp.lastName}
                      </td>
                      <td className="p-4">
                        {rsvp.attending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide">
                            <CheckCircle size={14} /> Confirmado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide">
                            <XCircle size={14} /> Não vai
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-[#4e4639]">
                        {rsvp.createdAt?.toDate().toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
