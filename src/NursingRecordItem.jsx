import { useState } from "react";
import { formatBpText, formatValue } from "./Utils";
import NursingRecordForm from "./NursingRecordForm";

export default function NursingRecordItem({
  patient,
  onBackToRecords,
  record,
  isEditing,
  setIsEditing,
  onUpdate,
  onDeleteRecord,
  onErrorsChange,
}) {
  const [formData] = useState({
    date: record?.date || "",
    vitals: record?.vitals || {},
    content: record?.content || "",
    author: record?.author || "",
  });

  if (!record)
    return <div className="panel panel-warning">記録が見つかりません</div>;

  const { T, P, R, SBP, DBP, SPO2 } = record.vitals;
  const bpText = formatBpText(SBP, DBP);
  const bpDisplay = bpText === "--" ? "--" : `${bpText}mmHg`;

  const handleSubmit = (data) => {
    const updateRecord = { ...record, ...data };
    onUpdate(updateRecord);
    setIsEditing(false);
    onBackToRecords();
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
            initialValues={formData}
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
                onBackToRecords();
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
            onClick={onBackToRecords}
          >
            戻る
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              onDeleteRecord(record.id);
              onBackToRecords();
            }}
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
