import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

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

app.get("/api/patients", (req, res) => {
  try {
    const data = readData();
    res.json(data.patients);
  } catch (error) {
    console.error("Get/api/patients error", error);
    res.status(500).json({ error: "Failed to read patients" });
  }
});

app.post("/api/patients", (req, res) => {
  try {
    const data = readData();

    const newPatient = {
      ...req.body,
      id: crypto.randomUUID(),
    };

    const next = {
      ...data,
      patients: [...data.patients, newPatient],
    };

    writeData(next);
    res.status(201).json(newPatient);
  } catch (error) {
    console.error("Get/api/patients error", error);
    res.status(500).json({ error: "Failed to create patients" });
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

app.put("/api/patients/:id", (req, res) => {
  try {
    const data = readData();
    const { id } = req.params;

    const exists = data.patients.some((patient) => patient.id === id);

    if (!exists) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const updatedPatient = {
      ...req.body,
      id,
    };

    const next = {
      ...data,
      patients: data.patients.map((patient) =>
        patient.id === id ? updatedPatient : patient,
      ),
    };

    writeData(next);
    res.json(updatedPatient);
  } catch (error) {
    console.error("PUT /api/patients/:id error:", error);
    res.status(500).json({ error: "Failed to update patient" });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
