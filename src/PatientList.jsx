import NursingRecordList from "./NursingRecordList";
import NursingRecordItem from "./NursingRecordItem";
import PatientCard from "./PatientCard";
import PatientDetails from "./PatientDetail";
import PatientVitals from "./PatientVitals";

import { extractUsedRoomNumbers } from "./Utils";
import { CircularProgress, Snackbar, Alert } from "@mui/material";

import { useState, useMemo } from "react";
import AddPatientForm from "./AddPatientForm";

export default function PatientList({
  onErrorsChange,
  onSaveData,
  patients,
  records,
  isLoading,
  apiError,
  selectedPatientId,
  setSelectedPatientId,
  addRecord,
  updatePatient,
  updateRecord,
}) {
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const [activeView, setActiveView] = useState("list");

  const [isEditing, setIsEditing] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);

  const handleSelect = (patient, view = "menu", recordId) => {
    setSelectedPatientId(patient.id);
    if (view === "recordItem") {
      setSelectedRecordId(recordId);
    } else {
      setSelectedRecordId(null);
    }
    setActiveView(view);
  };

  const handleBack = () => {
    setSelectedPatientId(null);
    setActiveView("list");
  };


  const patientRecordItem = selectedRecordId
    ? records.find((r) => r.id === selectedRecordId)
    : null;

  const handleBackToRecords = () => {
    setActiveView("records");
    setSelectedRecordId(null);
  };

  const handleBackToMenu = () => {
    setActiveView("menu");
    setSelectedRecordId(null);
  };

  const selectedPatient =
    selectedPatientId === null
      ? null
      : (patients.find((p) => p.id === selectedPatientId) ?? null);

  const patientRecords = useMemo(() => {
    if (selectedPatientId === null) return [];
    return records.filter((r) => r.patientId === selectedPatientId);
  }, [records, selectedPatientId]);


  const deletePatient = async (id) => {
    const nextPatients = patients.filter((p) => p.id !== id);
    const nextRecords = records.filter((r) => r.patientId !== id);
    await onSaveData({ patients: nextPatients, records: nextRecords });
    setSelectedPatientId(null);
    setSelectedRecordId(null);
    setActiveView("list");
  };
  const deleteRecord = async (id) => {
    const nextRecords = records.filter((r) => r.id !== id);
    await onSaveData({ patients, records: nextRecords });
    setSelectedRecordId(null);
    setActiveView("records");
  };

  const usedRoomsForEdit = useMemo(
    () => extractUsedRoomNumbers(patients, selectedPatient?.id),
    [patients, selectedPatient?.id],
  );

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

      {!selectedPatient ? (
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
                onClick={() => handleSelect(patient)}
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
            records={records}
            onSaveData={onSaveData}
            onErrorsChange={onErrorsChange}
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
          />
        </section>
      ) : activeView === "details" ? (
        <>
          <PatientDetails
            patient={selectedPatient}
            onBack={handleBack}
            onBackToMenu={handleBackToMenu}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            updatePatient={updatePatient}
            onErrorsChange={onErrorsChange}
            usedRoomsForEdit={usedRoomsForEdit}
          />
        </>
      ) : activeView === "vitals" ? (
        <>
          <PatientVitals
            patient={selectedPatient}
            records={patientRecords}
            onBackToRecords={handleBackToRecords}
            onBackToMenu={handleBackToMenu}
          />
        </>
      ) : activeView === "records" ? (
        <>
          <NursingRecordList
            patient={selectedPatient}
            records={patientRecords}
            onBack={handleBack}
            onBackToMenu={handleBackToMenu}
            onSelect={handleSelect}
            addRecord={addRecord}
            onErrorsChange={onErrorsChange}
          />
        </>
      ) : activeView === "recordItem" ? (
        <>
          <NursingRecordItem
            key={patientRecordItem?.id}
            patient={selectedPatient}
            record={patientRecordItem}
            onBack={handleBack}
            onSelect={handleSelect}
            onBackToRecords={handleBackToRecords}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            updateRecord={updateRecord}
            updatePatient={updatePatient}
            onDeleteRecord={deleteRecord}
            onErrorsChange={onErrorsChange}
          />
        </>
      ) : activeView === "menu" ? (
        <>
          <PatientCard
            patient={selectedPatient}
            records={patientRecords}
            onBack={handleBack}
            onSelect={handleSelect}
            onDelete={() => deletePatient(selectedPatient.id)}
          />
        </>
      ) : (
        <div>未実装</div>
      )}
    </div>
  );
}
