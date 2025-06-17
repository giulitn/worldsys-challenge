import fs from "fs";
import path from "path";
import readline from "readline";
import { connectToDb } from "../db/sqlServer";
import { logger } from "../utils/logger";
import {
  buildInsertRequest,
  isValidFullName,
  parseLine,
} from "../utils/clientUtils";

const inputPath = path.resolve("./challenge/input/CLIENTES_IN_0425.dat");

export const processFile = async () => {
  logger.log("📂 Iniciando procesamiento de archivo...");

  if (!fs.existsSync(inputPath)) {
    logger.error(`❌ Archivo de entrada no encontrado: ${inputPath}`);
    return;
  }

  const sqlConnection = await connectToDb();
  const fileStream = fs.createReadStream(inputPath);
  const lineReader = readline.createInterface({ input: fileStream });

  let totalLinesProcessed = 0;
  let totalValidLines = 0;
  let totalInvalidLines = 0;
  const startTime = Date.now();

  for await (const rawLine of lineReader) {
    totalLinesProcessed++;
    const parsedFields = parseLine(rawLine);

    if (!parsedFields) {
      totalInvalidLines++;
      continue;
    }

    const [
      firstName,
      lastName,
      dni,
      status,
      admissionDate,
      isPep,
      isSubjectToObligations,
    ] = parsedFields;

    const fullName = `${firstName} ${lastName}`;

    if (!isValidFullName(fullName)) {
      totalInvalidLines++;
      continue;
    }

    try {
      const insertRequest = buildInsertRequest(sqlConnection, {
        fullName,
        dni,
        estado: status,
        fechaIngreso: admissionDate,
        esPep: isPep,
        esSujetoObligado: isSubjectToObligations,
      });

      await insertRequest.query(`
        INSERT INTO clientes (NombreCompleto, DNI, Estado, FechaIngreso, EsPEP, EsSujetoObligado, FechaCreacion)
        VALUES (@nombreCompleto, @dni, @estado, @fechaIngreso, @esPep, @esSujetoObligado, GETDATE())
      `);

      totalValidLines++;
    } catch {
      totalInvalidLines++;
    }

    if (totalLinesProcessed % 10000 === 0) {
      const currentMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      logger.log(
        `🔍 Procesadas ${totalLinesProcessed} líneas...\n🧠 Checkpoint - ${totalValidLines} válidas 💾 Memoria actual: ${currentMemoryUsage.toFixed(
          2
        )} MiB`
      );
    }
  }

  const totalDurationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
  logger.log("\n✅ Procesamiento finalizado.");
  logger.log(`📌 Total de líneas procesadas: ${totalLinesProcessed}`);
  logger.log(`🚫 Total de líneas inválidas: ${totalInvalidLines}`);
  logger.log(`📥 Total de líneas válidas: ${totalValidLines}`);
  logger.log(
    `⏱️ Tiempo total de procesamiento: ${totalDurationSeconds} segundos`
  );

  const finalMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  logger.log(`💾 Memoria utilizada: ${finalMemoryUsage.toFixed(2)} MiB`);
};
