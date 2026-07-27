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
  date: z.string().min(1, "日付は必須"),
  author: z.string().min(1, "記録者は必須"),
  content: z.string().optional(),
  vitals: z.object({
    T: z.number().int().min(35).max(42),
    P: z.number().int().min(0).max(200),
    R: z.number().int().min(0).max(40),
    SBP: z.number().int().min(0).max(250),
    DBP: z.number().int().min(0).max(150),
    SPO2: z.number().int().min(0).max(100),
  }),
});

export type CreateRecordBody = z.infer<typeof createRecordSchema>;
