import { useOutletContext, useNavigate } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientMenu() {
  const navigate = useNavigate();
  const { patient, deletePatient } = useOutletContext();

  if (!patient) return <div>患者が見つかりません</div>;

  const handleDelete = async () => {
    const isDeleted = await deletePatient(patient.id);
    if (!isDeleted) {
      return;
    }
    navigate("/");
  };

  return (
    <div>
      <PatientCard patient={patient} onDeletePatient={handleDelete} />
    </div>
  );
}
