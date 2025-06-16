// src/services/fileProcessor.ts

import fs from "fs";
import path from "path";
import readline from "readline";
import { connectToDb } from "../db/sqlServer";
import { logger } from "../utils/logger";

const inputPath = path.resolve("./challenge/input/CLIENTES_IN_0425.dat");

export const processFile = async () => {
  logger.log("📂 Iniciando procesamiento de archivo...");

  if (!fs.existsSync(inputPath)) {
    logger.error(`❌ Archivo de entrada no encontrado: ${inputPath}`);
    return;
  }

  const connection = await connectToDb();
  const stream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({ input: stream });

  let total = 0;
  let valid = 0;
  let invalid = 0;
  const start = Date.now();

  for await (const line of rl) {
    total++;
    const fields = line.split("|");

    if (fields.length !== 7 || fields.some((f) => !f.trim())) {
      invalid++;
      continue;
    }

    const [
      nombre,
      apellido,
      dni,
      estado,
      fechaIngreso,
      esPep,
      esSujetoObligado,
    ] = fields;

    const nombreCompleto = `${nombre} ${apellido}`;
    const esPepInt = esPep.trim().toLowerCase() === "true" ? 1 : 0;
    const esSujetoObligadoInt =
      esSujetoObligado.trim().toLowerCase() === "true" ? 1 : 0;

    try {
      const request = connection.request();
      request
        .input("nombreCompleto", nombreCompleto.substring(0, 100))
        .input("dni", dni)
        .input("estado", estado)
        .input("fechaIngreso", fechaIngreso)
        .input("esPep", esPepInt)
        .input("esSujetoObligado", esSujetoObligadoInt);

      await request.query(`
        INSERT INTO clientes (NombreCompleto, DNI, Estado, FechaIngreso, EsPEP, EsSujetoObligado, FechaCreacion)
        VALUES (@nombreCompleto, @dni, @estado, @fechaIngreso, @esPep, @esSujetoObligado, GETDATE())
      `);

      valid++;
    } catch {
      invalid++;
    }

    if (total % 10000 === 0) {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      logger.log(
        `🔍 Procesadas ${total} líneas...
🧠 Checkpoint - ${valid} válidas 💾 Memoria actual: ${used.toFixed(2)} MiB`
      );
    }
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  logger.log("\n✅ Procesamiento finalizado.");
  logger.log(`📌 Total de líneas: ${total}`);
  logger.log(`🚫 Ignoradas por error: ${invalid}`);
  logger.log(`⏱️ Tiempo total: ${duration} segundos`);

  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  logger.log(`💾 Memoria utilizada: ${used.toFixed(2)} MiB`);
};
