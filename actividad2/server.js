const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

// 🔥 NORMALIZAR IP (IMPORTANTE)
function obtenerIP(req) {
  let ip = req.socket.remoteAddress;

  if (!ip) return "desconocido";

  if (ip === "::1") return "127.0.0.1";

  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }

  return ip;
}

const server = http.createServer((req, res) => {
  const ip = obtenerIP(req);
  const usuario = ip;

  console.log("IP cliente:", ip, "Usuario:", usuario || "(sin usuario)");

  // Función rápida para validar el usuario (IP)
  function validarUsuario() {
    if (!usuario) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("No se pudo obtener la IP del usuario");
      return false;
    }
    return true;
  }

  // ===============================
  // SERVIR HTML
  // ===============================
  if (req.method === "GET" && req.url === "/") {
    const filePath = path.join(__dirname, "public", "index.html");

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end("Error al cargar la página");
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  }

  // ===============================
  // OBTENER IP (LOGIN AUTOMÁTICO)
  // ===============================
  else if (req.method === "GET" && req.url === "/mi-ip") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ip: ip }));
  }

  // ===============================
  // OBTENER ALUMNOS DEL USUARIO
  // ===============================
  else if (req.method === "GET" && req.url.startsWith("/alumnos")) {
    if (!validarUsuario()) return;

    let data = {};

    try {
      data = JSON.parse(fs.readFileSync("alumnos.json", "utf8"));
    } catch {
      data = {};
    }

    const alumnos = data[usuario] || [];

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(alumnos));
  }

  // ===============================
  // GUARDAR ALUMNO
  // ===============================
  else if (req.method === "POST" && req.url.startsWith("/alumnos")) {
    if (!validarUsuario()) return;

    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      let nuevoAlumno;

      try {
        nuevoAlumno = JSON.parse(body);
      } catch {
        res.writeHead(400);
        return res.end("JSON inválido");
      }

      let data = {};

      try {
        data = JSON.parse(fs.readFileSync("alumnos.json", "utf8"));
      } catch {
        data = {};
      }

      if (!data[usuario]) {
        data[usuario] = [];
      }

      data[usuario].push(nuevoAlumno);

      fs.writeFileSync("alumnos.json", JSON.stringify(data, null, 2));

      res.writeHead(200);
      res.end("Alumno guardado");
    });
  }

  // ===============================
  // ELIMINAR ALUMNO
  // ===============================
  else if (req.method === "DELETE" && req.url.startsWith("/alumnos/")) {
    if (!validarUsuario()) return;

    const index = parseInt(req.url.split("/")[2]);

    let data = {};

    try {
      data = JSON.parse(fs.readFileSync("alumnos.json", "utf8"));
    } catch {
      data = {};
    }

    if (
      data[usuario] &&
      Number.isInteger(index) &&
      index >= 0 &&
      index < data[usuario].length
    ) {
      data[usuario].splice(index, 1);
    }

    fs.writeFileSync("alumnos.json", JSON.stringify(data, null, 2));

    res.writeHead(200);
    res.end("Alumno eliminado");
  }

  // ===============================
  // RUTA NO ENCONTRADA
  // ===============================
  else {
    res.writeHead(404);
    res.end("Ruta no encontrada");
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
