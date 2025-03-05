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

// Función para verificar si el perfil está completo
function isProfileComplete(userData) {
  return userData.nombre && 
         userData.bio && 
         userData.photos && 
         userData.photos.length > 0;
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    
    document.getElementById("login-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";
    
    if (userDoc.exists()) {
      document.getElementById("edit-profile").style.display = "none";
      document.getElementById("profile-tab").style.display = "block";
      cargarPerfilUsuario();
    } else {
      document.getElementById("edit-profile").style.display = "block";
      document.getElementById("profile-tab").style.display = "none";
    }
  } else {
    document.getElementById("login-section").style.display = "block";
    document.getElementById("app-section").style.display = "none";
  }
});

// Iniciar sesión con Google y verificar si el usuario ya existe
document.getElementById("login-btn").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Verificar si el usuario ya tiene perfil
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    
    document.getElementById("login-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";
    
    if (userDoc.exists()) {
      // Si el usuario ya existe, mostrar directamente su perfil
      document.getElementById("edit-profile").style.display = "none";
      document.getElementById("profile-tab").style.display = "block";
      cargarPerfilUsuario();
    } else {
      // Si es un usuario nuevo, mostrar el formulario de creación de perfil
      document.getElementById("edit-profile").style.display = "block";
      document.getElementById("profile-tab").style.display = "none";
    }
    
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

  // Mostrar botones de eliminación en el formulario de edición
  document.querySelectorAll('.delete-photo').forEach(btn => {
    btn.classList.remove('hidden');
  });
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
    alert("No podés cargar más de tres fotos.");
    return;
  }

  cloudinary.openUploadWidget(
    {
      cloudName: "dqazp3l13",
      uploadPreset: "picsDGtinder",
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
        deleteBtn.classList.add("delete-photo", "hidden"); // Añadir clase hidden
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
    document.getElementById("edit-profile-btn").style.display = "block";
  }
}

// Función para habilitar el swipe en las tarjetas de "Tus compas"
function habilitarSwipe() {
  document.querySelectorAll(".tarjeta-compa").forEach(tarjeta => {
    const mc = new Hammer(tarjeta);
    
    mc.on("swipeleft", async () => {
      const user = auth.currentUser;
      const compaId = tarjeta.getAttribute("data-id");
      
      tarjeta.style.transform = "translateX(-100vw)";
      tarjeta.style.opacity = "0";
      
      // Registrar rechazo
      await setDoc(doc(db, "interacciones", user.uid), {
        rechazos: arrayUnion(compaId)
      }, { merge: true });
      
      setTimeout(() => tarjeta.remove(), 300);
    });

    mc.on("swiperight", async () => {
      const user = auth.currentUser;
      const compaId = tarjeta.getAttribute("data-id");
      
      tarjeta.style.transform = "translateX(100vw)";
      tarjeta.style.opacity = "0";
      
      try {
        // Registrar match potencial
        await setDoc(doc(db, "matches", user.uid), {
          matches: arrayUnion(compaId)
        }, { merge: true });
        
        // Registrar interacción
        await setDoc(doc(db, "interacciones", user.uid), {
          matches: arrayUnion(compaId)
        }, { merge: true });
        
        setTimeout(() => {
          tarjeta.remove();
          cargarMatches();
        }, 300);
      } catch (error) {
        console.error("Error al registrar match:", error);
      }
    });
  });
}

// Función para cargar los perfiles de otros usuarios ("Tus compas")
async function cargarCompas() {
  const user = auth.currentUser;
  if (!user) return;

  // Obtener perfiles ya vistos (tanto matches como rechazos)
  const interaccionesRef = doc(db, "interacciones", user.uid);
  const interaccionesSnap = await getDoc(interaccionesRef);
  const perfilesVistos = interaccionesSnap.exists() ? 
    [...(interaccionesSnap.data().matches || []), ...(interaccionesSnap.data().rechazos || [])] : 
    [];

  const usuariosRef = collection(db, "usuarios");
  const querySnapshot = await getDocs(usuariosRef);
  const compasContainer = document.getElementById("compas-container");

  compasContainer.innerHTML = "";
  let perfilesDisponibles = false;

  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    // Mostrar solo perfiles completos que no sean el usuario actual y no hayan sido vistos
    if (docSnap.id !== user.uid && 
        !perfilesVistos.includes(docSnap.id) && 
        isProfileComplete(data)) {
      perfilesDisponibles = true;
      const tarjeta = document.createElement("div");
      tarjeta.classList.add("tarjeta-compa");
      tarjeta.setAttribute("data-id", docSnap.id);

      tarjeta.innerHTML = `
        <div class="tarjeta-contenido">
          <h3>${data.nombre}</h3>
          <div class="photos-grid">
            ${data.photos ? data.photos.map(url => `
              <img src="${url}" alt="Foto de perfil">
            `).join("") : ""}
          </div>
          <p class="bio-text">${data.bio}</p>
        </div>
      `;

      compasContainer.appendChild(tarjeta);
    }
  });

  if (!perfilesDisponibles) {
    compasContainer.innerHTML = "<p>No hay más perfiles disponibles por el momento.</p>";
  } else {
    habilitarSwipe();
  }
}

// Función para cargar "Tus matches"
async function cargarMatches() {
  const user = auth.currentUser;
  if (!user) return;

  const matchesRef = doc(db, "matches", user.uid);
  const matchesSnap = await getDoc(matchesRef);
  const matchesContainer = document.getElementById("matches-list");
  
  matchesContainer.innerHTML = "";

  if (matchesSnap.exists() && matchesSnap.data().matches) {
    const matchesData = matchesSnap.data().matches;
    
    for (const matchId of matchesData) {
      const matchRef = doc(db, "usuarios", matchId);
      const matchSnap = await getDoc(matchRef);
      
      if (matchSnap.exists()) {
        const matchData = matchSnap.data();
        const matchCard = document.createElement("div");
        matchCard.classList.add("match-card");
        
        matchCard.innerHTML = `
          <h3>${matchData.nombre}</h3>
          <div class="match-photos">
            ${matchData.photos ? matchData.photos.map(url => `
              <img src="${url}" alt="Foto de match">
            `).join("") : ""}
          </div>
          <p>${matchData.bio}</p>
        `;
        
        matchesContainer.appendChild(matchCard);
      }
    }
  } else {
    matchesContainer.innerHTML = "<p>Aún no tenés matches</p>";
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
