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
