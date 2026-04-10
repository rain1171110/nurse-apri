import { Outlet, useParams } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientPage({ patients, records,deletePatient }) {
  const { id } = useParams();

  const selectedPatient = patients.find((p) => String(p.id) === id);
  const patientRecords = records.filter((r) => String(r.patientId) === id);

  if (!selectedPatient) return <div>患者が見つかりません</div>;
  return (
    <div>
      <PatientCard patient={selectedPatient} onDelete={deletePatient}/>
      <Outlet context={{selectedPatient,patientRecords}}/>
    </div>
  );
}
