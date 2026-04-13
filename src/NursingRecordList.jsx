import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { createEmptyRecord, formatDate } from "./Utils";
import NursingRecordForm from "./NursingRecordForm";

export default function NursingRecordList({ onErrorsChange, addRecord }) {
  const navigate = useNavigate();
  const { patient, patientRecords } = useOutletContext();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState(createEmptyRecord());

  const handleSubmit = async (data) => {
    await addRecord(data.patient.id);
    setIsAdding(false);
    setFormData(createEmptyRecord());
  };

  if (!patient) return <div>患者が見つかりません</div>;
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
                setFormData({
                  ...createEmptyRecord(),
                  date: formatDate(new Date()),
                });
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
            {patientRecords.map((r) => (
              <div
                className="card"
                key={r.id}
                onClick={() =>
                  navigate(`/patient/${patient.id}/records/${r.id}`)
                }
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
            onClick={() => navigate(`/patient/${patient.id}`)}
          >
            メニューに戻る
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/")}
          >
            患者一覧へ戻る
          </button>
        </div>
      )}
    </div>
  );
}
