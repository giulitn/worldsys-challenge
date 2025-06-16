# 💾 Desafío Técnico – Procesamiento de archivo

Este proyecto tiene como objetivo procesar un archivo de gran tamaño (`CLIENTES_IN_0425.dat`), validar su contenido y almacenar los registros válidos en una base de datos SQL Server. El servicio está preparado para correr en un pod de Kubernetes con recursos limitados.

## 🧰 Tecnologías utilizadas

- **Node.js + TypeScript**
- **SQL Server** (para almacenamiento de datos)
- **Swagger** (para documentación de endpoints)
- **Kubernetes** (ambiente objetivo)
- **Logger personalizado** (para control de uso de memoria y trazabilidad)

## ▶️ Ejecución del procesamiento

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/worldsys-challenge.git
cd worldsys-challenge
```

### 2. Instalar dependencias

```bash
npm install
```

### 4. Crear la base de datos y tabla (si no existen)

Podés ejecutar el siguiente script SQL en tu servidor de SQL Server:

```bash
CREATE DATABASE clientes;
GO

USE clientes;
GO

CREATE TABLE Clientes (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  NombreCompleto VARCHAR(100),
  DNI VARCHAR(20),
  Estado VARCHAR(50),
  FechaIngreso DATE,
  EsPEP BIT,
  EsSujetoObligado BIT,
  FechaCreacion DATETIME DEFAULT GETDATE()
);
```

También podés ejecutar el siguiente comando para verificar que la tabla exista (y crearla si hace falta):

```bash
npm run check
```

### 4. Configurar variables de entorno

Crear un archivo .env en la raíz del proyecto con la configuración de conexión a la base de datos:

DB_USER=sa
DB_PASSWORD=yourStrong(!)Password
DB_SERVER=localhost
DB_NAME=clientes

### 5. Ejecutar el procesador de archivo

Para ejecutar el procesamiento:

```bash
npm run start
```

Se mostrará un resumen por consola con las estadísticas de procesamiento, uso de memoria, y líneas válidas/erróneas.

### 6. 📘 Swagger

Si bien la solución principal es un script para procesamiento batch, también se incluye el endpoint health documentado con Swagger. Esto facilita la futura ampliación del proyecto.
