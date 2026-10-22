import React, { useState, useEffect } from 'react';
import { TurnoEntrega, Ambulancia, Novedad } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeTurnos, 
  subscribeAmbulancias, 
  subscribeNovedades, 
  deleteTurno, 
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

  // Modales de Edición y Eliminación
  const [turnoEditando, setTurnoEditando] = useState<TurnoEntrega | null>(null);
  const [turnoEliminando, setTurnoEliminando] = useState<TurnoEntrega | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Campos editables controlados
  const [editPatente, setEditPatente] = useState('');
  const [editTurnoTipo, setEditTurnoTipo] = useState<'Día (08:00 - 20:00)' | 'Noche (20:00 - 08:00)'>('Día (08:00 - 20:00)');
  const [editKilometraje, setEditKilometraje] = useState<number>(0);
  const [editEstado, setEditEstado] = useState<'pendiente_tens' | 'pendiente_conductor' | 'completo' | 'con_novedades'>('completo');
  const [editObsConductor, setEditObsConductor] = useState('');
  const [editObsTens, setEditObsTens] = useState('');

  const abrirModalEdicion = (t: TurnoEntrega) => {
    setTurnoEditando(t);
    setEditPatente(t.patente);
    setEditTurnoTipo(t.turnoTipo);
    setEditKilometraje(t.kilometraje || 0);
    setEditEstado(t.estado);
    setEditObsConductor(t.observacionesConductorSaliente || '');
    setEditObsTens(t.observacionesTensSaliente || '');
  };

  const guardarEdicionTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoEditando) return;
    setIsProcessing(true);

    try {
      await updateTurnoParcial(turnoEditando.id, {
        patente: editPatente,
        turnoTipo: editTurnoTipo,
        kilometraje: Number(editKilometraje),
        estado: editEstado,
        observacionesConductorSaliente: editObsConductor.trim(),
        observacionesTensSaliente: editObsTens.trim()
      });

      setFeedbackToast({
        type: 'success',
        msg: `Turno ${turnoEditando.codigoFolio} actualizado exitosamente.`
      });
      setTurnoEditando(null);
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err: any) {
      console.error("Error al actualizar turno:", err);
      setFeedbackToast({
        type: 'error',
        msg: err?.message || "No se pudo actualizar el turno."
      });
      setTimeout(() => setFeedbackToast(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmarEliminacionTurno = async () => {
    if (!turnoEliminando) return;
    setIsProcessing(true);

    try {
      await deleteTurno(turnoEliminando.id, turnoEliminando.codigoFolio);
      setFeedbackToast({
        type: 'success',
        msg: `Turno ${turnoEliminando.codigoFolio} y sus registros asociados fueron eliminados correctamente.`
      });
      setTurnoEliminando(null);
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err: any) {
      console.error("Error al eliminar turno:", err);
      setFeedbackToast({
        type: 'error',
        msg: err?.message || "No se pudo eliminar el turno. Verifique permisos."
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
      doc.text(`• Niveles: Aceite: ${c.nivelAceite} | Refrigerante: ${c.nivelAguaRefrigerante} | Frenos: ${c.nivelLiquidoFrenos} | Combustible: ${c.nivelCombustible}`, 14, 82);
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
      doc.text(`• Sujeción Camilla: Sup: ${tens.camillaSujecionSuperior} | Med: ${tens.camillaSujecionMedio} | Inf: ${tens.camillaSujecionInferior}`, 14, 129);
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
                      {t.conductorSaliente ? (
                        <span className="text-emerald-700 font-semibold">{t.conductorSaliente.nombre}</span>
                      ) : (
                        <span className="text-amber-600 italic">Pendiente</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {t.tensSaliente ? (
                        <span className="text-teal-700 font-semibold">{t.tensSaliente.nombre}</span>
                      ) : (
                        <span className="text-amber-600 italic">Pendiente</span>
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
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => exportarPDF(t)}
                          title="Descargar Acta Oficial PDF"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-lg font-bold inline-flex items-center gap-1 transition-colors border border-slate-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        {canManageTurnos && (
                          <>
                            <button
                              type="button"
                              onClick={() => abrirModalEdicion(t)}
                              title="Modificar turno por corrección"
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors border border-transparent hover:border-sky-200"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setTurnoEliminando(t)}
                              title="Eliminar turno para rehacerlo"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición de Turno (Transporte / Admin) */}
      {turnoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider">
                  Módulo Transporte • Corrección de Turno
                </span>
                <h3 className="text-base font-black text-slate-800">
                  Editar Turno Folio: {turnoEditando.codigoFolio}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTurnoEditando(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarEdicionTurno} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Patente Móvil
                  </label>
                  <input
                    type="text"
                    required
                    value={editPatente}
                    onChange={e => setEditPatente(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kilometraje
                  </label>
                  <input
                    type="number"
                    required
                    value={editKilometraje}
                    onChange={e => setEditKilometraje(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Turno
                  </label>
                  <select
                    value={editTurnoTipo}
                    onChange={e => setEditTurnoTipo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="Día (08:00 - 20:00)">Día (08:00 - 20:00)</option>
                    <option value="Noche (20:00 - 08:00)">Noche (20:00 - 08:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estado Global
                  </label>
                  <select
                    value={editEstado}
                    onChange={e => setEditEstado(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="completo">Conforme (Completo)</option>
                    <option value="con_novedades">Con Novedades</option>
                    <option value="pendiente_tens">Pendiente TENS</option>
                    <option value="pendiente_conductor">Pendiente Conductor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observaciones Conductor (Saliente)
                </label>
                <textarea
                  rows={2}
                  value={editObsConductor}
                  onChange={e => setEditObsConductor(e.target.value)}
                  placeholder="Sin observaciones mecánicas reportadas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observaciones TENS (Saliente)
                </label>
                <textarea
                  rows={2}
                  value={editObsTens}
                  onChange={e => setEditObsTens(e.target.value)}
                  placeholder="Sin observaciones clínicas reportadas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-[11px] text-sky-800">
                ℹ️ Esta modificación respeta la estructura de datos no monolítica de Firestore: actualiza selectivamente los campos sin alterar las firmas electrónicas ni borrar verificaciones de checklist.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTurnoEditando(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isProcessing ? "Guardando..." : "Guardar Modificación"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación (Transporte / Admin) */}
      {turnoEliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              ¿Eliminar Entrega de Turno?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Estás a punto de eliminar el turno con Folio <strong>{turnoEliminando.codigoFolio}</strong> ({turnoEliminando.patente}). 
              <br /><br />
              Esta acción eliminará el registro de la base de datos y permitirá que los funcionarios puedan rehacer el documento correctamente desde cero si hubo una equivocación grave.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
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
                <span>{isProcessing ? "Eliminando..." : "Sí, Eliminar Turno"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
