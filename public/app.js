<script type="module">
  // Importación de los módulos necesarios de Firebase
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
  import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
  import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
  import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

  // Tu configuración de Firebase
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
  const storage = getStorage(app);

  // Lógica para iniciar sesión con Google
  document.getElementById("login-btn").addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Usuario logueado:", user);
      document.getElementById("login-section").style.display = "none";
      document.getElementById("app-section").style.display = "block";
    } catch (error) {
      console.error("Error de autenticación:", error);
    }
  });

  // Lógica para guardar el perfil del usuario
  document.getElementById('save-profile').addEventListener('click', async () => {
    const nombre = document.getElementById('nombre').value;
    const bio = document.getElementById('bio').value;

    if (nombre && bio) {
      const user = auth.currentUser;
      const userRef = doc(db, "usuarios", user.uid);

      try {
        await setDoc(userRef, {
          nombre: nombre,
          bio: bio
        }, { merge: true });

        alert("Perfil guardado exitosamente");
      } catch (error) {
        console.error("Error guardando perfil: ", error);
        alert("Error al guardar el perfil");
      }
    } else {
      alert("Por favor complete los campos de nombre y biografía.");
    }
  });

  // Lógica para subir fotos a Firebase Storage
  document.getElementById('upload-photo').addEventListener('click', () => {
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = 'image/*';
    inputFile.multiple = true;

    inputFile.addEventListener('change', async (event) => {
      const files = event.target.files;
      const photoURLs = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileRef = ref(storage, `photos/${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        try {
          await uploadTask;
          const photoURL = await getDownloadURL(fileRef);
          photoURLs.push(photoURL);

          // Mostrar una vista previa de las fotos
          const img = document.createElement('img');
          img.src = photoURL;
          img.classList.add('photo-preview');
          document.getElementById('photos-preview').appendChild(img);
        } catch (error) {
          console.error("Error subiendo la foto: ", error);
        }
      }

      // Guardar las URLs de las fotos en Firestore
      const user = auth.currentUser;
      const userRef = doc(db, "usuarios", user.uid);

      try {
        await setDoc(userRef, {
          photos: photoURLs
        }, { merge: true });

        alert("Fotos subidas exitosamente");
      } catch (error) {
        console.error("Error guardando fotos: ", error);
        alert("Error al subir fotos");
      }
    });

    inputFile.click();
  });

</script>
