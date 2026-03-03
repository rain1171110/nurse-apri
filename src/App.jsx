import { useState, useEffect, useRef } from "react";
import PatientList from "./PatientList";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { fetchAppData, saveAppData } from "./api/patientApi";

function App() {
  const [globalErrors, setGlobalErrors] = useState({});
  const [displayErrors, setDisplayErrors] = useState({});
  const timerRef = useRef(null);

  const [appData, setAppData] = useState({ patients: [], records: [] });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

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

  const onSaveData = async (payload) => {
    const saved = await saveAppData(payload);
    setAppData(saved);
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <header className="app-header">
        <h1>看護記録システム</h1>
      </header>
      <main className="app-main">
        <PatientList
          onErrorsChange={setGlobalErrors}
          onSaveData={onSaveData}
          patients={appData.patients}
          records={appData.records}
          setPatients={setPatients}
          setRecords={setRecords}
          isLoading={loading}
          apiError={apiError}
        />
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
