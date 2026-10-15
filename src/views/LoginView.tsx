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
  WifiOff,
} from "lucide-react";
import { formatRut } from "../utils/authUtils";

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    // If it looks like an email, don't auto-format
    if (val.includes("@")) {
      setCredential(val);
    } else {
      setCredential(formatRut(val));
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
            Ingresa con tu correo electrónico institucional o RUT
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
                Correo o RUT institucional
              </label>
              <div className="relative">
                <input
                  id="login-credential"
                  type="text"
                  required
                  autoComplete="username"
                  value={credential}
                  onChange={handleCredentialChange}
                  placeholder="correo@hospitalvillarrica.cl o 12.345.678-9"
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
