import fs from "fs";
import readline from "readline";
import { connectToDb } from "../db/sqlServer";

export const processFile = async (filePath: string) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });
  const db = await connectToDb();

  for await (const line of rl) {
    try {
      const [
        nombre,
        apellido,
        dni,
        estado,
        fechaIngreso,
        esPep,
        esSujetoObligado,
      ] = line.split("|");
      if (!nombre || !apellido || !dni || !estado || !fechaIngreso) continue; // tolerancia a errores

      await db
        .request()
        .input("NombreCompleto", `${nombre} ${apellido}`)
        .input("DNI", parseInt(dni))
        .input("Estado", estado)
        .input("FechaIngreso", new Date(fechaIngreso))
        .input("EsPEP", esPep === "true")
        .input(
          "EsSujetoObligado",
          esSujetoObligado === "" ? null : esSujetoObligado === "true"
        )
        .input("FechaCreacion", new Date())
        .query(`INSERT INTO Clientes (NombreCompleto, DNI, Estado, FechaIngreso, EsPEP, EsSujetoObligado, FechaCreacion)
                VALUES (@NombreCompleto, @DNI, @Estado, @FechaIngreso, @EsPEP, @EsSujetoObligado, @FechaCreacion)`);
    } catch (err) {
      console.warn(`Error en línea: ${line}`, err);
    }
  }
};
