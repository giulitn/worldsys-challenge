// This script checks whether required tables exist in the database.
// Useful for verifying initial DB setup before running processing scripts.

import { ConnectionPool } from "mssql";
import { connectToDb } from "../db/sqlServer";

/**
 * Checks if a specific table exists in the database.
 * @param sqlConnection - The database connection.
 * @param tableName - The name of the table to check.
 */
const checkTableExists = async (
  sqlConnection: ConnectionPool,
  tableName: string
): Promise<boolean> => {
  const query = `
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME = @tableName
  `;
  const result = await sqlConnection
    .request()
    .input("tableName", tableName)
    .query(query);
  return result.recordset.length > 0;
};

/**
 * Checks the required tables and logs the results.
 */
const verifyRequiredTables = async (): Promise<void> => {
  const requiredTablesNames = ["Clientes", "ErroresImportacion"];

  try {
    const db = await connectToDb();

    for (const tableName of requiredTablesNames) {
      const exists = await checkTableExists(db, tableName);
      if (exists) {
        console.log(`✅ Table '${tableName}' exists.`);
      } else {
        console.log(`❌ Table '${tableName}' does NOT exist.`);
      }
    }

    db.close();
  } catch (error) {
    console.error("❌ Error while verifying table existence:", error);
  }
};

verifyRequiredTables();
