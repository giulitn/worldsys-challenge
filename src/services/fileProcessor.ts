import fs from "fs";
import readline from "readline";
import { connectToDb } from "../db/sqlServer";
import { logger } from "../utils/logger";

const MAX_NOMBRE_COMPLETO = 100;

export const processFile = async (filePath: string) => {
  logger.log("📂 Iniciando procesamiento del archivo...");

  // ✅ Validar si el archivo existe
  if (!fs.existsSync(filePath)) {
    logger.error(`❌ El archivo no existe: ${filePath}`);
    logger.close();
    return;
  }

  const startTime = Date.now();
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });
  const db = await connectToDb();

  let total = 0;
  let insertados = 0;
  let ignorados = 0;

  for await (const line of rl) {
    total++;

    try {
      const [
        nombre,
        apellido,
        dniRaw,
        estado,
        fechaIngresoRaw,
        esPepRaw,
        esSujetoObligadoRaw,
      ] = line.split("|");

      if (!nombre || !apellido || !dniRaw || !estado || !fechaIngresoRaw) {
        ignorados++;
        continue;
      }

      const dni = parseInt(dniRaw);
      if (isNaN(dni)) {
        ignorados++;
        continue;
      }

      const fechaIngreso = new Date(fechaIngresoRaw);
      if (isNaN(fechaIngreso.getTime())) {
        ignorados++;
        continue;
      }

      const nombreCompleto = `${nombre} ${apellido}`.slice(
        0,
        MAX_NOMBRE_COMPLETO
      );
      const esPep = esPepRaw === "true";
      const esSujetoObligado =
        esSujetoObligadoRaw === "" ? null : esSujetoObligadoRaw === "true";

      await db
        .request()
        .input("NombreCompleto", nombreCompleto)
        .input("DNI", dni)
        .input("Estado", estado)
        .input("FechaIngreso", fechaIngreso)
        .input("EsPEP", esPep)
        .input("EsSujetoObligado", esSujetoObligado)
        .input("FechaCreacion", new Date())
        .query(
          `INSERT INTO Clientes (
            NombreCompleto, DNI, Estado, FechaIngreso,
            EsPEP, EsSujetoObligado, FechaCreacion
          ) VALUES (
            @NombreCompleto, @DNI, @Estado, @FechaIngreso,
            @EsPEP, @EsSujetoObligado, @FechaCreacion
          )`
        );

      insertados++;
    } catch (err) {
      ignorados++;
      logger.error(`⚠️ Error procesando línea ${total}: ${line}\n${err}`);
    }
  }

  const endTime = Date.now();
  const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024;

  logger.log("\n✅ Procesamiento finalizado.");
  logger.log(`📌 Total de líneas: ${total}`);
  logger.log(`📥 Insertadas correctamente: ${insertados}`);
  logger.log(`🚫 Ignoradas por error: ${ignorados}`);
  logger.log(`⏱️ Tiempo total: ${(endTime - startTime) / 1000} segundos`);
  logger.log(`💾 Memoria utilizada: ${memoryUsed.toFixed(2)} MB`);

  logger.close();
};
