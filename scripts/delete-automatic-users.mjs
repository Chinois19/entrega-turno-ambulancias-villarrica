import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, deleteUser } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";

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

const PASSWORDS_TO_TRY = ["Turno2026!", "Villarrica-COND", "Villarrica-TENS", "Villarrica-CALI", "Villarrica-TRAN", "123456"];

async function main() {
  console.log("=== Eliminación de Usuarios Automáticos (@hospitalvillarrica.cl) ===");

  // 1. Iniciar sesión como Admin
  await signInWithEmailAndPassword(auth, "gonzalop14@gmail.com", "Josefa20");
  console.log("Admin autenticado correctamente.");

  // 2. Obtener todos los usuarios de Firestore
  const usersSnap = await getDocs(collection(db, "usuarios"));
  console.log(`Total usuarios encontrados en Firestore: ${usersSnap.size}`);

  const toDelete = [];
  usersSnap.forEach((d) => {
    const data = d.data();
    const email = (data.email || "").toLowerCase();
    const authEmail = (data.authEmail || "").toLowerCase();
    if (email.endsWith("@hospitalvillarrica.cl") || authEmail.endsWith("@hospitalvillarrica.cl")) {
      toDelete.push({
        docId: d.id,
        nombre: data.nombre,
        email: data.email,
        authEmail: data.authEmail,
        rut: data.rut
      });
    }
  });

  console.log(`Usuarios a eliminar: ${toDelete.length}`);

  for (const u of toDelete) {
    console.log(`\nProcesando: ${u.nombre} (${u.email || u.authEmail}) [DocID: ${u.docId}]`);

    // A. Eliminar de Firestore usuarios
    try {
      await deleteDoc(doc(db, "usuarios", u.docId));
      console.log(`  -> Eliminado de Firestore 'usuarios/${u.docId}' [OK]`);
    } catch (e) {
      console.error(`  -> Error eliminando de Firestore usuarios: ${e.message}`);
    }

    // B. Eliminar de rut_lookup
    if (u.rut) {
      const cleanRut = u.rut.replace(/[^0-9kK]/g, "").toLowerCase();
      try {
        await deleteDoc(doc(db, "rut_lookup", cleanRut));
        console.log(`  -> Eliminado de 'rut_lookup/${cleanRut}' [OK]`);
      } catch (e) {
        // May not exist, ignore
      }
    }

    // C. Intentar eliminar de Firebase Auth iniciando sesión con su cuenta y deleteUser
    const emailsToTry = [u.authEmail, u.email].filter(Boolean);
    let authDeleted = false;
    for (const email of emailsToTry) {
      if (authDeleted) break;
      for (const pwd of PASSWORDS_TO_TRY) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, pwd);
          await deleteUser(userCred.user);
          console.log(`  -> Eliminado de Firebase Auth (${email}) [OK]`);
          authDeleted = true;
          // Re-iniciar como admin
          await signInWithEmailAndPassword(auth, "gonzalop14@gmail.com", "Josefa20");
          break;
        } catch (err) {
          // Continue trying other passwords
        }
      }
    }
    if (!authDeleted) {
      console.log(`  -> No se eliminó de Auth (o ya no existía en Auth).`);
    }
  }

  // 3. Revisar también si quedan documentos huérfanos en rut_lookup con @hospitalvillarrica.cl
  console.log("\nRevisando rut_lookup...");
  const rutSnap = await getDocs(collection(db, "rut_lookup"));
  for (const rd of rutSnap.docs) {
    const data = rd.data();
    if ((data.email || "").toLowerCase().endsWith("@hospitalvillarrica.cl")) {
      await deleteDoc(doc(db, "rut_lookup", rd.id));
      console.log(`  -> rut_lookup/${rd.id} (${data.email}) eliminado [OK]`);
    }
  }

  // 4. Mostrar usuarios que quedaron en el sistema
  console.log("\n=== Usuarios finales restantes en Firestore ===");
  const finalSnap = await getDocs(collection(db, "usuarios"));
  console.log(`Total usuarios restantes: ${finalSnap.size}`);
  finalSnap.forEach((d) => {
    const data = d.data();
    console.log(`• ${data.nombre} | ${data.email} | Rol: ${data.rol} | RUN: ${data.rut}`);
  });

  console.log("\nProceso de eliminación completado.");
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
