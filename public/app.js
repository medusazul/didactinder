// Importación de los módulos necesarios de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, getDoc, collection, getDocs, arrayUnion, arrayRemove, updateDoc 
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
    await signInWithPopup(auth, provider);
    document.getElementById("login-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";
  } catch (error) {
    console.error("Error de autenticación:", error);
  }
});

// Guardar perfil en Firestore y luego mostrar la tarjeta de perfil
document.getElementById("save-profile").addEventListener("click", async () => {
  const nombre = document.getElementById("nombre").value.trim();
  const bio = document.getElementById("bio").value.trim();
  const user = auth.currentUser;

  if (!user) {
    alert("No estás autenticado");
    return;
  }

  // Verificamos que se hayan ingresado nombre y bio
  if (!nombre || !bio) {
    alert("Por favor, completa el nombre y la biografía.");
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

document.getElementById('save-profile').addEventListener('click', function() {
  const nombre = document.getElementById('nombre').value;
  const bio = document.getElementById('bio').value;
  const photos = document.querySelectorAll('#photos-preview img');

  // Mostrar la tarjeta de perfil
  document.getElementById('profile-name').textContent = nombre;
  document.getElementById('profile-bio').textContent = bio;

  const photosGrid = document.getElementById('profile-photos');
  photosGrid.innerHTML = ''; // Limpiar fotos anteriores
  photos.forEach(photo => {
    const img = document.createElement('img');
    img.src = photo.src;
    photosGrid.appendChild(img);
  });

  document.getElementById('edit-profile').style.display = 'none';
  document.getElementById('profile-tab').style.display = 'block';
  document.getElementById('edit-profile-btn').style.display = 'block';
});

document.getElementById('edit-profile-btn').addEventListener('click', function() {
  document.getElementById('edit-profile').style.display = 'block';
  document.getElementById('profile-tab').style.display = 'none';
  document.getElementById('edit-profile-btn').style.display = 'none';
});

// Subir fotos con Cloudinary y actualizar la vista del perfil (pero solo actualizamos la tarjeta si ya se completó el nombre y bio)
document.getElementById("upload-photo").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("No estás autenticado");
    return;
  }

  const userRef = doc(db, "usuarios", user.uid);
  const userSnap = await getDoc(userRef);
  const currentPhotos = userSnap.exists() && userSnap.data().photos ? userSnap.data().photos : [];

  if (currentPhotos.length >= 3) {
    alert("No puedes cargar más de tres fotos.");
    return;
  }

  cloudinary.openUploadWidget(
    {
      cloudName: "dqazp3l13",           // Reemplazá con tu Cloud Name
      uploadPreset: "picsDGtinder",      // Reemplazá con tu Upload Preset
      multiple: true,
      maxFiles: 3 - currentPhotos.length,
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
          const imgContainer = document.createElement("div");
          imgContainer.classList.add("photo-container");

          const img = document.createElement("img");
          img.src = photoURL;
          img.classList.add("photo-preview");

          const deleteBtn = document.createElement("button");
          deleteBtn.innerHTML = "&times;";
          deleteBtn.classList.add("delete-photo");
          deleteBtn.addEventListener("click", async () => {
            imgContainer.remove();
            await updateDoc(doc(db, "usuarios", user.uid), {
              photos: arrayRemove(photoURL)
            });
          });

          imgContainer.appendChild(img);
          imgContainer.appendChild(deleteBtn);
          document.getElementById("photos-preview").appendChild(imgContainer);
          
          // Solo actualizamos la tarjeta si ya se completaron nombre y bio
          const nombreVal = document.getElementById("nombre").value.trim();
          const bioVal = document.getElementById("bio").value.trim();
          if (nombreVal && bioVal) {
            cargarPerfilUsuario();
          }
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
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("photo-container");

        const img = document.createElement("img");
        img.src = url;
        img.classList.add("photo-preview");

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "&times;";
        deleteBtn.classList.add("delete-photo");
        deleteBtn.addEventListener("click", async () => {
          imgContainer.remove();
          await updateDoc(doc(db, "usuarios", user.uid), {
            photos: arrayRemove(url)
          });
        });

        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);
        photosContainer.appendChild(imgContainer);
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
    mc.on("swipeleft", async () => {
      tarjeta.style.transform = "translateX(-100%)";
      setTimeout(() => tarjeta.remove(), 300);
      console.log("Rechazado:", tarjeta.querySelector("h3").textContent);
    });
    mc.on("swiperight", async () => {
      tarjeta.style.transform = "translateX(100%)";
      setTimeout(() => tarjeta.remove(), 300);
      console.log("Seleccionado:", tarjeta.querySelector("h3").textContent);

      const user = auth.currentUser;
      const compaId = tarjeta.getAttribute("data-id");

      if (user && compaId) {
        try {
          await setDoc(doc(db, "matches", user.uid), {
            matches: arrayUnion(compaId)
          }, { merge: true });
          console.log("Match guardado:", compaId);
        } catch (error) {
          console.error("Error guardando match:", error);
        }
      }
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
      tarjeta.setAttribute("data-id", docSnap.id); // Añadir data-id

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

// Función para cargar "Tus matches"
async function cargarMatches() {
  const user = auth.currentUser;
  if (!user) return;

  const matchesRef = doc(db, "matches", user.uid);
  const matchesSnap = await getDoc(matchesRef);

  const matchesContainer = document.getElementById("matches-list");
  matchesContainer.innerHTML = "";

  if (matchesSnap.exists()) {
    const matchesData = matchesSnap.data();
    if (matchesData.matches && Array.isArray(matchesData.matches)) {
      for (const matchId of matchesData.matches) {
        const matchRef = doc(db, "usuarios", matchId);
        const matchSnap = await getDoc(matchRef);
        if (matchSnap.exists()) {
          const matchData = matchSnap.data();
          const li = document.createElement("li");
          li.textContent = matchData.nombre;
          matchesContainer.appendChild(li);
        }
      }
    }
  } else {
    matchesContainer.innerHTML = "<li>No tienes matches aún</li>";
  }
}

// --- Código mínimo para el cambio de pestañas ---
// Se asume que en tu HTML tienes las pestañas definidas con data-tab="perfil", data-tab="compas" y data-tab="matches"
// y que el contenido de cada una está en un div con id="perfil", id="compas" e id="matches" respectivamente.
document.querySelectorAll(".tabs li").forEach(tab => {
  tab.addEventListener("click", () => {
    // Ocultar todos los contenidos de las pestañas
    document.querySelectorAll("#tabs-content .tab").forEach(content => {
      content.style.display = "none";
    });
    // Quitar la clase "active" a todas las pestañas
    document.querySelectorAll(".tabs li").forEach(t => t.classList.remove("active"));
    // Mostrar la pestaña seleccionada y agregar clase "active"
    const tabName = tab.getAttribute("data-tab");
    document.getElementById(tabName).style.display = "block";
    tab.classList.add("active");

    // Cargar contenido si es necesario
    if (tabName === "compas") {
      cargarCompas();
    } else if (tabName === "matches") {
      cargarMatches();
    }
  });
});
