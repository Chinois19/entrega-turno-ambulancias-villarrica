import jsPDF from 'jspdf';

/**
 * Genera el Formulario Imprimible de Contingencia para CONDUCTORES (Hoja de Chequeo Técnico-Mecánica)
 */
export function generarPdfContingenciaConductor(): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = 215.9;

  // Encabezado Institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 22, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("HOSPITAL DE VILLARRICA - SERVICIO DE SALUD ARAUCANÍA SUR", 12, 9);
  
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("PLAN DE CONTINGENCIA ANTE CAÍDAS DE RED • FORMULARIO FÍSICO DE REGULARIZACIÓN", 12, 15);
  doc.text("CÓDIGO: CONT-COND-01", 175, 15);

  // Subtítulo del Documento
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(10, 25, 195.9, 9, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 25, 195.9, 9, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PAUTA TÉCNICO-MECÁNICA Y OPERACIONAL DE ENTREGA DE TURNO (CONDUCTORES)", 14, 31);

  // 1. Datos del Móvil y Turno
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("1. IDENTIFICACIÓN DEL MÓVIL Y TURNO", 12, 40);

  doc.setFont("helvetica", "normal");
  doc.rect(10, 42, 195.9, 14, 'S');
  
  // Cajas para rellenar
  doc.text("Placa Patente: [                           ]", 14, 48);
  doc.text("Fecha: [     /     / 202   ]", 75, 48);
  doc.text("Turno:  (  ) Día (08:00 - 20:00)    (  ) Noche (20:00 - 08:00)", 125, 48);
  
  doc.text("Móvil / Modelo: [                                           ]", 14, 53);
  doc.text("Kilometraje Entrega: [                 ] km", 125, 53);

  // 2. Personal Conductor
  doc.setFont("helvetica", "bold");
  doc.text("2. PERSONAL DE TURNO", 12, 62);
  doc.rect(10, 64, 195.9, 14, 'S');

  doc.setFont("helvetica", "normal");
  doc.text("Conductor Saliente: [                                                                       ]  RUT: [                        ]", 14, 70);
  doc.text("Conductor Entrante: [                                                                       ]  RUT: [                        ]", 14, 75);

  // 3. Pauta de Chequeo Técnico-Mecánica
  doc.setFont("helvetica", "bold");
  doc.text("3. LISTA DE CHEQUEO TÉCNICO-MECÁNICA Y SEGURIDAD", 12, 84);

  // Tabla estilo checklist
  let y = 87;
  const colW = 96;

  // Cabecera de columnas
  doc.setFillColor(226, 232, 240);
  doc.rect(10, y, colW, 6, 'F');
  doc.rect(109.9, y, colW, 6, 'F');
  doc.rect(10, y, colW, 6, 'S');
  doc.rect(109.9, y, colW, 6, 'S');

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("ÍTEM A INSPECCIONAR", 14, y + 4.2);
  doc.text("ESTADO / CONFORMIDAD", 68, y + 4.2);

  doc.text("ÍTEM A INSPECCIONAR", 114, y + 4.2);
  doc.text("ESTADO / CONFORMIDAD", 168, y + 4.2);

  y += 6;

  // Items Columna Izquierda & Derecha
  const itemsLeft = [
    { label: "Cinturón Seguridad Conductor", opts: "(  ) Operativo   (  ) No Op." },
    { label: "Cinturón Seguridad Copiloto", opts: "(  ) Operativo   (  ) No Op." },
    { label: "Nivel Aceite de Motor", opts: "( ) Normal  ( ) Bajo  ( ) Crítico" },
    { label: "Nivel Agua / Refrigerante", opts: "( ) Normal  ( ) Bajo  ( ) Crítico" },
    { label: "Nivel Líquido de Frenos", opts: "( ) Normal  ( ) Bajo  ( ) Crítico" },
    { label: "Nivel Líquido Dirección", opts: "( ) Normal  ( ) Bajo  ( ) Crítico" },
    { label: "Nivel Combustible", opts: "( ) Lleno  ( ) 3/4  ( ) 1/2  ( ) 1/4" },
    { label: "Estado Sistema AdBlue", opts: "( ) Normal  ( ) Bajo  ( ) Crítico  ( ) N/A" },
    { label: "Estado Neumáticos", opts: "( ) Bueno  ( ) Regular  ( ) Malo" },
    { label: "Presión Neumáticos OK", opts: "(  ) SÍ           (  ) NO" },
    { label: "Plumillas Limpiaparabrisas", opts: "( ) Bueno  ( ) Regular  ( ) Malo" },
    { label: "Limpiaparabrisas / Luneta OK", opts: "(  ) SÍ           (  ) NO" },
    { label: "Carrocería e Iluminación Limpia", opts: "(  ) SÍ           (  ) NO" },
  ];

  const itemsRight = [
    { label: "Pastillas y Discos de Frenos", opts: "( ) Bueno  ( ) Regular  ( ) Malo" },
    { label: "Luces de Emergencia / Balizas", opts: "(  ) Operativo   (  ) No Op." },
    { label: "Sirena y Claxon Bitono", opts: "(  ) Operativo   (  ) No Op." },
    { label: "Testigos de Tablero / Alertas", opts: "( ) Normal  ( ) Con Alerta" },
    { label: "Sistema Carga y Baterías", opts: "( ) Bueno  ( ) Regular  ( ) Malo" },
    { label: "Gata Elevadora y Manivela", opts: "(  ) SÍ           (  ) NO" },
    { label: "Juego de Llaves de Rueda", opts: "(  ) SÍ           (  ) NO" },
    { label: "Juego de Triángulos Seguridad", opts: "(  ) SÍ           (  ) NO" },
    { label: "Chaleco Reflectante Reglamentario", opts: "(  ) SÍ           (  ) NO" },
    { label: "Rueda de Repuesto Operativa", opts: "(  ) SÍ           (  ) NO" },
    { label: "Prueba en Ruta Conforme", opts: "(  ) SÍ           (  ) NO" },
    { label: "Lubricación Puertas Conforme", opts: "(  ) SÍ           (  ) NO" },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  const maxRows = Math.max(itemsLeft.length, itemsRight.length);
  for (let i = 0; i < maxRows; i++) {
    const itL = itemsLeft[i];
    const itR = itemsRight[i];

    doc.rect(10, y, colW, 6.2, 'S');
    doc.rect(109.9, y, colW, 6.2, 'S');

    if (itL) {
      doc.text(itL.label, 13, y + 4.2);
      doc.text(itL.opts, 58, y + 4.2);
    }

    if (itR) {
      doc.text(itR.label, 113, y + 4.2);
      doc.text(itR.opts, 160, y + 4.2);
    }

    y += 6.2;
  }

  // 4. Verificaciones Administrativas
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("4. DOCUMENTACIÓN TÉCNICA DEL MÓVIL", 12, y + 3);
  y += 5;

  doc.rect(10, y, 195.9, 10, 'S');
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("• Permiso de Circulación al Día: [   ] SÍ  [   ] NO", 14, y + 6);
  doc.text("• Revisión Técnica al Día: [   ] SÍ  [   ] NO", 68, y + 6);
  doc.text("• Tarjeta Combustible en Móvil: [   ] SÍ  [   ] NO", 120, y + 6);
  doc.text("• Bitácora al Día: [   ] SÍ  [   ] NO", 168, y + 6);
  y += 12;

  // 5. Observaciones
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("5. OBSERVACIONES Y NOVEDADES MECÁNICAS (DETALLE DE ANOMALÍAS)", 12, y + 3);
  y += 5;

  doc.rect(10, y, 195.9, 22, 'S');
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Describa ruidos anormales, faltas de fluidos, daños en carrocería o reparaciones pendientes requeridas en taller:", 14, y + 5);
  
  // Líneas punteadas para escribir a mano
  doc.setLineDashPattern([1, 1], 0);
  doc.line(14, y + 10, 200, y + 10);
  doc.line(14, y + 15, 200, y + 15);
  doc.line(14, y + 20, 200, y + 20);
  doc.setLineDashPattern([], 0);
  y += 24;

  // 6. Firmas
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("6. CONSTANCIA Y FIRMAS DE ENTREGA / RECEPCIÓN", 12, y + 3);
  y += 5;

  const firmW = 60;
  // Conductor Saliente
  doc.rect(10, y, firmW, 28, 'S');
  doc.line(15, y + 20, 65, y + 20);
  doc.setFontSize(7.5);
  doc.text("Firma Conductor Saliente", 20, y + 24);
  doc.setFontSize(6.5);
  doc.text("Certifica estado informado", 21, y + 27);

  // Conductor Entrante
  doc.rect(78, y, firmW, 28, 'S');
  doc.line(83, y + 20, 133, y + 20);
  doc.setFontSize(7.5);
  doc.text("Firma Conductor Entrante", 88, y + 24);
  doc.setFontSize(6.5);
  doc.text("Conforme con recepción móvil", 87, y + 27);

  // Encargado de Transporte / Regularización
  doc.rect(146, y, firmW, 28, 'S');
  doc.line(151, y + 20, 201, y + 20);
  doc.setFontSize(7.5);
  doc.text("V°B° Encargado Transporte", 154, y + 24);
  doc.setFontSize(6.5);
  doc.text("Fecha Regularización Sistema: ___/___", 149, y + 27);

  // Pie de página de contingencia
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("* Documento Oficial de Contingencia. Una vez restablecida la red informática, los datos de esta pauta deben ser digitados en el Sistema Web por el funcionario o encargado responsable.", 10, 272);

  doc.save(`Formulario_Contingencia_Conductor_Hospital_Villarrica.pdf`);
}

/**
 * Genera el Formulario Imprimible de Contingencia para TENS (Hoja de Fijaciones y Cabina Sanitaria)
 */
export function generarPdfContingenciaTens(): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = 215.9;

  // Encabezado Institucional
  doc.setFillColor(13, 78, 81); // teal-900 / hospitalario
  doc.rect(0, 0, pageWidth, 22, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("HOSPITAL DE VILLARRICA - SERVICIO DE SALUD ARAUCANÍA SUR", 12, 9);
  
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("PLAN DE CONTINGENCIA ANTE CAÍDAS DE RED • FORMULARIO FÍSICO DE REGULARIZACIÓN", 12, 15);
  doc.text("CÓDIGO: CONT-TENS-02", 175, 15);

  // Subtítulo del Documento
  doc.setFillColor(240, 253, 250); // teal-50
  doc.rect(10, 25, 195.9, 9, 'F');
  doc.setDrawColor(153, 246, 228);
  doc.rect(10, 25, 195.9, 9, 'S');

  doc.setTextColor(17, 94, 89);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PAUTA DE CABINA SANITARIA, FIJACIONES Y EQUIPAMIENTO CLÍNICO (TENS)", 14, 31);

  // 1. Datos del Móvil y Turno
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("1. IDENTIFICACIÓN DEL MÓVIL Y TURNO ASISTENCIAL", 12, 40);

  doc.setFont("helvetica", "normal");
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 42, 195.9, 14, 'S');
  
  doc.text("Placa Patente: [                           ]", 14, 48);
  doc.text("Fecha: [     /     / 202   ]", 75, 48);
  doc.text("Turno:  (  ) Día (08:00 - 20:00)    (  ) Noche (20:00 - 08:00)", 125, 48);
  
  doc.text("Móvil SAMU / Básica: [                                      ]", 14, 53);
  doc.text("Folio Sistema Asociado (si existe): [                   ]", 125, 53);

  // 2. Personal TENS
  doc.setFont("helvetica", "bold");
  doc.text("2. PERSONAL CLÍNICO (TENS)", 12, 62);
  doc.rect(10, 64, 195.9, 14, 'S');

  doc.setFont("helvetica", "normal");
  doc.text("TENS Saliente (Entrega): [                                                                 ]  RUT: [                        ]", 14, 70);
  doc.text("TENS Entrante (Recibe): [                                                                   ]  RUT: [                        ]", 14, 75);

  // 3. Pauta de Chequeo de Fijaciones y Equipamiento
  doc.setFont("helvetica", "bold");
  doc.text("3. LISTA DE CHEQUEO DE FIJACIONES, EQUIPOS CRÍTICOS Y BIOSEGURIDAD", 12, 84);

  let y = 87;
  const colW = 96;

  // Cabecera de columnas
  doc.setFillColor(204, 251, 241);
  doc.rect(10, y, colW, 6, 'F');
  doc.rect(109.9, y, colW, 6, 'F');
  doc.rect(10, y, colW, 6, 'S');
  doc.rect(109.9, y, colW, 6, 'S');

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("ÍTEM CLÍNICO / ANCLAJE", 14, y + 4.2);
  doc.text("ESTADO / CONFORMIDAD", 68, y + 4.2);

  doc.text("ÍTEM CLÍNICO / ANCLAJE", 114, y + 4.2);
  doc.text("ESTADO / CONFORMIDAD", 168, y + 4.2);

  y += 6;

  const itemsTensLeft = [
    { label: "Sujeción Camilla: Correa Superior", opts: "(  ) Operativo   (  ) No Op." },
    { label: "Sujeción Camilla: Correa Inferior", opts: "(  ) Operativo   (  ) No Op." },
    { label: "Anclaje de Camilla al Piso del Móvil", opts: "(  ) Operativo   (  ) No Op." },
    { label: "Cinturón Asiento Cabecera Camilla", opts: "(  ) Operativo   (  ) No Op." },
    { label: "Cinturones Asientos Laterales", opts: "(  ) Operativo   (  ) No Op." },
    { label: "Anclaje / Soporte Silla de Ruedas", opts: "( ) Operativo  ( ) No Op.  ( ) N/A" },
    { label: "Anclaje / Fijación Incubadora", opts: "( ) Operativo  ( ) No Op.  ( ) N/A" },
  ];

  const itemsTensRight = [
    { label: "Fijación Desfibrilador / Monitor", opts: "( ) Operativo  ( ) No Op.  ( ) N/A" },
    { label: "Fijación Monitor de Signos Vitales", opts: "( ) Operativo  ( ) No Op.  ( ) N/A" },
    { label: "Fijación Bomba de Infusión", opts: "( ) Operativo  ( ) No Op.  ( ) N/A" },
    { label: "Fijación Bomba de Aspiración", opts: "( ) Operativo  ( ) No Op.  ( ) N/A" },
    { label: "Gavetas y Cierres de Almacenaje", opts: "(  ) Operativo   (  ) No Op." },
    { label: "Cabina Limpia y Desinfectada", opts: "(  ) CONFORME     (  ) NO" },
    { label: "Cilindro de Oxígeno Principal Lleno", opts: "(  ) CONFORME     (  ) NO" },
    { label: "Cilindro de Oxígeno Portátil Lleno", opts: "(  ) CONFORME     (  ) NO" },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  const maxTensRows = Math.max(itemsTensLeft.length, itemsTensRight.length);
  for (let i = 0; i < maxTensRows; i++) {
    const itL = itemsTensLeft[i];
    const itR = itemsTensRight[i];

    doc.rect(10, y, colW, 7, 'S');
    doc.rect(109.9, y, colW, 7, 'S');

    if (itL) {
      doc.text(itL.label, 13, y + 4.5);
      doc.text(itL.opts, 58, y + 4.5);
    }

    if (itR) {
      doc.text(itR.label, 113, y + 4.5);
      doc.text(itR.opts, 160, y + 4.5);
    }

    y += 7;
  }

  // 4. Insumos y Equipos Biomédicos
  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("4. ESTADO DE EQUIPAMIENTO BIOMÉDICO Y BOLSOS DE PARO", 12, y + 3);
  y += 5;

  doc.rect(10, y, 195.9, 12, 'S');
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("• Bolso de Reanimación / Paro Sellado: [   ] SÍ  [   ] NO", 14, y + 5);
  doc.text("• Fondeoscopio y Esfigmomanómetro: [   ] OK  [   ] Malo", 85, y + 5);
  doc.text("• Termómetro y Saturometría: [   ] OK  [   ] Malo", 145, y + 5);
  
  doc.text("• Reguladores / Flujómetros de Red: [   ] Operativo  [   ] Fuga", 14, y + 9.5);
  doc.text("• Maletín de Vía Aérea: [   ] Conforme  [   ] Incompleto", 85, y + 9.5);
  doc.text("• Dispositivo Succión: [   ] Operativo  [   ] Falla", 145, y + 9.5);
  y += 15;

  // 5. Observaciones
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("5. OBSERVACIONES Y NOVEDADES CLÍNICAS (CALIDAD Y SEGURIDAD DEL PACIENTE)", 12, y + 3);
  y += 5;

  doc.rect(10, y, 195.9, 28, 'S');
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Detalle faltantes de insumos, fallas en correas de sujeción, roturas en gavetas o novedades para la Unidad de Calidad:", 14, y + 5);
  
  // Líneas punteadas
  doc.setLineDashPattern([1, 1], 0);
  doc.line(14, y + 11, 200, y + 11);
  doc.line(14, y + 16, 200, y + 16);
  doc.line(14, y + 21, 200, y + 21);
  doc.line(14, y + 26, 200, y + 26);
  doc.setLineDashPattern([], 0);
  y += 30;

  // 6. Firmas
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("6. CONSTANCIA Y FIRMAS DE ENTREGA / RECEPCIÓN SANITARIA", 12, y + 3);
  y += 5;

  const firmW = 60;
  // TENS Saliente
  doc.rect(10, y, firmW, 28, 'S');
  doc.line(15, y + 20, 65, y + 20);
  doc.setFontSize(7.5);
  doc.text("Firma TENS Saliente", 22, y + 24);
  doc.setFontSize(6.5);
  doc.text("Certifica cabina y fijaciones", 20, y + 27);

  // TENS Entrante
  doc.rect(78, y, firmW, 28, 'S');
  doc.line(83, y + 20, 133, y + 20);
  doc.setFontSize(7.5);
  doc.text("Firma TENS Entrante", 91, y + 24);
  doc.setFontSize(6.5);
  doc.text("Recepción conforme cabina", 88, y + 27);

  // Supervisor / Regularizador
  doc.rect(146, y, firmW, 28, 'S');
  doc.line(151, y + 20, 201, y + 20);
  doc.setFontSize(7.5);
  doc.text("V°B° Calidad / Supervisión", 154, y + 24);
  doc.setFontSize(6.5);
  doc.text("Fecha Regularización Sistema: ___/___", 149, y + 27);

  // Pie de página de contingencia
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("* Documento Oficial de Contingencia. Una vez restablecida la red informática, los datos de esta pauta deben ser digitados en el Sistema Web por el funcionario o encargado responsable.", 10, 272);

  doc.save(`Formulario_Contingencia_TENS_Hospital_Villarrica.pdf`);
}
