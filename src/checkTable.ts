import { connectToDb } from "./db/sqlServer";

async function checkTableExists() {
  const db = await connectToDb();
  const result = await db
    .request()
    .query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Clientes'`
    );

  if (result.recordset.length > 0) {
    console.log("✅ La tabla 'Clientes' existe en la base de datos.");
  } else {
    console.log("❌ La tabla 'Clientes' NO existe.");
  }

  db.close();
}

checkTableExists().catch((err) => {
  console.error("❌ Error al verificar la tabla:", err);
});
