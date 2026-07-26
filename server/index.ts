import express from "express";
import cors from "cors";
import { prisma } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/data", async (req, res) => {
  try {
    const patients = await prisma.patient.findMany();
    const records = await prisma.nursingRecord.findMany({
      include: {
        vitals: true,
      },
    });

    const data = {
      patients,
      records,
    };

    res.json(data);
  } catch (error) {
    console.error("GET /api/data error:", error);
    res.status(500).json({ error: "Failed to read data" });
  }
});

app.get("/api/patients", async (req, res) => {
  try {
    const patients = await prisma.patient.findMany();

    res.json(patients);
  } catch (error) {
    console.error("Get /api/patients error", error);
    res.status(500).json({ error: "Failed to read patients" });
  }
});

type CreatePatientBody = {
  name: string;
  room: number;
  age?: number;
  disease?: string;
  history?: string;
  progress?: string;
};

app.post<{}, {}, CreatePatientBody>("/api/patients", async (req, res) => {
  try {
    const newPatient = await prisma.patient.create({
      data: req.body,
    });

    res.status(201).json(newPatient);
  } catch (error) {
    console.error("POST /api/patients error", error);
    res.status(500).json({ error: "Failed to create patient" });
  }
});

type VitalSignsBody = {
  T?: number;
  P?: number;
  R?: number;
  SBP?: number;
  DBP?: number;
  SPO2?: number;
};

type CreateRecordBody = {
  patientId: string;
  date: string;
  author: string;
  content?: string;
  vitals: VitalSignsBody;
};

app.post<{}, {}, CreateRecordBody>("/api/records", async (req, res) => {
  try {
    const { vitals, ...recordData } = req.body;

    const newRecord = await prisma.nursingRecord.create({
      data: {
        ...recordData,
        vitals: {
          create: vitals,
        },
      },
      include: {
        vitals: true,
      },
    });

    res.status(201).json(newRecord);
  } catch (error) {
    console.error("POST /api/records error", error);
    res.status(500).json({ error: "Failed to create record" });
  }
});

app.put<{ id: string }, {}, CreatePatientBody>(
  "/api/patients/:id",
  async (req, res) => {
    try {
      const { id } = req.params;

      const updatedPatient = await prisma.patient.update({
        where: {
          id,
        },
        data: req.body,
      });

      res.json(updatedPatient);
    } catch (error) {
      console.error("PUT /api/patients/:id error:", error);
      res.status(500).json({ error: "Failed to update patient" });
    }
  },
);

app.put("/api/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { vitals, ...recordData } = req.body;

    const updatedRecord = await prisma.nursingRecord.update({
      where: {
        id,
      },
      data: {
        ...recordData,
        vitals: {
          upsert: {
            create: vitals,
            update: vitals,
          },
        },
      },
      include: {
        vitals: true,
      },
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error("PUT /api/records/:id error:", error);
    res.status(500).json({ error: "Failed to update record" });
  }
});

app.delete("/api/patients/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.patient.delete({
      where: {
        id,
      },
    });

    res.json({ id });
  } catch (error) {
    console.error("DELETE /api/patients/:id error:", error);
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

app.delete("/api/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.nursingRecord.delete({
      where: {
        id,
      },
    });

    res.json({ id });
  } catch (error) {
    console.error("DELETE /api/records/:id error:", error);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
