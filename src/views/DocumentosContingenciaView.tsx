import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  AlertCircle, 
  ShieldAlert, 
  Truck, 
  HeartPulse, 
  CheckCircle2, 
  WifiOff, 
  Info,
  Clock
} from 'lucide-react';
import { generarPdfContingenciaConductor, generarPdfContingenciaTens } from '../utils/contingenciaPdf';

export const DocumentosContingenciaView: React.FC = () => {
  const [downloadingConductor, setDownloadingConductor] = useState(false);
  const [downloadingTens, setDownloadingTens] = useState(false);

  const handleDownloadConductor = () => {
    setDownloadingConductor(true);
    try {
      generarPdfContingenciaConductor();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDownloadingConductor(false), 800);
    }
  };

  const handleDownloadTens = () => {
    setDownloadingTens(true);
    try {
      generarPdfContingenciaTens();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDownloadingTens(false), 800);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Banner Principal de Contingencia */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 text-amber-200 text-xs font-bold mb-3 border border-amber-300/30">
              <WifiOff className="w-4 h-4 text-amber-300" />
              <span>Protocolo de Contingencia Operacional y Red Caída</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Documentos Oficiales de Contingencia
            </h1>
            <p className="text-sm text-amber-100/90 mt-2 max-w-2xl leading-relaxed">
              Descargue e imprima los formularios físicos ante indisponibilidad técnica o cortes de red informática. 
              Permiten el registro manual estandarizado durante la entrega de turno y su posterior regularización en el aplicativo.
            </p>
          </div>
        </div>
      </div>

      {/* Alerta Informativa del Flujo */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs text-blue-900 space-y-1">
          <h4 className="font-bold text-sm text-blue-950">Procedimiento ante Fallas de Conectividad:</h4>
          <p className="leading-relaxed text-blue-800">
            1. Imprima o mantenga copias de respaldo impresas en la central de ambulancias y box clínico.
          </p>
          <p className="leading-relaxed text-blue-800">
            2. El personal saliente y entrante completa y firma físicamente la pauta correspondiente.
          </p>
          <p className="leading-relaxed text-blue-800">
            3. Una vez restablecida la red, el <strong>Encargado de Transporte</strong> o personal asignado regulariza los datos en la plataforma para mantener el expediente digital del móvil al día.
          </p>
        </div>
      </div>

      {/* Tarjetas de Descarga de Formularios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tarjeta Conductor */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Pauta Mecánica
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Formulario Contingencia: Conductores
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Código institucional: <strong>CONT-COND-01</strong> • Revisión Técnico-Mecánica y Operacional
            </p>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Niveles de fluidos (aceite, agua/refrigerante, frenos, combustible y Sistema AdBlue)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Cinturones de seguridad, neumáticos, plumillas y luces de emergencia</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Permiso de circulación, revisión técnica y bitácora de ruta</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Herramientas, gata elevadora, triángulos y prueba en ruta</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Espacio para observaciones mecánicas y firmas manuscritas</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadConductor}
            disabled={downloadingConductor}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingConductor ? "Generando Formulario..." : "Descargar Formulario Conductor (PDF)"}</span>
          </button>
        </div>

        {/* Tarjeta TENS */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Pauta Cabina Sanitaria
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Formulario Contingencia: TENS
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Código institucional: <strong>CONT-TENS-02</strong> • Fijaciones y Equipamiento Biomédico
            </p>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Sujeción de camilla (correas superior/inferior y anclaje al piso)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Cinturones de asientos cabina sanitaria y anclaje silla de ruedas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Fijación de desfibrilador, monitor cardiaco y bombas biomédicas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Control de cilindros de oxígeno (red y portátil) y bioseguridad</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Espacio para novedades clínicas y firmas manuscritas</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadTens}
            disabled={downloadingTens}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingTens ? "Generando Formulario..." : "Descargar Formulario TENS (PDF)"}</span>
          </button>
        </div>

      </div>

      {/* Recordatorio de Regularización */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-bold text-white text-xs sm:text-sm">Regularización Oportuna en el Sistema</h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Una vez restablecida la red informática, los registros en papel deben ingresarse al sistema dentro del mismo turno laboral.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
