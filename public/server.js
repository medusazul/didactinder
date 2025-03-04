import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos desde "public"
app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
