import { logger } from "./logger";

const saveError = async (
  db: any,
  linea: string,
  motivo: string
): Promise<void> => {
  try {
    await db
      .request()
      .input("Linea", linea.slice(0, 500)) // truncamos si es muy larga
      .input("Motivo", motivo.slice(0, 255))
      .input("FechaCreacion", new Date()).query(`
        INSERT INTO ErroresImportacion (Linea, Motivo, FechaCreacion)
        VALUES (@Linea, @Motivo, @FechaCreacion)
      `);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Error desconocido";
    logger.warn(
      `❌ No se pudo registrar el error en ErroresImportacion:\n${linea}\n${motivo}\n${errMsg}`
    );
  }
};

export { saveError };
