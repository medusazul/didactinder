// Importación de los módulos necesarios de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, getDoc, collection, getDocs, arrayUnion 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

// Guardar perfil en Firestore y luego mostrar la tarjeta de perfil
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
    // Cargar la vista de perfil actualizada
    cargarPerfilUsuario();
  } catch (error) {
    console.error("Error guardando perfil: ", error);
  }
});

// Subir fotos con Cloudinary y actualizar la vista del perfil
document.getElementById("upload-photo").addEventListener("click", () => {
  const user = auth.currentUser;
  if (!user) {
    alert("No estás autenticado");
    return;
  }

  cloudinary.openUploadWidget(
    {
      cloudName: "dqazp3l13",           // Reemplazá con tu Cloud Name
      uploadPreset: "picsDGtinder",      // Reemplazá con tu Upload Preset
      multiple: true,
      maxFiles: 3,
      folder: `didactinder/${user.uid}`
    },
    async (error, result) => {
      if (!error && result.event === "success") {
        const photoURL = result.info.secure_url;
        try {
          // Acumular la URL en un array usando arrayUnion
          await setDoc(doc(db, "usuarios", user.uid), {
            photos: arrayUnion(photoURL)
          }, { merge: true });
          
          // Mostrar vista previa en el formulario
          const img = document.createElement("img");
          img.src = photoURL;
          img.classList.add("photo-preview");
          document.getElementById("photos-preview").appendChild(img);
          
          // Actualizar la tarjeta de perfil
          cargarPerfilUsuario();
        } catch (err) {
          console.error("Error guardando fotos:", err);
        }
      }
    }
  );
});

// Función para cargar el perfil del usuario y mostrar la tarjeta en "Tu perfil"
async function cargarPerfilUsuario() {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "usuarios", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    document.getElementById("profile-name").textContent = data.nombre || "";
    document.getElementById("profile-bio").textContent = data.bio || "";

    const photosContainer = document.getElementById("profile-photos");
    photosContainer.innerHTML = "";
    if (data.photos && Array.isArray(data.photos)) {
      data.photos.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        img.classList.add("photo-preview");
        photosContainer.appendChild(img);
      });
    }

    // Ocultar el formulario de edición y mostrar la tarjeta de perfil
    document.getElementById("edit-profile").style.display = "none";
    document.getElementById("profile-tab").style.display = "block";
  }
}

// Función para habilitar el swipe en las tarjetas de "Tus compas"
function habilitarSwipe() {
  document.querySelectorAll(".tarjeta-compa").forEach(tarjeta => {
    const mc = new Hammer(tarjeta);
    mc.on("swipeleft", () => {
      tarjeta.style.transform = "translateX(-100%)";
      setTimeout(() => tarjeta.remove(), 300);
      console.log("Rechazado:", tarjeta.querySelector("h3").textContent);
    });
    mc.on("swiperight", () => {
      tarjeta.style.transform = "translateX(100%)";
      setTimeout(() => tarjeta.remove(), 300);
      console.log("Seleccionado:", tarjeta.querySelector("h3").textContent);
    });
  });
}

// Función para cargar los perfiles de otros usuarios ("Tus compas")
async function cargarCompas() {
  const user = auth.currentUser;
  if (!user) return;

  const usuariosRef = collection(db, "usuarios");
  const querySnapshot = await getDocs(usuariosRef);
  const compasContainer = document.getElementById("compas-container");

  compasContainer.innerHTML = "";

  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (docSnap.id !== user.uid) { // Excluir al usuario actual
      const tarjeta = document.createElement("div");
      tarjeta.classList.add("tarjeta-compa");

      tarjeta.innerHTML = `
        <h3>${data.nombre}</h3>
        <div class="photos-grid">
          ${data.photos ? data.photos.map(url => `<img src="${url}" class="photo-preview">`).join("") : ""}
        </div>
        <p>${data.bio}</p>
      `;

      compasContainer.appendChild(tarjeta);
    }
  });

  // Habilitar swipe en las tarjetas recién creadas
  habilitarSwipe();
}

// Función placeholder para cargar "Tus matches"
function cargarMatches() {
  const matchesContainer = document.getElementById("matches-list");
  matchesContainer.innerHTML = "<li>Aquí se mostrarán tus matches</li>";
}

// Asignar listeners a las pestañas "Tus compas" y "Tus matches"
document.querySelector("[data-tab='compas']").addEventListener("click", cargarCompas);
document.querySelector("[data-tab='matches']").addEventListener("click", cargarMatches);
