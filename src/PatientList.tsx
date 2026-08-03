import { CircularProgress, Snackbar, Alert } from "@mui/material";

import  { useState } from "react";
import AddPatientForm from "./AddPatientForm";
import { useNavigate } from "react-router-dom";
import type { Patient } from "./types";
import type { FieldErrors } from "react-hook-form";
import type { PatientInput } from "./schema";

type PatientListProps = {
  patients: Patient[];
  isLoading: boolean;
  apiError: string;
  onErrorsChange: (errors: FieldErrors<PatientInput>) => void;
  addPatient: (patient: Omit<Patient, "id">) => Promise<Patient | undefined>;
};

export default function PatientList({
  patients,
  isLoading,
  apiError,
  onErrorsChange,
  addPatient,
}: PatientListProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const navigate = useNavigate();

  const addPatientSubmit = async (
    data: Omit<Patient, "id">,
  ): Promise<Patient | undefined> => {
    const savedPatient = await addPatient(data);
    if (!savedPatient) {
      return undefined;
    }
    return savedPatient;
  };

  return (
    <div className="container">
      {isLoading && (
        <div className="loading-container">
          <CircularProgress size={24} />
          <span className="loading-text">読み込み中...</span>
        </div>
      )}

      {!isLoading && apiError && (
        <Snackbar
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={true}
          autoHideDuration={5000}
        >
          <Alert severity="error">{apiError}</Alert>
        </Snackbar>
      )}

      {!isLoading && (
        <section className="section">
          <div className="section-header">
            <h1 className="section-title">患者一覧</h1>
            <div className="section-actions">
              {!showAddForm && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowAddForm(true)}
                >
                  追加
                </button>
              )}
            </div>
          </div>

          <div className="item-list">
            {patients.map((patient) => (
              <div
                className="card"
                key={patient.id}
                onClick={() => navigate(`/patient/${patient.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="card-header">
                  <h2 className="card-title" style={{ margin: 0 }}>
                    {patient.room}号室 {patient.name}
                  </h2>
                </div>
              </div>
            ))}
          </div>

          <AddPatientForm
            patients={patients}
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
            onSubmit={addPatientSubmit}
            onErrorsChange={onErrorsChange}
          />
        </section>
      )}
    </div>
  );
}
