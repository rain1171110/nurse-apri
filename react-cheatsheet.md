# React初心者チートシート

## 1. useState

**役割**
画面の中で「変わる値」を保存する箱。

**書き方**

```js
const [count, setCount] = useState(0);
```

意味

- `count` = 今の値
- `setCount` = 値を変えるためのボタン
- `useState(0)` = 最初は `0`

例

```js
const [name, setName] = useState("");
```

更新

```js
setCount(1);
setName("田中");
```

前の値を使って更新

```js
setCount((prev) => prev + 1);
```

つまり
`useState` は「変わる値を覚えて、変わったら再表示する仕組み」。

## 2. props

役割
親コンポーネントから子コンポーネントへ渡すデータ。

親

```jsx
<PatientCard name="山田太郎" age={80} />
```

子

```jsx
function PatientCard(props) {
  return <p>{props.name}</p>;
}
```

分割代入で書く形

```jsx
function PatientCard({ name, age }) {
  return (
    <p>
      {name} {age}
    </p>
  );
}
```

つまり
`props` は「親から子への手紙」。

## 3. map

役割
配列の中身を順番に取り出して表示する。

例

```jsx
const patients = [
  { id: 1, name: "田中" },
  { id: 2, name: "佐藤" },
];

{
  patients.map((patient) => <li key={patient.id}>{patient.name}</li>);
}
```

意味

- `patients` を1つずつ取り出す
- `patient` に順番に入る
- 取り出したものを `<li>` にして表示する

つまり
`map` は「配列を順番に画面へ並べる道具」。

## 4. useEffect

役割
画面が表示された後や、値が変わった時に処理を動かす。

基本

```js
useEffect(() => {
  console.log("動いた");
}, []);
```

依存配列あり

```js
useEffect(() => {
  console.log("countが変わった");
}, [count]);
```

意味

- `[]` -> 最初の1回だけ
- `[count]` -> `count` が変わった時だけ

よくある用途

- API通信
- 監視
- タイマー
- エラー通知

つまり
`useEffect` は「あとから動く処理」。

## 5. useMemo

役割
重い計算を毎回やり直さないようにする。

基本

```js
const selectedPatient = useMemo(() => {
  if (selectedPatientId === null) return null;
  return patients.find((p) => p.id === selectedPatientId) ?? null;
}, [patients, selectedPatientId]);
```

意味

- `patients` か `selectedPatientId` が変わった時だけ再計算
- 変わっていなければ前の結果を使う

useMemoなしでも書ける

```js
const selectedPatient =
  selectedPatientId === null
    ? null
    : (patients.find((p) => p.id === selectedPatientId) ?? null);
```

使い分け

- データが少ない -> なくてもOK
- 計算が重い / 件数が多い -> `useMemo` を考える

つまり
`useMemo` は「同じ計算のムダを減らす仕組み」。

## 6. if文の早期return

役割
条件に合わない時に先に終わる。

例

```js
if (selectedPatientId === null) return null;
```

意味

- 選ばれていないなら、もうここで終わる

つまり
早期return は「ダメなら先に帰る」。

## 7. find

役割
配列から条件に合う1件を探す。

例

```js
const patient = patients.find((p) => p.id === selectedPatientId);
```

意味

- `id` が同じ患者を1人探す
- 見つからなければ `undefined`

つまり
`find` は「1人だけ探す」。

## 8. filter

役割
条件に合うものだけ残す。

例

```js
const others = patients.filter((p) => p.id !== selectedPatient.id);
```

意味

- 今編集中の患者以外を残す

つまり
`filter` は「いらないものを除く」。

## 9. ??（Nullish coalescing）

役割
左が `null` または `undefined` の時だけ右を使う。

例

```js
const result = patients.find((p) => p.id === selectedPatientId) ?? null;
```

意味

- 見つかればその患者
- 見つからなければ `null`

似ているもの

```js
a || b;
a ?? b;
```

違い

- `||` は `0`, `""`, `false` も右に変わる
- `??` は `null` と `undefined` だけ右に変わる

つまり
`??` は「本当に値がない時だけ代わりを使う」。

## 10. `?.`（Optional chaining）

役割
左側の値がある時だけ先を読む。

例

```js
selectedPatient?.name;
```

意味

- 患者がいれば `name`
- いなければ `undefined`

つまり
`?.` は「あれば読む」。

## 11. `...`（展開）

役割
オブジェクトをコピーして結合する。

例

```js
const updated = { ...patient, ...data };
```

意味

- 元データに変更分を上書きする

つまり
`...` は「コピーして上書き」。

## 12. `=>`（アロー関数）

役割
関数を短く書く。

例

```js
patients.find((p) => p.id === selectedPatientId);
```

意味

- `p` を受け取って条件判定する

つまり
`=>` は「関数を短く書く記法」。

## 13. 関数をその場で書く（無名関数）

例

```jsx
onClick={() => setCount(count + 1)}
```

意味

- クリックされた時だけ実行したいので、関数で包んでいる

NG例

```jsx
onClick={setCount(count + 1)}
```

これだと、クリック前に実行される。

つまり
`() => ...` は「あとで実行するための包み紙」。

## 14. 親で状態を持つ理由

よくある形

```js
const [patients, setPatients] = useState([]);
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

なぜ `selectedPatient` を state にしないの？

- `patients` と `selectedPatient` を別々に持つとズレやすい
- 一覧は更新されたのに、詳細だけ古いままになることがある

安全な考え方

- 本体データは `patients`
- 選択中は `selectedPatientId`
- 必要な時だけ `find` で探す

つまり
「本物のデータは1か所」にするほうが安全。

## 15. よくある更新処理

患者を更新する例

```js
setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
```

意味

- 前の患者一覧を順番に見る
- `id` が同じ人だけ新しいデータに置き換える
- 他の人はそのまま

つまり
`map` を使うと「1人だけ差し替え」ができる。

## 16. 今日の超重要まとめ

- `useState` = 変わる値を保存
- `props` = 親から子へ渡す
- `map` = 配列を表示
- `useEffect` = 後から動く処理
- `useMemo` = 無駄な再計算を減らす
- `find` = 1件探す
- `filter` = 条件で絞る
- `??` = 値がない時だけ代わりを使う
- `?.` = あれば読む
- `...` = コピーして上書き
- `=>` = 関数を短く書く

## 17. よく使う形だけ一覧で見る

```js
const [value, setValue] = useState("");

useEffect(() => {
  // 処理
}, [value]);

const item = items.find((x) => x.id === id) ?? null;
const safeName = item?.name;

const list = items.filter((x) => x.id !== id);

const memoValue = useMemo(() => {
  return heavyCalc(items);
}, [items]);

const updated = { ...item, name: "新しい名前" };

setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
```
