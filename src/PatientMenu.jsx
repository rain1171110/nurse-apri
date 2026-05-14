import { useOutletContext, useNavigate } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientMenu() {
  const navigate = useNavigate();
  const { patient, deletePatient } = useOutletContext();

  if (!patient) return <div>患者が見つかりません</div>;

  const handleDelete = async () => {
    console.log("削除する患者ID:", patient.id);

    await deletePatient(patient.id);
    navigate("/");
  };

  return (
    <div>
      <PatientCard patient={patient} onDelete={handleDelete} />
    </div>
  );
}
