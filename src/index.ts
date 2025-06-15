import express from "express";
import { healthCheck } from "./controllers/healthController";

const app = express();
const port = process.env.PORT || 3000;

app.get("/health", healthCheck);

app.listen(port, () => {
  console.log(`Service running on port ${port}`);
});
