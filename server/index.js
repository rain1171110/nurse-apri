import express from "express";
import cors from "cors";
import {readFileSync,writeFileSync} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());

const readData = () => {
  const raw = readFileSync(dataPath, "utf-8");
  return JSON.parse(raw);
};

const writeData = (data) => {
  writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
};

app.get("/api/data", (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (error) {
    console.error("GET /api/data error:", error);
    res.status(500).json({ error: "Failed to read data" });
  }
});

app.put("/api/data", (req, res) => {
  try {
    const { patients, records } = req.body;
    if (!Array.isArray(patients) || !Array.isArray(records)) {
      return res.status(400).json({ error: "invalid payload" });
    }
    const next = { patients, records };
    writeData(next);
    res.json(next);
  } catch (error) {
    console.error("PUT /api/data error:", error);
    res.status(500).json({ error: "Failed to write data" });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
