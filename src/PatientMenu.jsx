import { useParams } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientMenu({ patients, deletePatient }) {
  const { id } = useParams();

  const patient = patients.find((p) => String(p.id) === id);

  if (!patient) return <div>患者が見つかりません</div>;

  return <PatientCard patient={patient} onDelete={deletePatient} />;
}
