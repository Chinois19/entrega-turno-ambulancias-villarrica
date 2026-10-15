/**
 * SCRIPT DE MIGRACIÓN DE USUARIOS — Hospital de Villarrica
 * =========================================================
 * Este script crea las cuentas en Firebase Auth y los documentos
 * correspondientes en Firestore (colección: usuarios/).
 *
 * Ejecutar UNA SOLA VEZ desde la consola del navegador o desde
 * un entorno Node con las credenciales de Admin SDK.
 *
 * ⚠️  INSTRUCCIONES DE USO (Consola Firebase o entorno local):
 *
 * 1. Asegúrate de estar en el proyecto Firebase correcto
 * 2. Habilita Email/Password en Firebase Auth Console:
 *    Authentication → Sign-in method → Email/Password → Enable
 * 3. Abre la app en el navegador
 * 4. Abre las DevTools (F12) → Consola
 * 5. Copia y pega este script completo
 * 6. Presiona Enter para ejecutarlo
 * 7. Para cada usuario creado, el admin deberá asignar una contraseña
 *    provisoria a través del MantenedorUsuariosView en la app
 *    (que usa Firebase Auth → sendPasswordResetEmail o contraseña manual).
 *
 * ALTERNATIVA (recomendada): Usar la consola Firebase directamente:
 *    Authentication → Users → Add User
 *    Ingresar email + contraseña temporal para cada funcionario
 *    Luego en Firestore crear el documento en usuarios/{uid}
 */

// ─── Usuarios a crear ─────────────────────────────────────────────────────────
// Formato: { email, password_inicial, perfil }
// La contraseña inicial es temporal — el sistema obliga cambiarla al primer login

const USUARIOS_FIREBASE = [
  // ── Roles de gestión ──────────────────────────────────────────────────────
  {
    email: "calidad@hospitalvillarrica.cl",
    password: "Villarrica-CALI",
    perfil: {
      nombre: "Dra. Marcela Lagos",
      rut: "9.999.999-9",
      rol: "calidad",
      cargo: "Encargada de Calidad y Acreditación",
      activo: true,
      isTemporaryPassword: true
    }
  },
  {
    email: "transporte@hospitalvillarrica.cl",
    password: "Villarrica-TRAN",
    perfil: {
      nombre: "Roberto Zambrano",
      rut: "8.888.888-8",
      rol: "transporte",
      cargo: "Jefe Unidad de Transporte y Parque Automotriz",
      activo: true,
      isTemporaryPassword: true
    }
  },

  // ── Conductores ───────────────────────────────────────────────────────────
  { email: "vlazo@hospitalvillarrica.cl",       password: "Villarrica-COND", perfil: { nombre: "Víctor Lazo Esparza",            rut: "11.111.111-1", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "ggatica@hospitalvillarrica.cl",     password: "Villarrica-COND", perfil: { nombre: "Gerard Gatica Bustos",           rut: "12.222.222-2", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "aballadares@hospitalvillarrica.cl", password: "Villarrica-COND", perfil: { nombre: "Aldo Balladares Gonzales",       rut: "13.333.333-3", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "fmolina@hospitalvillarrica.cl",     password: "Villarrica-COND", perfil: { nombre: "Franklin Molina Berrios",        rut: "14.444.444-4", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "rvera@hospitalvillarrica.cl",       password: "Villarrica-COND", perfil: { nombre: "Rony Vera Villagran",            rut: "15.555.555-5", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "dsanmartin@hospitalvillarrica.cl",  password: "Villarrica-COND", perfil: { nombre: "Daniel San Martín San Martin",  rut: "16.666.666-6", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "jcabezas@hospitalvillarrica.cl",    password: "Villarrica-COND", perfil: { nombre: "Jonathan Cabezas Lagos",        rut: "17.777.777-7", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "jmanosalva@hospitalvillarrica.cl",  password: "Villarrica-COND", perfil: { nombre: "Javier Manosalva Barbett",      rut: "18.888.888-8", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "jsanmartin@hospitalvillarrica.cl",  password: "Villarrica-COND", perfil: { nombre: "José San Martín Calderón",      rut: "19.999.999-9", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "mgarrido@hospitalvillarrica.cl",    password: "Villarrica-COND", perfil: { nombre: "Mario Garrido Albarran",        rut: "10.123.456-7", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "mcabezas@hospitalvillarrica.cl",    password: "Villarrica-COND", perfil: { nombre: "Manuel Cabezas Lagos",          rut: "11.234.567-8", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "pulloa@hospitalvillarrica.cl",      password: "Villarrica-COND", perfil: { nombre: "Pablo Ulloa Mansilla",          rut: "12.345.678-9", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "mmendoza@hospitalvillarrica.cl",    password: "Villarrica-COND", perfil: { nombre: "Miguel Mendoza Burgos",         rut: "13.456.789-0", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "lcarter@hospitalvillarrica.cl",     password: "Villarrica-COND", perfil: { nombre: "Luis Carter Lillo",             rut: "14.567.890-1", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "bsalas@hospitalvillarrica.cl",      password: "Villarrica-COND", perfil: { nombre: "Bladimir Salas Frey",           rut: "15.678.901-2", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "acartagena@hospitalvillarrica.cl",  password: "Villarrica-COND", perfil: { nombre: "Andrés Cartagena Roa",         rut: "16.789.012-3", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "ciluffi@hospitalvillarrica.cl",     password: "Villarrica-COND", perfil: { nombre: "Cesar Iluffi Olivares",         rut: "17.890.123-4", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "fmolinav@hospitalvillarrica.cl",    password: "Villarrica-COND", perfil: { nombre: "Francisco Molina Valenzuela",   rut: "18.901.234-5", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },
  { email: "lcava@hospitalvillarrica.cl",       password: "Villarrica-COND", perfil: { nombre: "Luis Cava Carinao",             rut: "19.012.345-6", rol: "conductor", cargo: "Conductor SAMU / Traslado", activo: true, isTemporaryPassword: true } },

  // ── TENS ──────────────────────────────────────────────────────────────────
  { email: "csoto@hospitalvillarrica.cl",       password: "Villarrica-TENS", perfil: { nombre: "Camila Andrea Soto Morales",          rut: "12.876.543-2", rol: "tens", cargo: "TENS Clínico de Móvil", activo: true, isTemporaryPassword: true } },
  { email: "rpalma@hospitalvillarrica.cl",      password: "Villarrica-TENS", perfil: { nombre: "Rodrigo Ignacio Palma Reyes",          rut: "14.987.654-3", rol: "tens", cargo: "TENS Clínico de Móvil", activo: true, isTemporaryPassword: true } },
  { email: "vriquelme@hospitalvillarrica.cl",   password: "Villarrica-TENS", perfil: { nombre: "Valentina Paz Riquelme Sepúlveda",     rut: "16.543.210-9", rol: "tens", cargo: "TENS Clínico de Móvil", activo: true, isTemporaryPassword: true } },
  { email: "ecarrillo@hospitalvillarrica.cl",   password: "Villarrica-TENS", perfil: { nombre: "Esteban Gonzalo Carrillo Vera",        rut: "17.654.321-8", rol: "tens", cargo: "TENS Clínico de Móvil", activo: true, isTemporaryPassword: true } },
  { email: "mfuentes@hospitalvillarrica.cl",    password: "Villarrica-TENS", perfil: { nombre: "Margarita Elena Fuentes Torres",       rut: "15.321.654-7", rol: "tens", cargo: "TENS Clínico de Móvil", activo: true, isTemporaryPassword: true } },
];

/**
 * INSTRUCCIONES PARA CREAR USUARIOS EN FIREBASE CONSOLE:
 * --------------------------------------------------------
 * 1. Ve a: https://console.firebase.google.com/project/[TU-PROYECTO]/authentication/users
 * 2. Haz clic en "Add User"
 * 3. Ingresa el email y la contraseña de la lista anterior
 * 4. Una vez creado, copia el UID generado
 * 5. Ve a Firestore → usuarios → Add Document
 * 6. Usa el UID como ID del documento
 * 7. Agrega los campos del objeto "perfil" correspondiente
 *    más los campos: id = UID, email = email, creadoEn = fecha actual
 *
 * CAMPOS REQUERIDOS EN FIRESTORE usuarios/{uid}:
 *   id: string (= Firebase Auth UID)
 *   email: string
 *   nombre: string
 *   rut: string
 *   rol: 'conductor' | 'tens' | 'calidad' | 'transporte' | 'admin'
 *   cargo: string
 *   activo: boolean (= true)
 *   isTemporaryPassword: boolean (= true para primer login)
 *   creadoEn: timestamp
 */

console.log("Lista de usuarios a crear en Firebase Auth + Firestore:");
console.table(USUARIOS_FIREBASE.map(u => ({
  email: u.email,
  password_inicial: u.password,
  rol: u.perfil.rol,
  nombre: u.perfil.nombre
})));

console.log("\n\nCampos que deben ir en Firestore usuarios/{uid}:");
console.log(JSON.stringify({
  id: "[Firebase Auth UID]",
  email: "[correo del usuario]",
  nombre: "[nombre completo]",
  rut: "[RUT con formato 12.345.678-9]",
  rol: "[conductor|tens|calidad|transporte|admin]",
  cargo: "[cargo institucional]",
  activo: true,
  isTemporaryPassword: true,
  creadoEn: "[Timestamp Firebase]"
}, null, 2));
