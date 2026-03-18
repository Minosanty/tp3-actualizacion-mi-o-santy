const http = require("http");
const fs = require("fs");
const path = require("path");

// Base de datos en memoria organizada por IP
const baseDeDatos = {};

const server = http.createServer((req, res) => {
  // Obtener la IP del cliente
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  // Limpiar formato de IP (especialmente en local que sale ::1 o ::ffff:)
  if (ip === "::1") ip = "127.0.0.1";
  if (ip.startsWith("::ffff:")) ip = ip.substring(7);

  // Servir archivos estáticos
  if (req.method === "GET" && req.url === "/") {
    fs.readFile(path.join(__dirname, "index.html"), (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end("Error cargando index.html");
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  }
  // API: Obtener datos de la IP
  else if (req.method === "GET" && req.url === "/datos") {
    const datosUsuario = baseDeDatos[ip] || [];

    // Calcular promedio
    let promedio = 0;
    if (datosUsuario.length > 0) {
      const suma = datosUsuario.reduce((acc, p) => acc + p.nota, 0);
      promedio = suma / datosUsuario.length;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ personas: datosUsuario, promedio: promedio.toFixed(2) }),
    );
  }
  // API: Guardar nuevo alumno
  else if (req.method === "POST" && req.url === "/guardar") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const nuevaPersona = JSON.parse(body);

        // Inicializar lista para esta IP si no existe
        if (!baseDeDatos[ip]) {
          baseDeDatos[ip] = [];
        }

        // Guardar datos
        baseDeDatos[ip].push({
          nombre: nuevaPersona.nombre,
          edad: parseInt(nuevaPersona.edad),
          nota: parseFloat(nuevaPersona.nota),
        });

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end("Error en los datos enviados");
      }
    });
  } else {
    res.writeHead(404);
    res.end("No encontrado");
  }
});

const PORT = 3300;
const HOST = "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log("Presiona Ctrl+C para detener");
});
