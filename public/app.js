if (typeof document === "undefined") {
  console.error("Este script debe ejecutarse en un navegador.");
  process.exit(1); // Detiene la ejecución si se ejecuta en Node.js
}

/**********************
 * Configuración Firebase
 **********************/
const firebaseConfig = {
  apiKey: "AIzaSyBV9LFUeZ4fHKv9FWwA_kLBiPaPeCGHR-8",
  authDomain: "didactinder-d642f.firebaseapp.com",
  projectId: "didactinder-d642f",
  storageBucket: "didactinder-d642f.firebasestorage.app",
  messagingSenderId: "851846177120",
  appId: "1:851846177120:web:0275907fd82d4e0c1b7e05"
};

// Verificar la configuración antes de inicializar Firebase
console.log(firebaseConfig);

// Ahora, importa Firebase y configura la app
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Usa Firestore y Auth
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

/**********************
* Variables globales
**********************/
let currentUser = null;
let uploadedPhotos = []; // Array para almacenar las URLs de las fotos subidas

/**********************
* Función para cambiar entre pestañas
**********************/
function changeTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.style.display = (tab.id === tabName) ? 'block' : 'none';
  });
  
  if(tabName === 'compañeros-tab') {
    loadProfiles();
  } else if(tabName === 'matches-tab') {
    loadMatches();
  }
  
  document.querySelectorAll('nav ul.tabs li').forEach(li => {
    li.classList.toggle('active', li.getAttribute('data-tab') === tabName);
  });
}

/**********************
* Manejo de pestañas
**********************/
document.querySelectorAll('nav ul.tabs li').forEach(li => {
  li.addEventListener('click', () => {
    changeTab(li.getAttribute('data-tab'));
  });
});

/**********************
* Autenticación con Google
**********************/
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Maneja el evento de login con Google
document.getElementById('login-btn').addEventListener('click', () => {
  const provider = new GoogleAuthProvider(); // Proveedor de Google
  
  signInWithPopup(auth, provider)
    .then(result => {
      currentUser = result.user;
      // Oculta la sección de login y muestra la app
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('app-section').style.display = 'block';

      // Verificar si el usuario ya tiene un perfil
      db.collection('profiles').doc(currentUser.uid).get()
        .then(doc => {
          if (doc.exists) {
            // Si el perfil existe, cargarlo
            uploadedPhotos = doc.data().photos; // Recuperar fotos subidas
            updateProfileView(); // Actualizar la vista del perfil
            document.getElementById('edit-profile').style.display = 'none'; // Ocultar edición
            document.getElementById('edit-profile-btn').style.display = 'block'; // Mostrar botón de editar
          } else {
            // Si no existe, mostrar la sección de edición
            document.getElementById('edit-profile').style.display = 'block';
            document.getElementById('edit-profile-btn').style.display = 'none';
          }
        })
        .catch(error => {
          console.error("Error al acceder al perfil:", error);
        });
    })
    .catch(error => {
      console.error("Error al iniciar sesión con Google:", error);
    });
});

// Verifica si el usuario ya está logueado al cargar la página
auth.onAuthStateChanged(user => {
  if (user) {
    // El usuario ya está logueado
    currentUser = user;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    
    // Verificar si tiene un perfil
    db.collection('profiles').doc(currentUser.uid).get()
      .then(doc => {
        if (doc.exists) {
          uploadedPhotos = doc.data().photos;
          updateProfileView(); // Actualizar la vista del perfil
          document.getElementById('edit-profile').style.display = 'none';
          document.getElementById('edit-profile-btn').style.display = 'block';
        } else {
          document.getElementById('edit-profile').style.display = 'block';
          document.getElementById('edit-profile-btn').style.display = 'none';
        }
      })
      .catch(error => {
        console.error("Error al acceder al perfil:", error);
      });
  }
});

/**********************
* Subir fotos a Cloudinary (Máx. 3 fotos)
**********************/
document.getElementById('upload-photo').addEventListener('click', () => {
  if (uploadedPhotos.length >= 3) {
    alert("Solo puedes subir hasta 3 fotos.");
    return;
  }

  cloudinary.openUploadWidget({
    cloudName: 'dqazp3l13',
    uploadPreset: 'picsDGtinder', // Configura un preset en Cloudinary
    sources: ['local', 'url', 'camera'],
    multiple: false
  }, (error, result) => {
    if (!error && result && result.event === "success") {
      console.log("Imagen subida: ", result.info.secure_url);
      uploadedPhotos.push(result.info.secure_url);
      updatePhotoPreview(); // Llamar función para actualizar la vista previa
    }
  });
});
