import { useOutletContext, useNavigate } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientMenu() {
  const navigate = useNavigate();
  const { patient, deletePatient } = useOutletContext();

  if (!patient) return <div>患者が見つかりません</div>;

  const handleDelete = async () => {
    await deletePatient(patient.id);
    navigate("/")
  };

  return (
    <div>
      <PatientCard patient={patient} onDelete={handleDelete} />
    </div>
  );
}
