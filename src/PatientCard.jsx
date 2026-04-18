import { useNavigate } from "react-router-dom";
import DeleteButton from "./DeleteButton";

export default function PatientCard({ patient, onDelete }) {
  const navigate = useNavigate();

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
            onClick={() => navigate(`/patient/${patient.id}/detail`)}
          >
            患者情報
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/patient/${patient.id}/vitals`)}
          >
            バイタルサイン一覧
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/patient/${patient.id}/records`)}
          >
            看護記録
          </button>
        </div>
      </div>
      <div className="card-footer">
        <button
          className="btn-secondary"
          type="button"
          onClick={() => navigate("/")}
        >
          一覧に戻る
        </button>

        <DeleteButton onClick={onDelete} />
      </div>
    </div>
  );
}
