import { Outlet, useParams } from "react-router-dom";
import { extractUsedRoomNumbers } from "./Utils";
import type { Patient, NursingRecord, PatientOutletContext } from "./types";

type PatientPageProps = {
  patients: Patient[];
  records: NursingRecord[];
} & Pick<
  PatientOutletContext,
  | "updatePatient"
  | "updateRecord"
  | "deleteRecord"
  | "deletePatient"
  | "addRecord"
>;

export default function PatientPage({
  patients,
  records,
  updatePatient,
  addRecord,
  updateRecord,
  deleteRecord,
  deletePatient,
}: PatientPageProps) {
  const { id } = useParams();
  const patient = patients.find((p) => String(p.id) === id);
  const patientRecords = records.filter((r) => String(r.patientId) === id);

  if (!patient) return <div>患者が見つかりません</div>;

  const usedRoomsForEdit = extractUsedRoomNumbers(patients, patient.id);

  const outletContext: PatientOutletContext = {
    patient,
    patientRecords,
    updatePatient,
    addRecord,
    updateRecord,
    deleteRecord,
    deletePatient,
    usedRoomsForEdit,
  };
  return <Outlet context={outletContext} />;
}
