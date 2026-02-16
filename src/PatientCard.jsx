export default function PatientCard({ patient, onSelect, onBack, onDelete }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          {patient.room}号室 {patient.name} さん
        </h2>
      </div>
      <div className="card-body">
        <div className="item-list">
          <button
            type="button"
            className="btn-primary"
            onClick={() => onSelect(patient, "details")}
          >
            患者情報
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onSelect(patient, "vitals")}
          >
            バイタルサイン一覧
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onSelect(patient, "records")}
          >
            看護記録
          </button>
        </div>
      </div>
      <div className="card-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onBack()}
        >
          戻る
        </button>
        <button type="button" className="btn-danger" onClick={onDelete}>
          削除
        </button>
      </div>
    </div>
  );
}
