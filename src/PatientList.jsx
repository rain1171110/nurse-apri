import { CircularProgress, Snackbar, Alert } from "@mui/material";

import { useState } from "react";
import AddPatientForm from "./AddPatientForm";
import { useNavigate } from "react-router-dom";

export default function PatientList({
  onSaveData,
  patients,
  records,
  isLoading,
  apiError,
  onErrorsChange,
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  const navigate = useNavigate();

  const addPatientSubmit = async (data) => {
    const patientToAdd = { ...data, id: crypto.randomUUID() };
    const nextPatients = [...patients, patientToAdd];
    await onSaveData({ patients: nextPatients, records });
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

      {!isLoading && !apiError && (
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
