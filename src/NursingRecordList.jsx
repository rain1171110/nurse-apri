import { useState } from "react";
import { createEmptyRecord, formatDate } from "./Utils";
import NursingRecordForm from "./NursingRecordForm";

export default function NursingRecordList({
  records,
  patient,
  onSelect,
  onBack,
  onBackToMenu,
  addRecord,
  onErrorsChange,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState(createEmptyRecord);

  const handleSubmit = (data) => {
    addRecord(data);
    setIsAdding(false);
    setFormData(createEmptyRecord());
  };

  return (
    <div className="container-md">
      <div className="section-header">
        <h1 className="section-title">
          {patient.room}号室 {patient.name} さん
        </h1>
        {!isAdding && (
          <div className="section-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  date: formatDate(new Date()),
                }));
                setIsAdding(true);
              }}
            >
              記録を追加
            </button>
          </div>
        )}
      </div>

      {!isAdding && (
        <>
          <p className="text-secondary">看護記録一覧</p>
          <div className="item-list">
            {records.map((r) => (
              <div
                className="card"
                key={r.id}
                onClick={() => onSelect(patient, "recordItem", r.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="card-header">
                  <h3 className="card-title" style={{ margin: 0 }}>
                    {r.date} {r.author}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isAdding && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">記録を追加</h3>
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
                setIsAdding(false);
                setFormData(createEmptyRecord());
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {!isAdding && (
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onBackToMenu}
          >
            メニューに戻る
          </button>
          <button type="button" className="btn-secondary" onClick={onBack}>
            患者一覧へ戻る
          </button>
        </div>
      )}
    </div>
  );
}
