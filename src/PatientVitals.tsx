import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatValue, formatBpText } from "./Utils";
import type { PatientOutletContext } from "./types";

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
    label: `${r.date} ${r.time || "時刻未記録"}`,
    temperature: r.vitals?.T,
  }));



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

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={temperatureGraphData}
            margin={{ top: 12, right: 16, bottom: 24, left: 8 }}
          >
            <XAxis
              dataKey={"label"}
              interval={"preserveStartEnd"}
              angle={-35}
              textAnchor="end"
              height={70}
              tick={{ fontSize: 12 }}
            />
            <YAxis domain={[34, 42]} tickFormatter={(value) => `${value}℃`} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="temperature"
              name="体温"
              stroke="currentColor"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

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
