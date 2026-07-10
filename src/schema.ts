import { z } from "zod";

export const optionalNumber = (
  min: number,
  max: number,
  msgMin: string,
  msgMax: string,
) =>
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

export const makePatientSchemaPartial = (usedRooms: number[]) => {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "氏名は必須です")
        .refine((v) => !/\d/.test(v), {
          message: "氏名に数字を含めることはできません",
        }),
      room: optionalNumber(1, 999, "部屋番号は1以上", "部屋番号は999以下"),
      age: optionalNumber(0, 150, "年齢は0以上", "年齢は150以下"),
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
  date: z.string().trim().min(1, "日付は必須"),
  author: z.string().trim().min(1, "記録者は必須"),
  content: z.string().trim().optional(),
  vitals: z.object({
    T: optionalNumber(35, 42, "体温は35以上", "体温は42以下"),
    P: optionalNumber(0, 200, "脈拍は0以上", "脈拍は200以下"),
    R: optionalNumber(0, 40, "呼吸は0以上", "呼吸は40以下"),
    SBP: optionalNumber(0, 250, "収縮期は0以上", "収縮期は250以下"),
    DBP: optionalNumber(0, 150, "拡張期は0以上", "拡張期は150以下"),
    SPO2: optionalNumber(0, 100, "SPO2は0以上", "SPO2は100以下"),
  }),
});

type RecordInput = {
  date: string;
  author: string;
  content: string;
  vitals: {
    T: string;
    P: string;
    R: string;
    SBP: string;
    DBP: string;
    SPO2: string;
  };
};

type ValidPatientValidationCase = {
  id: string;
  label: string;
  usedRooms: number[];
  input: {
    name: string;
    room: string;
    age: string;
    disease: string;
    history: string;
    progress: string;
  };
  expectValid: true;
};
type InvalidPatientValidationCase = {
  id: string;
  label: string;
  usedRooms: number[];
  input: {
    name: string;
    room: string;
    age: string;
    disease: string;
    history: string;
    progress: string;
  };
  expectValid: false;
  expectErrorPath: string;
  expectErrorMessage?: string;
};

type PatientValidationCase =
  | ValidPatientValidationCase
  | InvalidPatientValidationCase;

export const createPatientValidationCases = (): PatientValidationCase[] => [
  {
    id: "normal-input",
    label: "正常入力",
    usedRooms: [101, 102],
    input: {
      name: "山田太郎",
      room: "103",
      age: "70",
      disease: "肺炎",
      history: "高血圧",
      progress: "解熱傾向",
    },
    expectValid: true,
  },
  {
    id: "duplicate-room",
    label: "重複部屋",
    usedRooms: [101, 102],
    input: {
      name: "山田太郎",
      room: "101",
      age: "70",
      disease: "肺炎",
      history: "高血圧",
      progress: "解熱傾向",
    },
    expectValid: false,
    expectErrorPath: "room",
    expectErrorMessage: "この部屋番号は既に使用されています",
  },
  {
    id: "required-missing",
    label: "必須未入力",
    usedRooms: [101, 102],
    input: {
      name: "",
      room: "103",
      age: "70",
      disease: "肺炎",
      history: "高血圧",
      progress: "解熱傾向",
    },
    expectValid: false,
    expectErrorPath: "name",
    expectErrorMessage: "氏名は必須です",
  },
  {
    id: "room-not-number",
    label: "部屋番号が数字でない",
    usedRooms: [101, 102],
    input: {
      name: "山田太郎",
      room: "abc", // 数字でない部屋番号の入力
      age: "70",
      disease: "肺炎",
      history: "高血圧",
      progress: "解熱傾向",
    },
    expectValid: false,
    expectErrorPath: "room",
    expectErrorMessage: "数字を入力して下さい",
  },
];

type PatientValidationResult = {
  id: string;
  label: string;
  expected: "valid" | "invalid";
  actual: "valid" | "invalid";
  ok: boolean;
  firstErrorPath: string;
  firstErrorMessage: string;
};

export const runPatientValidationCases = (): PatientValidationResult[] => {
  return createPatientValidationCases().map((testCase) => {
    const schema = makePatientSchemaPartial(testCase.usedRooms);
    const result = schema.safeParse(testCase.input);

    const firstIssue = result.success ? undefined : result.error.issues[0];
    const firstPath = (firstIssue?.path ?? []).join(".");
    const firstMessage = firstIssue?.message ?? "";

    const isExpectedResult = result.success === testCase.expectValid;

    const isExpectedErrorPath =
      testCase.expectValid || firstPath === testCase.expectErrorPath;

    const isExpectedErrorMessage =
      testCase.expectValid ||
      testCase.expectErrorMessage === undefined ||
      firstMessage === testCase.expectErrorMessage;

    return {
      id: testCase.id,
      label: testCase.label,
      expected: testCase.expectValid ? "valid" : "invalid",
      actual: result.success ? "valid" : "invalid",
      ok: isExpectedResult && isExpectedErrorPath && isExpectedErrorMessage,
      firstErrorPath: firstPath,
      firstErrorMessage: result.success
        ? ""
        : (result.error.issues[0]?.message ?? ""),
    };
  });
};

type ValidRecordValidationCase = {
  id: string;
  label: string;
  input: RecordInput;
  expectValid: true;
};

type InvalidRecordValidationCase = {
  id: string;
  label: string;
  input: RecordInput;
  expectValid: false;
  expectErrorPath: string;
  expectErrorMessage?: string;
};

type RecordValidationCase =
  | ValidRecordValidationCase
  | InvalidRecordValidationCase;

export const createRecordValidationCases = (): RecordValidationCase[] => [
  {
    id: "normal-record",
    label: "正常な看護記録",
    input: {
      date: "2026-07-10",
      author: "岡﨑",
      content: "発熱なし。食事摂取良好。",
      vitals: {
        T: "36.5",
        P: "80",
        R: "18",
        SBP: "120",
        DBP: "70",
        SPO2: "98",
      },
    },
    expectValid: true,
  },
  {
    id: "date-required",
    label: "日付未入力",
    input: {
      date: "",
      author: "岡﨑",
      content: "発熱なし。",
      vitals: {
        T: "36.5",
        P: "80",
        R: "18",
        SBP: "120",
        DBP: "70",
        SPO2: "98",
      },
    },
    expectValid: false,
    expectErrorPath: "date",
    expectErrorMessage: "日付は必須",
  },
  {
    id: "author-required",
    label: "記録者未入力",
    input: {
      date: "2026-07-10",
      author: "",
      content: "発熱なし。",
      vitals: {
        T: "36.5",
        P: "80",
        R: "18",
        SBP: "120",
        DBP: "70",
        SPO2: "98",
      },
    },
    expectValid: false,
    expectErrorPath: "author",
    expectErrorMessage: "記録者は必須",
  },
  {
    id: "temperature-too-low",
    label: "体温が低すぎる",
    input: {
      date: "2026-07-10",
      author: "岡﨑",
      content: "低体温チェック。",
      vitals: {
        T: "34",
        P: "80",
        R: "18",
        SBP: "120",
        DBP: "70",
        SPO2: "98",
      },
    },
    expectValid: false,
    expectErrorPath: "vitals.T",
    expectErrorMessage: "体温は35以上",
  },
  {
    id: "spo2-too-high",
    label: "SPO2が高すぎる",
    input: {
      date: "2026-07-10",
      author: "岡﨑",
      content: "SPO2入力チェック。",
      vitals: {
        T: "36.5",
        P: "80",
        R: "18",
        SBP: "120",
        DBP: "70",
        SPO2: "101",
      },
    },
    expectValid: false,
    expectErrorPath: "vitals.SPO2",
    expectErrorMessage: "SPO2は100以下",
  },
];

type RecordValidationResult = {
  id: string;
  label: string;
  expected: "valid" | "invalid";
  actual: "valid" | "invalid";
  ok: boolean;
  firstErrorPath: string;
  firstErrorMessage: string;
};

export const runRecordValidationCases = (): RecordValidationResult[] => {
  return createRecordValidationCases().map((testCase) => {
    const result = recordSchema.safeParse(testCase.input);

    const firstIssue = result.success ? undefined : result.error.issues[0];
    const firstPath = (firstIssue?.path ?? []).join(".");
    const firstMessage = firstIssue?.message ?? "";

    const isExpectedResult = result.success === testCase.expectValid;

    const isExpectedErrorPath =
      testCase.expectValid || firstPath === testCase.expectErrorPath;

    const isExpectedErrorMessage =
      testCase.expectValid ||
      testCase.expectErrorMessage === undefined ||
      firstMessage === testCase.expectErrorMessage;

    return {
      id: testCase.id,
      label: testCase.label,
      expected: testCase.expectValid ? "valid" : "invalid",
      actual: result.success ? "valid" : "invalid",
      ok: isExpectedResult && isExpectedErrorPath && isExpectedErrorMessage,
      firstErrorPath: firstPath,
      firstErrorMessage: result.success
        ? ""
        : (result.error.issues[0]?.message ?? ""),
    };
  });
};

// ブラウザのコンソールから叩けるようにする（安全ガード付き）
if (import.meta.env?.DEV && typeof window !== "undefined") {
  const devWindow = window as typeof window & {
    runPatientValidationCases: typeof runPatientValidationCases;
    runRecordValidationCases: typeof runRecordValidationCases;
  };
  devWindow.runPatientValidationCases = runPatientValidationCases;
  devWindow.runRecordValidationCases = runRecordValidationCases;
}
