import { useParams } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientPage({ patients, records }) {
  const { id } = useParams();

  const patient = patients.find((p) => String(p.id) === id);
  const patientRecords = records.filter((r) => String(r.patientId) === id);

  if (!patient) return <div>患者が見つかりません</div>;
  return (
    <div>
      <PatientCard patient={patient} records={patientRecords} />
    </div>
  );
}
