import { Outlet, useParams } from "react-router-dom";
import { extractUsedRoomNumbers } from "./Utils";
import { Alert } from "@mui/material";
import type { Patient, NursingRecord, PatientOutletContext } from "./types";

type PatientPageProps = {
  patients: Patient[];
  records: NursingRecord[];
  apiError: string;
  onClearApiError: () => void;
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
  apiError,
  onClearApiError,
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
  return (
    <>
      {apiError && (
        <Alert severity="error" onClose={onClearApiError}>
          {apiError}
        </Alert>
      )}

      <Outlet context={outletContext} />
    </>
  );
}
