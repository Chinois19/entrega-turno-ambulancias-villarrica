import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppUser, UserRole } from '../types';
import { 
  getUsuarios, 
  saveUsuario, 
  migrateUsuarioUid,
  subscribeUsuarios,
  saveRutLookup, 
  eliminarCuentaUsuario, 
  reactivarCuentaUsuario, 
  verificarRutBloqueado 
} from '../firebase/firestoreService';
import { 
  validateRut, 
  formatRut, 
  rutToAuthEmail,
  formatProperName,
  validateFullNameWords,
  sha256Hash,
  encryptPassword,
  decryptPassword
} from '../utils/authUtils';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { firebaseConfig, auth } from '../firebase/config';
import { sendWelcomeEmail } from '../services/emailService';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Search, 
  Check, 
  Copy, 
  AlertCircle, 
  AlertTriangle,
  UserCheck, 
  Send, 
  MessageSquare, 
  Trash2,
  UserX,
  RotateCcw,
  Archive,
  Lock,
  History,
  UserCog,
  Save,
  Shield,
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react';

export const MantenedorUsuariosView: React.FC = () => {
  const { currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'activos' | 'eliminados'>('activos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal para Modificar Funcionario / Roles / Credenciales
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRol, setEditRol] = useState<UserRole>('conductor');
  const [editCargo, setEditCargo] = useState('');
  const [editResetPassword, setEditResetPassword] = useState(false);
  const [editCustomPassword, setEditCustomPassword] = useState('');
  const [editGeneratedPassword, setEditGeneratedPassword] = useState<string | null>(null);
  const [editEmailSentTo, setEditEmailSentTo] = useState<string | null>(null);
  const [editCopied, setEditCopied] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal para Eliminar Cuenta (Baja definitiva de nómina)
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [motivoEliminacion, setMotivoEliminacion] = useState('Término de funciones / Desvinculación laboral');
  const [deletingLoading, setDeletingLoading] = useState(false);

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
  const [customCreatePassword, setCustomCreatePassword] = useState('');

  // Visibilidad de contraseñas desencriptadas en tiempo real para Admin y Transporte
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeUsuarios(async (list) => {
      setUsuarios(list);
      const map: Record<string, string> = {};
      for (const u of list) {
        if (u.passwordEncrypted) {
          map[u.id] = await decryptPassword(u.passwordEncrypted);
        }
      }
      setDecryptedPasswords(map);
    });
    return () => unsubscribe();
  }, []);

  const loadUsuarios = async () => {
    const list = await getUsuarios();
    setUsuarios(list);
    const map: Record<string, string> = {};
    for (const u of list) {
      if (u.passwordEncrypted) {
        map[u.id] = await decryptPassword(u.passwordEncrypted);
      }
    }
    setDecryptedPasswords(map);
  };

  const toggleShowPassword = (uid: string) => {
    setVisiblePasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const copyRowPassword = (uid: string, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedRowId(uid);
    setTimeout(() => setCopiedRowId(null), 2000);
  };

  const handleOpenCreate = () => {
    setNombre('');
    setRut('');
    setEmail('');
    setRol('conductor');
    setCargo('Conductor SAMU / Traslado');
    setCustomCreatePassword('');
    setGeneratedPassword(null);
    setEmailSentTo(null);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  /**
   * Provisions or updates a user's password directly in Firebase Auth using an isolated secondary instance,
   * without requiring email verification links or disrupting the Admin's session.
   * Returns { uid, authEmail }.
   */
  const forceProvisionAuthPassword = async (
    cleanedDigits: string,
    targetPassword: string,
    existingUser?: AppUser
  ): Promise<{ uid: string; authEmail: string }> => {
    const helperName = `AdminAuthHelper_${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, helperName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 1. If editing an existing user and we have their decrypted old password, try updating in-place first
      if (existingUser) {
        const oldPlain = existingUser.passwordEncrypted
          ? await decryptPassword(existingUser.passwordEncrypted)
          : '';
        const candidateAuthEmail = existingUser.authEmail || `${cleanedDigits}@hospitalvillarrica.cl`;

        if (oldPlain) {
          try {
            const cred = await signInWithEmailAndPassword(secondaryAuth, candidateAuthEmail, oldPlain);
            await updatePassword(cred.user, targetPassword);
            const uid = cred.user.uid;
            await signOut(secondaryAuth);
            await deleteApp(secondaryApp).catch(() => {});
            return { uid, authEmail: candidateAuthEmail };
          } catch {
            // Fall through to fresh credential slot creation
          }
        }
      }

      // 2. Try standard institutional authEmail first
      const primaryAuthEmail = `${cleanedDigits}@hospitalvillarrica.cl`;
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, primaryAuthEmail, targetPassword);
        const uid = cred.user.uid;
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp).catch(() => {});
        return { uid, authEmail: primaryAuthEmail };
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          // 3. Allocate a new active credential slot linked to the user's RUT
          const slotAuthEmail = `${cleanedDigits}-c${Date.now().toString(36)}@hospitalvillarrica.cl`;
          const cred = await createUserWithEmailAndPassword(secondaryAuth, slotAuthEmail, targetPassword);
          const uid = cred.user.uid;
          await signOut(secondaryAuth);
          await deleteApp(secondaryApp).catch(() => {});
          return { uid, authEmail: slotAuthEmail };
        }
        throw err;
      }
    } catch (e) {
      await deleteApp(secondaryApp).catch(() => {});
      throw e;
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setEmailSentTo(null);

    if (!nombre.trim()) {
      setErrorMsg('El nombre del funcionario es requerido.');
      return;
    }

    if (!validateFullNameWords(nombre)) {
      setErrorMsg('El nombre debe incluir al menos un nombre y dos apellidos (mínimo 3 palabras, ej: Aldo Balladares González).');
      return;
    }

    if (!validateRut(rut)) {
      setErrorMsg('El RUN ingresado no es válido (Verificación Módulo 11).');
      return;
    }

    const normalizedNombre = formatProperName(nombre);
    const cleanRut = formatRut(rut);
    const cleanedDigits = cleanRut.replace(/[^0-9kK]/g, '').toLowerCase();

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 1. Evitar registro futuro si el RUN ya fue eliminado/bloqueado (salvo en localhost para pruebas)
    if (!isLocalhost) {
      const blockedCheck = await verificarRutBloqueado(cleanedDigits);
      if (blockedCheck && blockedCheck.bloqueado) {
        setErrorMsg(
          `Este RUN (${cleanRut}) se encuentra registrado como cuenta eliminada / dada de baja (${blockedCheck.motivo || 'Baja previa'}). Para evitar registros no autorizados, debe reactivarse desde la pestaña "Cuentas Eliminadas" si corresponde.`
        );
        return;
      }
    }

    setSaving(true);
    try {
      // 2. Generar o usar contraseña definida por Administración / Transporte
      const tempPass = customCreatePassword.trim()
        ? customCreatePassword.trim()
        : `Villarrica-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      if (tempPass.length < 6) {
        setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
        setSaving(false);
        return;
      }

      const hasRealEmail = email.trim().includes('@');
      const contactEmail = hasRealEmail ? email.trim().toLowerCase() : '';

      // 3. Crear cuenta directamente en Firebase Auth
      const { uid, authEmail } = await forceProvisionAuthPassword(cleanedDigits, tempPass);

      // 4. Encriptar contraseña (AES-GCM) y generar hash SHA-256 para resguardo en colección `usuarios`
      const [pHash, pEnc] = await Promise.all([
        sha256Hash(tempPass),
        encryptPassword(tempPass),
      ]);

      // 5. Enviar correo informativo vía EmailJS si tiene correo registrado (opcional y no bloqueante)
      if (hasRealEmail) {
        try {
          const roleLabel = rol === 'conductor' ? 'Conductor' : rol === 'tens' ? 'TENS' : rol === 'calidad' ? 'Encargada de Calidad' : 'Encargado Transporte';
          const mailRes = await sendWelcomeEmail({
            to_name: normalizedNombre,
            to_email: contactEmail,
            to_rut: cleanRut,
            temp_password: tempPass,
            role_name: roleLabel
          });
          if (mailRes.success) {
            setEmailSentTo(contactEmail);
          }
        } catch (mailErr) {
          console.warn('[EmailJS] Error al despachar correo:', mailErr);
        }
      }

      // 6. Guardar perfil completo con clave encriptada en colección `usuarios`
      const newUser: AppUser = {
        id: uid,
        nombre: normalizedNombre,
        rut: cleanRut,
        email: contactEmail || authEmail,
        authEmail,
        rol,
        cargo: cargo.trim() || undefined,
        passwordHash: pHash,
        passwordEncrypted: pEnc,
        isTemporaryPassword: false,
        activo: true,
        eliminado: false,
        creadoEn: new Date().toISOString()
      };

      await saveUsuario(newUser);

      // 7. Vincular siempre RUT -> AuthEmail para inicio de sesión directo e infalible con RUT
      await saveRutLookup(cleanedDigits, authEmail, normalizedNombre);

      await loadUsuarios();
      setGeneratedPassword(tempPass);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear el usuario.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Modal de Edición / Modificación de Roles y Credenciales ───────────────
  const handleOpenEditModal = (u: AppUser) => {
    setUserToEdit(u);
    setEditNombre(u.nombre);
    setEditRut(u.rut);
    setEditEmail(u.email || '');
    setEditRol(u.rol);
    setEditCargo(u.cargo || '');
    setEditResetPassword(false);
    setEditCustomPassword('');
    setEditGeneratedPassword(null);
    setEditEmailSentTo(null);
    setEditCopied(false);
    setEditError(null);
  };

  const handleEditRoleSelect = (newRole: UserRole) => {
    setEditRol(newRole);
    // Sugerir cargo según el nuevo rol si está vacío o coincide con el genérico
    const cargosDefault: Record<UserRole, string> = {
      conductor: 'Conductor SAMU / Traslado',
      tens: 'TENS Clínico de Móvil',
      transporte: 'Jefe Unidad de Transporte / Movilización',
      calidad: 'Referente de Calidad',
      admin: 'Administrador del Sistema y TI'
    };
    if (!editCargo.trim() || Object.values(cargosDefault).includes(editCargo.trim())) {
      setEditCargo(cargosDefault[newRole]);
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    setEditError(null);
    setEditEmailSentTo(null);

    if (!editNombre.trim()) {
      setEditError('El nombre completo es requerido.');
      return;
    }

    // Al editar se permite conservar el nombre previo si ya tenía menos palabras
    const isNameChanged = editNombre.trim() !== userToEdit.nombre.trim();
    if (isNameChanged && !validateFullNameWords(editNombre)) {
      setEditError('Al modificar el nombre debe incluir al menos un nombre y dos apellidos (mínimo 3 palabras, ej: Aldo Balladares González).');
      return;
    }

    setEditSaving(true);
    try {
      const normalizedNombre = formatProperName(editNombre);
      const cleanRut = formatRut(editRut || userToEdit.rut);
      const cleanedDigits = cleanRut.replace(/[^0-9kK]/g, '').toLowerCase();
      const hasRealEmail = editEmail.trim().includes('@');
      const userDisplayEmail = hasRealEmail ? editEmail.trim().toLowerCase() : rutToAuthEmail(cleanRut);

      let newTempPass: string | null = null;
      let isTemp = false;
      let finalUid = userToEdit.id;
      let finalAuthEmail = userToEdit.authEmail || `${cleanedDigits}@hospitalvillarrica.cl`;
      let newPasswordHash = userToEdit.passwordHash;
      let newPasswordEncrypted = userToEdit.passwordEncrypted;

      if (editResetPassword) {
        newTempPass = editCustomPassword.trim() || `Villarrica-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        if (newTempPass.length < 6) {
          setEditError('La contraseña debe tener al menos 6 caracteres.');
          setEditSaving(false);
          return;
        }
        // Forzar cambio directo en Firebase Auth sin depender de enlaces por correo
        const provisioned = await forceProvisionAuthPassword(cleanedDigits, newTempPass, userToEdit);
        finalUid = provisioned.uid;
        finalAuthEmail = provisioned.authEmail;
        [newPasswordHash, newPasswordEncrypted] = await Promise.all([
          sha256Hash(newTempPass),
          encryptPassword(newTempPass),
        ]);
        isTemp = false;
      }

      const updatedUser: AppUser = {
        ...userToEdit,
        id: finalUid,
        nombre: normalizedNombre,
        rut: cleanRut,
        email: userDisplayEmail,
        authEmail: finalAuthEmail,
        rol: editRol,
        cargo: editCargo.trim() || undefined,
        passwordHash: newPasswordHash,
        passwordEncrypted: newPasswordEncrypted,
        isTemporaryPassword: isTemp,
      };

      await migrateUsuarioUid(userToEdit.id, updatedUser);

      // Actualizar mapeo en rut_lookup apuntando siempre al authEmail activo en Firebase Auth
      await saveRutLookup(cleanedDigits, finalAuthEmail, normalizedNombre);

      // Si se asignó nueva clave y el usuario tiene correo personal/institucional registrado, notificar por EmailJS
      if (newTempPass && hasRealEmail) {
        try {
          const roleLabels: Record<UserRole, string> = {
            conductor: 'Conductor',
            tens: 'TENS',
            transporte: 'Encargado de Transporte',
            calidad: 'Encargada de Calidad',
            admin: 'Administrador'
          };
          const mailRes = await sendWelcomeEmail({
            to_name: normalizedNombre,
            to_email: userDisplayEmail,
            to_rut: cleanRut,
            temp_password: newTempPass,
            role_name: roleLabels[editRol]
          });
          if (mailRes.success) {
            setEditEmailSentTo(userDisplayEmail);
          }
        } catch (mailErr) {
          console.warn('[EmailJS] Advertencia al despachar correo:', mailErr);
        }
      }

      await loadUsuarios();

      if (newTempPass) {
        setEditGeneratedPassword(newTempPass);
      } else {
        setUserToEdit(null);
      }
    } catch (err: any) {
      setEditError(err.message || 'Error al guardar modificaciones del usuario.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleResetPassword = (u: AppUser) => {
    handleOpenEditModal(u);
    setEditResetPassword(true);
    const currentDecrypted = decryptedPasswords[u.id] || '';
    setEditCustomPassword(currentDecrypted || 'Minsal2026');
  };

  const handleToggleActivo = async (u: AppUser) => {
    const updatedUser: AppUser = {
      ...u,
      activo: !u.activo
    };
    await saveUsuario(updatedUser);
    await loadUsuarios();
  };

  // Abrir modal de eliminación definitiva de cuenta
  const handleOpenDeleteModal = (u: AppUser) => {
    setUserToDelete(u);
    setMotivoEliminacion('Término de funciones / Desvinculación laboral');
  };

  // Confirmar eliminación de cuenta: saca del listado, bloquea registro futuro y resguarda historial
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeletingLoading(true);
    try {
      const ejecutadoPor = currentUser ? `${currentUser.nombre} (${currentUser.rol})` : 'Transporte / Administración';
      await eliminarCuentaUsuario(
        userToDelete.id, 
        userToDelete.rut, 
        motivoEliminacion, 
        ejecutadoPor
      );
      setUserToDelete(null);
      await loadUsuarios();
    } catch (err: any) {
      alert(`Error al eliminar la cuenta: ${err.message}`);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Reactivar cuenta eliminada previamente
  const handleReactivar = async (u: AppUser) => {
    if (!window.confirm(`¿Reactivar e incorporar nuevamente a ${u.nombre} (${u.rut}) al listado de funcionarios activos?`)) {
      return;
    }
    try {
      await reactivarCuentaUsuario(u.id, u.rut);
      await loadUsuarios();
    } catch (err: any) {
      alert(`Error al reactivar cuenta: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEditToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setEditCopied(true);
    setTimeout(() => setEditCopied(false), 2000);
  };

  // Separación entre usuarios activos y eliminados
  const usuariosActivos = usuarios.filter(u => !u.eliminado);
  const usuariosEliminados = usuarios.filter(u => !!u.eliminado);

  const usuariosVisibles = activeTab === 'activos' ? usuariosActivos : usuariosEliminados;

  const filteredUsuarios = usuariosVisibles.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      (u.nombre || '').toLowerCase().includes(term) ||
      (u.rut || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.rol || '').toLowerCase().includes(term)
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

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'conductor':
        return 'Acceso a Entrega de Turno de Conductor, bitácora de odómetro/kilometraje e inspección mecánica preventiva.';
      case 'tens':
        return 'Acceso a Entrega de Turno TENS, inspección de cabina sanitaria, fijaciones de equipos críticos y reposición de insumos.';
      case 'transporte':
        return 'Control de flota de ambulancias, mantenedor de móviles, auditoría y administración de nómina de usuarios.';
      case 'calidad':
        return 'Auditoría de turnos, visualización de dashboards, acreditación institucional y gestión de novedades.';
      case 'admin':
        return 'Control total de la plataforma y configuraciones de TI.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" /> Control de Acceso y Gestión de Nómina
          </div>
          <h2 className="text-2xl font-black">Administración de Usuarios y Cuentas</h2>
          <p className="text-sm text-indigo-200/80 mt-1">
            Gestión oficial para Encargada de Transporte y Administración con resguardo de auditoría clínica
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Ingresar Nuevo Funcionario</span>
        </button>
      </div>

      {/* Selector de Pestañas: Activos vs Eliminados/Historial */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('activos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'activos'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Nómina Activa ({usuariosActivos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('eliminados')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'eliminados'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-red-700 hover:bg-red-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Cuentas Eliminadas / Historial ({usuariosEliminados.length})</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, RUN, correo o rol..."
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Funcionario</th>
                <th className="py-3 px-4">RUN</th>
                <th className="py-3 px-4">Contraseña Activa (Encriptada)</th>
                <th className="py-3 px-4">Correo</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {activeTab === 'activos' 
                      ? "No hay funcionarios registrados en la nómina activa." 
                      : "No hay registros de cuentas eliminadas."}
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map(u => {
                  const plainPwd = decryptedPasswords[u.id] || '';
                  const isPwdVisible = !!visiblePasswords[u.id];
                  return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {formatProperName(u.nombre)}
                      {u.cargo && <span className="block text-[11px] text-slate-400 font-normal">{u.cargo}</span>}
                      {u.eliminado && u.motivoBaja && (
                        <span className="block text-[10px] text-red-600 font-medium mt-0.5">
                          Motivo: {u.motivoBaja}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{u.rut}</td>
                    <td className="py-3.5 px-4">
                      {plainPwd ? (
                        <div className="inline-flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <span className="font-mono font-bold text-slate-800 text-xs tracking-wide select-all">
                            {isPwdVisible ? plainPwd : '••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(u.id)}
                            className="p-0.5 text-slate-500 hover:text-indigo-600 transition-colors"
                            title={isPwdVisible ? 'Ocultar contraseña' : 'Ver contraseña activa'}
                          >
                            {isPwdVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyRowPassword(u.id, plainPwd)}
                            className="p-0.5 text-slate-500 hover:text-emerald-600 transition-colors"
                            title="Copiar contraseña"
                          >
                            {copiedRowId === u.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition-colors"
                          title="Asignar una clave directa y visible para este funcionario"
                        >
                          <Key className="w-3 h-3" />
                          <span>Sin registro (Asignar)</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">{getRolBadge(u.rol)}</td>
                    <td className="py-3.5 px-4">
                      {u.eliminado ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                            <Lock className="w-3 h-3" /> Cuenta Eliminada
                          </span>
                          {u.eliminadoEn && (
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Baja: {new Date(u.eliminadoEn).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {u.activo ? 'Activo' : 'Desactivado'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {activeTab === 'activos' ? (
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* BOTÓN OFICIAL DE MODIFICACIÓN DE ROL Y CREDENCIALES */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            title="Modificar rol, credenciales y datos del funcionario según criterio de Transporte"
                            className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                          >
                            <UserCog className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Modificar Rol</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetPassword(u)}
                            title="Cambiar o forzar contraseña directamente en el aplicativo"
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                          >
                            <Key className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cambiar Clave</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActivo(u)}
                            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                              u.activo ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>

                          {/* BOTÓN OFICIAL DE ELIMINAR CUENTA */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(u)}
                            title="Eliminar cuenta, sacar del listado y bloquear registros futuros conservando auditoría anterior"
                            className="px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <UserX className="w-3.5 h-3.5 text-red-600" />
                            <span>Eliminar Cuenta</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleReactivar(u)}
                            className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reactivar Cuenta</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MODIFICAR USUARIO, ROLES Y CREDENCIALES */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-indigo-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Criterio de Transporte / Administración
                  </span>
                  <h3 className="text-lg font-black text-slate-800">Modificar Rol y Credenciales</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserToEdit(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            {editGeneratedPassword ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3.5">
                <UserCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">¡Credenciales y Rol Actualizados!</h4>
                <p className="text-xs text-slate-600">
                  Se ha actualizado el perfil de <strong>{editNombre}</strong> con el rol <strong>{editRol.toUpperCase()}</strong>.
                </p>

                {editEmailSentTo ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 text-left text-xs text-slate-700 space-y-1 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold">
                      <Send className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>Notificación automática enviada a:</span>
                    </div>
                    <p className="font-bold text-slate-900 pl-6">{editEmailSentTo}</p>
                  </div>
                ) : null}

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Nueva contraseña provisoria asignada:
                  </span>
                  <div className="flex items-center justify-center gap-2 p-2.5 bg-white rounded-lg border border-emerald-300 font-mono font-black text-slate-900 text-base">
                    <span>{editGeneratedPassword}</span>
                    <button
                      type="button"
                      onClick={() => copyEditToClipboard(editGeneratedPassword)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Copiar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {editCopied && <span className="text-[11px] text-emerald-700 font-bold block">¡Copiado al portapapeles!</span>}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Hola ${editNombre.trim()}, se han actualizado tus credenciales institucionales para el Sistema de Entrega de Turno de Ambulancias - Hospital de Villarrica.\n\n• Rol asignado: ${editRol.toUpperCase()}\n• RUN de acceso: ${editRut}\n• Contraseña provisoria: ${editGeneratedPassword}\n\nPuedes ingresar directamente desde tu celular o computador en:\nhttps://entrega-turno-ambulancias.pages.dev`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Compartir por WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveEditUser} className="space-y-4">
                {/* Selector de Rol Principal */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Rol Institucional Asignado
                  </label>
                  <select
                    value={editRol}
                    onChange={e => handleEditRoleSelect(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="conductor">Conductor (Chequeo Mecánico y Turno Vehicular)</option>
                    <option value="tens">TENS (Cabina Sanitaria y Equipos Médicos)</option>
                    <option value="transporte">Encargado de Transporte (Flota, Móviles y Usuarios)</option>
                    <option value="calidad">Encargada de Calidad (Auditoría y Acreditación)</option>
                    <option value="admin">Administrador del Sistema (TI y Configuración)</option>
                  </select>
                  <div className="flex items-start gap-2 text-[11px] text-indigo-800/90 pt-0.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>{getRoleDescription(editRol)}</span>
                  </div>
                </div>

                {/* Cargo Institucional */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cargo Institucional
                  </label>
                  <input
                    type="text"
                    value={editCargo}
                    onChange={e => setEditCargo(e.target.value)}
                    placeholder="Ej: Conductor SAMU / Traslado"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>

                {/* Nombre y RUN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nombre Completo <span className="text-slate-400 font-normal lowercase">(al menos un nombre y dos apellidos)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                      placeholder="Ej: Aldo Balladares González"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      RUN / RUT
                    </label>
                    <input
                      type="text"
                      value={editRut}
                      onChange={e => setEditRut(formatRut(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-slate-50"
                    />
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Electrónico Institucional
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="correo@redsalud.gob.cl"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                {/* Sección Modificar Credenciales / Contraseña */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editResetPassword}
                      onChange={e => setEditResetPassword(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Modificar / Asignar nueva contraseña directa en el aplicativo
                    </span>
                  </label>

                  {editResetPassword && (
                    <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                      <p className="text-[11px] text-indigo-900">
                        La contraseña se aplicará de inmediato (sin requerir enlaces de correo ni bloqueos) y quedará resguardada con encriptación AES-256 en la colección <code className="font-mono font-bold">usuarios</code>, visible en tiempo real para Administración y Jefe de Transporte.
                      </p>
                      <input
                        type="text"
                        value={editCustomPassword}
                        onChange={e => setEditCustomPassword(e.target.value)}
                        placeholder="Escribir contraseña (ej: Minsal2026) o dejar vacío para autogenerar"
                        className="w-full px-3 py-1.5 rounded-lg border border-indigo-300 text-xs font-mono font-bold bg-white"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    disabled={editSaving}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editSaving ? "Guardando..." : "Guardar Modificaciones"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación de Cuenta */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-100 text-red-700 rounded-xl">
                <UserX className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                  Acción de Seguridad • Transporte y Calidad
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  ¿Eliminar Cuenta de {userToDelete.nombre}?
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  RUN: {userToDelete.rut} • Rol: {userToDelete.rol}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Aviso de resguardo de datos y bloqueo futuro */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-700" />
                <span>Efectos de la eliminación:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-800">
                <li>
                  <strong>Saldrá inmediatamente del listado activo</strong> de funcionarios del sistema.
                </li>
                <li>
                  <strong>Bloqueo de acceso futuro:</strong> No podrá iniciar sesión ni registrarse nuevamente con este RUN sin autorización.
                </li>
                <li>
                  <strong>Preservación de datos anteriores:</strong> Todas las entregas de turno, firmas digitales y novedades reportadas previamente permanecerán resguardadas intactas para fines de acreditación legal y sanitaria.
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motivo de la Eliminación / Salida
              </label>
              <select
                value={motivoEliminacion}
                onChange={e => setMotivoEliminacion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="Término de funciones / Desvinculación laboral">Término de funciones / Desvinculación laboral</option>
                <option value="Renuncia voluntaria">Renuncia voluntaria</option>
                <option value="Traslado a otro establecimiento / Servicio de Salud">Traslado a otro establecimiento / Servicio de Salud</option>
                <option value="Término de reemplazo o suplencia">Término de reemplazo o suplencia</option>
                <option value="Registro duplicado o erróneo">Registro duplicado o erróneo</option>
                <option value="Baja administrativa por Transporte">Baja administrativa por Transporte</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deletingLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingLoading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingLoading ? "Eliminando..." : "Confirmar y Eliminar Cuenta"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Nómina Oficial Hospital de Villarrica
                </span>
                <h3 className="text-lg font-black text-slate-800">Ingresar Nuevo Funcionario</h3>
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
              <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {generatedPassword ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3.5">
                <UserCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">¡Funcionario Ingresado Exitosamente!</h4>
                
                {emailSentTo ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 text-left text-xs text-slate-700 space-y-1 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold">
                      <Send className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>Correo automático enviado a:</span>
                    </div>
                    <p className="font-bold text-slate-900 pl-6">{emailSentTo}</p>
                    <p className="text-[11px] text-slate-500 pl-6">
                      El funcionario ha recibido el correo con sus credenciales provisorias y el enlace para ingresar al sistema.
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
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Hola ${nombre.trim()}, se ha generado tu cuenta de usuario para el Sistema de Entrega de Turno de Ambulancias - Hospital de Villarrica.\n\n• RUT de acceso: ${rut}\n• Contraseña provisoria: ${generatedPassword}\n\nPuedes ingresar directamente desde tu celular o computador en:\nhttps://entrega-turno-ambulancias.pages.dev\n\n(Recuerda cambiar tu contraseña en tu primer ingreso).`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Enviar por WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre Completo <span className="text-slate-400 font-normal lowercase">(al menos un nombre y dos apellidos)</span>
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
                    placeholder="Opcional: correo@redsalud.gob.cl"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <p className="text-[10px] text-indigo-600 mt-1 font-medium">
                    📧 Al ingresar el correo, se enviará automáticamente un mensaje con la clave provisoria e instrucciones de acceso. El funcionario siempre podrá ingresar directamente con su <strong>RUT</strong>.
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contraseña de Acceso <span className="text-slate-400 font-normal lowercase">(opcional: escribir o dejar vacío para autogenerar)</span>
                  </label>
                  <input
                    type="text"
                    value={customCreatePassword}
                    onChange={e => setCustomCreatePassword(e.target.value)}
                    placeholder="Ej: Minsal2026 (si se deja vacío se autogenera)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-[11px] text-indigo-900">
                  La contraseña quedará activa de inmediato y almacenada con <strong>encriptación AES-256</strong> en la colección <code className="font-mono font-bold">usuarios</code>, visible en tiempo real para Administración y Jefe de Transporte.
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
