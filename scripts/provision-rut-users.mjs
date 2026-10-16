import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

function cleanRut(rut) {
  return (rut || "").replace(/[^0-9kK]/g, "").toLowerCase();
}

function rutToAuthEmail(rut) {
  return `${cleanRut(rut)}@hospitalvillarrica.cl`;
}

const DEFAULT_TEMP_PASSWORD = "Turno2026!";

const USERS = [
  // Gestión
  { rut: "9.999.999-9", nombre: "Dra. Marcela Lagos", rol: "calidad", cargo: "Encargada de Calidad y Acreditación", email: "calidad@hospitalvillarrica.cl" },
  { rut: "8.888.888-8", nombre: "Roberto Zambrano", rol: "transporte", cargo: "Jefe Unidad de Transporte y Parque Automotriz", email: "transporte@hospitalvillarrica.cl" },

  // Conductores
  { rut: "11.111.111-1", nombre: "Víctor Lazo Esparza", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "vlazo@hospitalvillarrica.cl" },
  { rut: "12.222.222-2", nombre: "Gerard Gatica Bustos", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "ggatica@hospitalvillarrica.cl" },
  { rut: "13.333.333-3", nombre: "Aldo Balladares Gonzales", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "aballadares@hospitalvillarrica.cl" },
  { rut: "14.444.444-4", nombre: "Franklin Molina Berrios", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "fmolina@hospitalvillarrica.cl" },
  { rut: "15.555.555-5", nombre: "Rony Vera Villagran", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "rvera@hospitalvillarrica.cl" },
  { rut: "16.666.666-6", nombre: "Daniel San Martín San Martin", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "dsanmartin@hospitalvillarrica.cl" },
  { rut: "17.777.777-7", nombre: "Jonathan Cabezas Lagos", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "jcabezas@hospitalvillarrica.cl" },
  { rut: "18.888.888-8", nombre: "Javier Manosalva Barbett", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "jmanosalva@hospitalvillarrica.cl" },
  { rut: "19.999.999-9", nombre: "José San Martín Calderón", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "jsanmartin@hospitalvillarrica.cl" },
  { rut: "10.123.456-7", nombre: "Mario Garrido Albarran", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "mgarrido@hospitalvillarrica.cl" },
  { rut: "11.234.567-8", nombre: "Manuel Cabezas Lagos", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "mcabezas@hospitalvillarrica.cl" },
  { rut: "12.345.678-9", nombre: "Pablo Ulloa Mansilla", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "pulloa@hospitalvillarrica.cl" },
  { rut: "13.456.789-0", nombre: "Miguel Mendoza Burgos", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "mmendoza@hospitalvillarrica.cl" },
  { rut: "14.567.890-1", nombre: "Luis Carter Lillo", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "lcarter@hospitalvillarrica.cl" },
  { rut: "15.678.901-2", nombre: "Bladimir Salas Frey", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "bsalas@hospitalvillarrica.cl" },
  { rut: "16.789.012-3", nombre: "Andrés Cartagena Roa", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "acartagena@hospitalvillarrica.cl" },
  { rut: "17.890.123-4", nombre: "Cesar Iluffi Olivares", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "ciluffi@hospitalvillarrica.cl" },
  { rut: "18.901.234-5", nombre: "Francisco Molina Valenzuela", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "fmolinav@hospitalvillarrica.cl" },
  { rut: "19.012.345-6", nombre: "Luis Cava Carinao", rol: "conductor", cargo: "Conductor SAMU / Traslado", email: "lcava@hospitalvillarrica.cl" },

  // TENS
  { rut: "12.876.543-2", nombre: "Camila Andrea Soto Morales", rol: "tens", cargo: "TENS Clínico de Móvil", email: "csoto@hospitalvillarrica.cl" },
  { rut: "14.987.654-3", nombre: "Rodrigo Ignacio Palma Reyes", rol: "tens", cargo: "TENS Clínico de Móvil", email: "rpalma@hospitalvillarrica.cl" },
  { rut: "16.543.210-9", nombre: "Valentina Paz Riquelme Sepúlveda", rol: "tens", cargo: "TENS Clínico de Móvil", email: "vriquelme@hospitalvillarrica.cl" },
  { rut: "17.654.321-8", nombre: "Esteban Gonzalo Carrillo Vera", rol: "tens", cargo: "TENS Clínico de Móvil", email: "ecarrillo@hospitalvillarrica.cl" },
  { rut: "15.321.654-7", nombre: "Margarita Elena Fuentes Torres", rol: "tens", cargo: "TENS Clínico de Móvil", email: "mfuentes@hospitalvillarrica.cl" },
];

async function main() {
  console.log("Iniciando aprovisionamiento de usuarios por RUT...");

  // Sign in as admin first to write profiles
  const adminCred = await signInWithEmailAndPassword(auth, "gonzalop14@gmail.com", "Josefa20");
  console.log("Admin autenticado con UID:", adminCred.user.uid);

  let createdCount = 0;
  for (const u of USERS) {
    const authEmail = rutToAuthEmail(u.rut);
    let uid = null;

    try {
      // 1. Intentar crear en Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, authEmail, DEFAULT_TEMP_PASSWORD);
      uid = cred.user.uid;
      console.log(`[CREADO] ${u.nombre} (${u.rut}) -> Auth Email: ${authEmail} [UID: ${uid}]`);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        // Ya existe en Auth, obtener UID haciendo login
        try {
          const existingCred = await signInWithEmailAndPassword(auth, authEmail, DEFAULT_TEMP_PASSWORD);
          uid = existingCred.user.uid;
          console.log(`[YA EXISTE] ${u.nombre} (${u.rut}) -> Auth UID: ${uid}`);
        } catch (loginErr) {
          console.warn(`[PASSWORD MODIFICADA] ${u.nombre} (${u.rut}) ya tiene cuenta con clave personalizada.`);
        }
      } else {
        console.error(`[ERROR AUTH] ${u.nombre} (${u.rut}):`, err.message);
      }
    }

    // Volver a loguear como admin para poder escribir en Firestore si es necesario
    await signInWithEmailAndPassword(auth, "gonzalop14@gmail.com", "Josefa20");

    if (uid) {
      // 2. Guardar perfil en Firestore usuarios/{uid}
      await setDoc(doc(db, "usuarios", uid), {
        id: uid,
        nombre: u.nombre,
        rut: u.rut,
        email: u.email,
        authEmail: authEmail,
        rol: u.rol,
        cargo: u.cargo,
        activo: true,
        isTemporaryPassword: true,
        creadoEn: new Date().toISOString()
      }, { merge: true });
      createdCount++;
    }
  }

  console.log(`\n=== Aprovisionamiento finalizado: ${createdCount}/${USERS.length} usuarios listos para ingresar por RUT ===`);
  process.exit(0);
}

main().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
