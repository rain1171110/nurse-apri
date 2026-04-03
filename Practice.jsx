// 実装とは関係なく、練習用のコンポーネント

import { useState } from "react";
import { useParams } from "react-router-dom";
import { record } from "zod";

// 問題①

// patients と records がある状態で

//  URLの id に一致する患者を取得しなさい

// 条件
// useParams を使う
// id は文字列で比較
const { id } = useParams();
const patient = patients.find((p) => p.id === id);

// 問題②

// 👉 その患者の記録だけ取り出して

// 条件
// patientId と id を比較
const patientRecords = records.filter((r) => String(r.patientId) === id);

// 問題③

// 👉 患者がいなかったらエラー表示

if (!patient) return <div>患者がいなかったらエラー表示</div>;

const { id } = useParams();
const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);
if (!patient) return <div>患者が見つかりません</div>;

// 問題④

// 👉 patientRecords を mapで画面表示する
patientRecords.map((r) => (
  <div key={r.id}>
    <p>{r.data}</p>
    <p>体温:{r.vitals?.temperature}</p>
    <p>{r.vitals?.pulse}</p>
  </div>
));


//問題
export default function RecordItem({ record }) {
  return (
    <div>
      <p>{record.date}</p>
      <p>体温:{record.vitals?.temperature}</p>
      <p>{record.vitals?.pulse}</p>
    </div>
  );
}

patientRecords.map((r) => (
  <RecordItem key={r.id} record={r}/>
));


//問題⑤ に削除ボタン追加
import { useState } from "react";

const [records,setRecords]= useState([]);
const handleDelete = (id) => {
  const nextRecords = records.filter((r) => r.id !== id)
  setRecords(nextRecords)
}
return (
  <>
  {patientRecords.map((r)=> (
<RecordItem key={r.id} record={r} onDelete={handleDelete}/>
))}
</>
)


export default function RecordItem ({record,onDelete}) {
  return (
    <div>
      <p>{record.date}</p>
      <p>{record.vitals?.temperature}</p>
      <p>{record.vitals?.pulse}</p>
      <button onClick={() => onDelete(record.id)}>削除</button>
    </div>
  )
}

// 🧩 問題 👉 「idが3だけ残す」にはどう書く？
records.filter((r)=> r.id === 3)

//🧩 問題👉 「idが1と3だけ残す」には？
records.filter((r)=> r.id === 1 || r.id === 3)
records.filter((r)=>[1,3].includes(r.id))

//🧩 問題👉 「idが2と4以外を削除」
records.filter((r)=> r.id === 2 ||r.id === 4)

//🧩 問題👉 「idが1,3,5以外を削除」
records.filter((r)=> [1,3,5].includes(r.id))