// This script checks whether required tables exist in the database.
// Useful for verifying initial DB setup before running processing scripts.

import { connectToDb } from "./db/sqlServer";

/**
 * Checks if a specific table exists in the database.
 * @param db - The database connection.
 * @param tableName - The name of the table to check.
 */
const checkTableExists = async (
  db: any,
  tableName: string
): Promise<boolean> => {
  const query = `
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME = @tableName
  `;
  const result = await db.request().input("tableName", tableName).query(query);
  return result.recordset.length > 0;
};

/**
 * Checks the required tables and logs the results.
 */
const verifyRequiredTables = async (): Promise<void> => {
  const requiredTables = ["Clientes", "ErroresImportacion"];

  try {
    const db = await connectToDb();

    for (const table of requiredTables) {
      const exists = await checkTableExists(db, table);
      if (exists) {
        console.log(`✅ Table '${table}' exists.`);
      } else {
        console.log(`❌ Table '${table}' does NOT exist.`);
      }
    }

    db.close();
  } catch (error) {
    console.error("❌ Error while verifying table existence:", error);
  }
};

verifyRequiredTables();
