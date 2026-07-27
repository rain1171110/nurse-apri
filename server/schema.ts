import { z } from "zod";

export const createPatientSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  room: z.number().int().min(1).max(999),
  age: z.number().int().min(0).max(150).optional(),
  disease: z.string().optional(),
  history: z.string().optional(),
  progress: z.string().optional(),
});

export type CreatePatientBody = z.infer<typeof createPatientSchema>;

export const createRecordSchema = z.object({
  patientId: z.string().min(1, "患者IDは必須"),
  date: z.string().min(1, "日付は必須"),
  author: z.string().min(1, "記録者は必須"),
  content: z.string().optional(),
  vitals: z.object({
    T: z.number().min(35).max(42).optional(),
    P: z.number().int().min(0).max(200).optional(),
    R: z.number().int().min(0).max(40).optional(),
    SBP: z.number().int().min(0).max(250).optional(),
    DBP: z.number().int().min(0).max(150).optional(),
    SPO2: z.number().int().min(0).max(100).optional(),
  }),
});

export type CreateRecordBody = z.infer<typeof createRecordSchema>;
