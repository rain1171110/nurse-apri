import { formatValue, formatBpText } from "./Utils";

export default function PatientVitals({
  patient,
  onBackToRecords,
  onBackToMenu,
  records = [],
}) {
  return (
    <div className="container-md">
      <div className="section-header">
        <h1 className="section-title">バイタルサイン一覧</h1>
      </div>
      <p>
        {patient.room}号室 {patient.name} さん
      </p>
      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>日付</th>
                <th>体温</th>
                <th>脈拍</th>
                <th>呼吸</th>
                <th>血圧</th>
                <th>SPO2</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const { T, P, R, SBP, DBP, SPO2 } = r.vitals ?? {};
                const date = r.date;
                const bpText = formatBpText(SBP, DBP);
                const bpDisplay = bpText === "--" ? "--" : `${bpText}mmHg`;
                return (
                  <tr key={r.id}>
                    <td>{formatValue(date)}</td>
                    <td>{formatValue(T, "℃")}</td>
                    <td>{formatValue(P, "回/分")}</td>
                    <td>{formatValue(R, "回/分")}</td>
                    <td>{bpDisplay}</td>
                    <td>{formatValue(SPO2, "%")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBackToMenu}>
          メニューに戻る
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onBackToRecords}
        >
          看護記録一覧
        </button>
      </div>
    </div>
  );
}
