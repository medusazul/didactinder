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

// Inicializa Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();  // Usaremos Firestore para guardar perfiles y matches

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
document.getElementById('login-btn').addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
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
        });
    })
    .catch(error => {
      console.error("Error al iniciar sesión:", error);
    });
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

/**********************
* Actualizar vista previa de fotos subidas
**********************/
function updatePhotoPreview() {
  const photosPreview = document.getElementById('photos-preview');
  photosPreview.innerHTML = ""; // Limpiar antes de actualizar

  uploadedPhotos.forEach((url, index) => {
    const imgContainer = document.createElement('div');
    imgContainer.style.display = "inline-block";
    imgContainer.style.position = "relative";
    imgContainer.style.margin = "5px";

    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = "200px";
    img.style.borderRadius = "8px";

    // Botón para eliminar imagen
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "X";
    deleteBtn.style.position = "absolute";
    deleteBtn.style.top = "0";
    deleteBtn.style.right = "0";
    deleteBtn.style.background = "#fe3c72";
    deleteBtn.style.color = "#fff";
    deleteBtn.style.border = "none";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.borderRadius = "50%";

    deleteBtn.addEventListener('click', () => {
      uploadedPhotos.splice(index, 1); // Eliminar la foto del array
      updatePhotoPreview(); // Actualizar la vista previa
    });

    imgContainer.appendChild(img);
    imgContainer.appendChild(deleteBtn);
    photosPreview.appendChild(imgContainer);
  });
}

/**********************
* Guardar perfil en Firestore
**********************/
document.getElementById('save-profile').addEventListener('click', () => {
  const nombre = document.getElementById('nombre').value;
  const bio = document.getElementById('bio').value;
  if (!nombre || !bio || uploadedPhotos.length < 3) {
    alert("Debes ingresar tu nombre, bio y subir 3 fotos.");
    return;
  }

  db.collection('profiles').doc(currentUser.uid).set({
    nombre: nombre,
    bio: bio,
    photos: uploadedPhotos,
    email: currentUser.email,
  })
  .then(() => {
    alert("Perfil guardado con éxito.");
    // Actualizar la vista en la pestaña Perfil
    updateProfileView();
    // Ocultar la sección de edición y mostrar el botón de editar
    document.getElementById('edit-profile').style.display = 'none';
    document.getElementById('edit-profile-btn').style.display = 'block';
  })
  .catch(error => {
    console.error("Error guardando el perfil:", error);
  });
});

/**********************
* Actualizar la vista de la pestaña Perfil
**********************/
function updateProfileView() {
  db.collection('profiles').doc(currentUser.uid).get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();
        // Mostrar datos del perfil
        document.getElementById('profile-name').textContent = data.nombre;
        document.getElementById('profile-bio').textContent = data.bio;
        // Mostrar las fotos del perfil
        const photosContainer = document.getElementById('profile-photos');
        photosContainer.innerHTML = "";
        data.photos.forEach(url => {
          const img = document.createElement('img');
          img.src = url;
          img.style.maxWidth = '200px';
          img.style.margin = '5px';
          photosContainer.appendChild(img);
        });
        // Mostrar el botón de editar perfil
        document.getElementById('edit-profile-btn').style.display = 'block';
        // Ocultar los elementos de edición
        document.getElementById('edit-profile').style.display = 'none';
      }
    })
    .catch(error => {
      console.error("Error cargando el perfil:", error);
    });
}

/**********************
* Volver al modo de edición de perfil
**********************/
document.getElementById('edit-profile-btn').addEventListener('click', () => {
  // Volver a mostrar la sección de edición
  document.getElementById('edit-profile').style.display = 'block';
  document.getElementById('edit-profile-btn').style.display = 'none';
});

/**********************
* Cargar perfiles de compañeros (Tus compas)
**********************/
function loadProfiles() {
  db.collection('profiles').get().then(snapshot => {
    const profilesList = document.getElementById('profiles-list');
    profilesList.innerHTML = "";
    
    snapshot.forEach(doc => {
      if(doc.id === currentUser.uid) return;
      
      const data = doc.data();
      const card = document.createElement('div');
      card.className = "profile-card";
      card.innerHTML = `
        <h3>${data.nombre}</h3>
        <div class="photos">
          ${data.photos.map(url => `<img src="${url}" style="max-width:80px; margin:5px;">`).join('')}
        </div>
        <p>${data.bio}</p>
        <div class="swipe-area">
          <button class="swipe-btn" data-swipe="left">❌</button>
          <button class="swipe-btn" data-swipe="right">❤️</button>
        </div>
      `;
      
      // Agregar eventos de swipe
      enableSwipe(card, doc.id);
      
      // Eventos para los botones
      card.querySelectorAll('.swipe-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          handleSwipe(doc.id, btn.dataset.swipe);
          card.remove(); // Eliminar la tarjeta después del swipe
        });
      });
      
      profilesList.appendChild(card);
    });
  });
}

/**********************
 * Habilitar gestos de swipe (Hammer.js)
 **********************/
function enableSwipe(card, profileId) {
  const hammer = new Hammer(card);
  
  // Configuración básica de Hammer.js
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });

  // Swipe a la izquierda (rechazar)
  hammer.on('swipeleft', () => {
    handleSwipe(profileId, 'left');
    card.style.transform = 'translateX(-100%)';
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 300); // Elimina la tarjeta después de la animación
  });

  // Swipe a la derecha (like)
  hammer.on('swiperight', () => {
    handleSwipe(profileId, 'right');
    card.style.transform = 'translateX(100%)';
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 300); // Elimina la tarjeta después de la animación
  });
}

/**********************
 * Manejar swipe (like/dislike)
 **********************/
function handleSwipe(profileId, direction) {
  if (direction === "right") {
    // Registrar like en Firestore
    db.collection('likes').add({
      from: currentUser.uid,
      to: profileId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      console.log("Like registrado para el perfil:", profileId);

      // Verificar si hay un match
      db.collection('likes')
        .where("from", "==", profileId)
        .where("to", "==", currentUser.uid)
        .get()
        .then((snapshot) => {
          if (!snapshot.empty) {
            // Obtener el nombre del usuario actual desde su perfil
            db.collection('profiles').doc(currentUser.uid).get()
              .then((currentUserDoc) => {
                const currentUserName = currentUserDoc.data().nombre;

                // Obtener el nombre del otro usuario desde su perfil
                db.collection('profiles').doc(profileId).get()
                  .then((otherUserDoc) => {
                    const otherUserName = otherUserDoc.data().nombre;

                    // Guardar el match con los nombres del perfil
                    db.collection('matches').add({
                      usuarios: [currentUser.uid, profileId],
                      nombres: [currentUserName, otherUserName], // Usar nombres del perfil
                      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    })
                    .then(() => {
                      console.log("¡Hiciste match! 🎉");
                      loadMatches(); // Actualizar la lista de matches
                    });
                  });
              });
          }
        });
    })
    .catch((error) => {
      console.error("Error al registrar like:", error);
    });
  } else if (direction === "left") {
    // Registrar dislike (opcional)
    console.log("Dislike para el perfil:", profileId);
  }
}

/**********************
 * Cargar matches (Tus matches)
 **********************/
function loadMatches() {
  db.collection('matches')
    .where('usuarios', 'array-contains', currentUser.uid)
    .get()
    .then((snapshot) => {
      const matchesList = document.getElementById('matches-list');
      matchesList.innerHTML = ""; // Limpiar la lista antes de cargar

      snapshot.forEach(async (doc) => {
        const data = doc.data();
        const otherUserId = data.usuarios.find((id) => id !== currentUser.uid);

        // Obtener el nombre del otro usuario desde su perfil
        const otherUserDoc = await db.collection('profiles').doc(otherUserId).get();
        const otherUserName = otherUserDoc.data().nombre;

        // Mostrar el nombre en la lista
        const matchItem = document.createElement('li');
        matchItem.textContent = otherUserName;
        matchesList.appendChild(matchItem);
      });
    })
    .catch((error) => {
      console.error("Error cargando matches:", error);
    });
}