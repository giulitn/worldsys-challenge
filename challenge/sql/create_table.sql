CREATE TABLE Clientes (
  NombreCompleto NVARCHAR(100) NOT NULL,
  DNI BIGINT NOT NULL,
  Estado VARCHAR(10) NOT NULL,
  FechaIngreso DATE NOT NULL,
  EsPEP BIT NOT NULL,
  EsSujetoObligado BIT NULL,
  FechaCreacion DATETIME NOT NULL
);
