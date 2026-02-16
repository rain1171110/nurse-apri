import { useState, useEffect, useRef } from "react";
import PatientList from "./PatientList";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

function App() {
  const [globalErrors, setGlobalErrors] = useState({});
  const [displayErrors, setDisplayErrors] = useState({});
  const timerRef = useRef(null);

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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <header className="app-header">
        <h1>看護記録システム</h1>
      </header>
      <main className="app-main">
        <PatientList onErrorsChange={setGlobalErrors} />
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
