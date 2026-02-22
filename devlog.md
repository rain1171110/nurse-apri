# Dev Log

## 2026-02-17

### 今日の学び

1. Reactでは、親コンポーネントが state 更新関数を子へ渡すことで、子から親へ状態変更を通知できる仕組みを理解した。

2. 重複部屋番号チェックでは、新規追加と編集で判定が異なる。編集時は自己重複を防ぐため、編集中の患者IDを除外する必要があると理解した。

### 次のアクション

- 正常入力 / 重複部屋 / 必須未入力 の3ケース検証
- 通信処理分離に進むか判断

## 2026-02-22

### 学習ログ（react-hook-form / エラー管理の理解）

#### 1. handleSubmit / data / patient の関係

- `handleSubmit` は自分の関数ではなく `react-hook-form` が提供する送信管理関数。
- 送信時にフォーム入力を収集し、Zod 検証 OK のときだけ `data` を渡してくる。
- `patient` は親コンポーネントから渡された「元の患者データ（編集前）」。
- `data` はフォームに入力した値（編集後の変更部分）。

```js
const updated = { ...patient, ...data };
```

これは「元の患者情報に、変更した部分だけ上書きした新しい患者オブジェクト」を作っている。

※順番が重要

- `{ ...data, ...patient }` にすると、古い情報で上書きされ更新が反映されない。

#### 2. patients と selectedPatient の違い

Reactでは一覧用の state と表示用の state は別管理になる。

- `patients` は患者一覧を描画するためのデータ（全体管理）
- `selectedPatient` は画面に表示・編集している1人の患者

一覧を書き換えるだけでは、画面表示中の患者は更新されない。

```js
setSelectedPatient(updated);
```

これは「表示している患者の情報を新しいデータに差し替える」ために必要。

#### 3. defaultValues と reset

- `defaultValues` は `useForm` 初回実行時に1度だけ読み込まれる初期値。
- `selectedPatient` が変わってもフォームは自動更新されない。

そのため患者を切り替えた時は：

```js
useEffect(() => {
  reset(patient);
}, [patient, reset]);
```

- `reset` はフォーム内部 state を新しい患者データで作り直す操作。

#### 4. mode と reValidateMode

```js
mode: "onSubmit",
reValidateMode: "onSubmit",
```

- 初回の検証: 保存ボタン押下時のみ
- エラー後の再検証: 保存ボタン押下時のみ

入力中にエラーが増減しないように挙動を固定している。

#### 5. clearErrors が必要な理由

- エラーは保存時に `errors` に入り、そのまま残ることがある。
- 編集終了や保存成功時には「エラーが無い状態」に戻す必要がある。

```js
clearErrors();
```

これは `react-hook-form` 内部のエラーを空にする処理。

#### 6. onErrorsChange({}) が必要な理由

- フォームのエラーは親コンポーネントにも渡している。
- 子フォーム `errors` → 親の `globalErrors`

そのため `clearErrors()` だけでは親のエラー表示が残る。

```js
onErrorsChange({});
```

これは「親へ、エラーはもう無いと通知する」処理。

#### 7. 3つの役割の整理（最重要理解）

| 操作                 | 役割                                       |
| -------------------- | ------------------------------------------ |
| `setSelectedPatient` | 表示する患者を変更（React の state）       |
| `reset`              | フォーム入力値を変更（フォーム内部 state） |
| `clearErrors`        | エラー状態を消す（`errors`）               |

React の state と `react-hook-form` の state は別管理であり、それぞれ個別に更新が必要になる。

### 今日の学び（まとめ）

- React の state とフォームの state は別物
- `defaultValues` は自動更新されない
- `reset` でフォームを作り直す必要がある
- エラーは子と親の2箇所に存在する
- `clearErrors` と `onErrorsChange` は役割が違う

## 2026-02-19

### 学習ログ（責務分離 / 通信処理の分離）

#### 1. 責務分離とは

責務分離とは「役割ごとにコードを分ける設計」のこと。

例：レストラン

- 受付 → 注文を受ける（画面 / React コンポーネント）
- 厨房 → 料理を作る（通信 / API 処理）

Reactアプリでも同じで、UI（表示）と通信（fetch）を同じファイルに書かないことが重要。

#### 2. 分離前の問題点（PatientList.jsxに全部書いていた状態）

以前は `PatientList.jsx` に以下をすべて書いていた：

- 画面描画
- state管理
- エラー表示
- fetch通信
- JSON変換
- HTTPステータス判定

```js
const res = await fetch("http://localhost:3001/api/data");
const data = await res.json();
```

この状態だと：

- URL変更 → UIファイル修正
- 保存方式変更 → UIファイル修正
- エラー仕様変更 → UIファイル修正

つまり、画面と通信が強く結合している（密結合）状態だった。

#### 3. 分離後の構造

通信処理を `patientApi.js` に移動。

`patientApi.js`（通信担当）

```js
export const fetchAppData = async () => {
  const response = await fetch(`${API_BASE}/data`);
  if (!response.ok) throw new Error(`API error:${response.status}`);
  return response.json();
};

export const saveAppData = async (payload) => {
  const response = await fetch(`${API_BASE}/data`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`API error:${response.status}`);
  return response.json();
};
```

`PatientList.jsx`（画面担当）

```js
try {
  const data = await fetchAppData();
  setPatients(Array.isArray(data.patients) ? data.patients : []);
  setRecords(Array.isArray(data.records) ? data.records : []);
} catch (e) {
  setApiError("APIから読み込めませんでした");
}
```

画面は「データを取得して表示する」だけになり、通信の詳細（fetch / method / headers / JSON）は一切知らない構造になった。

#### 4. response.ok と throw の役割

```js
if (!response.ok) {
  throw new Error(`API error:${response.status}`);
}
```

- fetch は 500 エラーでも成功扱いで response を返す
- そのため自分で失敗を throw する必要がある

これにより画面側は：

- 成功 → try 内で処理
- 失敗 → catch で表示

だけを書けばよくなる。

#### 5. なぜ責務分離が重要か

変更に強くなる。

| 変更内容       | 修正箇所               |
| -------------- | ---------------------- |
| API URL変更    | `patientApi.js` のみ   |
| PUT → POST変更 | `patientApi.js` のみ   |
| 認証追加       | `patientApi.js` のみ   |
| 表示文言変更   | `PatientList.jsx` のみ |

UIを触らずに通信仕様を変更できる。

#### 6. 学んだ設計上のポイント

- 画面は「何をしたいか」だけ書く
- 通信は「どうやってするか」を持つ
- JSON変換（JSON.stringify）は通信の責務
- HTTPステータス判定（response.ok）も通信の責務

### 今日の学び（まとめ）

- UIと通信を同じコンポーネントに書くと修正範囲が広がる
- API処理を別ファイルに分けるとコードが読みやすくなる
- try/catch は画面表示のために使い、通信の失敗判定はAPI側で行う
- 責務分離により「変更に強い構造」を作れる
