import { useMemo, useState } from "react";
import { formatBpText, formatValue } from "./Utils";
import NursingRecordForm from "./NursingRecordForm";
import DeleteButton from "./DeleteButton";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
export default function NursingRecordItem({ onErrorsChange }) {
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();
  const { patient, patientRecords, updateRecord, deleteRecord } =
    useOutletContext();
  const { recordId } = useParams();

  const record = patientRecords.find((r) => String(r.id) === recordId);

  const initialValues = useMemo(() => {
    return {
      date: record?.date || "",
      vitals: record?.vitals || {},
      content: record?.content || "",
      author: record?.author || "",
    };
  }, [record]);

  if (!patient) return <div>患者が見つかりません</div>;
  if (!record)
    return <div className="panel panel-warning">記録が見つかりません</div>;

  const { T, P, R, SBP, DBP, SPO2 } = record.vitals ?? {};
  const bpText = formatBpText(SBP, DBP);
  const bpDisplay = bpText === "--" ? "--" : `${bpText}mmHg`;

  const handleRecordSubmit = async (data) => {
    const updatedRecord = { ...record, ...data };
    await updateRecord(updatedRecord);
    setIsEditing(false);
    navigate(`/patient/${patient.id}/records`);
  };

  const handleDelete = async () => {
    await deleteRecord(record.id);
    navigate(`/patient/${patient.id}/records`);
  };

  return (
    <div className="container-md">
      {!isEditing && (
        <>
          <div className="section-header">
            <h1 className="section-title">
              {patient.room}号室 {patient.name} さん
            </h1>
          </div>
          <div className="card">
            <div className="card-body">
              <p>日付:{record.date}</p>
              <p>
                体温:{formatValue(T, "℃")} 脈拍:{formatValue(P, "回/分")} 呼吸:
                {formatValue(R, "回/分")} 血圧:{bpDisplay} SPO2:
                {formatValue(SPO2, "%")}
              </p>
              <p>{record.content}</p>
              <p>{record.author}</p>
            </div>
          </div>
        </>
      )}

      {isEditing && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">記録を編集</h3>
          </div>
          <NursingRecordForm
            initialValues={initialValues}
            onSubmit={handleRecordSubmit}
            showDate
            onErrorsChange={onErrorsChange}
          />
          <div className="card-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsEditing(false);
                navigate(`/patient/${patient.id}/records`);
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="form-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsEditing(true)}
          >
            編集
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/patient/${patient.id}/records`)}
          >
            戻る
          </button>
          <DeleteButton onClick={handleDelete} />
        </div>
      )}
    </div>
  );
}
