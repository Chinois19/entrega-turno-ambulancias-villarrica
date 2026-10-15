import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, writeBatch, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQM8iWQX0pr5t81TzAl7nJsktX2lKfbJ8",
  authDomain: "ambulancias-villarrica.firebaseapp.com",
  projectId: "ambulancias-villarrica",
  storageBucket: "ambulancias-villarrica.firebasestorage.app",
  messagingSenderId: "115797701475",
  appId: "1:115797701475:web:39fb079e59f211616bd956"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const USUARIOS_DEMO = [
  {
    id: "calidad-marcela-lagos",
    email: "calidad@hospitalvillarrica.cl",
    nombre: "Dra. Marcela Lagos",
    rut: "9.999.999-9",
    rol: "calidad",
    cargo: "Encargada de Calidad y Acreditación",
    activo: true,
    isTemporaryPassword: false,
    creadoEn: new Date().toISOString()
  },
  {
    id: "transporte-roberto-zambrano",
    email: "transporte@hospitalvillarrica.cl",
    nombre: "Roberto Zambrano",
    rut: "8.888.888-8",
    rol: "transporte",
    cargo: "Jefe Unidad de Transporte y Parque Automotriz",
    activo: true,
    isTemporaryPassword: false,
    creadoEn: new Date().toISOString()
  },
  {
    id: "cond-victor-lazo",
    email: "vlazo@hospitalvillarrica.cl",
    nombre: "Víctor Lazo Esparza",
    rut: "11.111.111-1",
    rol: "conductor",
    cargo: "Conductor SAMU / Traslado",
    activo: true,
    isTemporaryPassword: true,
    creadoEn: new Date().toISOString()
  },
  {
    id: "tens-camila-soto",
    email: "csoto@hospitalvillarrica.cl",
    nombre: "Camila Andrea Soto Morales",
    rut: "12.876.543-2",
    rol: "tens",
    cargo: "TENS Clínico de Móvil",
    activo: true,
    isTemporaryPassword: true,
    creadoEn: new Date().toISOString()
  }
];

const TURNO_DEMO = {
  id: "ENT-COND-20261015-01",
  patente: "HKRC-84",
  fecha: new Date().toISOString().split("T")[0],
  turno: "Largo",
  tipoTurno: "24h",
  kilometrajeSalida: 118450,
  conductorSaliente: {
    nombre: "Víctor Lazo Esparza",
    rut: "11.111.111-1",
    firmaUrl: "",
    fechaHora: new Date().toISOString()
  },
  conductorEntrante: {
    nombre: "Gerard Gatica Bustos",
    rut: "12.222.222-2",
    firmaUrl: "",
    fechaHora: new Date().toISOString()
  },
  tensSaliente: {
    nombre: "Camila Andrea Soto Morales",
    rut: "12.876.543-2",
    firmaUrl: "",
    fechaHora: new Date().toISOString()
  },
  tensEntrante: {
    nombre: "Rodrigo Ignacio Palma Reyes",
    rut: "14.987.654-3",
    firmaUrl: "",
    fechaHora: new Date().toISOString()
  },
  checklistConductor: {
    permisoCirculacion: true,
    revisionTecnica: true,
    tarjetaCombustible: "Si",
    bitacoraMovil: "Si",
    nivelAceite: "Normal",
    nivelAguaRefrigerante: "Normal",
    nivelLiquidoFrenos: "Normal",
    nivelLiquidoDireccion: "Normal",
    nivelCombustible: "Lleno",
    estadoNeumaticos: "Bueno",
    presionNeumaticos: true,
    estadoPlumillas: "Bueno",
    limpiaparabrisasLuneta: true,
    exteriorLimpioSinDano: true
  },
  checklistTens: {
    desfibriladorOperativo: true,
    oxigenoCentralPsi: 1800,
    oxigenoPortatilPsi: 1500,
    aspiradorSecreciones: true,
    monitorSignosVitales: true,
    maletinViaAereaCompleto: true,
    maletinTraumaCompleto: true,
    maletinPartoSellado: true,
    bolsoMedicamentosSellado: true,
    camillaPrincipalOperativa: true,
    tablaEspinalYCollares: true,
    sillaRuedasOperativa: true,
    limpiezaDesinfeccionCabina: true
  },
  estado: "completo",
  observacionesGenerales: "Entrega de turno sin incidentes mayores. Móvil en perfectas condiciones.",
  creadoPor: "vlazo@hospitalvillarrica.cl",
  creadoEn: new Date().toISOString()
};

const NOVEDAD_DEMO = {
  id: "NOV-20261015-01",
  folioTurno: "ENT-COND-20261015-01",
  patente: "FLJW-90",
  tipo: "mecanica",
  itemAfectado: "Frenos delanteros",
  descripcion: "Se detecta vibración leve en pedal de freno al descender en pendiente.",
  criticidad: "media",
  estado: "en_revision",
  reportadoPor: "Víctor Lazo Esparza",
  reportadoRol: "conductor",
  reportadoEn: new Date().toISOString(),
  asignadoA: "Roberto Zambrano (Jefe de Transporte)"
};

async function main() {
  await signInWithEmailAndPassword(auth, "gonzalop14@gmail.com", "AdminVillarrica2026!");
  console.log("Logged in!");

  // 1. Seed usuarios
  const batchUsers = writeBatch(db);
  for (const u of USUARIOS_DEMO) {
    batchUsers.set(doc(db, "usuarios", u.id), u);
  }
  await batchUsers.commit();
  console.log("Usuarios seeded!");

  // 2. Seed entregas_turno
  await setDoc(doc(db, "entregas_turno", TURNO_DEMO.id), TURNO_DEMO);
  console.log("Turno seeded!");

  // 3. Seed novedades + subcoleccion acciones
  await setDoc(doc(db, "novedades", NOVEDAD_DEMO.id), NOVEDAD_DEMO);
  await addDoc(collection(db, "novedades", NOVEDAD_DEMO.id, "acciones"), {
    fechaHora: new Date().toISOString(),
    usuario: "Roberto Zambrano",
    rut: "8.888.888-8",
    rol: "transporte",
    accionTomada: "Móvil ingresado a Taller Municipal para revisión de pastillas.",
    estadoAnterior: "pendiente",
    nuevoEstado: "en_revision"
  });
  console.log("Novedad y subcoleccion acciones seeded!");

  console.log("ALL COLLECTIONS CREATED SUCCESSFULLY!");
  process.exit(0);
}

main().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});
