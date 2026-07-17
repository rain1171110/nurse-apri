import type { RecordOutput } from "./schema";

export type VitalSigns = {
  T?: number;
  P?: number;
  R?: number;
  SBP?: number;
  DBP?: number;
  SPO2?: number;
};

export type Patient = {
  id: string;
  name: string;
  room: number;
  age?: number;
  disease?: string;
  history?: string;
  progress?: string;
};

export type NursingRecord = {
  id: string;
  patientId: string;
  date: string;
  author: string;
  content?: string;
  vitals: VitalSigns;
};

export type AppData = {
  patients: Patient[];
  records: NursingRecord[];
};

export type PatientOutletContext = {
  patient: Patient;
  patientRecords: NursingRecord[];
  updatePatient: (patient: Patient) => Promise<Patient | undefined>;
  addRecord: (
    data: RecordOutput,
    patientId: string,
  ) => Promise<NursingRecord | undefined>;
  updateRecord: (record: NursingRecord) => Promise<NursingRecord | undefined>;
  deleteRecord: (id: string) => Promise<boolean>;
  deletePatient: (id: string) => Promise<boolean>;
  usedRoomsForEdit: number[];
};
