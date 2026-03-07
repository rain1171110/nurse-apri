import NursingRecordList from "./NursingRecordList";
import NursingRecordItem from "./NursingRecordItem";
import PatientCard from "./PatientCard";
import PatientDetails from "./PatientDetail";
import PatientVitals from "./PatientVitals";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { makePatientSchemaPartial } from "./schema";
import { extractUsedRoomNumbers } from "./Utils";
import { CircularProgress, Snackbar, Alert, TextField } from "@mui/material";

import { useEffect, useState, useMemo } from "react";

export default function PatientList({
  onErrorsChange,
  onSaveData,
  patients,
  records,
  setPatients,
  setRecords,
  isLoading,
  apiError,
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [saveError, setSaveError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      await onSaveData({ patients, records });
      setSaveSuccess(true);
    } catch (e) {
      console.error(e);
      setSaveError("APIへの保存に失敗しました");
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [saveSuccess]);

  useEffect(() => {
    if (saveError === "") return;
    const timer = setTimeout(() => {
      setSaveError("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [saveError]);

  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const [activeView, setActiveView] = useState("list");

  const [isEditing, setIsEditing] = useState(false);

  const [newPatient, setNewPatient] = useState({
    name: "",
    room: "",
  });

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

  const updateRecord = (updateRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === updateRecord.id ? updateRecord : r)),
    );
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

  // const selectedPatient = useMemo(() => {
  //   if (selectedPatientId === null) return null;
  //   return patients.find((p) => p.id === selectedPatientId) ?? null;
  // }, [patients, selectedPatientId]);
  const selectedPatient =
    selectedPatientId === null
      ? null
      : (patients.find((p) => p.id === selectedPatientId) ?? null);

  const patientRecords = selectedPatient
    ? records.filter((r) => r.patientId === selectedPatient.id)
    : [];

  const updatePatient = (updated) => {
    setPatients((prev) => {
      return prev.map((patient) => {
        if (patient.id === updated.id) {
          return updated;
        } else {
          return patient;
        }
      });
    });
  };

  const addPatient = (added) => {
    const patientToAdd = {
      ...added,
      id: Date.now(),
    };
    setPatients((prev) => [...prev, patientToAdd]);
    setNewPatient({
      name: "",
      room: "",
    });
  };

  const addRecord = (record) => {
    const recordToAdd = {
      ...record,
      patientId: selectedPatient.id,
      id: Date.now(),
    };

    setRecords((prev) => [...prev, recordToAdd]);
  };

  const deletePatient = (id) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setRecords((prev) => prev.filter((r) => r.patientId !== id));
    setSelectedPatientId(null);
    setActiveView("list");
  };
  const deleteRecord = (id) =>
    setRecords((prev) => prev.filter((r) => r.id !== id));

  const usedRooms = useMemo(() => extractUsedRoomNumbers(patients), [patients]);

  const usedRoomsForEdit = useMemo(
    () => extractUsedRoomNumbers(patients, selectedPatient?.id),
    [patients, selectedPatient?.id],
  );

  const schema = useMemo(
    () => makePatientSchemaPartial(usedRooms),
    [usedRooms],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: newPatient,
  });

  useEffect(() => {
    reset(newPatient);
  }, [newPatient, reset]);

  useEffect(() => {
    if (onErrorsChange) {
      onErrorsChange(errors);
    }
  }, [errors, onErrorsChange]);

  return (
    <div className="container">
      {isLoading && (
        <div className="loading-container">
          <CircularProgress size={24} />
          <span className="loading-text">読み込み中...</span>
        </div>
      )}
      {isSaving && (
        <div className="loading-container">
          <CircularProgress size={24} />
          <span className="loading-text">保存中...</span>
        </div>
      )}
      {saveSuccess && (
        <Snackbar
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={true}
          autoHideDuration={5000}
          onClose={() => setSaveSuccess(false)}
        >
          <Alert severity="success">保存しました</Alert>
        </Snackbar>
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

      {saveError && (
        <Snackbar
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={true}
          autoHideDuration={5000}
          onClose={() => setSaveError("")}
        >
          <Alert severity="error">{saveError}</Alert>
        </Snackbar>
      )}

      {!selectedPatient ? (
        <section className="section">
          {/* 仮ボタン */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
            保存
          </button>
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

          {showAddForm && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">患者を追加</h3>
              </div>
              <form
                onSubmit={handleSubmit((data) => {
                  addPatient(data);
                  setShowAddForm(false);
                  reset();
                })}
              >
                <div className="card-body">
                  <div className="form-group">
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="氏名"
                          error={!!errors.name}
                          helperText={errors.name?.message}
                        />
                      )}
                    />
                  </div>
                  <div className="form-group">
                    <Controller
                      name="room"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="部屋番号"
                          error={!!errors.room}
                          helperText={errors.room?.message}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    患者を追加
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      ) : activeView === "details" ? (
        <>
          <PatientDetails
            patient={selectedPatient}
            onBack={handleBack}
            onBackToMenu={handleBackToMenu}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            onUpdate={updatePatient}
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
            onUpdate={updateRecord}
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
