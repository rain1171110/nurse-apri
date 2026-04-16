import { Outlet, useParams } from "react-router-dom";
import { extractUsedRoomNumbers } from "./Utils";

export default function PatientPage({
  patients,
  records,
  updatePatient,
  addRecord,
  updateRecord,
  deleteRecord,
  deletePatient
}) {
  const { id } = useParams();
  const patient = patients.find((p) => String(p.id) === id);
  const patientRecords =
    records.filter((r) => String(r.patientId) === id) ?? [];

  if (!patient) return <div>患者が見つかりません</div>;

  const usedRoomsForEdit = extractUsedRoomNumbers(patients, patient.id);

  return (
    <Outlet
      context={{
        patient,
        patientRecords,
        updatePatient,
        addRecord,
        updateRecord,
        deleteRecord,
        deletePatient,
        usedRoomsForEdit,
      }}
    />
  );
}
