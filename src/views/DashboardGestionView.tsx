import React, { useState, useEffect } from 'react';
import { TurnoEntrega, Ambulancia, Novedad, ChecklistConductor, ChecklistTens } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeTurnos, 
  subscribeAmbulancias, 
  subscribeNovedades, 
  deleteTurno,
  deleteRegistroConductor,
  deleteRegistroTens,
  updateTurnoParcial 
} from '../firebase/firestoreService';
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Truck, 
  HeartPulse, 
  Download, 
  Search,
  ExternalLink,
  ShieldCheck,
  Radio,
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';

export const DashboardGestionView: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const [turnos, setTurnos] = useState<TurnoEntrega[]>([]);
  const [ambulancias, setAmbulancias] = useState<Ambulancia[]>([]);
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [online, setOnline] = useState(navigator.onLine);

  // Permisos: Encargado de Transporte o Administrador pueden gestionar, editar y depurar turnos
  const canManageTurnos = hasRole(['transporte', 'admin']);

  // Modales de Edición Individuales y Eliminación
  const [turnoConductorEditando, setTurnoConductorEditando] = useState<TurnoEntrega | null>(null);
  const [turnoTensEditando, setTurnoTensEditando] = useState<TurnoEntrega | null>(null);
  const [turnoEliminando, setTurnoEliminando] = useState<{ turno: TurnoEntrega; tipo: 'conductor' | 'tens' | 'todo' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Estados controlados para Documento CONDUCTOR
  const [cEditPatente, setCEditPatente] = useState('');
  const [cEditKilometraje, setCEditKilometraje] = useState<number>(0);
  const [cEditTurnoTipo, setCEditTurnoTipo] = useState<'Día (08:00 - 20:00)' | 'Noche (20:00 - 08:00)'>('Día (08:00 - 20:00)');
  const [cEditConductorSaliente, setCEditConductorSaliente] = useState('');
  const [cEditConductorEntrante, setCEditConductorEntrante] = useState('');
  const [cEditObsSaliente, setCEditObsSaliente] = useState('');
  const [cEditObsEntrante, setCEditObsEntrante] = useState('');
  const [cChecklist, setCChecklist] = useState<ChecklistConductor>({
    cinturonConductor: 'Operativo',
    cinturonCopiloto: 'Operativo',
    permisoCirculacion: true,
    revisionTecnica: true,
    tarjetaCombustible: 'Si',
    bitacoraMovil: 'Si',
    nivelAceite: 'Normal',
    nivelAguaRefrigerante: 'Normal',
    nivelLiquidoFrenos: 'Normal',
    nivelLiquidoDireccion: 'Normal',
    nivelCombustible: 'Lleno',
    estadoAdBlue: 'Normal',
    estadoNeumaticos: 'Bueno',
    presionNeumaticos: true,
    estadoPlumillas: 'Bueno',
    limpiaparabrisasLuneta: true,
    exteriorLimpioSinDano: true,
    pastillasDiscosFrenos: 'Bueno',
    lucesBalizasSirena: 'Operativo',
    testigosTablero: 'Normal',
    sistemaCargaBaterias: 'Bueno',
    gataElevadora: true,
    juegoLlaves: true,
    juegoTriangulos: true,
    chalecoReflectante: true,
    ruedaRepuesto: true,
    pruebaRutaOk: true,
    lubricacionPuertasOk: true,
  });

  // Estados controlados para Documento TENS
  const [tEditTensSaliente, setTEditTensSaliente] = useState('');
  const [tEditTensEntrante, setTEditTensEntrante] = useState('');
  const [tEditObsSaliente, setTEditObsSaliente] = useState('');
  const [tEditObsEntrante, setTEditObsEntrante] = useState('');
  const [tChecklist, setTChecklist] = useState<ChecklistTens>({
    camillaSujecionSuperior: 'Operativo',
    camillaSujecionInferior: 'Operativo',
    camillaAnclajePiso: 'Operativo',
    cinturonAsientoCabecera: 'Operativo',
    cinturonAsientosLaterales: 'Operativo',
    sillaRuedasAnclaje: 'Operativo',
    incubadoraAnclaje: 'No Aplica',
    fijacionBombaInfusion: 'Operativo',
    fijacionDesfibrilador: 'Operativo',
    fijacionMonitorSignos: 'Operativo',
    fijacionBombaAspiracion: 'Operativo',
    gavetasAlmacenamiento: 'Operativo',
    cabinaLimpiaDesinfectada: true,
    oxigenoCilindroLleno: true,
  });

  // Apertura modal CONDUCTOR
  const abrirModalEdicionConductor = (t: TurnoEntrega) => {
    setTurnoConductorEditando(t);
    setCEditPatente(t.patente || '');
    setCEditKilometraje(t.kilometraje || 0);
    setCEditTurnoTipo(t.turnoTipo || 'Día (08:00 - 20:00)');
    setCEditConductorSaliente(t.conductorSaliente?.nombre || '');
    setCEditConductorEntrante(t.conductorEntrante?.nombre || '');
    setCEditObsSaliente(t.observacionesConductorSaliente || '');
    setCEditObsEntrante(t.observacionesConductorEntrante || '');
    if (t.checklistConductor) {
      setCChecklist({ ...t.checklistConductor });
    }
  };

  // Apertura modal TENS
  const abrirModalEdicionTens = (t: TurnoEntrega) => {
    setTurnoTensEditando(t);
    setTEditTensSaliente(t.tensSaliente?.nombre || '');
    setTEditTensEntrante(t.tensEntrante?.nombre || '');
    setTEditObsSaliente(t.observacionesTensSaliente || '');
    setTEditObsEntrante(t.observacionesTensEntrante || '');
    if (t.checklistTens) {
      setTChecklist({ ...t.checklistTens });
    }
  };

  // Guardar Edición Documento CONDUCTOR
  const guardarEdicionConductor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoConductorEditando) return;
    setIsProcessing(true);

    try {
      const now = new Date().toISOString();
      const updates: Partial<TurnoEntrega> = {
        patente: cEditPatente,
        kilometraje: Number(cEditKilometraje),
        turnoTipo: cEditTurnoTipo,
        observacionesConductorSaliente: cEditObsSaliente.trim(),
        observacionesConductorEntrante: cEditObsEntrante.trim(),
        checklistConductor: cChecklist,
        actualizadoEn: now
      };

      if (cEditConductorSaliente.trim()) {
        updates.conductorSaliente = {
          nombre: cEditConductorSaliente.trim(),
          rut: turnoConductorEditando.conductorSaliente?.rut || '',
          firmaUrl: turnoConductorEditando.conductorSaliente?.firmaUrl || '',
          fechaHora: turnoConductorEditando.conductorSaliente?.fechaHora || now
        };
      }

      if (cEditConductorEntrante.trim()) {
        updates.conductorEntrante = {
          nombre: cEditConductorEntrante.trim(),
          rut: turnoConductorEditando.conductorEntrante?.rut || '',
          firmaUrl: turnoConductorEditando.conductorEntrante?.firmaUrl || '',
          fechaHora: turnoConductorEditando.conductorEntrante?.fechaHora || now
        };
      }

      // Si falta TENS sigue como pendiente_tens, sino completo
      if (!turnoConductorEditando.tensSaliente) {
        updates.estado = 'pendiente_tens';
      }

      await updateTurnoParcial(turnoConductorEditando.id, updates);

      setFeedbackToast({
        type: 'success',
        msg: `Documento de Conductor del turno ${turnoConductorEditando.codigoFolio} guardado exitosamente.`
      });
      setTurnoConductorEditando(null);
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err: any) {
      console.error("Error al actualizar formulario conductor:", err);
      setFeedbackToast({
        type: 'error',
        msg: err?.message || "No se pudo actualizar el registro de conductor."
      });
      setTimeout(() => setFeedbackToast(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Guardar Edición Documento TENS
  const guardarEdicionTens = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoTensEditando) return;
    setIsProcessing(true);

    try {
      const now = new Date().toISOString();
      const updates: Partial<TurnoEntrega> = {
        observacionesTensSaliente: tEditObsSaliente.trim(),
        observacionesTensEntrante: tEditObsEntrante.trim(),
        checklistTens: tChecklist,
        actualizadoEn: now
      };

      if (tEditTensSaliente.trim()) {
        updates.tensSaliente = {
          nombre: tEditTensSaliente.trim(),
          rut: turnoTensEditando.tensSaliente?.rut || '',
          firmaUrl: turnoTensEditando.tensSaliente?.firmaUrl || '',
          fechaHora: turnoTensEditando.tensSaliente?.fechaHora || now
        };
      }

      if (tEditTensEntrante.trim()) {
        updates.tensEntrante = {
          nombre: tEditTensEntrante.trim(),
          rut: turnoTensEditando.tensEntrante?.rut || '',
          firmaUrl: turnoTensEditando.tensEntrante?.firmaUrl || '',
          fechaHora: turnoTensEditando.tensEntrante?.fechaHora || now
        };
      }

      // Si falta conductor sigue pendiente_conductor, sino completo
      if (!turnoTensEditando.conductorSaliente) {
        updates.estado = 'pendiente_conductor';
      } else {
        updates.estado = 'completo';
      }

      await updateTurnoParcial(turnoTensEditando.id, updates);

      setFeedbackToast({
        type: 'success',
        msg: `Documento de TENS del turno ${turnoTensEditando.codigoFolio} guardado exitosamente.`
      });
      setTurnoTensEditando(null);
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err: any) {
      console.error("Error al actualizar formulario TENS:", err);
      setFeedbackToast({
        type: 'error',
        msg: err?.message || "No se pudo actualizar el registro de TENS."
      });
      setTimeout(() => setFeedbackToast(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const abrirModalEliminarDesdeModal = (t: TurnoEntrega, tipo: 'conductor' | 'tens') => {
    setTurnoConductorEditando(null);
    setTurnoTensEditando(null);
    setTurnoEliminando({ turno: t, tipo });
  };

  const confirmarEliminacionTurno = async () => {
    if (!turnoEliminando) return;
    setIsProcessing(true);

    try {
      const { turno, tipo } = turnoEliminando;

      if (tipo === 'conductor') {
        const res = await deleteRegistroConductor(turno.id);
        setFeedbackToast({
          type: 'success',
          msg: res.deletedEntireTurno
            ? `Se eliminó el registro de Conductor y el turno ${turno.codigoFolio} al no registrar TENS.`
            : `Se eliminó únicamente el registro de Conductor del turno ${turno.codigoFolio}. El registro de TENS permanece intacto.`
        });
      } else if (tipo === 'tens') {
        const res = await deleteRegistroTens(turno.id);
        setFeedbackToast({
          type: 'success',
          msg: res.deletedEntireTurno
            ? `Se eliminó el registro de TENS y el turno ${turno.codigoFolio} al no registrar Conductor.`
            : `Se eliminó únicamente el registro de TENS del turno ${turno.codigoFolio}. El registro de Conductor permanece intacto.`
        });
      } else {
        await deleteTurno(turno.id, turno.codigoFolio);
        setFeedbackToast({
          type: 'success',
          msg: `Turno ${turno.codigoFolio} y todos sus registros fueron eliminados correctamente.`
        });
      }

      setTurnoEliminando(null);
      setTimeout(() => setFeedbackToast(null), 4500);
    } catch (err: any) {
      console.error("Error al eliminar registro:", err);
      setFeedbackToast({
        type: 'error',
        msg: err?.message || "No se pudo eliminar el registro. Verifique permisos."
      });
      setTimeout(() => setFeedbackToast(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Real-time listeners — unsubscribe on unmount
    const unsubTurnos = subscribeTurnos(setTurnos);
    const unsubAmbulancias = subscribeAmbulancias(setAmbulancias);
    const unsubNovedades = subscribeNovedades(setNovedades);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubTurnos();
      unsubAmbulancias();
      unsubNovedades();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Turnos incompletos (solo conductor o solo TENS)
  const turnosPendientes = turnos.filter(t => t.estado === 'pendiente_tens' || t.estado === 'pendiente_conductor');

  const exportarPDF = (t: TurnoEntrega) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(2, 132, 199);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("HOSPITAL DE VILLARRICA - SERVICIO DE SALUD ARAUCANÍA SUR", 14, 11);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("ACTA OFICIAL DE ENTREGA Y RECEPCIÓN DE TURNO DE AMBULANCIAS", 14, 18);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`FOLIO DE TURNO: ${t.codigoFolio}`, 14, 34);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha y Hora: ${new Date(t.fecha).toLocaleString('es-CL')}`, 14, 40);
    doc.text(`Placa Patente: ${t.patente}`, 14, 46);
    doc.text(`Turno: ${t.turnoTipo}`, 120, 34);
    doc.text(`Kilometraje Registrado: ${t.kilometraje.toLocaleString('es-CL')} km`, 120, 40);
    doc.text(`Estado del Turno: ${t.estado.toUpperCase()}`, 120, 46);

    // Línea separadora
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 50, 196, 50);

    // Módulo Conductor
    doc.setFont("helvetica", "bold");
    doc.text("1. REVISIÓN TÉCNICO-MECÁNICA Y OPERACIONAL (CONDUCTORES)", 14, 57);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`• Conductor Saliente: ${t.conductorSaliente?.nombre || 'Pendiente'} (${t.conductorSaliente?.rut || 'S/I'})`, 14, 64);
    doc.text(`• Conductor Entrante: ${t.conductorEntrante?.nombre || 'Pendiente'} (${t.conductorEntrante?.rut || 'S/I'})`, 14, 70);
    
    if (t.checklistConductor) {
      const c = t.checklistConductor;
      doc.text(`• Fijaciones Cabina: Cinturón Conductor: [${c.cinturonConductor || 'Operativo'}] | Copiloto: [${c.cinturonCopiloto || 'Operativo'}]`, 14, 76);
      doc.text(`• Niveles: Aceite: ${c.nivelAceite} | Refrigerante: ${c.nivelAguaRefrigerante} | Frenos: ${c.nivelLiquidoFrenos} | Combustible: ${c.nivelCombustible} | AdBlue: ${c.estadoAdBlue || 'Normal'}`, 14, 82);
      doc.text(`• Neumáticos: ${c.estadoNeumaticos} | Plumillas: ${c.estadoPlumillas} | Luces/Balizas: ${c.lucesBalizasSirena}`, 14, 87);
      doc.text(`• Documentación: Permiso Circulación [${c.permisoCirculacion ? 'OK' : 'Falta'}], Rev. Técnica [${c.revisionTecnica ? 'OK' : 'Falta'}]`, 14, 92);
    }
    if (t.observacionesConductorSaliente) {
      doc.text(`• Obs. Conductor: ${t.observacionesConductorSaliente}`, 14, 97);
    }

    // Línea separadora
    doc.line(14, 102, 196, 102);

    // Módulo TENS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("2. REVISIÓN DE CABINA SANITARIA Y FIJACIONES (TENS)", 14, 109);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`• TENS Saliente: ${t.tensSaliente?.nombre || 'Pendiente'} (${t.tensSaliente?.rut || 'S/I'})`, 14, 116);
    doc.text(`• TENS Entrante: ${t.tensEntrante?.nombre || 'Pendiente'} (${t.tensEntrante?.rut || 'S/I'})`, 14, 122);

    if (t.checklistTens) {
      const tens = t.checklistTens;
      doc.text(`• Sujeción Camilla: Sup: ${tens.camillaSujecionSuperior} | Inf: ${tens.camillaSujecionInferior} | Anclaje Piso: ${tens.camillaAnclajePiso}`, 14, 129);
      doc.text(`• Cinturones Cabina: Cabecera: ${tens.cinturonAsientoCabecera} | Laterales: ${tens.cinturonAsientosLaterales}`, 14, 135);
      doc.text(`• Fijación Equipos: Desfibrilador: ${tens.fijacionDesfibrilador} | Monitor: ${tens.fijacionMonitorSignos} | Bombas: ${tens.fijacionBombaInfusion}`, 14, 141);
      doc.text(`• Bioseguridad: Cabina Desinfectada: ${tens.cabinaLimpiaDesinfectada ? 'SÍ' : 'NO'} | Cilindro Oxígeno: ${tens.oxigenoCilindroLleno ? 'CONFORME' : 'NO'}`, 14, 147);
    }
    if (t.observacionesTensSaliente) {
      doc.text(`• Obs. TENS: ${t.observacionesTensSaliente}`, 14, 154);
    }

    // Cuadros de Firmas Digitales
    doc.line(14, 162, 196, 162);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("3. FIRMAS ELECTRÓNICAS REGISTRADAS EN SISTEMA", 14, 169);

    if (t.conductorSaliente?.firmaUrl) {
      try {
        doc.addImage(t.conductorSaliente.firmaUrl, 'PNG', 14, 175, 42, 22);
        doc.setFontSize(8);
        doc.text("Firma Conductor Saliente", 14, 201);
      } catch (e) {}
    }
    if (t.conductorEntrante?.firmaUrl) {
      try {
        doc.addImage(t.conductorEntrante.firmaUrl, 'PNG', 60, 175, 42, 22);
        doc.setFontSize(8);
        doc.text("Firma Conductor Entrante", 60, 201);
      } catch (e) {}
    }
    if (t.tensSaliente?.firmaUrl) {
      try {
        doc.addImage(t.tensSaliente.firmaUrl, 'PNG', 106, 175, 42, 22);
        doc.setFontSize(8);
        doc.text("Firma TENS Saliente", 106, 201);
      } catch (e) {}
    }
    if (t.tensEntrante?.firmaUrl) {
      try {
        doc.addImage(t.tensEntrante.firmaUrl, 'PNG', 152, 175, 42, 22);
        doc.setFontSize(8);
        doc.text("Firma TENS Entrante", 152, 201);
      } catch (e) {}
    }

    // Footer de acreditación
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("Documento oficial generado para el proceso de Acreditación de Calidad en Salud. Hospital de Villarrica.", 14, 280);

    doc.save(`Acta_Entrega_Turno_${t.codigoFolio}_${t.patente}.pdf`);
  };

  const filteredTurnos = turnos.filter(t => {
    if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        t.codigoFolio.toLowerCase().includes(term) ||
        t.patente.toLowerCase().includes(term) ||
        (t.conductorSaliente?.nombre.toLowerCase().includes(term)) ||
        (t.tensSaliente?.nombre.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Flotante de Notificaciones */}
      {feedbackToast && (
        <div className={`fixed top-20 right-4 z-50 max-w-md px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border-2 ${
          feedbackToast.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-400' 
            : 'bg-rose-600 text-white border-rose-400'
        }`}>
          {feedbackToast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-xs font-bold leading-tight flex-1">{feedbackToast.msg}</p>
          <button 
            type="button" 
            onClick={() => setFeedbackToast(null)} 
            className="text-white/80 hover:text-white font-black text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-200 text-xs font-semibold mb-2">
            <BarChart3 className="w-4 h-4" /> Panel de Control General
          </div>
          <h2 className="text-2xl font-black">Módulo de Gestión, Auditoría y Calidad</h2>
          <p className="text-sm text-sky-200/80 mt-1">
            Supervisión transversal de entregas de turno, turnos pendientes y expedientes de acreditación
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
            online ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
          }`}>
            <Radio className="w-3.5 h-3.5" />
            {online ? 'Tiempo Real · Firestore' : 'Modo Offline · Cache local'}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Flota Registrada</span>
            <Truck className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">{ambulancias.length}</p>
          <span className="text-xs text-emerald-600 font-semibold">
            {ambulancias.filter(a => a.estado === 'operativa').length} operativas
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Turnos Pendientes</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{turnosPendientes.length}</p>
          <span className="text-xs text-slate-500 font-medium">Incompletos Conductor o TENS</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Novedades Abiertas</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">
            {novedades.filter(n => n.estado === 'pendiente' || n.estado === 'en_evaluacion').length}
          </p>
          <span className="text-xs text-slate-500 font-medium">Requieren gestión o taller</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Turnos Completos</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {turnos.filter(t => t.estado === 'completo').length}
          </p>
          <span className="text-xs text-slate-500 font-medium">Acreditación respaldada</span>
        </div>
      </div>

      {/* Alerta de Turnos Pendientes de Entrega */}
      {turnosPendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Atención: Hay {turnosPendientes.length} entrega(s) de turno pendientes de completar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {turnosPendientes.map(tp => (
              <div key={tp.id} className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>{tp.patente}</span>
                  <span className="text-amber-700">
                    {tp.estado === 'pendiente_tens' ? 'Falta TENS' : 'Falta Conductor'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Iniciado por: {tp.creadoPor} ({new Date(tp.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial General de Turnos y Exportación */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Historial Oficial de Entregas de Turno</h3>
            <p className="text-xs text-slate-500">Descarga de actas en PDF para auditoría y respaldo de calidad</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por folio, patente..."
                className="w-full px-3 py-1.5 pl-8 rounded-xl border border-slate-300 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="todos">Todos los Estados</option>
              <option value="completo">Completos</option>
              <option value="con_novedades">Con Novedades</option>
              <option value="pendiente_tens">Pendientes TENS</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Folio</th>
                <th className="py-3 px-3">Móvil / Patente</th>
                <th className="py-3 px-3">Fecha y Turno</th>
                <th className="py-3 px-3">Conductor</th>
                <th className="py-3 px-3">TENS</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTurnos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se registran turnos con los filtros actuales
                  </td>
                </tr>
              ) : (
                filteredTurnos.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{t.codigoFolio}</td>
                    <td className="py-3 px-3 font-black text-slate-900">{t.patente}</td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{new Date(t.fecha).toLocaleDateString('es-CL')}</div>
                      <span className="text-[10px] text-slate-400">{t.turnoTipo}</span>
                    </td>
                    <td className="py-3 px-3">
                      {canManageTurnos ? (
                        <button
                          type="button"
                          onClick={() => abrirModalEdicionConductor(t)}
                          title="Haga clic para editar o corregir la entrega de Conductor"
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-left transition-all hover:bg-emerald-50 border border-transparent hover:border-emerald-300"
                        >
                          {t.conductorSaliente ? (
                            <span className="text-emerald-800 font-bold group-hover:underline flex items-center gap-1">
                              {t.conductorSaliente.nombre}
                              <Edit2 className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium italic flex items-center gap-1 text-xs">
                              Pendiente (Completar)
                              <Edit2 className="w-3 h-3 text-amber-500" />
                            </span>
                          )}
                        </button>
                      ) : (
                        t.conductorSaliente ? (
                          <span className="text-emerald-700 font-semibold">{t.conductorSaliente.nombre}</span>
                        ) : (
                          <span className="text-amber-600 italic">Pendiente</span>
                        )
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {canManageTurnos ? (
                        <button
                          type="button"
                          onClick={() => abrirModalEdicionTens(t)}
                          title="Haga clic para editar o corregir la entrega de TENS"
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-left transition-all hover:bg-teal-50 border border-transparent hover:border-teal-300"
                        >
                          {t.tensSaliente ? (
                            <span className="text-teal-800 font-bold group-hover:underline flex items-center gap-1">
                              {t.tensSaliente.nombre}
                              <Edit2 className="w-3 h-3 text-teal-600 opacity-60 group-hover:opacity-100" />
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium italic flex items-center gap-1 text-xs">
                              Pendiente (Completar)
                              <Edit2 className="w-3 h-3 text-amber-500" />
                            </span>
                          )}
                        </button>
                      ) : (
                        t.tensSaliente ? (
                          <span className="text-teal-700 font-semibold">{t.tensSaliente.nombre}</span>
                        ) : (
                          <span className="text-amber-600 italic">Pendiente</span>
                        )
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        t.estado === 'completo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.estado === 'con_novedades'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.estado === 'completo' ? 'Conforme' : t.estado === 'con_novedades' ? 'Con Novedades' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {/* Solo el botón PDF en la columna de acciones */}
                      <button
                        type="button"
                        onClick={() => exportarPDF(t)}
                        title="Descargar Acta Oficial PDF"
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-lg font-bold inline-flex items-center gap-1.5 transition-colors border border-slate-200 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición de Formulario de CONDUCTOR (Transporte / Admin) */}
      {turnoConductorEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Módulo Transporte • Edición Documento Conductor
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Folio: {turnoConductorEditando.codigoFolio}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    Registro de Entrega - Móvil {turnoConductorEditando.patente}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTurnoConductorEditando(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicionConductor} className="space-y-5">
              {/* Datos de Móvil y Odómetro */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Patente Móvil
                  </label>
                  <input
                    type="text"
                    required
                    value={cEditPatente}
                    onChange={e => setCEditPatente(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kilometraje Móvil
                  </label>
                  <input
                    type="number"
                    required
                    value={cEditKilometraje}
                    onChange={e => setCEditKilometraje(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Turno
                  </label>
                  <select
                    value={cEditTurnoTipo}
                    onChange={e => setCEditTurnoTipo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="Día (08:00 - 20:00)">Día (08:00 - 20:00)</option>
                    <option value="Noche (20:00 - 08:00)">Noche (20:00 - 08:00)</option>
                  </select>
                </div>
              </div>

              {/* Conductores Saliente y Entrante */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Conductor Saliente (Entrega)
                  </label>
                  <input
                    type="text"
                    value={cEditConductorSaliente}
                    onChange={e => setCEditConductorSaliente(e.target.value)}
                    placeholder="Nombre completo conductor saliente"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white mb-2"
                  />
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Observaciones Saliente</label>
                  <textarea
                    rows={2}
                    value={cEditObsSaliente}
                    onChange={e => setCEditObsSaliente(e.target.value)}
                    placeholder="Observaciones de entrega mecánica..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Conductor Entrante (Recibe)
                  </label>
                  <input
                    type="text"
                    value={cEditConductorEntrante}
                    onChange={e => setCEditConductorEntrante(e.target.value)}
                    placeholder="Nombre completo conductor entrante"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white mb-2"
                  />
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Observaciones Entrante</label>
                  <textarea
                    rows={2}
                    value={cEditObsEntrante}
                    onChange={e => setCEditObsEntrante(e.target.value)}
                    placeholder="Observaciones de recepción..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Checklist Mecánico / Inspección Conductor */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Pauta de Chequeo Técnico-Mecánico (Corrección de Ítems)
                  </h4>
                  <span className="text-[10px] text-slate-500 italic">
                    Modifique los ítems marcados por error o faltantes
                  </span>
                </div>

                {/* Niveles y Fluidos */}
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-500 mb-2">Fluidos y Mecánica</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Nivel Aceite</label>
                      <select
                        value={cChecklist.nivelAceite}
                        onChange={e => setCChecklist({ ...cChecklist, nivelAceite: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Bajo">Bajo</option>
                        <option value="Critico">Crítico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Agua / Refrig.</label>
                      <select
                        value={cChecklist.nivelAguaRefrigerante}
                        onChange={e => setCChecklist({ ...cChecklist, nivelAguaRefrigerante: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Bajo">Bajo</option>
                        <option value="Critico">Crítico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Líq. Frenos</label>
                      <select
                        value={cChecklist.nivelLiquidoFrenos}
                        onChange={e => setCChecklist({ ...cChecklist, nivelLiquidoFrenos: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Bajo">Bajo</option>
                        <option value="Critico">Crítico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Combustible</label>
                      <select
                        value={cChecklist.nivelCombustible}
                        onChange={e => setCChecklist({ ...cChecklist, nivelCombustible: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Lleno">Lleno</option>
                        <option value="3/4">3/4</option>
                        <option value="1/2">1/2</option>
                        <option value="1/4">1/4</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Sistema AdBlue</label>
                      <select
                        value={cChecklist.estadoAdBlue || 'Normal'}
                        onChange={e => setCChecklist({ ...cChecklist, estadoAdBlue: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Bajo">Bajo</option>
                        <option value="Critico">Crítico</option>
                        <option value="No Aplica">No Aplica</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Equipamiento y Seguridad */}
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-500 mb-2">Componentes y Seguridad</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Cinturón Cond.</label>
                      <select
                        value={cChecklist.cinturonConductor}
                        onChange={e => setCChecklist({ ...cChecklist, cinturonConductor: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Balizas y Sirena</label>
                      <select
                        value={cChecklist.lucesBalizasSirena}
                        onChange={e => setCChecklist({ ...cChecklist, lucesBalizasSirena: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Neumáticos</label>
                      <select
                        value={cChecklist.estadoNeumaticos}
                        onChange={e => setCChecklist({ ...cChecklist, estadoNeumaticos: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Bueno">Bueno</option>
                        <option value="Regular">Regular</option>
                        <option value="Malo">Malo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Testigos Tablero</label>
                      <select
                        value={cChecklist.testigosTablero}
                        onChange={e => setCChecklist({ ...cChecklist, testigosTablero: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Alerta">Alerta</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Verificaciones y Documentos (Checkboxes) */}
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-500 mb-2">Documentación y Herramientas</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cChecklist.permisoCirculacion}
                        onChange={e => setCChecklist({ ...cChecklist, permisoCirculacion: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Permiso Circulación</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cChecklist.revisionTecnica}
                        onChange={e => setCChecklist({ ...cChecklist, revisionTecnica: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Revisión Técnica</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cChecklist.ruedaRepuesto}
                        onChange={e => setCChecklist({ ...cChecklist, ruedaRepuesto: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Rueda de Repuesto</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cChecklist.gataElevadora}
                        onChange={e => setCChecklist({ ...cChecklist, gataElevadora: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Gata y Llaves</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cChecklist.chalecoReflectante}
                        onChange={e => setCChecklist({ ...cChecklist, chalecoReflectante: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Chaleco y Triángulos</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cChecklist.pruebaRutaOk}
                        onChange={e => setCChecklist({ ...cChecklist, pruebaRutaOk: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Prueba en Ruta OK</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Botones de acción del modal Conductor */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => abrirModalEliminarDesdeModal(turnoConductorEditando, 'conductor')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors border border-rose-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Registro / Turno</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTurnoConductorEditando(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isProcessing ? "Guardando..." : "Guardar Modificación Conductor"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edición de Formulario de TENS (Transporte / Admin) */}
      {turnoTensEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Módulo Transporte • Edición Documento TENS
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Folio: {turnoTensEditando.codigoFolio}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    Cabina Sanitaria y Equipamiento - Móvil {turnoTensEditando.patente}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTurnoTensEditando(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicionTens} className="space-y-5">
              {/* TENS Saliente y Entrante */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-1">
                    TENS Saliente (Entrega)
                  </label>
                  <input
                    type="text"
                    value={tEditTensSaliente}
                    onChange={e => setTEditTensSaliente(e.target.value)}
                    placeholder="Nombre completo TENS saliente"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white mb-2"
                  />
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Observaciones TENS Saliente</label>
                  <textarea
                    rows={2}
                    value={tEditObsSaliente}
                    onChange={e => setTEditObsSaliente(e.target.value)}
                    placeholder="Observaciones clínicas o de cabina..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-1">
                    TENS Entrante (Recibe)
                  </label>
                  <input
                    type="text"
                    value={tEditTensEntrante}
                    onChange={e => setTEditTensEntrante(e.target.value)}
                    placeholder="Nombre completo TENS entrante"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white mb-2"
                  />
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Observaciones TENS Entrante</label>
                  <textarea
                    rows={2}
                    value={tEditObsEntrante}
                    onChange={e => setTEditObsEntrante(e.target.value)}
                    placeholder="Observaciones de recepción cabina..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Checklist Fijaciones y Equipos Médicos */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    Pauta de Cabina Sanitaria (Fijaciones y Equipos Médicos)
                  </h4>
                  <span className="text-[10px] text-slate-500 italic">
                    Modifique los ítems marcados por error o faltantes
                  </span>
                </div>

                {/* Camilla y Sujeción */}
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-500 mb-2">Camilla y Sujeción</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Sujeción Superior</label>
                      <select
                        value={tChecklist.camillaSujecionSuperior}
                        onChange={e => setTChecklist({ ...tChecklist, camillaSujecionSuperior: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Sujeción Inferior</label>
                      <select
                        value={tChecklist.camillaSujecionInferior}
                        onChange={e => setTChecklist({ ...tChecklist, camillaSujecionInferior: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Anclaje al Piso</label>
                      <select
                        value={tChecklist.camillaAnclajePiso}
                        onChange={e => setTChecklist({ ...tChecklist, camillaAnclajePiso: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Equipos Biomédicos Críticos */}
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-500 mb-2">Equipos Médicos Críticos</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Fijación Desfibrilador</label>
                      <select
                        value={tChecklist.fijacionDesfibrilador}
                        onChange={e => setTChecklist({ ...tChecklist, fijacionDesfibrilador: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                        <option value="No Aplica">No Aplica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Monitor Signos</label>
                      <select
                        value={tChecklist.fijacionMonitorSignos}
                        onChange={e => setTChecklist({ ...tChecklist, fijacionMonitorSignos: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                        <option value="No Aplica">No Aplica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Bomba Infusión</label>
                      <select
                        value={tChecklist.fijacionBombaInfusion}
                        onChange={e => setTChecklist({ ...tChecklist, fijacionBombaInfusion: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                        <option value="No Aplica">No Aplica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Bomba Aspiración</label>
                      <select
                        value={tChecklist.fijacionBombaAspiracion}
                        onChange={e => setTChecklist({ ...tChecklist, fijacionBombaAspiracion: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                        <option value="No Aplica">No Aplica</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Estado Sanitario y Bioseguridad */}
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-500 mb-2">Bioseguridad y Cabina</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Gavetas Almacenaje</label>
                      <select
                        value={tChecklist.gavetasAlmacenamiento}
                        onChange={e => setTChecklist({ ...tChecklist, gavetasAlmacenamiento: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Cinturón Cabecera</label>
                      <select
                        value={tChecklist.cinturonAsientoCabecera}
                        onChange={e => setTChecklist({ ...tChecklist, cinturonAsientoCabecera: e.target.value as any })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="No Operativo">No Operativo</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tChecklist.cabinaLimpiaDesinfectada}
                        onChange={e => setTChecklist({ ...tChecklist, cabinaLimpiaDesinfectada: e.target.checked })}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <span>Cabina Desinfectada</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tChecklist.oxigenoCilindroLleno}
                        onChange={e => setTChecklist({ ...tChecklist, oxigenoCilindroLleno: e.target.checked })}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <span>Oxígeno Lleno</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Botones de acción del modal TENS */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => abrirModalEliminarDesdeModal(turnoTensEditando, 'tens')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors border border-rose-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Registro / Turno</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTurnoTensEditando(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isProcessing ? "Guardando..." : "Guardar Modificación TENS"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación (Transporte / Admin) */}
      {turnoEliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              {turnoEliminando.tipo === 'conductor' && "¿Eliminar Registro de Conductor?"}
              {turnoEliminando.tipo === 'tens' && "¿Eliminar Registro de TENS?"}
              {turnoEliminando.tipo === 'todo' && "¿Eliminar Documento Completo?"}
            </h3>

            <div className="text-xs text-slate-600 mb-4 leading-relaxed space-y-2">
              <p>
                Móvil: <strong>{turnoEliminando.turno.patente}</strong> • Folio: <strong>{turnoEliminando.turno.codigoFolio}</strong>
              </p>

              {turnoEliminando.tipo === 'conductor' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                  <p className="font-semibold mb-1">⚠️ Se eliminará únicamente la entrega del Conductor:</p>
                  <p className="text-[11px] text-rose-800">
                    Se borrarán los datos de conductores saliente/entrante, kilometraje, checklist mecánico y novedades vehiculares reportadas por el conductor.
                    <br /><br />
                    <strong>El registro de cabina sanitaria del TENS se conservará intacto.</strong> El turno pasará a estado <em>Pendiente Conductor</em> para ser rehecho por el conductor.
                  </p>
                </div>
              )}

              {turnoEliminando.tipo === 'tens' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                  <p className="font-semibold mb-1">⚠️ Se eliminará únicamente la entrega del TENS:</p>
                  <p className="text-[11px] text-rose-800">
                    Se borrarán los datos de TENS saliente/entrante, checklist de cabina sanitaria, fijaciones biomédicas y novedades clínicas reportadas por el TENS.
                    <br /><br />
                    <strong>El registro técnico-mecánico del Conductor se conservará intacto.</strong> El turno pasará a estado <em>Pendiente TENS</em> para ser rehecho por el personal TENS.
                  </p>
                </div>
              )}

              {turnoEliminando.tipo === 'todo' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                  <p className="text-[11px] text-rose-800">
                    Esta acción eliminará el turno por completo de la base de datos junto con todos los registros vinculados.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setTurnoEliminando(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={confirmarEliminacionTurno}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? "Eliminando..."
                    : turnoEliminando.tipo === 'conductor'
                    ? "Sí, Eliminar solo Conductor"
                    : turnoEliminando.tipo === 'tens'
                    ? "Sí, Eliminar solo TENS"
                    : "Sí, Eliminar Todo"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
