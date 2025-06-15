import fs from "fs";
import readline from "readline";
import { connectToDb } from "../db/sqlServer";
import { logger } from "../utils/logger";
import { saveError } from "../utils/saveError";
import { ValidParsedLine, InvalidParsedLine } from "../types/Cliente";
import { ConnectionPool } from "mssql";

const LOG_EVERY_N_LINES = 10_000;
const BATCH_SIZE = 100;

/**
 * Parses a line from the input file and validates its structure and data types.
 */
const parseAndValidateLine = (
  line: string
): ValidParsedLine | InvalidParsedLine => {
  const fields = line.split("|");
  if (fields.length < 5)
    return { error: "Cantidad insuficiente de campos", rawLine: line };

  const [
    nombre,
    apellido,
    dniRaw,
    estado,
    fechaIngresoRaw,
    esPepRaw,
    esSujetoObligadoRaw,
  ] = fields;
  if (!nombre || !apellido || !dniRaw || !estado || !fechaIngresoRaw) {
    return { error: "Campos obligatorios faltantes", rawLine: line };
  }

  const dni = parseInt(dniRaw, 10);
  if (isNaN(dni)) return { error: `DNI inválido: '${dniRaw}'`, rawLine: line };

  const fechaIngreso = new Date(fechaIngresoRaw);
  if (isNaN(fechaIngreso.getTime())) {
    return {
      error: `FechaIngreso inválida: '${fechaIngresoRaw}'`,
      rawLine: line,
    };
  }

  return {
    data: {
      nombreCompleto: `${nombre} ${apellido}`.slice(0, 100),
      dni,
      estado,
      fechaIngreso,
      esPep: esPepRaw === "true",
      esSujetoObligado:
        esSujetoObligadoRaw === "" ? null : esSujetoObligadoRaw === "true",
    },
  };
};

/**
 * Inserts a batch of client records into the database.
 */
const insertClientBatch = async (
  db: ConnectionPool,
  batch: ValidParsedLine["data"][]
) => {
  const request = db.request();

  const values = batch
    .map(
      (_, i) =>
        `(@NombreCompleto${i}, @DNI${i}, @Estado${i}, @FechaIngreso${i}, @EsPEP${i}, @EsSujetoObligado${i}, @FechaCreacion${i})`
    )
    .join(", ");

  batch.forEach((record, i) => {
    request.input(`NombreCompleto${i}`, record.nombreCompleto);
    request.input(`DNI${i}`, record.dni);
    request.input(`Estado${i}`, record.estado);
    request.input(`FechaIngreso${i}`, record.fechaIngreso);
    request.input(`EsPEP${i}`, record.esPep);
    request.input(`EsSujetoObligado${i}`, record.esSujetoObligado);
    request.input(`FechaCreacion${i}`, new Date());
  });

  await request.query(`
    INSERT INTO Clientes (
      NombreCompleto, DNI, Estado, FechaIngreso,
      EsPEP, EsSujetoObligado, FechaCreacion
    ) VALUES ${values}
  `);
};

/**
 * Logs a summary of the processing.
 */
const logSummary = (
  total: number,
  inserted: number,
  ignored: number,
  startTime: number
) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  logger.log("\n✅ Procesamiento finalizado.");
  logger.log(`📌 Total de líneas: ${total}`);
  logger.log(`📥 Insertadas correctamente: ${inserted}`);
  logger.log(`🚫 Ignoradas por error: ${ignored}`);
  logger.log(`⏱️ Tiempo total: ${duration} segundos`);
  logger.log(`💾 Memoria utilizada: ${memoryUsed} MB`);
};

/**
 * Processes a .dat file with customer data and inserts valid rows into the Clientes table.
 */
export const processFile = async (filePath: string): Promise<void> => {
  logger.log("📂 Starting file processing...");

  if (!fs.existsSync(filePath)) {
    logger.error(`❌ File does not exist: ${filePath}`);
    logger.close();
    return;
  }

  const startTime = Date.now();
  const db = await connectToDb();
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });

  let total = 0,
    inserted = 0,
    ignored = 0;
  let batch: ValidParsedLine["data"][] = [];

  for await (const line of rl) {
    total++;
    if (total % LOG_EVERY_N_LINES === 0)
      logger.log(`🔍 Procesadas ${total} líneas...`);

    const parsedLine = parseAndValidateLine(line);
    if ("error" in parsedLine) {
      ignored++;
      await saveError(db, parsedLine.rawLine, parsedLine.error);
      continue;
    }

    batch.push(parsedLine.data);
    if (batch.length >= BATCH_SIZE) {
      try {
        await insertClientBatch(db, batch);
        inserted += batch.length;
      } catch (err) {
        for (const item of batch) {
          ignored++;
          await saveError(
            db,
            JSON.stringify(item),
            `Insert error: ${err instanceof Error ? err.message : "Unknown"}`
          );
        }
      } finally {
        batch = [];
      }
    }
  }

  if (batch.length > 0) {
    try {
      await insertClientBatch(db, batch);
      inserted += batch.length;
    } catch (err) {
      for (const item of batch) {
        ignored++;
        await saveError(
          db,
          JSON.stringify(item),
          `Insert error: ${err instanceof Error ? err.message : "Unknown"}`
        );
      }
    }
  }

  /**
   * Logs a summary of the processing, including memory usage warnings.
   */
  const logSummary = (
    total: number,
    inserted: number,
    ignored: number,
    startTime: number
  ) => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryRounded = Number(memoryUsed.toFixed(2));

    logger.log("\n✅ Procesamiento finalizado.");
    logger.log(`📌 Total de líneas: ${total}`);
    logger.log(`📥 Insertadas correctamente: ${inserted}`);
    logger.log(`🚫 Ignoradas por error: ${ignored}`);
    logger.log(`⏱️ Tiempo total: ${duration} segundos`);
    logger.log(`💾 Memoria utilizada: ${memoryRounded} MB`);

    if (memoryRounded > 256) {
      logger.warn(
        `⚠️⚠️⚠️⚠️ Uso de memoria EXCEDIDO: ${memoryRounded} MB (límite: 256Mi)`
      );
      console.warn(
        `\x1b[41m\x1b[37m⚠️  Uso de memoria EXCEDIDO: ${memoryRounded} MB (límite: 256Mi)\x1b[0m`
      );
    } else if (memoryRounded > 128) {
      logger.warn(
        `🔶🔶🔶🔶 Uso de memoria por encima del request: ${memoryRounded} MB (>128Mi)`
      );
      console.warn(
        `\x1b[43m\x1b[30m🔶 Uso de memoria por encima del request: ${memoryRounded} MB (>128Mi)\x1b[0m`
      );
    }
  };
  logger.close();
};
