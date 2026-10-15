import React, { useState, useEffect } from 'react';
import { TurnoEntrega, Ambulancia, Novedad } from '../types';
import { subscribeTurnos, subscribeAmbulancias, subscribeNovedades } from '../firebase/firestoreService';
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
  Radio
} from 'lucide-react';
import jsPDF from 'jspdf';

export const DashboardGestionView: React.FC = () => {
  const [turnos, setTurnos] = useState<TurnoEntrega[]>([]);
  const [ambulancias, setAmbulancias] = useState<Ambulancia[]>([]);
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [online, setOnline] = useState(navigator.onLine);

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
      doc.text(`• Niveles: Aceite: ${c.nivelAceite} | Refrigerante: ${c.nivelAguaRefrigerante} | Frenos: ${c.nivelLiquidoFrenos} | Combustible: ${c.nivelCombustible}`, 14, 77);
      doc.text(`• Neumáticos: ${c.estadoNeumaticos} | Plumillas: ${c.estadoPlumillas} | Luces/Balizas: ${c.lucesBalizasSirena}`, 14, 83);
      doc.text(`• Documentación: Permiso Circulación [${c.permisoCirculacion ? 'OK' : 'Falta'}], Rev. Técnica [${c.revisionTecnica ? 'OK' : 'Falta'}]`, 14, 89);
    }
    if (t.observacionesConductorSaliente) {
      doc.text(`• Obs. Conductor: ${t.observacionesConductorSaliente}`, 14, 96);
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
                <th className="py-3 px-3 text-right">Acta PDF</th>
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
                      <button
                        type="button"
                        onClick={() => exportarPDF(t)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-lg font-bold inline-flex items-center gap-1.5 transition-colors border border-slate-200"
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
    </div>
  );
};
