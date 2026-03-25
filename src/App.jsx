import { useState, useEffect, useRef } from "react";
import PatientList from "./PatientList";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { fetchAppData, saveAppData } from "./api/patientApi";
import { Routes, Route } from "react-router-dom";
import PatientPage from "./PatientPage";

function App() {
  const [globalErrors, setGlobalErrors] = useState({});
  const [displayErrors, setDisplayErrors] = useState({});
  const timerRef = useRef(null);

  const [appData, setAppData] = useState({ patients: [], records: [] });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  useEffect(() => {
    // エラーが新しく出た時
    if (Object.keys(globalErrors).length > 0) {
      // マイクロタスクキューに登録（同期的ではなくなる）
      Promise.resolve().then(() => {
        setDisplayErrors(globalErrors);
      });

      // 前のタイマーをクリア
      if (timerRef.current) clearTimeout(timerRef.current);

      // 10秒後に表示をクリア
      timerRef.current = setTimeout(() => {
        setDisplayErrors({});
      }, 10000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [globalErrors]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setApiError("");
      try {
        const data = await fetchAppData();
        setAppData({
          patients: Array.isArray(data.patients) ? data.patients : [],
          records: Array.isArray(data.records) ? data.records : [],
        });
      } catch (error) {
        console.error(error);
        setApiError("APIから読み込めませんでした");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const isValidAppData = (data) => {
    return (
      data &&
      typeof data === "object" &&
      Array.isArray(data.patients) &&
      Array.isArray(data.records)
    );
  };

  const onSaveData = async (payload) => {
    const saved = await saveAppData(payload);
    if (isValidAppData(saved)) {
      setAppData(saved);
    } else {
      console.error("保存のレスポンス形式が不正です", saved);
    }
  };

  const addRecord = async (record) => {
    if (selectedPatientId === null) return;

    const recordToAdd = {
      ...record,
      patientId: selectedPatientId,
      id: Date.now(),
    };
    const nextRecords = [...appData.records, recordToAdd];
    await onSaveData({
      patients: appData.patients,
      records: nextRecords,
    });
  };

  const setPatients = (updater) => {
    setAppData((prev) => {
      const nextPatients =
        typeof updater === "function" ? updater(prev.patients) : updater;
      return { ...prev, patients: nextPatients };
    });
  };

  const setRecords = (updater) => {
    setAppData((prev) => {
      const nextRecords =
        typeof updater === "function" ? updater(prev.records) : updater;
      return { ...prev, records: nextRecords };
    });
  };

  const updatePatient = async (updated) => {
    const nextPatients = appData.patients.map((p) =>
      p.id === updated.id ? updated : p,
    );
    await onSaveData({ patients: nextPatients, records: appData.records });
  };

  const updateRecord = async (updatedRecord) => {
    const nextRecords = appData.records.map((r) =>
      r.id === updatedRecord.id ? updatedRecord : r,
    );
    await onSaveData({ patients: appData.patients, records: nextRecords });
  };

  const deletePatient = async (id) => {
    const nextPatients = appData.patients.filter((p) => p.id !== id);
    const nextRecords = appData.records.filter((r) => r.patientId !== id);
    await onSaveData({ patients: nextPatients, records: nextRecords });
    setSelectedPatientId(null);
  };
  const deleteRecord = async (id) => {
    const nextRecords = appData.records.filter((r) => r.id !== id);
    await onSaveData({ patients: appData.patients, records: nextRecords });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <header className="app-header">
        <h1>看護記録システム</h1>
      </header>
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <PatientList
                onErrorsChange={setGlobalErrors}
                onSaveData={onSaveData}
                patients={appData.patients}
                records={appData.records}
                setPatients={setPatients}
                updatePatient={updatePatient}
                setRecords={setRecords}
                selectedPatientId={selectedPatientId}
                setSelectedPatientId={setSelectedPatientId}
                isLoading={loading}
                apiError={apiError}
                addRecord={addRecord}
                updateRecord={updateRecord}
                deletePatient={deletePatient}
                deleteRecord={deleteRecord}
              />
            }
          />
          <Route
            path="/patient/:id"
            element={
              <PatientPage
                patients={appData.patients}
                records={appData.records}
                
              />
            }
          />
          <Route path="/test" element={<div>テスト画面</div>} />
        </Routes>

        {import.meta.env.DEV && Object.keys(displayErrors).length > 0 && (
          <div className="dev-error-panel">
            <strong>Validation Errors:</strong>
            <pre>{JSON.stringify(displayErrors, null, 2)}</pre>
          </div>
        )}
      </main>
    </LocalizationProvider>
  );
}

export default App;
