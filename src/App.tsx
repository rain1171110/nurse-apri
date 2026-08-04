import { useState, useEffect, useRef } from "react";
import PatientList from "./PatientList";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { fetchAppData } from "./api/appDataApi";
import {
  createPatientApi,
  updatePatientApi,
  deletePatientApi,
} from "./api/patientApi";
import {
  createRecordApi,
  updateRecordApi,
  deleteRecordApi,
} from "./api/recordApi";
import { Routes, Route } from "react-router-dom";
import PatientPage from "./PatientPage";
import PatientDetail from "./PatientDetail";
import PatientVitals from "./PatientVitals";
import NursingRecordList from "./NursingRecordList";
import NursingRecordItem from "./NursingRecordItem";
import PatientMenu from "./PatientMenu";
import { Alert, Snackbar } from "@mui/material";
import type { AppData, NursingRecord, Patient } from "./types";
import type { RecordOutput } from "./schema";

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  } else {
    return fallbackMessage;
  }
};

function App() {
  const [globalErrors, setGlobalErrors] = useState({});
  const [displayErrors, setDisplayErrors] = useState({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [appData, setAppData] = useState<AppData>({
    patients: [],
    records: [],
  });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const onClearApiError = (): void => {
    setApiError("");
  };

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
        setGlobalErrors({});
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

  const addPatient = async (
    patient: Omit<Patient, "id">,
  ): Promise<Patient | undefined> => {
    try {
      setApiError("");

      const savedPatient = await createPatientApi(patient);

      setAppData((prev) => ({
        ...prev,
        patients: [...prev.patients, savedPatient],
      }));
      return savedPatient;
    } catch (error) {
      console.error("患者追加に失敗しました", error);
      setApiError(getErrorMessage(error, "患者追加に失敗しました"));
      return undefined;
    }
  };

  const updatePatient = async (
    patientToUpdate: Patient,
  ): Promise<Patient | undefined> => {
    try {
      setApiError("");

      const { id, ...patientData } = patientToUpdate;

      const updatedPatient = await updatePatientApi(id, patientData);

      setAppData((prev) => ({
        ...prev,
        patients: prev.patients.map((patient) =>
          String(patient.id) === String(updatedPatient.id)
            ? updatedPatient
            : patient,
        ),
      }));
      return updatedPatient;
    } catch (error) {
      console.error("患者情報更新に失敗しました", error);
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("患者情報更新に失敗しました");
      }
      return undefined;
    }
  };

  const deletePatient = async (id: string): Promise<boolean> => {
    try {
      setApiError("");

      const deletedPatient = await deletePatientApi(id);

      setAppData((prev) => ({
        ...prev,
        patients: prev.patients.filter(
          (patient) => String(patient.id) !== String(deletedPatient.id),
        ),
        records: prev.records.filter(
          (record) => String(record.patientId) !== String(deletedPatient.id),
        ),
      }));
      return true;
    } catch (error) {
      console.error("患者削除に失敗しました", error);
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("患者削除に失敗しました");
      }
      return false;
    }
  };

  const addRecord = async (
    record: RecordOutput,
    patientId: string,
  ): Promise<NursingRecord | undefined> => {
    const recordToAdd: Omit<NursingRecord, "id"> = {
      ...record,
      patientId,
    };

    try {
      setApiError("");
      const savedRecord = await createRecordApi(recordToAdd);

      setAppData((prev) => ({
        ...prev,
        records: [...prev.records, savedRecord],
      }));
      return savedRecord;
    } catch (error) {
      console.error("看護記録追加に失敗しました", error);
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("看護記録追加に失敗しました");
      }
      return undefined;
    }
  };

  const updateRecord = async (
    recordToUpdate: NursingRecord,
  ): Promise<NursingRecord | undefined> => {
    try {
      setApiError("");

      const { id, ...recordData } = recordToUpdate;

      const updatedRecord = await updateRecordApi(id, recordData);

      setAppData((prev) => ({
        ...prev,
        records: prev.records.map((r) =>
          String(r.id) === String(updatedRecord.id) ? updatedRecord : r,
        ),
      }));
      return updatedRecord;
    } catch (error) {
      console.error("看護記録修正に失敗しました", error);
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("看護記録修正に失敗しました");
      }
      return undefined;
    }
  };

  const deleteRecord = async (id: string): Promise<boolean> => {
    try {
      setApiError("");
      const deletedRecord = await deleteRecordApi(id);

      setAppData((prev) => ({
        ...prev,
        records: prev.records.filter(
          (record) => String(record.id) !== String(deletedRecord.id),
        ),
      }));

      return true;
    } catch (error) {
      console.error("看護記録削除に失敗しました", error);
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("看護記録削除に失敗しました");
      }
      return false;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <header className="app-header">
        <h1>看護記録システム</h1>
      </header>

      <Snackbar
        open={Boolean(apiError)}
        autoHideDuration={5000}
        onClose={onClearApiError}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Alert
          severity="error"
          onClose={onClearApiError}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {apiError}
        </Alert>
      </Snackbar>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <PatientList
                patients={appData.patients}
                isLoading={loading}
                onErrorsChange={setGlobalErrors}
                addPatient={addPatient}
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
