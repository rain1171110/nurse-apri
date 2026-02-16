import dayjs from "dayjs";

export const VITAL_FIELDS = ["T", "P", "R", "SBP", "DBP", "SPO2"];

export const formatValue = (value, unit = "", empty = "--") =>
  value !== "" && value != null ? `${value}${unit}` : empty;

export const createEmptyRecord = () => ({
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
export const formatBpText = (sbp, dbp) =>
  sbp && dbp ? `${sbp}/${dbp}` : sbp || dbp || "--";

export const formatDate = (date) => {
  return date ? dayjs(date).format("YYYY-MM-DD") : "";
};

export const extractUsedRoomNumbers = (patients, excludePatientId = null) => {
  return patients
    .filter((p) => p.id !== excludePatientId)
    .map((p) => (p.room == null || p.room === "" ? undefined : Number(p.room)))
    .filter((r) => Number.isFinite(r));
};
