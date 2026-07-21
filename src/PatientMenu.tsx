import { useOutletContext, useNavigate } from "react-router-dom";
import PatientCard from "./PatientCard";
import type { PatientOutletContext } from "./types";

type PatientMenuContext = Pick<
  PatientOutletContext,
  "patient" | "deletePatient"
>;

export default function PatientMenu() {
  const navigate = useNavigate();
  const { patient, deletePatient } = useOutletContext<PatientMenuContext>();

  if (!patient) return <div>患者が見つかりません</div>;

  const handleDelete = async ():Promise<void> => {
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
