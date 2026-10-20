import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Ambulance,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Wifi,
  KeyRound,
  Send,
  CheckCircle2,
} from "lucide-react";
import { formatRut } from "../utils/authUtils";
import { resolveAuthEmail } from "../firebase/firestoreService";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal / Estado de recuperación de clave
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(credential, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Error al iniciar sesión.");
    }
  };

  const handleCredentialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes("@")) {
      setCredential(val);
    } else {
      setCredential(formatRut(val));
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    const input = (forgotInput || credential || "").trim();
    if (!input) {
      setForgotMsg({ type: 'error', text: 'Por favor ingrese su RUN o correo institucional.' });
      return;
    }
    setForgotLoading(true);
    try {
      const email = await resolveAuthEmail(input);
      if (!email || !email.includes('@')) {
        setForgotMsg({ type: 'error', text: 'No se encontró un correo institucional asociado a este RUN.' });
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setForgotMsg({
        type: 'success',
        text: `✅ Enlace oficial de restablecimiento enviado a ${email}. Revisa tu bandeja de entrada o spam para definir tu clave e ingresar con tu RUN.`
      });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setForgotMsg({ type: 'error', text: 'No se encontró ningún usuario con ese RUN o correo.' });
      } else {
        setForgotMsg({ type: 'error', text: err.message || 'Error al enviar enlace de restablecimiento.' });
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 shadow-xl shadow-sky-500/20 text-white mb-4">
            <Ambulance className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Hospital de Villarrica
          </h1>
          <p className="text-sm text-sky-200/80 mt-1 font-medium">
            Sistema Oficial de Entrega de Turno de Ambulancias
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-900/60 border border-sky-400/20 text-sky-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Proceso de Acreditación Institucional</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-7 border border-white/20">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Iniciar Sesión</h2>
          <p className="text-xs text-slate-500 mb-5">
            Ingresa con tu RUN/RUT de funcionario o correo de administrador
          </p>

          {error && (
            <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-2">
              <span className="mt-0.5 text-red-500">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                RUT de Funcionario (o Correo)
              </label>
              <div className="relative">
                <input
                  id="login-credential"
                  type="text"
                  required
                  autoComplete="username"
                  value={credential}
                  onChange={handleCredentialChange}
                  placeholder="12.345.678-9 (o correo institucional)"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-white text-slate-800"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-white text-slate-800"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setForgotInput(credential);
                    setForgotMsg(null);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold transition-colors"
                >
                  ¿Olvidaste tu contraseña o necesitas recuperarla?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-600/25 active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? "Verificando con Firebase..." : "Ingresar al Sistema"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Modal Recuperación de Contraseña */}
          {showForgotModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-sky-100 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                    <KeyRound className="w-4 h-4 text-sky-600" />
                    <span>Recuperar / Definir Clave</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Ingresa tu RUN institucional o correo registrado. Te enviaremos un enlace oficial de Google Firebase a tu correo para que puedas definir o restablecer tu contraseña:
                </p>

                {forgotMsg && (
                  <div className={`p-3 text-xs rounded-xl flex items-start gap-2 ${
                    forgotMsg.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {forgotMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <span className="text-red-500 font-bold">⚠</span>
                    )}
                    <span>{forgotMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      RUN o Correo Institucional
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForgotInput(val.includes("@") ? val : formatRut(val));
                      }}
                      placeholder="12.345.678-9 (o correo)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{forgotLoading ? "Enviando enlace..." : "Enviar Enlace"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security notice */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Wifi className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>
                Autenticación segura vía <strong className="text-slate-600">Firebase Auth</strong>.
                Las credenciales nunca se almacenan en el navegador. El sistema funciona con red
                inestable gracias a la persistencia offline.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-sky-300/60 flex items-center justify-center gap-1.5">
          <HeartPulse className="w-3.5 h-3.5 text-red-400" />
          <span>Servicio de Salud Araucanía Sur • Red Asistencial MINSAL</span>
        </div>
      </div>
    </div>
  );
};
