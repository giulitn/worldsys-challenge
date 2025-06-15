import express from "express";
import { setupSwagger } from "./swagger";

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger docs
setupSwagger(app);

/**
 * @openapi
 * /health:
 *   get:
 *     description: Retorna el estado del servicio
 *     responses:
 *       200:
 *         description: Servicio funcionando correctamente
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📘 Documentación Swagger: http://localhost:${PORT}/docs`);
});
