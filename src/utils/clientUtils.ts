import { ConnectionPool, Request } from "mssql";
import { ClientData } from "../types/Client";

export const parseLine = (line: string): string[] | null => {
  const fields = line.split("|").map((f) => f.trim());
  return fields.length === 7 && fields.every(Boolean) ? fields : null;
};

export const isValidFullName = (fullName: string): boolean => {
  const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
  const words = fullName.trim().split(/\s+/);
  return regex.test(fullName) && words.length >= 2 && words.length <= 4;
};

export const buildInsertRequest = (
  connection: ConnectionPool,
  data: ClientData
): Request => {
  const request = connection.request();
  request
    .input("nombreCompleto", data.fullName.substring(0, 100))
    .input("dni", data.dni)
    .input("estado", data.estado)
    .input("fechaIngreso", data.fechaIngreso)
    .input("esPep", data.esPep.toLowerCase() === "true" ? 1 : 0)
    .input(
      "esSujetoObligado",
      data.esSujetoObligado.toLowerCase() === "true" ? 1 : 0
    );
  return request;
};
