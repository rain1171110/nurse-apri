import { useState, useEffect, useRef } from "react";
import PatientList from "./PatientList";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { fetchAppData, saveAppData } from "./api/patientApi";
import { Routes, Route } from "react-router-dom";
import PatientPage from "./PatientPage";
import PatientDetail from "./PatientDetail";
import PatientVitals from "./PatientVitals";
import NursingRecordList from "./NursingRecordList";
import NursingRecordItem from "./NursingRecordItem";
import PatientMenu from "./PatientMenu";

function App() {
  const [globalErrors, setGlobalErrors] = useState({});
  const [displayErrors, setDisplayErrors] = useState({});
  const timerRef = useRef(null);

  const [appData, setAppData] = useState({ patients: [], records: [] });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // 開発時にエラー内容が分かるように
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

  const onSaveData = async (nextAppData) => {
    try {
      setApiError("");
      const responseAppData = await saveAppData(nextAppData);
      if (!isValidAppData(responseAppData)) {
        throw new Error("保存のレスポンス形式が不正です");
      }
      setAppData(responseAppData);
    } catch (error) {
      console.error("データの保存に失敗しました", error);
      setApiError("データの保存に失敗しました");
    }
  };

  const addRecord = async (record, patientId) => {
    const recordToAdd = {
      ...record,
      patientId,
      id: crypto.randomUUID(),
    };
    const nextRecords = [...appData.records, recordToAdd];
    await onSaveData({
      patients: appData.patients,
      records: nextRecords,
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
                onSaveData={onSaveData}
                patients={appData.patients}
                records={appData.records}
                isLoading={loading}
                apiError={apiError}
                onErrorsChange={setGlobalErrors}
              />
            }
          />
          <Route
            path="/patient/:id"
            element={
              <PatientPage
                patients={appData.patients}
                records={appData.records}
                updatePatient={updatePatient}
                addRecord={addRecord}
                updateRecord={updateRecord}
                deleteRecord={deleteRecord}
                deletePatient={deletePatient}
              />
            }
          >
            <Route index element={<PatientMenu />} />
            <Route
              path="detail"
              element={<PatientDetail onErrorsChange={setGlobalErrors} />}
            />
            <Route path="vitals" element={<PatientVitals />} />
            <Route
              path="records"
              element={<NursingRecordList onErrorsChange={setGlobalErrors} />}
            />
            <Route
              path="records/:recordId"
              element={<NursingRecordItem onErrorsChange={setGlobalErrors} />}
            />
          </Route>
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
