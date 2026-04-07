import { useState } from "react";
import { formatBpText, formatValue } from "./Utils";
import NursingRecordForm from "./NursingRecordForm";
import DeleteButton from "./DeleteButton";
import { useNavigate, useParams } from "react-router-dom";
export default function NursingRecordItem({
  patients,
  records,
  onErrorsChange,
  updateRecord,
  onDeleteRecord,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const { id, recordId } = useParams();
  const navigate = useNavigate();

  const patient = patients.find((p) => String(p.id) === id);
  const record = records.find(
    (r) => String(r.id) === recordId && String(r.patientId) === id,
  );

  if (!patient) return <div>患者が見つかりません</div>;
  if (!record)
    return <div className="panel panel-warning">記録が見つかりません</div>;

  const initialValues = {
    date: record?.date || "",
    vitals: record?.vitals || {},
    content: record?.content || "",
    author: record?.author || "",
  };

  const { T, P, R, SBP, DBP, SPO2 } = record.vitals ?? {};
  const bpText = formatBpText(SBP, DBP);
  const bpDisplay = bpText === "--" ? "--" : `${bpText}mmHg`;

  const handleSubmit = async (data) => {
    const updatedRecord = { ...record, ...data };
    await updateRecord(updatedRecord);
    setIsEditing(false);
    navigate(`/patient/${id}/records`);
  };

  const handleDelete = async () => {
    await onDeleteRecord(record.id);
    navigate(`/patient/${id}/records`);
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
            onSubmit={handleSubmit}
            showDate
            onErrorsChange={onErrorsChange}
          />
          <div className="card-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsEditing(false);
                navigate(`/patient/${id}/records`);
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
            onClick={() => navigate(`/patient/${id}/records`)}
          >
            戻る
          </button>
          <DeleteButton handleDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}
