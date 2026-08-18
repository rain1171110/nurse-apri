import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { prisma } from "./db.js";
import {
  createPatientSchema,
  createRecordSchema,
  registerSchema,
  loginSchema,
  type CreatePatientBody,
  type CreateRecordBody,
  type RegisterBody,
  type LoginBody,
} from "./schema.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { requireAuth } from "./auth.js";

export const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

type PrismaErrorCode = "P2002" | "P2003" | "P2025";

const isPrismaError = (error: unknown, code: PrismaErrorCode): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
};

app.use(cors({ origin: "http://" + "localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/data", requireAuth, async (req, res) => {
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
    res
      .status(500)
      .json({ error: "Failed to read data / データの読み込みに失敗しました" });
  }
});

app.get("/api/patients", requireAuth, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany();

    res.json(patients);
  } catch (error) {
    console.error("Get /api/patients error", error);
    res.status(500).json({
      error: "Failed to read patients / 患者情報の読み込みに失敗しました",
    });
  }
});

app.post<{}, {}, CreatePatientBody>(
  "/api/patients",
  requireAuth,
  async (req, res) => {
    try {
      const result = createPatientSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({
          error: "Invalid patient data / 無効な患者データ",
          details: result.error.flatten(),
        });
        return;
      }

      const newPatient = await prisma.patient.create({
        data: result.data,
      });

      res.status(201).json(newPatient);
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        res.status(409).json({
          error:
            "This room number is already in use / この部屋番号はすでに使用されています",
        });
        return;
      }
      console.error("POST /api/patients error", error);
      res.status(500).json({
        error: "Failed to create patient / 患者情報追加に失敗しました",
      });
    }
  },
);

app.post<{}, {}, CreateRecordBody>(
  "/api/records",
  requireAuth,
  async (req, res) => {
    try {
      const result = createRecordSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: "Invalid record data / 無効な看護記録データ",
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
      if (isPrismaError(error, "P2003")) {
        res.status(404).json({
          error: "Patient not found / 患者が見つかりません",
        });
        return;
      }
      console.error("POST /api/records error", error);
      res.status(500).json({
        error: "Failed to create record / 看護記録の追加に失敗しました",
      });
    }
  },
);

app.put<{ id: string }, {}, CreatePatientBody>(
  "/api/patients/:id",
  requireAuth,
  async (req, res) => {
    try {
      const result = createPatientSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({
          error: "Invalid patient data / 無効な患者データ",
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
      if (isPrismaError(error, "P2002")) {
        res.status(409).json({
          error:
            "This room number is already in use / この部屋番号はすでに使用されています",
        });
        return;
      }
      if (isPrismaError(error, "P2025")) {
        res.status(404).json({
          error: "Patient not found / 患者が見つかりません",
        });
        return;
      }
      console.error("PUT /api/patients/:id error:", error);
      res
        .status(500)
        .json({ error: "Failed to update patient / 患者の更新に失敗しました" });
    }
  },
);

app.put<{ id: string }, {}, CreateRecordBody>(
  "/api/records/:id",
  requireAuth,
  async (req, res) => {
    try {
      const result = createRecordSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: "Invalid record data / 無効な看護記録データ",
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
      if (isPrismaError(error, "P2025")) {
        res.status(404).json({
          error: "Record not found / 看護記録が見つかりません",
        });
        return;
      }
      if (isPrismaError(error, "P2003")) {
        res.status(404).json({
          error: "Patient not found / 患者が見つかりません",
        });
        return;
      }
      console.error("PUT /api/records/:id error:", error);
      res.status(500).json({
        error: "Failed to update record / 看護記録の更新に失敗しました",
      });
    }
  },
);

app.delete<{ id: string }>(
  "/api/patients/:id",
  requireAuth,
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.patient.delete({
        where: {
          id,
        },
      });

      res.json({ id });
    } catch (error) {
      if (isPrismaError(error, "P2025")) {
        res.status(404).json({
          error: "Patient not found / 患者が見つかりません",
        });
        return;
      }
      console.error("DELETE /api/patients/:id error:", error);
      res
        .status(500)
        .json({ error: "Failed to delete patient / 患者削除に失敗しました" });
    }
  },
);

app.delete<{ id: string }>(
  "/api/records/:id",
  requireAuth,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.nursingRecord.delete({
        where: {
          id,
        },
      });

      res.json({ id });
    } catch (error) {
      if (isPrismaError(error, "P2025")) {
        res.status(404).json({
          error: "Record not found / 看護記録が見つかりません",
        });
        return;
      }
      console.error("DELETE /api/records/:id error:", error);
      res.status(500).json({
        error: "Failed to delete record / 看護記録の削除に失敗しました",
      });
    }
  },
);

app.post<{}, {}, RegisterBody>("/api/auth/register", async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid registration data / 無効な登録データ",
        details: result.error.flatten(),
      });
      return;
    }
    const { email, password } = result.data;

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      createdAt: newUser.createdAt,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      res.status(409).json({
        error: "Email is already registered / このメールアドレスは登録済みです",
      });
      return;
    }
    console.error("POST /api/auth/register", error);
    res
      .status(500)
      .json({ error: "Failed to register user / ユーザー登録に失敗しました" });
  }
});

app.post<{}, {}, LoginBody>("/api/auth/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid login data / 無効なログインデータ",
        details: result.error.flatten(),
      });
      return;
    }
    const { email, password } = result.data;
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      res.status(401).json({
        error:
          "Invalid email or password / メールアドレスまたはパスワードが正しくありません",
      });
      return;
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        error:
          "Invalid email or password / メールアドレスまたはパスワードが正しくありません",
      });
      return;
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
    });
    res.json({
      success: true,
      message: "ログイン成功",
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("POST /api/auth/login", error);
    res.status(500).json({
      error: "Failed to login user / ユーザーログインに失敗しました",
    });
  }
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}
