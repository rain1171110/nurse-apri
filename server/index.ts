import express from "express";
import cors from "cors";
import { prisma } from "./db.js";
import {
  createPatientSchema,
  createRecordSchema,
  type CreatePatientBody,
  type CreateRecordBody,
} from "./schema.js";
import { error } from "node:console";

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

app.post<{}, {}, CreatePatientBody>("/api/patients", async (req, res) => {
  try {
    const result = createPatientSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Invalid patient data",
        details: result.error.flatten(),
      });
      return;
    }

    const newPatient = await prisma.patient.create({
      data: result.data,
    });

    res.status(201).json(newPatient);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        error: "This room number is already in use",
      });
      return;
    }
    console.error("POST /api/patients error", error);
    res.status(500).json({ error: "Failed to create patient" });
  }
});

app.post<{}, {}, CreateRecordBody>("/api/records", async (req, res) => {
  try {
    const result = createRecordSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid record data",
        details: result.error.flatten(),
      });
      return;
    }
    const { vitals, ...recordData } = result.data;

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
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      res.status(404).json({
        error: "Patient not found",
      });
      return;
    }
    console.error("POST /api/records error", error);
    res.status(500).json({ error: "Failed to create record" });
  }
});

app.put<{ id: string }, {}, CreatePatientBody>(
  "/api/patients/:id",
  async (req, res) => {
    try {
      const result = createPatientSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({
          error: "Invalid patient data",
          details: result.error.flatten(),
        });
        return;
      }

      const { id } = req.params;

      const updatedPatient = await prisma.patient.update({
        where: {
          id,
        },
        data: result.data,
      });

      res.json(updatedPatient);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        res.status(409).json({
          error: "This room number is already in use",
        });
        return;
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2025"
      ) {
        res.status(404).json({
          error: "Patient not found",
        });
        return;
      }
      console.error("PUT /api/patients/:id error:", error);
      res.status(500).json({ error: "Failed to update patient" });
    }
  },
);

app.put<{ id: string }, {}, CreateRecordBody>(
  "/api/records/:id",
  async (req, res) => {
    try {
      const result = createRecordSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: "Invalid record data",
          details: result.error.flatten(),
        });
        return;
      }

      const { id } = req.params;
      const { vitals, ...recordData } = result.data;

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
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2025"
      ) {
        res.status(404).json({
          error: "Record not found",
        });
        return;
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2003"
      ) {
        res.status(404).json({
          error: "Patient not found",
        });
        return;
      }
      console.error("PUT /api/records/:id error:", error);
      res.status(500).json({ error: "Failed to update record" });
    }
  },
);

app.delete<{ id: string }>("/api/patients/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.patient.delete({
      where: {
        id,
      },
    });

    res.json({ id });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      res.status(404).json({
        error: "Patient not found",
      });
      return;
    }
    console.error("DELETE /api/patients/:id error:", error);
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

app.delete<{ id: string }>("/api/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.nursingRecord.delete({
      where: {
        id,
      },
    });

    res.json({ id });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      res.status(404).json({
        error: "Record not found",
      });
      return;
    }
    console.error("DELETE /api/records/:id error:", error);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
