import { data, useNavigate, useOutletContext } from "react-router-dom";
import { formatValue, formatBpText } from "./Utils";
import type { PatientOutletContext } from "./types";
import { locale } from "dayjs";

type PatientVitalsOutletContext = Pick<
  PatientOutletContext,
  "patient" | "patientRecords"
>;

export default function PatientVitals() {
  const navigate = useNavigate();
  const { patient, patientRecords } =
    useOutletContext<PatientVitalsOutletContext>();

  if (!patient) return <div>患者が見つかりません</div>;

  const patientRecordsGraph = [...patientRecords];
  patientRecordsGraph.sort((a, b) => {
    const dateOrder = Date.parse(a.date) - Date.parse(b.date);
    if (dateOrder !== 0) return dateOrder;

    if (!a.time && b.time) return 1;
    if (a.time && !b.time) return -1;
    if (a.time === b.time) return 0;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return 0;
  });

  const patientRecordsWithTemperature = patientRecordsGraph.filter(
    (r) => r.vitals?.T != null,
  );
  const temperatureGraphData = patientRecordsWithTemperature.map((r) => ({
    date: r.date,
    label: `${r.date} ${r.time || "時刻未記録"}`,
    temperature: r.vitals?.T,
  }));

  const graphStartDate = temperatureGraphData[0]
    ? Date.parse(temperatureGraphData[0].date)
    : 0;
  const graphEndDate = temperatureGraphData.length
    ? Date.parse(temperatureGraphData[temperatureGraphData.length - 1].date)
    : 0;

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
                <th>時刻</th>
                <th>日付</th>
                <th>体温</th>
                <th>脈拍</th>
                <th>呼吸</th>
                <th>血圧</th>
                <th>SPO2</th>
              </tr>
            </thead>
            <tbody>
              {patientRecords.map((r) => {
                const { T, P, R, SBP, DBP, SPO2 } = r.vitals ?? {};
                const date = r.date;
                const bpText = formatBpText(SBP, DBP);
                const bpDisplay = bpText === "--" ? "--" : `${bpText}mmHg`;
                return (
                  <tr key={r.id}>
                    <td>{r.time || "時刻未記録"}</td>
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

      <svg viewBox="0 0 600 300" role="img" aria-label="体温の推移">
        <line x1="40" y1="260" x2="580" y2="260" stroke="currentColor" />
        <line x1="40" y1="20" x2="40" y2="260" stroke="currentColor" />

        {temperatureGraphData.map((item, index) => {
          const currentDate = Date.parse(item.date);
          const x =
            graphStartDate === graphEndDate
              ? 310
              : 40 +
                ((currentDate - graphStartDate) /
                  (graphEndDate - graphStartDate)) *
                  540;
          if (item.temperature == null) return null;
          const y = 260 - ((item.temperature - 34) / 8) * 240;

          return (
            <circle
              key={`${item.date}-${index}`}
              cx={x}
              cy={y}
              r="4"
              fill="currentColor"
            />
          );
        })}
      </svg>

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
          onClick={() => navigate(`/patient/${patient.id}/records`)}
        >
          看護記録一覧
        </button>
      </div>
    </div>
  );
}
