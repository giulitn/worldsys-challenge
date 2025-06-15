import dotenv from "dotenv";
dotenv.config();
import sql from "mssql";

const config: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: {
    trustServerCertificate: true,
  },
};

export const connectToDb = async () => {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error("Error connecting to database", err);
    throw err;
  }
};
