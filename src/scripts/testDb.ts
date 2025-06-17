import { connectToDb } from "../db/sqlServer";

/**
 * Inserts a single valid test client into the `Clientes` table.
 */
const insertSampleClient = async () => {
  const dbConnection = await connectToDb();

  await dbConnection
    .request()
    .input("NombreCompleto", "Juan Pérez")
    .input("DNI", 12345678)
    .input("Estado", "Activo")
    .input("FechaIngreso", new Date("2023-01-01"))
    .input("EsPEP", true)
    .input("EsSujetoObligado", false)
    .input("FechaCreacion", new Date()).query(`
      INSERT INTO Clientes (
        NombreCompleto, DNI, Estado, FechaIngreso,
        EsPEP, EsSujetoObligado, FechaCreacion
      ) VALUES (
        @NombreCompleto, @DNI, @Estado, @FechaIngreso,
        @EsPEP, @EsSujetoObligado, @FechaCreacion
      )
    `);

  console.log("✅ Successfully inserted a test client into the Clientes table");
};

/**
 * Inserts a sample error into the `ErroresImportacion` table for testing purposes.
 */
const insertSampleImportError = async () => {
  const dbConnection = await connectToDb();

  await dbConnection
    .request()
    .input("Linea", "Nombre|Apellido|DNI|Estado|FechaIngreso|true|true")
    .input("Motivo", "Invalid FechaIngreso")
    .input("FechaCreacion", new Date()).query(`
      INSERT INTO ErroresImportacion (
        Linea, Motivo, FechaCreacion
      ) VALUES (
        @Linea, @Motivo, @FechaCreacion
      )
    `);

  console.log(
    "✅ Successfully inserted a test error into the ErroresImportacion table"
  );
};

/**
 * Entry point: executes both test insert functions sequentially.
 */
const main = async () => {
  try {
    await insertSampleClient();
    await insertSampleImportError();
  } catch (error) {
    console.error("❌ Test insert failed:", error);
  } finally {
    process.exit(0); // Ensures the process exits cleanly
  }
};

main();
