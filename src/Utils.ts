import dayjs, { type Dayjs } from "dayjs";
import type { RecordInput } from "./schema";
import type { Patient } from "./types";
export const VITAL_FIELDS = ["T", "P", "R", "SBP", "DBP", "SPO2"];

type FormatValue = (
  value: string | number | null | undefined,
  unit?: string,
  empty?: string,
) => string;

export const formatValue: FormatValue = (value, unit = "", empty = "--") =>
  value !== "" && value != null ? `${value}${unit}` : empty;

export const createEmptyRecord = (): RecordInput => ({
  date: "",
  vitals: {
    T: "",
    P: "",
    R: "",
    SBP: "",
    DBP: "",
    SPO2: "",
  },
  content: "",
  author: "",
});

export const TEMP_OPTIONS = [
  "35.0",
  "35.5",
  "36.0",
  "36.5",
  "37.0",
  "37.5",
  "38.0",
];
export const PULSE_OPTIONS = ["50", "60", "70", "80", "90", "100"];
export const RR_OPTIONS = ["10", "15", "20", "25", "30", "40"];
export const AUTHOR_OPTIONS = ["岡崎洋子", "大泉洋", "小栗俊", "鈴木綾香"];
export const SBP_OPTIONS = [
  "50",
  "60",
  "70",
  "80",
  "90",
  "100",
  "110",
  "120",
  "130",
  "140",
  "150",
  "160",
];
export const DBP_OPTIONS = [
  "20",
  "30",
  "40",
  "50",
  "60",
  "70",
  "80",
  "90",
  "100",
];
export const SPO2_OPTIONS = ["90", "92", "94", "96", "98", "100"];

export const formatBpText = (
  sbp: string | number | null | undefined,
  dbp: string | number | null | undefined,
): string => {
  if (sbp && dbp) {
    return `${sbp}/${dbp}`;
  }
  return "--";
};

export const formatDate = (
  date: string | number | Date | Dayjs | null | undefined,
): string => {
  return date ? dayjs(date).format("YYYY-MM-DD") : "";
};

export const extractUsedRoomNumbers = (
  patients: Patient[],
  excludePatientId: string | null = null,
): number[] => {
  return patients
    .filter((p) => p.id !== excludePatientId)
    .map((p) => p.room)
    .filter((r) => Number.isFinite(r));
};
