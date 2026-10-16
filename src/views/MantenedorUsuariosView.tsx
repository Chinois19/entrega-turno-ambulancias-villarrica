import React, { useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { getUsuarios, saveUsuario, saveRutLookup } from '../firebase/firestoreService';
import { validateRut, formatRut, rutToAuthEmail } from '../utils/authUtils';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, firebaseConfig } from '../firebase/config';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Search, 
  Check, 
  Copy, 
  AlertCircle,
  Mail,
  UserCheck,
  RefreshCcw,
  Send
} from 'lucide-react';

export const MantenedorUsuariosView: React.FC = () => {
  const [usuarios, setUsuarios] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario nuevo usuario
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<UserRole>('conductor');
  const [cargo, setCargo] = useState('');

  // Clave provisoria generada y confirmación de correo
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    const list = await getUsuarios();
    setUsuarios(list);
  };

  const handleOpenCreate = () => {
    setNombre('');
    setRut('');
    setEmail('');
    setRol('conductor');
    setCargo('Conductor SAMU / Traslado');
    setGeneratedPassword(null);
    setEmailSentTo(null);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setEmailSentTo(null);

    if (!validateRut(rut)) {
      setErrorMsg('El RUN ingresado no es válido (Verificación Módulo 11).');
      return;
    }
    setSaving(true);
    let secondaryApp: any = null;
    try {
      // 1. Generar contraseña provisoria
      const tempPass = `Villarrica-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const cleanRut = formatRut(rut);
      const cleanedDigits = cleanRut.replace(/[^0-9kK]/g, '').toLowerCase();
      const hasRealEmail = email.trim().includes('@');
      const userDisplayEmail = hasRealEmail ? email.trim().toLowerCase() : rutToAuthEmail(cleanRut);
      const authEmail = userDisplayEmail;

      // 2. Crear cuenta en Firebase Auth usando una instancia secundaria aislada.
      // Así se evita sobreescribir la sesión activa del Administrador en el navegador.
      secondaryApp = getApps().find(a => a.name === 'AdminAuthHelper') 
        || initializeApp(firebaseConfig, 'AdminAuthHelper');
      const secondaryAuth = getAuth(secondaryApp);

      const credential = await createUserWithEmailAndPassword(secondaryAuth, authEmail, tempPass);
      const uid = credential.user.uid;

      // 3. Enviar correo automático nativo de Firebase al nuevo usuario si ingresó correo
      if (hasRealEmail) {
        try {
          await sendPasswordResetEmail(secondaryAuth, authEmail);
          setEmailSentTo(authEmail);
        } catch (mailErr) {
          console.warn('No se pudo enviar el correo automático de Firebase:', mailErr);
        }
      }

      await signOut(secondaryAuth);
      await deleteApp(secondaryApp).catch(() => {});
      secondaryApp = null;

      // 4. Guardar perfil en Firestore
      const newUser: AppUser = {
        id: uid,
        nombre: nombre.trim(),
        rut: cleanRut,
        email: userDisplayEmail,
        rol,
        cargo: cargo.trim() || undefined,
        isTemporaryPassword: true,
        activo: true,
        creadoEn: new Date().toISOString()
      };

      await saveUsuario(newUser);

      // 5. Vincular RUT -> Email para inicio de sesión transparente con RUT
      if (hasRealEmail) {
        await saveRutLookup(cleanedDigits, authEmail, nombre.trim());
      }

      await loadUsuarios();
      setGeneratedPassword(tempPass);
    } catch (err: any) {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(() => {});
      }
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este RUN o correo ya tiene una cuenta registrada en Firebase Auth.');
      } else {
        setErrorMsg(err.message || 'Error al crear el usuario.');
      }
    } finally {
      setSaving(false);
    }
  };


  const handleResetPassword = async (u: AppUser) => {
    if (!window.confirm(`¿Enviar correo de restablecimiento de contraseña a ${u.nombre} (${u.email})?`)) return;
    try {
      await sendPasswordResetEmail(auth, u.email);
      // Mark as temporary so the app asks to change on next login
      await saveUsuario({ ...u, isTemporaryPassword: true });
      await loadUsuarios();
      alert(`✅ Correo de restablecimiento enviado a ${u.email}.\n\nEl funcionario debe revisar su bandeja y seguir el enlace de Firebase para definir su nueva contraseña.`);
    } catch (err: any) {
      alert(`Error al enviar correo de restablecimiento: ${err.message}`);
    }
  };

  const handleToggleActivo = async (u: AppUser) => {
    const updatedUser: AppUser = {
      ...u,
      activo: !u.activo
    };
    await saveUsuario(updatedUser);
    await loadUsuarios();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsuarios = usuarios.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(term) ||
      u.rut.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.rol.toLowerCase().includes(term)
    );
  });

  const getRolBadge = (r: UserRole) => {
    switch (r) {
      case 'calidad':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Encargada Calidad</span>;
      case 'transporte':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Encargado Transporte</span>;
      case 'tens':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-700">TENS</span>;
      case 'conductor':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700">Conductor</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Admin</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" /> Control de Acceso Institucional (RBAC)
          </div>
          <h2 className="text-2xl font-black">Administración de Usuarios y Cuentas</h2>
          <p className="text-sm text-indigo-200/80 mt-1">
            Gestión de roles (Conductores, TENS, Calidad y Transporte) con contraseñas provisorias seguras
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Nuevo Usuario</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, RUT, correo o rol..."
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          {filteredUsuarios.length} usuarios en el sistema
        </span>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Funcionario</th>
                <th className="py-3 px-4">RUN</th>
                <th className="py-3 px-4">Correo</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsuarios.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {u.nombre}
                    {u.cargo && <span className="block text-[11px] text-slate-400 font-normal">{u.cargo}</span>}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{u.rut}</td>
                  <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3.5 px-4">{getRolBadge(u.rol)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {u.isTemporaryPassword && (
                      <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">
                        Clave Provisoria
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleResetPassword(u)}
                      title="Generar nueva clave provisoria"
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" />
                      <span>Reset Clave</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActivo(u)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                        u.activo ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Habilidad auth-user-management-firebase
                </span>
                <h3 className="text-lg font-black text-slate-800">Crear Nuevo Usuario</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {generatedPassword ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3.5">
                <UserCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">¡Usuario Creado Exitosamente!</h4>
                
                {emailSentTo ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 text-left text-xs text-slate-700 space-y-1 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold">
                      <Send className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>Correo automático enviado a:</span>
                    </div>
                    <p className="font-bold text-slate-900 pl-6">{emailSentTo}</p>
                    <p className="text-[11px] text-slate-500 pl-6">
                      El funcionario ha recibido el correo oficial de Firebase con el enlace para definir directamente su contraseña segura.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">
                    Entrega esta contraseña provisoria al funcionario. El sistema le exigirá definir su clave definitiva en su primer inicio de sesión:
                  </p>
                )}

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    {emailSentTo ? "Contraseña provisoria de respaldo (o ingreso directo):" : "Contraseña provisoria generada:"}
                  </span>
                  <div className="flex items-center justify-center gap-2 p-2.5 bg-white rounded-lg border border-emerald-300 font-mono font-black text-slate-900 text-base">
                    <span>{generatedPassword}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedPassword)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Copiar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {copied && <span className="text-[11px] text-emerald-700 font-bold block">¡Copiado al portapapeles!</span>}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  Cerrar y Continuar
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ej: Marcelo Poblete Vega"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    RUN / RUT (Con Guión)
                  </label>
                  <input
                    type="text"
                    required
                    value={rut}
                    onChange={e => setRut(formatRut(e.target.value))}
                    placeholder="Ej: 12.345.678-9"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Electrónico <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Opcional: correo@hospitalvillarrica.cl"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <p className="text-[10px] text-indigo-600 mt-1 font-medium">
                    📧 Al ingresar su correo, Firebase enviará automáticamente un enlace al funcionario para que defina su contraseña. También podrá iniciar sesión con su <strong>RUT</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Rol en el Sistema
                    </label>
                    <select
                      value={rol}
                      onChange={e => {
                        const r = e.target.value as UserRole;
                        setRol(r);
                        if (r === 'conductor') setCargo('Conductor SAMU / Traslado');
                        if (r === 'tens') setCargo('TENS Clínico de Móvil');
                        if (r === 'calidad') setCargo('Referente de Calidad');
                        if (r === 'transporte') setCargo('Jefe de Movilización');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="conductor">Conductor</option>
                      <option value="tens">TENS</option>
                      <option value="calidad">Encargada de Calidad</option>
                      <option value="transporte">Encargado Transporte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Cargo Institucional
                    </label>
                    <input
                      type="text"
                      value={cargo}
                      onChange={e => setCargo(e.target.value)}
                      placeholder="Conductor / TENS"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                  Se generará automáticamente una <strong>contraseña provisoria</strong> y el usuario deberá definir una contraseña propia y segura en su primer acceso.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{saving ? "Creando..." : "Crear Usuario"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
