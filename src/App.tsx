import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './views/LoginView';
import { FormularioConductorView } from './views/FormularioConductorView';
import { FormularioTensView } from './views/FormularioTensView';
import { GestionNovedadesView } from './views/GestionNovedadesView';
import { MantenedorMovilesView } from './views/MantenedorMovilesView';
import { MantenedorUsuariosView } from './views/MantenedorUsuariosView';
import { DashboardGestionView } from './views/DashboardGestionView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { 
  Ambulance, 
  Truck, 
  HeartPulse, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X,
  FileText
} from 'lucide-react';

export function App() {
  const { currentUser, logout, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('default');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If not logged in, render Login
  if (!currentUser) {
    return <LoginView />;
  }

  // Determine initial tab according to role
  const getEffectiveTab = () => {
    if (activeTab !== 'default') return activeTab;
    if (currentUser.rol === 'conductor') return 'conductor';
    if (currentUser.rol === 'tens') return 'tens';
    return 'dashboard';
  };

  const currentTab = getEffectiveTab();

  // Role permissions
  const canSeeConductor = hasRole(['conductor', 'calidad', 'transporte', 'admin']);
  const canSeeTens = hasRole(['tens', 'calidad', 'transporte', 'admin']);
  const canSeeGestion = hasRole(['calidad', 'transporte', 'admin']);
  const isConductorOnly = currentUser.rol === 'conductor';
  const isTensOnly = currentUser.rol === 'tens';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Obligatory change password modal for users with temporary password */}
      <ChangePasswordModal />

      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Ambulance className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight">HOSPITAL DE VILLARRICA</span>
                <span className="text-[10px] uppercase font-bold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-400/20">
                  Acreditación
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sistema Oficial de Entrega de Turno de Ambulancias
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {canSeeConductor && (
              <button
                type="button"
                onClick={() => setActiveTab('conductor')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'conductor' 
                    ? 'bg-sky-600 text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Turno Conductor</span>
              </button>
            )}

            {canSeeTens && (
              <button
                type="button"
                onClick={() => setActiveTab('tens')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'tens' 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                <span>Turno TENS (Cabina)</span>
              </button>
            )}

            {canSeeGestion && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'dashboard' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Auditoría & Turnos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('novedades')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'novedades' 
                      ? 'bg-amber-600 text-white shadow-md' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Novedades Calidad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('moviles')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'moviles' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Ambulance className="w-4 h-4" />
                  <span>Flota Móviles</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('usuarios')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'usuarios' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Usuarios</span>
                </button>
              </>
            )}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <span className="block text-xs font-bold text-slate-200">{currentUser.nombre}</span>
              <span className="block text-[10px] text-sky-400 capitalize">
                Rol: {currentUser.rol} {currentUser.cargo ? `• ${currentUser.cargo}` : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Cerrar Sesión"
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors border border-slate-700"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 lg:hidden border border-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-t border-slate-800 p-4 space-y-2">
            <div className="pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
              Conectado como: <strong className="text-white">{currentUser.nombre}</strong> ({currentUser.rol})
            </div>

            {canSeeConductor && (
              <button
                type="button"
                onClick={() => { setActiveTab('conductor'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                  currentTab === 'conductor' ? 'bg-sky-600 text-white' : 'text-slate-300'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Turno Conductor</span>
              </button>
            )}

            {canSeeTens && (
              <button
                type="button"
                onClick={() => { setActiveTab('tens'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                  currentTab === 'tens' ? 'bg-teal-600 text-white' : 'text-slate-300'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                <span>Turno TENS (Cabina)</span>
              </button>
            )}

            {canSeeGestion && (
              <>
                <button
                  type="button"
                  onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                    currentTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Auditoría & Turnos</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('novedades'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                    currentTab === 'novedades' ? 'bg-amber-600 text-white' : 'text-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Novedades Calidad</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('moviles'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                    currentTab === 'moviles' ? 'bg-blue-600 text-white' : 'text-slate-300'
                  }`}
                >
                  <Ambulance className="w-4 h-4" />
                  <span>Flota Móviles</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('usuarios'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                    currentTab === 'usuarios' ? 'bg-purple-600 text-white' : 'text-slate-300'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Usuarios</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'conductor' && canSeeConductor && <FormularioConductorView />}
        {currentTab === 'tens' && canSeeTens && <FormularioTensView />}
        {currentTab === 'dashboard' && canSeeGestion && <DashboardGestionView />}
        {currentTab === 'novedades' && canSeeGestion && <GestionNovedadesView />}
        {currentTab === 'moviles' && canSeeGestion && <MantenedorMovilesView />}
        {currentTab === 'usuarios' && canSeeGestion && <MantenedorUsuariosView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          Hospital de Villarrica • Servicio de Salud Araucanía Sur (SSASUR)
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Proceso de Acreditación de Calidad y Seguridad del Paciente en Traslados Asistenciales
        </p>
      </footer>
    </div>
  );
}

export default App;
