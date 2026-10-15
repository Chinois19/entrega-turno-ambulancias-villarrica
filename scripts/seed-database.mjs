import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";

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

const AMBULANCIAS = [
  {
    id: "HKRC-84",
    patente: "HKRC-84",
    nombreMovil: "Móvil 1 - SAMU Avanzada",
    marca: "Mercedes-Benz",
    modelo: "Sprinter 415 CDI",
    anio: 2021,
    fechaEnrolamiento: "2021-03-15",
    kilometrajeActual: 118450,
    estado: "operativa",
    proximoMantenimientoKm: 120000,
    proximoMantenimientoFecha: "2026-10-15",
    tallerAsignado: "Kaufmann Temuco"
  },
  {
    id: "HXRP-19",
    patente: "HXRP-19",
    nombreMovil: "Móvil 2 - SAMU Básica",
    marca: "Peugeot",
    modelo: "Boxer 2.2 HDi",
    anio: 2020,
    fechaEnrolamiento: "2020-08-10",
    kilometrajeActual: 149800,
    estado: "operativa",
    proximoMantenimientoKm: 150000,
    proximoMantenimientoFecha: "2026-09-28",
    tallerAsignado: "Taller Central SSASUR"
  },
  {
    id: "PHGS-31",
    patente: "PHGS-31",
    nombreMovil: "Móvil 3 - Respaldo Urgencia",
    marca: "Ford",
    modelo: "Transit 350L",
    anio: 2022,
    fechaEnrolamiento: "2022-05-20",
    kilometrajeActual: 72300,
    estado: "operativa",
    proximoMantenimientoKm: 80000,
    proximoMantenimientoFecha: "2026-12-01",
    tallerAsignado: "Gildemeister"
  },
  {
    id: "FLJW-90",
    patente: "FLJW-90",
    nombreMovil: "Móvil 4 - Transporte Pacientes",
    marca: "Hyundai",
    modelo: "H350",
    anio: 2019,
    fechaEnrolamiento: "2019-11-05",
    kilometrajeActual: 198200,
    estado: "en_mantencion",
    proximoMantenimientoKm: 200000,
    proximoMantenimientoFecha: "2026-10-02",
    tallerAsignado: "Taller Municipal Villarrica",
    observaciones: "Cambio de pastillas y discos de freno delanteros"
  }
];

async function seed() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "gonzalop14@gmail.com", "AdminVillarrica2026!");
    const uid = cred.user.uid;
    console.log("Authenticated as Admin UID:", uid);

    // 1. Create admin profile in usuarios/{uid}
    await setDoc(doc(db, "usuarios", uid), {
      id: uid,
      email: "gonzalop14@gmail.com",
      nombre: "Gonzalo Pérez (Administrador)",
      rut: "1-9",
      rol: "admin",
      cargo: "Administrador del Sistema y TI",
      activo: true,
      isTemporaryPassword: false,
      creadoEn: new Date().toISOString()
    });
    console.log("Admin profile written successfully to usuarios/" + uid);

    // 2. Batch write ambulancias
    const batch = writeBatch(db);
    for (const amb of AMBULANCIAS) {
      batch.set(doc(db, "ambulancias", amb.patente), amb);
    }
    await batch.commit();
    console.log("Fleet of 4 ambulances written successfully to ambulancias/");

    console.log("SEEDED_OK");
    process.exit(0);
  } catch (err) {
    console.error("SEED_ERROR:", err);
    process.exit(1);
  }
}

seed();
