import { useParams } from "react-router-dom";

export default function PatientPage() {
  const { id } = useParams();
  const patient = PatientList.find((p) => String(p.id) === id);
  return <div>患者ID: {id}</div>;
}
