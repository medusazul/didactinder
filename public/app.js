// Importación de los módulos necesarios de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBV9LFUeZ4fHKv9FWwA_kLBiPaPeCGHR-8",
  authDomain: "didactinder-d642f.firebaseapp.com",
  projectId: "didactinder-d642f",
  storageBucket: "didactinder-d642f.appspot.com",
  messagingSenderId: "851846177120",
  appId: "1:851846177120:web:0275907fd82d4e0c1b7e05"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Iniciar sesión con Google
document.getElementById("login-btn").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    document.getElementById("login-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";
  } catch (error) {
    console.error("Error de autenticación:", error);
  }
});

// Guardar perfil en Firestore
document.getElementById("save-profile").addEventListener("click", async () => {
  const nombre = document.getElementById("nombre").value;
  const bio = document.getElementById("bio").value;
  const user = auth.currentUser;

  if (!user) {
    alert("No estás autenticado");
    return;
  }

  try {
    await setDoc(doc(db, "usuarios", user.uid), {
      nombre,
      bio,
      timestamp: new Date()
    }, { merge: true });
    alert("Perfil guardado exitosamente");
  } catch (error) {
    console.error("Error guardando perfil: ", error);
  }
});

// Subir fotos con Cloudinary
document.getElementById("upload-photo").addEventListener("click", () => {
  const user = auth.currentUser;
  if (!user) {
    alert("No estás autenticado");
    return;
  }

  cloudinary.openUploadWidget(
    {
      cloudName: "tu-cloud-name", // Reemplazá con tu Cloud Name de Cloudinary
      uploadPreset: "tu-upload-preset", // Reemplazá con tu Upload Preset
      multiple: true,
      maxFiles: 3,
      folder: `didactinder/${user.uid}`
    },
    async (error, result) => {
      if (!error && result.event === "success") {
        const photoURLs = result.info.secure_url;
        
        // Guardar la URL en Firestore
        try {
          await setDoc(doc(db, "usuarios", user.uid), {
            photos: photoURLs
          }, { merge: true });

          // Mostrar vista previa
          const img = document.createElement("img");
          img.src = photoURLs;
          img.classList.add("photo-preview");
          document.getElementById("photos-preview").appendChild(img);
        } catch (err) {
          console.error("Error guardando fotos:", err);
        }
      }
    }
  );
});