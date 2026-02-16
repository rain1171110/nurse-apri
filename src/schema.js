import { z } from "zod";

export const optionalNumber = (min, max, msgMin, msgMax) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v == null ? "" : String(v).trim()))
    .transform((v) => (v === "" ? undefined : Number(v)))
    .refine((v) => v === undefined || Number.isFinite(v), {
      message: "数字を入力して下さい",
    })
    .refine((v) => v === undefined || v >= min, { message: msgMin })
    .refine((v) => v === undefined || v <= max, { message: msgMax });

export const makePatientSchemaPartial = (usedRooms) => {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "氏名は必須です")
        .refine((v) => !/\d/.test(v), {
          message: "氏名に数字を含めることはできません",
        }),
      room: z.preprocess(
        (v) => (v === "" || v == null ? undefined : Number(v)),
        z
          .number()
          .min(1, "部屋番号は1以上")
          .max(999, "部屋番号は999以下")
          .optional(),
      ),
      age: z.preprocess(
        (v) => (v === "" || v == null ? undefined : Number(v)),
        z.number().min(0, "年齢は0以上").max(150, "年齢は150以下").optional(),
      ),
      disease: z.string().trim().optional(),
      history: z.string().trim().optional(),
      progress: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.room == null) return;
      if (usedRooms.includes(data.room)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "この部屋番号は既に使用されています",
          path: ["room"],
        });
      }
    });
};

export const recordSchema = z.object({
  date: z.string().trim().min(1, "日付は必須").optional(),
  author: z.string().trim().min(1, "記録者は必須"),
  content: z.string().optional(),
  vitals: z.object({
    T: optionalNumber(35, 42, "体温は35以上", "体温は42以下"),
    P: optionalNumber(0, 200, "脈拍は0以上", "脈拍は200以下"),
    R: optionalNumber(0, 40, "呼吸は0以上", "呼吸は40以下"),
    SBP: optionalNumber(0, 250, "収縮期は0以上", "収縮期は250以下"),
    DBP: optionalNumber(0, 150, "拡張期は0以上", "拡張期は150以下"),
    SPO2: optionalNumber(0, 100, "SPO2は0以上", "SPO2は100以下"),
  }),
});
