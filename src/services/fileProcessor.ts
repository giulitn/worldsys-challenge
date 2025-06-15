import fs from "fs";
import readline from "readline";
import { connectToDb } from "../db/sqlServer";
import { logger } from "../utils/logger";
import { saveError } from "../utils/saveError";
import { ValidParsedLine, InvalidParsedLine, Cliente } from "../types/Cliente";
import { ConnectionPool } from "mssql";

/**
 * Parses a line from the input file and validates its structure and data types.
 */

const parseAndValidateLine = (
  line: string
): ValidParsedLine | InvalidParsedLine => {
  const fields = line.split("|");

  if (fields.length < 5) {
    return { error: "Cantidad insuficiente de campos", rawLine: line };
  }

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
 * Inserts a valid client record into the database.
 */
const insertClient = async (
  db: ConnectionPool,
  data: ValidParsedLine["data"]
) => {
  const { nombreCompleto, dni, estado, fechaIngreso, esPep, esSujetoObligado } =
    data;

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
 * Invalid rows are stored in ErroresImportacion for later analysis.
 */
export const processFile = async (filePath: string): Promise<void> => {
  logger.log("📂 Starting file processing...");

  if (!fs.existsSync(filePath)) {
    logger.error(`❌ File does not exist: ${filePath}`);
    logger.close();
    return;
  }

  const startTime = Date.now();

  try {
    logger.log("🔌 Connecting to database...");
    const db = await connectToDb();
    logger.log("✅ Database connection established.");

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream });

    let total = 0;
    let inserted = 0;
    let ignored = 0;

    for await (const line of rl) {
      total++;
      logger.log(`🔍 Processing line ${total}`);

      const parsedLine = parseAndValidateLine(line);

      if ("error" in parsedLine) {
        ignored++;
        await saveError(db, parsedLine.rawLine, parsedLine.error);
        continue;
      }

      try {
        await insertClient(db, parsedLine.data);
        inserted++;
        logger.log(`✅ Inserted: ${parsedLine.data.nombreCompleto}`);
      } catch (err) {
        ignored++;
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        logger.warn(`❌ DB insert error:\n${line}\n${errMsg}`);
        await saveError(db, line, `Insert error: ${errMsg}`);
      }
    }

    logSummary(total, inserted, ignored, startTime);
  } catch (error) {
    logger.error(
      "❌ Fatal processing error: " +
        (error instanceof Error ? error.message : error)
    );
  } finally {
    logger.close();
  }
};
