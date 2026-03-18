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

## 2026-02-24

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

## 2026-02-27

### 学習ログ（Zodテストコード / safeParse / バリデーションの仕組み理解）

#### 1. テストコードとは何か

テストコードは「アプリの機能」ではなく、プログラムが壊れていないか確認するためのコード。
ユーザーのためではなく、開発者（未来の自分）のための安全装置。

手動確認：

- フォームを開く
- 入力する
- エラーを見る

テストコード：

- 入力例を用意
- 自動で検査
- 正しいか採点

つまり、確認作業を人間からコンピュータに任せている。

#### 2. 今回のコードの全体構造

今回のテストは2つの役割に分かれている。

1. `createPatientValidationCases`
   テストケース（問題集）を作る関数。

- 正常入力
- 重複部屋
- 必須未入力

ここでは検査はしていない。
ただの入力例と正解のセット。

2. `runPatientValidationCases`
   テストケースを1つずつZodで検査し、結果をまとめた成績表を返す関数。

#### 3. Zodが実際に動いている場所

Zodの検査が実行されるのはここ。

```js
const result = schema.safeParse(testCase.input);
```

- `schema` = バリデーションルール（検査機）
- `input` = 患者データ
- `safeParse` = 検査を実行するスイッチ
- `result` = 検査結果

`safeParse`は以下のオブジェクトを返す。

成功：

```js
{ success: true, data: ... }
```

失敗：

```js
{ success: false, error: ... }
```

`result.success` は「合格か不合格か」を表すフラグ。

#### 4. なぜ今まで `safeParse` を書かなくても動いていたか

フォームでは以下を使っていた。

```js
useForm({
  resolver: zodResolver(recordSchema),
});
```

`react-hook-form` の `zodResolver` が内部でZodを実行していた。
つまり裏では `safeParse` 相当が毎回呼ばれていた。

| 場面     | Zodを実行している人     |
| -------- | ----------------------- |
| フォーム | react-hook-form（自動） |
| テスト   | 自分（手動）            |

#### 5. `expected` / `actual` / `ok` の意味

- `expected` → 人間が用意した正解
- `actual` → Zodが出した結果

```js
actual: result.success ? "valid" : "invalid";
```

`ok` は最終採点。

- 合否が一致
- かつ（指定があれば）エラーの場所も一致

つまり「正しい結果」だけでなく「正しい理由」で失敗しているかまで確認している。

#### 6. `firstErrorPath` と `firstErrorMessage`

- `firstErrorPath`：最初にエラーが起きた項目名（`room` など）
- `firstErrorMessage`：そのエラーの内容

Zodの `issues[0]` から取得している。

#### 7. `.join(".")` を使う理由

Zodのエラー場所は配列で返る。

```js
["room"];
```

しかしテストの正解は文字列。

```js
"room";
```

配列は `===` で比較できないため、文字列に変換して比較している。

#### 8. 配列が `===` で一致しない理由

```js
["room"] === ["room"]; // false
```

配列は「中身」ではなく「メモリ上の場所（箱）」を比較する。
`[]` を書くたびに新しい箱が作られるため一致しない。

#### 9. `window` に入れている理由

```js
window.runPatientValidationCases = runPatientValidationCases;
```

ブラウザのコンソールから直接

```js
runPatientValidationCases();
```

を実行できるようにするための入口。

### 今日の理解（重要）

- Zodは `schema` を作っただけでは動かない
- `safeParse` を呼んだときに初めて検査が実行される
- フォームでは `react-hook-form` が自動で呼んでいた
- テストコードでは自分で呼ぶ必要がある
- テストコードはバリデーションそのものではなく、バリデーションが壊れていないか確認する仕組み

## 2026-02-28

### 今日の学びまとめ

#### 1. safeParse の本当の役割

- Zod は入力データをチェックする審査機
- safeParse はプログラムを止めずに合否を返す

`result.success`

- `true` → 保存してよいデータ
- `false` → 保存してはいけないデータ

つまり：
safeParse = 患者データをカルテ登録してよいか判定する装置

#### 2. React Hook Form の errors の正体

フォームの赤エラーは React が出しているのではなく、
Zod の safeParse に落ちた結果が表示されているだけ。

- 保存時（onSubmit）に検証が走る
- 失敗すると errors に入る
- `clearErrors()` はその赤ペンを外す処理

#### 3. 保存後に必要だった「3つの同期」

患者編集バグの原因は、患者データが3か所に存在していたこと。

- `patients`（一覧データ）
- `selectedPatient`（表示中の患者）
- `useForm` 内部の値 + `errors`（フォーム）

そのため保存後は：

- `onUpdate(updated)` → 一覧更新
- `reset(updated)` → フォーム更新
- `clearErrors()` → エラー解除

つまり：保存処理の本質は「状態の同期」だった。

#### 4. Vitest の意味

Vitest は画面のテストではなく、
ロジックが壊れていないかを監視する装置。

役割：

- `describe`：テストの見出し
- `it`：1つの確認項目
- `expect`：こうなるはず、という約束

`expect(result.success).toBe(true);`

= 「この患者データは必ず通るはず」と機械に監視させている。

#### 5. validCases と invalidCases

テストは2種類必要だった：

- `validCases`：通るべきデータが通るか
- `invalidCases`：落ちるべきデータが落ちるか

さらに

`expect(firstErrorPath).toBe(c.expectErrorPath);`

で、どの項目で落ちたか（age なのか room なのか）まで保証している。

### 今日の核心（いちばん重要）

あなたは今日、Reactのフォームを作っていたのではなく、
「入力データの正しさを機械に保証させる仕組み」を作っていました。

これは
アプリを作る人 → ソフトウェアエンジニア
に上がるタイミングの学習内容です。

### 明日のテーマ

「なぜテストがあると“安心してリファクタリングできる”のか」
をやると、テストの価値が一気に腑に落ちます。

## 2026-03-01 学習ログ（Vitest導入 / Zodリファクタリング）

---

### 1. Vitestをターミナルで実行できるようになった

```bash
npm exec vitest run
```

- ターミナルから自動テストを実行できた
- watchモードでは保存するたびにテストが自動実行される
- テストの役割は「正しいか確認」ではなく
  **リファクタリングしても壊れていないことを保証する保険**

---

### 2. フォーム入力とZodのズレを理解

ユーザーがフォームに入力：

```html
<input name="age" />
```

画面では

```
70
```

と入力しているが、JavaScriptに届く値は

```js
"70";
```

数値ではなく「文字列」。

そのため、これだけでは失敗する：

```js
z.number().safeParse("70");
// ❌ 失敗
```

---

### 3. preprocess の役割（検証前の通訳）

```js
z.preprocess((v) => Number(v), z.number());
```

処理の流れ：

```
"70"
↓
70 に変換
↓
number検証
```

つまり
**Zodが理解できる形に直してから検証する仕組み。**

---

### 4. optionalNumber の理解（今日の核心）

作成した関数：

```js
export const optionalNumber = (min, max, msgMin, msgMax) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v == null ? "" : String(v).trim()))
    .transform((v) => (v === "" ? undefined : Number(v)))
    .refine((v) => v === undefined || Number.isFinite(v), {
      message: "数字を入力して下さい",
    })
    .refine((v) => v === undefined || v >= min, { message: msgMin })
    .refine((v) => v === undefined || v <= max, { message: msgMax });
```

これは単なる「数値チェック関数」ではない。

#### この関数が定義しているもの

- 空欄 → 未入力として扱う
- 数字以外 → 「数字を入力して下さい」
- 範囲外 → min/maxエラー
- 空白付き → 自動補正

つまり

> このアプリにおける「数値入力の仕様」を定義している

Zodを使っているのではなく
**Zodでアプリのルールを作っている状態**と理解した。

---

### 5. リファクタリング（重要）

修正前（項目ごとに別ルール）：

```js
room: z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().min(1).max(999).optional()
),

age: z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().min(0).max(150).optional()
),
```

修正後（ルールを統一）：

```js
room: optionalNumber(1, 999, "部屋番号は1以上", "部屋番号は999以下"),
age: optionalNumber(0, 150, "年齢は0以上", "年齢は150以下"),
```

効果：

- 数値入力の仕様を1箇所に集約
- 将来の仕様変更は `optionalNumber` だけ直せばよい
- バグが入りにくくなる

---

### 6. テストの追加（仕様を守る）

テストケースを追加：

```js
{
  id: "room-not-number",
  label: "部屋番号が数字でない",
  usedRooms: [101, 102],
  input: {
    name: "山田太郎",
    room: "abc",
    age: "70",
    disease: "肺炎",
    history: "高血圧",
    progress: "解熱傾向",
  },
  expectValid: false,
  expectErrorPath: "room",
  expectErrorMessage: "数字を入力して下さい",
}
```

テスト側：

```js
expect(firstIssue?.message).toBe(c.expectErrorMessage);
```

ここで理解したこと：

- テストはコードを守るものではない
- **ユーザーに見える挙動（仕様）を守るもの**

---

### 7. 今日の最重要理解

リファクタリングとは

```
コードを綺麗にすること
ではない
↓
動きを変えずに壊れにくくすること
```

Vitestにより開発スタイルが変化した：

- Before：ブラウザを触って確認する開発
- After：テストで安全を確保して変更できる開発

つまり今日、
**「動けばOKの学習アプリ」から「壊れない設計のアプリ」へ一歩進んだ。**

## 2026-03-02

### 学習ログ（PatientList 通信分離 DRAFT）

#### 1. 通信分離とは

通信分離とは、`fetch` を別ファイルに置くことではない。
画面コンポーネントがサーバーと直接通信しない構造にすること。

役割分担：

| 役割             | 担当           |
| ---------------- | -------------- |
| 画面表示・操作   | PatientList    |
| データ管理・保存 | App            |
| データ保管       | Express Server |

PatientListは「この状態にしたい」と提案するだけで、保存はAppが行う。

#### 2. 変更前（通信分離前）

PatientList が直接保存していた：

```js
useEffect(() => {
  if (!hasLoaded) return;

  const saveData = async () => {
    setIsSaving(true);
    try {
      await saveAppData({ patients, records });
      setSaveSuccess(true);
    } catch (error) {
      setApiError("APIへの保存に失敗しました");
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };
  saveData();
}, [patients, records, hasLoaded]);
```

問題：

- `patients` / `records` が変わるたびに自動保存
- PatientList が保存係になってしまう
- データの正本が画面側に存在してしまう

#### 3. 変更後（通信分離DRAFT）

自動保存 `useEffect` を削除し、保存ボタン方式へ変更。

PatientList：

```js
const handleSave = async () => {
  setIsSaving(true);
  setApiError("");
  try {
    await onSaveData({ patients, records });
    setSaveSuccess(true);
  } catch (e) {
    setApiError("APIへの保存に失敗しました");
    setSaveSuccess(false);
  } finally {
    setIsSaving(false);
  }
};
```

ボタンで保存：

```jsx
<button onClick={handleSave} disabled={isSaving}>
  保存
</button>
```

ポイント：

- PatientList は `saveAppData` を呼ばない
- 親に保存を依頼するだけ

#### 4. Appが保存係になる

App が保存処理を担当：

```js
import { saveAppData } from "./api/patientApi";

const onSaveData = async (payload) => {
  await saveAppData(payload);
};
```

そして PatientList に渡す：

```jsx
<PatientList onErrorsChange={setGlobalErrors} onSaveData={onSaveData} />
```

これで通信は App に1箇所だけ存在する。

#### 5. サーバー側の修正理由

PUTの返り値を変更：

変更前：

```js
res.json({ ok: true });
```

変更後：

```js
const next = { patients, records };
writeData(next);
res.json(next);
```

理由：
Reactが必要なのは「成功したか」だけではなく、
保存後の正式なデータだから。

#### 6. なぜ必要か（Single Source of Truth）

データの正解（正本）は1か所に集める必要がある。

もし PatientList が保存すると：

- 画面ごとに保存処理が生まれる
- `patients` と `records` の整合性が崩れる
- 上書き事故が起きる

Reactではこれを防ぐために
Single Source of Truth（単一の情報源）を作る。

今回の正本は App。

### 今日の結論（つまり）

通信分離とは
「画面コンポーネントが直接サーバー保存する構造」をやめ、

- PatientList：変更案を作る
- App：保存して正本を管理する

という責任分離の設計である。

これにより、アプリ全体のデータ整合性が保たれる。

## 2026-03-03

### 学習ログ（API通信 / HTTP / CSRF / ブラウザの仕組み）

#### 1. GET / POST / PUT は Express の仕様ではない

最初、GETやPUTは Express 独自の機能だと思っていたが違った。
これは HTTP（Webの通信ルール）そのもの。

- GET → データ取得
- POST → 新規作成
- PUT → 上書き
- DELETE → 削除

Express はこの「命令」を受け取って処理を分岐しているだけ。

```js
app.get("/api/data", ...);
app.put("/api/data", ...);
```

つまり Express は API を作っているのではなく、
HTTPの受付係を実装しているだけ。

#### 2. fetch は何をしているか

```js
const response = await fetch(`${API_BASE}/data`);
```

`fetch` は「URLにデータを取りに行く命令」。
ブラウザでURLを開くのと本質的に同じ通信（GET）を送っている。

つまり

- ブラウザでページを開く
- Reactでfetchする

は同じ仕組みの上にある。

#### 3. /api を付ける理由

URLには役割がある。

| 種類      | 役割                   |
| --------- | ---------------------- |
| /patients | 画面（人間用）         |
| /api/data | データ（プログラム用） |

`/api` は飾りではなく、機械専用入口であることを示す設計。

これを分けないと

- ブラウザ閲覧
- プログラム通信

が混ざり、セキュリティが崩れる。

#### 4. CSRF（クロスサイトリクエストフォージェリ）

攻撃者がサーバーを直接攻撃するわけではない。
ユーザーのブラウザに通信させる攻撃。

悪意サイトの中に：

```html
<form action="http://localhost:3001/data" method="POST"></form>
```

が仕込まれていると、
ユーザーがページを開いただけでサーバーへリクエストが送られる。

重要ポイント：

- 送信しているのは攻撃者ではなく「ユーザーのブラウザ」
- サーバーから見ると正規操作に見える

#### 5. JSON送信の意味

Reactの保存処理：

```js
fetch("/api/data", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

普通のHTMLフォームは `application/json` を送れない。
そのため CSRF の一部を防ぎやすくなる。

サーバー側で確認可能：

```js
if (!req.is("application/json")) {
  return res.status(403).send("Forbidden");
}
```

ただしこれは完全な防御ではない。
`curl` やスクリプトからは送れてしまう。

#### 6. 本当の防御は認証

`req.is()` は「門」でしかない。
本当の鍵はログイン認証。

セキュリティの段階：

- APIと画面を分離
- フォーム攻撃対策（JSONチェック）
- CORS
- 認証（ログイン） ← 本命
- 権限管理

#### 7. 海賊版サイトのタブ増殖の正体

ウイルスではなく、ブラウザのJavaScriptが原因。

```js
window.open("広告URL");
```

新しく開いたページも同じ処理を行うため、
タブがネズミ算式に増える。

攻撃の本質：

- PC侵入ではない
- ブラウザを操作している

ブラウザは、
ユーザーが開いたページの命令を実行する環境だから成立する。

#### 8. 今日の核心理解

ブラウザは単なる閲覧ソフトではない。

- JavaScriptを実行する環境
- ネットワーク通信も行える

つまり

Reactアプリも、悪意サイトも、同じ仕組みの上で動いている。

そしてCSRFはサーバー攻撃ではなく、
「ユーザーのブラウザを利用したなりすまし通信」であると理解した。

## 2026-03-03 学習ログ（通信分離DRAFT / 正本をAppへ）

### 1) 何をしたか（結論）

- `patients` / `records` の正本（Single Source of Truth）を `App.jsx` に移動
- `PatientList` は表示と操作だけを担当
- API通信（fetch/PUT）は `App.jsx` + apiファイルだけに置く

### 2) なぜ App に正本を置くのか

`PatientList` が勝手に `useState(patients)` を持つと正本が2つになる。
→ データの分裂（画面・保存・サーバーがズレる）→ バグの原因。

### 3) App.jsx 側：正本 appData を持つ

```js
const [appData, setAppData] = useState({ patients: [], records: [] });
```

初期値を `[]` にしているのは、`patients.map()` / `records.filter()` を安全に動かすため。

- `null` や `{}` だと `.map()` が使えず落ちる

### 4) App.jsx 側：読み込み（非同期）を App に集約

```js
useEffect(() => {
  const run = async () => {
    setLoading(true);
    setApiError("");
    try {
      const data = await fetchAppData();
      setAppData({
        patients: Array.isArray(data.patients) ? data.patients : [],
        records: Array.isArray(data.records) ? data.records : [],
      });
    } catch (e) {
      console.error(e);
      setApiError("APIから読み込めませんでした");
    } finally {
      setLoading(false);
    }
  };
  run();
}, []);
```

`Array.isArray` は「本当に配列か？」の型チェック。

- `data.patients || []` だと `{}` が来たときにすり抜けて `.map()` で落ちる

### 5) App.jsx 側：保存（PUT）も App に集約

```js
const onSaveData = async (payload) => {
  const saved = await saveAppData(payload);
  setAppData(saved);
};
```

`PatientList` は「保存して」とお願いするだけ。
実際の通信は App が担当。

### 6) PatientList から App の正本を更新できるよう「窓口」を用意

PatientList 内の `setPatients((prev)=>...)` を活かすため、App 側でラップ関数を作る。

```js
const setPatients = (updater) => {
  setAppData((prev) => {
    const nextPatients =
      typeof updater === "function" ? updater(prev.patients) : updater;
    return { ...prev, patients: nextPatients };
  });
};

const setRecords = (updater) => {
  setAppData((prev) => {
    const nextRecords =
      typeof updater === "function" ? updater(prev.records) : updater;
    return { ...prev, records: nextRecords };
  });
};
```

`{ ...prev, patients: nextPatients }` は records を消さないため（`useState`は部分更新ではなく丸ごと置き換え）。

- `...prev` を書かないと records が消える

### 7) PatientList.jsx 側：propsで受け取って使う

```jsx
<PatientList
  onErrorsChange={setGlobalErrors}
  onSaveData={onSaveData}
  patients={appData.patients}
  records={appData.records}
  setPatients={setPatients}
  setRecords={setRecords}
  isLoading={loading}
  apiError={apiError}
/>
```

`PatientList` は「正本を持たない」：

```js
export default function PatientList({
  onSaveData,
  patients,
  records,
  setPatients,
  setRecords,
  isLoading,
  apiError,
}) {
  // ここでは useState で patients/records を作らない
}
```

### 8) 保存ボタン（自動保存をやめて、必要な時だけ保存）

```js
const handleSave = async () => {
  setIsSaving(true);
  setSaveError("");
  try {
    await onSaveData({ patients, records });
    setSaveSuccess(true);
  } catch (e) {
    console.error(e);
    setSaveError("APIへの保存に失敗しました");
  } finally {
    setIsSaving(false);
  }
};
```

- 「いつ保存が走るか」が明確で初心者に分かりやすい
- 後で自動保存（`useEffect`）に戻すこともできる

### 9) 学び（結論）

- 責任の分離（通信はApp、画面はPatientList）が一番大事
- 正本を1つにしないとデータの分裂が起きてバグる
- 配列は `map/filter` を使う前提なので、初期値・型チェックが重要

次は「自動保存に戻すならどう設計するか（保存頻度・保存中の二重送信防止・差分保存）」に進めるけど、今はこのDRAFTが動いていることが最高に価値ある。

## 2026-03-04 学習ログ（appData方式の理解）

### 1) appData方式とは何か

```js
const [appData, setAppData] = useState({
  patients: [],
  records: [],
});
```

- `patients` と `records` を1つの箱で管理している
- APIが `{ patients, records }` を丸ごと扱うため自然な設計
- 正本（データの本体）は `App` にある

### 2) setAppData は「箱ごと更新」

```js
setAppData({ patients: newPatients });
```

この書き方だと `records` が消えるので危険。

### 3) 部分更新が必要になる

子で「患者だけ更新したい / 記録は触りたくない」時は、以下のように書く必要がある。

```js
setAppData((prev) => ({
  ...prev,
  patients: prev.patients.map(...),
}));
```

### 4) 自作 setPatients の正体

```js
const setPatients = (updater) => {
  setAppData((prev) => ({
    ...prev,
    patients: typeof updater === "function" ? updater(prev.patients) : updater,
  }));
};
```

これは `appData` の中の `patients` だけ安全に更新するためのショートカット。

### 5) typeof updater === "function" の意味

`typeof updater === "function"` は「`updater` が関数だったら実行する」という意味。

Reactの `setState` は2種類あるため、それに対応している。

- `setState(newValue)`
- `setState((prev) => newValue)`

### 6) 今日一番大事な気づき

疑問：

「同時に両方更新すればよくない？」

答え：

- できる
- でも毎回コードが長くなる
- ミスしやすい
- 責任が子に広がる

だから「部分更新専用の窓口」を作る。

### 今日の本質

- `appData` = 大きな箱
- `setAppData` = 箱ごと交換
- `setPatients` = 箱の中の患者だけ交換

### いまモヤる理由

いま触っているのは「stateの抽象化レベル」。
これは初心者ゾーンを抜け始めた証拠。

### 明日やること（おすすめ）

「自作関数を消して、全部 `setAppData` で書いてみる」を1回やる。

そうすると体感で分かる：

- なぜ長くなるか
- なぜ自作関数が楽か

## 2026-03-07 学習ログ（React 状態設計の理解：selectedPatient と selectedPatientId）

### 1) データの分裂（stateを増やしすぎる問題）

最初は次のように state を持っていた。

```js
const [patients, setPatients] = useState([]);
const [selectedPatient, setSelectedPatient] = useState(null);
```

この場合、患者を選ぶと以下になる。

```js
setSelectedPatient(patient);
```

状態イメージ：

```text
patients
 └ { id: 3, name: "田中" }

selectedPatient
 └ { id: 3, name: "田中" }
```

同じ患者データが2箇所に存在する。

この状態で患者を更新すると、

- `patients` は更新される
- `selectedPatient` は古いままになる可能性がある

その結果、

- 患者一覧は新しい
- 患者詳細は古い

というデータのズレ（同期ズレ）が起きる。

### 2) 解決方法：selectedPatientId方式

患者データは `patients` に1箇所だけ持つ。

```js
const [patients, setPatients] = useState([]);
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

患者を選ぶときは ID だけ保存する。

```js
setSelectedPatientId(patient.id);
```

表示するときは `patients` から探す。

```js
const selectedPatient =
  patients.find((p) => p.id === selectedPatientId) ?? null;
```

状態イメージ：

```text
patients
 └ { id: 3, name: "田中" }

selectedPatientId
 └ 3
```

患者データは `patients` にしか存在しない。

そのため、

`patients` 更新 -> `find` 再実行 -> `selectedPatient` も最新

となり、データのズレが起きにくい。

### 3) React設計の重要原則

Reactでは「stateは最小限にする」が重要。

ルール：

- 保存が必要なもの -> state
- 計算できるもの -> stateにしない

今回の整理：

- `patients` -> 保存データ
- `selectedPatientId` -> UI状態
- `selectedPatient` -> 計算結果

### 4) useMemoについて

次のコードは、`patients` または `selectedPatientId` が変わったときだけ再計算するためのもの。

```js
const selectedPatient = useMemo(() => {
  if (selectedPatientId === null) return null;
  return patients.find((p) => p.id === selectedPatientId) ?? null;
}, [patients, selectedPatientId]);
```

ただし `patients.find(...)` は軽い処理なので、実務では以下のように直接書くことも多い。

```js
const selectedPatient =
  patients.find((p) => p.id === selectedPatientId) ?? null;
```

### 今日の重要理解

- `patients` -> 本物データ
- `selectedPatientId` -> 選択状態
- `selectedPatient` -> `patients` から計算

これによりデータの分裂を防げる。

React の Single Source of Truth（データの真実は1箇所）を守る設計になる。

### 次の一歩

`nurse-apri` の設計がさらに良くなる「React状態設計の黄金ルール」を学ぶと、
`useState` をどこに置くべきかを素早く判断できるようになる。

## 2026-03-08 学習ログ（実行時エラーの原因特定）

### 発生したエラー

```text
Uncaught ReferenceError: Cannot access 'selectedPatient' before initialization
```

### 原因

- `selectedPatient` を作る前に、`patientRecords` 側で `selectedPatient` を読んでいた
- `const` は宣言前に参照すると実行時エラーになる

### 修正

- 宣言順を調整して、先に `selectedPatient` を定義
- その後に `patientRecords` を計算するようにした

### 学び

- Reactでは state 設計だけでなく「宣言順」も重要
- 値を使う処理は、必ずその値の定義より後ろに置く

### つまり

`selectedPatientId` 設計は正しかった。
今回の問題は設計ではなく、参照順（初期化前アクセス）だった。

## 2026-03-08 学習ログ（React基礎整理）

### 1) stateは最小限にする

Reactでは「計算できるものは state にしない」が基本。

悪い例（データ分裂）：

```js
const [patients, setPatients] = useState([]);
const [selectedPatient, setSelectedPatient] = useState(null);
```

問題：

- `patients` と `selectedPatient` の2箇所に同じデータが存在する
- `patients` 更新 -> `selectedPatient` が古い

というバグが起こる可能性がある。

良い設計：

```js
const [patients, setPatients] = useState([]);
const [selectedPatientId, setSelectedPatientId] = useState(null);

const selectedPatient =
  patients.find((p) => p.id === selectedPatientId) ?? null;
```

保存しているのは `patients` と `selectedPatientId` だけ。
`selectedPatient` は計算値。

これを Single Source of Truth（真実のデータは1つ）という。

### 2) Reactは state が変わると再実行される

例：

```js
setSelectedPatientId(3);
```

すると React はコンポーネントをもう一度実行する。

その時、

```js
const selectedPatient = patients.find((p) => p.id === selectedPatientId);
```

も再計算される。

つまり `selectedPatient` は保存データではなく、毎回計算される値。

### 3) 配列操作（Reactでよく使う）

`find`

- 最初の1つを取得

```js
patients.find((p) => p.id === selectedPatientId);
```

見つからなければ `undefined`。

`map`

- 配列を変換する

```jsx
patients.map((p) => <li key={p.id}>{p.name}</li>);
```

Reactでは一覧表示によく使う。

`filter`

- 条件に合うものだけ残す

```js
patients.filter((p) => p.id !== id);
```

削除処理で使う。

### 4) Reactの配列更新パターン

追加：

```js
setPatients((prev) => [...prev, newPatient]);
```

更新：

```js
setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
```

削除：

```js
setPatients((prev) => prev.filter((p) => p.id !== id));
```

### 5) immutable更新

Reactでは state を直接変更しない。

NG：

```js
patient.age = 81;
```

OK：

```js
const updated = { ...patient, age: 81 };
```

### 6) スプレッド構文

```js
const updated = { ...patient, ...data };
```

意味：

- `patient` をコピー
- `data` で上書き

### 7) 三項演算子

`condition ? A : B`

例：

```js
p.id === updated.id ? updated : p;
```

意味：

- 条件 `true` -> `updated`
- 条件 `false` -> `p`

### 8) JavaScript演算子

optional chaining：

```js
selectedPatient?.name;
```

- 存在すれば読む
- 無ければ `undefined`

null合体演算子：

```js
value ?? defaultValue;
```

- `null` / `undefined` の時だけ `defaultValue`

OR演算子：

```js
value || defaultValue;
```

- falsy なら `defaultValue`

falsy：

- `false`
- `0`
- `""`
- `null`
- `undefined`
- `NaN`

### 9) keyの役割

```jsx
patients.map((p) => <li key={p.id}>{p.name}</li>);
```

`key` は React が要素を識別するための ID。
これにより「どの要素が変わったか」を React が判断できる。

### 今日の重要ポイント

- state = 保存するデータ
- 変数 = 計算値

React設計の基本：stateは最小限。

## 2026-03-12 学習ログ（患者追加処理の理解）

### 1) フォーム送信の流れ

```jsx
<form
  onSubmit={handleSubmit(async (data) => {
    const patientToAdd = { ...data, id: crypto.randomUUID() };
    const nextPatients = [...patients, patientToAdd];
    await onSaveData({ patients: nextPatients, records });
    setShowAddForm(false);
    reset();
  })}
>
```

処理の順番：

1. フォーム送信
2. 入力データ取得
3. `patientToAdd` 作成
4. `nextPatients` 作成
5. サーバー保存
6. フォームを閉じる
7. 入力リセット

### 2) handleSubmit の役割

`handleSubmit(async (data) => { ... })` は `react-hook-form` の送信管理関数。

- 入力値を集める
- Zodでバリデーション
- 問題なければ `data` を渡す

### 3) patientToAdd（患者データ作成）

```js
const patientToAdd = { ...data, id: crypto.randomUUID() };
```

意味：

- フォーム入力 `data` をコピー
- 新しいIDを追加
- 保存する患者オブジェクトを作る

### 4) nextPatients（新しい患者リスト）

```js
const nextPatients = [...patients, patientToAdd];
```

意味：

- 既存配列を壊さず
- 追加後の新しい配列を作る

### 5) サーバー保存

```js
await onSaveData({ patients: nextPatients, records });
```

意味：

- 追加後データをそのまま保存する
- `await` で保存完了を待ってから次に進む

### 6) なぜ `setPatients(nextPatients)` を先に呼ばないのか

今回の設計では `onSaveData` 側が保存成功後に state を更新する。

```js
const onSaveData = async (payload) => {
  const saved = await saveAppData(payload);
  setAppData(saved);
};
```

このため、呼び出し側で先に `setPatients(nextPatients)` を実行すると、
更新責務が2か所になって理解と保守が難しくなる。

結論：

- 更新責務は `onSaveData` に集約
- 呼び出し側は「保存依頼」に専念

## 2026-03-13

### 学習ログ（selectedPatientId / addRecord / App に state を上げる理解）

### 1) selectedPatientId を使う理由

以前は `selectedPatient` のように患者オブジェクトを直接使う考えがあった。
でも React では `patients` と `selectedPatient` の両方を state に持つと、同じ患者データが2か所に存在して分裂しやすい。

そのため、

```jsx
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

のように「IDだけを state に持つ」方が安全。

### 2) selectedPatient は state ではなく計算して作る

```jsx
const selectedPatient =
  selectedPatientId === null
    ? null
    : (patients.find((p) => p.id === selectedPatientId) ?? null);
```

意味:

- `selectedPatientId` が `null` なら患者未選択なので `null`
- `selectedPatientId` があるなら `patients` 配列から一致する患者を探す
- 見つからなければ `null`

つまり:

- 選択状態は ID で持つ
- 必要な患者データは `patients` から探す

という設計。

### 3) patientRecords も selectedPatientId から作る

```jsx
const patientRecords = useMemo(() => {
  if (selectedPatientId === null) return [];
  return records.filter((r) => r.patientId === selectedPatientId);
}, [records, selectedPatientId]);
```

意味:

- 患者未選択なら空配列
- 選択中なら、その患者IDに紐づく記録だけ取り出す

ここでも `selectedPatient.id` ではなく `selectedPatientId` を使うことで、ID参照設計にそろっている。

### 4) patientId は record がどの患者のものかを表す

record はこういう構造になる。

```js
{
  id: 171000000000,
  patientId: 2,
  note: "発熱あり"
}
```

役割:

- `id` -> 記録そのもののID
- `patientId` -> この記録がどの患者のものか

つまり `record -> patient` を `patientId` で結びつけている。

### 5) addRecord を App に置く理由

以前は PatientList 内で

```jsx
setRecords((prev) => [...prev, recordToAdd]);
```

としていた。これは state を直接更新して画面を変える処理。

でも今は `records` の本体は App にあるので、

- stateを持つ場所 = 更新責任を持つ場所

に合わせて、`addRecord` も App に置く方がよい。

### 6) App 側の addRecord

```jsx
const addRecord = async (record) => {
  if (selectedPatientId === null) return;

  const recordToAdd = {
    ...record,
    patientId: selectedPatientId,
    id: Date.now(),
  };

  const nextRecords = [...appData.records, recordToAdd];

  await onSaveData({
    patients: appData.patients,
    records: nextRecords,
  });
};
```

流れ:

- 患者未選択なら何もしない
- 入力データに `patientId` と `id` を足して record を完成させる
- `nextRecords` を作る
- `onSaveData` でサーバー保存する

### 7) なぜ await onSaveData(...) が大事か

`await onSaveData(...)` があることで

- サーバー保存
- App state更新
- 画面描画

の順番を守れる。

もし先に `setRecords(...)` すると、

- 画面だけ先に変わる
- サーバー保存失敗

となり、画面と保存データがズレる危険がある。

### 8) App に上げた state は子で再び持たない

App で

```jsx
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

を持つなら、PatientList 側ではもう

```jsx
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

を作らない。子は props で受け取って使う。

つまり:

- App が持つ
- PatientList は受け取る

にする。

### 9) 今の PatientList で良いところ

```jsx
const selectedPatient =
  selectedPatientId === null
    ? null
    : (patients.find((p) => p.id === selectedPatientId) ?? null);

const patientRecords = useMemo(() => {
  if (selectedPatientId === null) return [];
  return records.filter((r) => r.patientId === selectedPatientId);
}, [records, selectedPatientId]);
```

この2つはとても良い。

理由:

- IDで選択状態を管理している
- 必要なデータは配列から探している
- stateの分裂を防げる

### 10) 今の段階でまだ途中のところ

`updatePatient` や `updateRecord` はまだ PatientList で

- `setPatients(...)`
- `setRecords(...)`

を使っている。

```jsx
const updatePatient = (updated) => {
  setPatients((prev) => {
    return prev.map((patient) => {
      if (patient.id === updated.id) {
        return updated;
      } else {
        return patient;
      }
    });
  });
};

const updateRecord = (updateRecord) => {
  setRecords((prev) =>
    prev.map((r) => (r.id === updateRecord.id ? updateRecord : r)),
  );
};
```

これはまだ「画面state直接更新」の設計が残っている。
将来的にはこれも App 側責任に寄せるとさらにきれいになる。

### 今日の一番大事な理解

- `selectedPatientId` は選択状態
- `patientId` は record がどの患者に属するか
- どちらも ID参照で設計すると分かりやすい
- `selectedPatient` や `patientRecords` は state ではなく、`patients` / `records` から計算して作る
- `records` の本体が App にあるなら、`addRecord` も App に置く方が自然

ひとことでまとめると:

- 本体データは App に置く
- 選択は ID で持つ
- 必要な値は配列から探して作る

### まとめ（つまり）

- `patientToAdd` と `nextPatients` は「保存に渡す完成データ」を作るため
- 画面更新は `onSaveData` 成功後に一元管理
- これで state の正解が1か所にまとまり、ズレが起きにくい

## 2026-03-12 学習ログ（React / コンポーネント分離）

### 1) AddPatientForm をコンポーネント分離

以前は `PatientList` の中に追加フォームが直接書かれていた。

Before:

```jsx
{showAddForm && (
  <form onSubmit={handleSubmit(...)}>
    ...
  </form>
)}
```

この状態では `PatientList` が次の責任を同時に持ってしまう。

- 患者一覧
- 追加フォーム
- バリデーション
- 保存処理

After:

追加フォームを `AddPatientForm` として分離。

```jsx
<AddPatientForm
  patients={patients}
  records={records}
  onSaveData={onSaveData}
  onErrorsChange={onErrorsChange}
  showAddForm={showAddForm}
  setShowAddForm={setShowAddForm}
/>
```

### 2) AddPatientForm の役割

`AddPatientForm` は次の責任を持つ。

- 入力フォーム表示
- react-hook-form 管理
- Zod バリデーション
- 新規患者データ作成
- 保存処理呼び出し

保存処理:

```jsx
onSubmit={handleSubmit(async (data) => {
  const patientToAdd = { ...data, id: crypto.randomUUID() };
  const nextPatients = [...patients, patientToAdd];
  await onSaveData({ patients: nextPatients, records });
  setShowAddForm(false);
  reset();
})}
```

### 3) データ追加の流れ

患者追加の流れ:

1. AddPatientForm
2. `patientToAdd` 作成
3. `nextPatients` 作成
4. `onSaveData` 呼び出し
5. App が state 更新
6. React 再描画
7. 画面更新

重要ポイント: 画面更新は state 更新のときに起こる。

### 4) patientToAdd と nextPatients

`patientToAdd`:

- 新しく追加する患者1人

```js
const patientToAdd = { ...data, id: crypto.randomUUID() };
```

`nextPatients`:

- 追加後の患者一覧

```js
const nextPatients = [...patients, patientToAdd];
```

### 5) なぜ PatientList が patients を持たないのか

理由: 情報の分裂を防ぐため。

もし `PatientList` も state を持つと、

- App の `patients`
- PatientList の `patients`

のように本物のデータが2つできる。

これが Single Source of Truth（本物のデータは1つ）という考え方。

### 6) state を置く場所のルール

state は「誰が使うか」で決める。

- 1つのコンポーネントだけ使う -> そのコンポーネントに置く
- 複数コンポーネントで使う -> 共通の親に置く

### 7) 今のアプリ構造

```text
App
 └ PatientList
     ├ PatientDetails
     ├ NursingRecordList
     ├ NursingRecordItem
     ├ PatientVitals
     └ AddPatientForm
```

`patients` は `PatientList` / `PatientDetails` / `AddPatientForm` で使うため、App に state を置く。

### 8) リファクタリング結果

PatientList の役割:

- 患者一覧表示
- 画面切り替え
- 患者更新
- 記録更新
- AddPatientForm の表示制御

AddPatientForm の役割:

- 追加フォーム
- 入力管理
- バリデーション
- 保存処理

### 今日の重要ポイント

- state は「誰が使うか」で置く場所を決める
- 複数コンポーネントで使うデータは共通の親に置く
- Reactでは state が変わると画面が再描画される

### 今日の一言まとめ

`PatientList` は `patients` を使う側であり、`patients` の本物を持つ側ではない。

## 2026-03-13 学習ログ（削除処理 / patientId の理解）

### 1. record のデータ構造

看護記録（record）は患者データと紐づいている。

```js
{
  id: 101,         // 記録ID
  patientId: 2,    // 患者ID
  note: "発熱"
}
```

役割:

- `id` -> 記録そのもののID
- `patientId` -> この記録がどの患者のものか

つまり:

`record -> patient`

という関係になっている。

### 2. patientId はどこで作られているか

serverではなく、Reactアプリ側で作っている。

```js
const addRecord = (record) => {
  const recordToAdd = {
    ...record,
    patientId: selectedPatient.id,
    id: Date.now(),
  };

  setRecords((prev) => [...prev, recordToAdd]);
};
```

ここで

`patientId: selectedPatient.id`

としているので

今選択している患者ID
↓
record に保存

される。

### 3. 患者削除時に record も削除する理由

削除処理:

```js
const deletePatient = async (id) => {
  const nextPatients = patients.filter((p) => p.id !== id);
  const nextRecords = records.filter((r) => r.patientId !== id);

  await onSaveData({ patients: nextPatients, records: nextRecords });

  setSelectedPatientId(null);
  setSelectedRecordId(null);
  setActiveView("list");
};
```

ポイント:

`records.filter((r) => r.patientId !== id)`

意味:

削除する患者に紐づく記録を消す。

もしこれがないと

存在しない患者の記録

が残ってしまう。

これを

孤児データ（orphan data）

という。

### 4. p.id と r.patientId の違い

patients:

```js
patients.filter((p) => p.id !== id);
```

患者データ:

```js
{ id: 2, name: "佐藤" }
```

なので `p.id` を比較する。

records:

```js
records.filter((r) => r.patientId !== id);
```

recordデータ:

```js
{ id: 101, patientId: 2 }
```

なので `patientId` で比較する。

### 5. なぜ await が必要か

`await onSaveData(...)`

これは

サーバー保存完了

を待つため。

もし await を消すと

保存が終わる前にUI処理が進む

可能性がある。

つまり

サーバー保存
↓
state更新
↓
画面描画

という順番を守るために必要。

### 6. 今回の重要な理解

患者と記録は

```text
patients
   ↑
records
```

というリレーション構造になっている。

そのため

患者削除
↓
その患者のrecord削除

が必要になる。

これは

- SQL
- MongoDB
- Firebase

などでも同じ設計になる。

### 今日の理解（まとめ）

- record は `patientId` で患者と紐づいている
- `patientId` は React側で作っている
- 患者削除時はその患者の記録も削除する必要がある
- `p.id` は患者ID、`r.patientId` は記録が属する患者ID
- `await` はサーバー保存完了を待つため

## 2026-03-14 学習ログ React state更新と保存処理の理解（updatePatient / updateRecord）

### 1. React の state 更新は「即更新ではない」

React の setState（例: `setPatients`）は、その場で値を書き換える処理ではない。

React に対して、

「次の描画で state を更新してください」

という更新予約を出しているだけ。

例:

```js
setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
```

この時点ではまだ `appData.patients` は古い値のまま。

### 2. だからこのコードはズレる可能性がある

```js
setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

await onSaveData({
  patients: appData.patients,
  records: appData.records,
});
```

一見すると

- 患者更新
- 保存

に見えるが、実際は

- `setPatients` -> 更新予約
- `onSaveData` -> 古い `appData` を保存

になる可能性がある。

つまり、更新前のデータを保存してしまう可能性がある。

### 3. 解決方法

先に `next` データを作る。

保存するデータは自分で作ってから保存する。

```js
const nextPatients = appData.patients.map((p) =>
  p.id === updated.id ? updated : p,
);

await onSaveData({
  patients: nextPatients,
  records: appData.records,
});
```

こうすると

- 保存する配列
- 更新した配列

が完全に同じものになる。

### 4. updatePatient の正しい形

```js
const updatePatient = async (updated) => {
  const nextPatients = appData.patients.map((p) =>
    p.id === updated.id ? updated : p,
  );

  await onSaveData({
    patients: nextPatients,
    records: appData.records,
  });
};
```

### 5. updateRecord も同じ考え

```js
const updateRecord = async (updatedRecord) => {
  const nextRecords = appData.records.map((r) =>
    r.id === updatedRecord.id ? updatedRecord : r,
  );

  await onSaveData({
    patients: appData.patients,
    records: nextRecords,
  });
};
```

### 6. 設計の考え方

今回の設計の目的は「データ分裂を防ぐこと」。

そのために、

```text
データの真実の場所（Single Source of Truth）
App
 ├ patients
 └ records
```

更新処理も App に寄せる。

```text
App
 ├ addPatient
 ├ updatePatient
 ├ deletePatient
 ├ addRecord
 ├ updateRecord
 └ deleteRecord
```

子コンポーネントは「表示 + 入力」だけ担当する。

### 7. 今日の一番大事な理解

React では `setState` は即更新ではない。

なので、保存する配列は先に `next` を作ってから使う。

まとめ（超重要）:

- `setState` は更新予約
- `appData` はまだ古い

だから

`nextPatients` を作る
↓
それを保存する

## 2026-03-15 学習ログ（React state更新 / setPatients の仕組み）

### 1. 自作 setPatients の役割

App では `patients` と `records` をまとめて `appData` という state で管理している。

```js
const [appData, setAppData] = useState({
  patients: [],
  records: [],
});
```

そのため `patients` だけ更新するための関数を自作している。

```js
const setPatients = (updater) => {
  setAppData((prev) => {
    const nextPatients =
      typeof updater === "function" ? updater(prev.patients) : updater;

    return { ...prev, patients: nextPatients };
  });
};
```

この関数は **patients だけ更新するラッパー関数** として作られている。

### 2. updater の意味

`setPatients()` に渡した値が `updater` になる。

例：

```js
setPatients(nextPatients);
```

この場合

```text
updater = nextPatients
```

になる。

### 3. updater が関数かどうかを判定

```js
typeof updater === "function";
```

これは `updater` が関数かどうかをチェックしている。

### 4. updater が関数の場合

例：

```js
setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
```

この場合 `updater` は関数なので

```js
nextPatients = updater(prev.patients);
```

が実行される。

つまり `prev.patients.map(...)` が実行されて、新しい配列が作られる。

### 5. updater が関数じゃない場合

例：

```js
setPatients(nextPatients);
```

この場合 `updater` は配列なので

```js
nextPatients = updater;
```

になる。

つまり **渡された配列をそのまま使う** という意味になる。

### 6. なぜこの設計なのか

React の `setState` と同じ仕組みだから。

React では

```js
setState(value);
setState((prev) => newValue);
```

の2つの書き方ができる。

今回の `setPatients` は、この仕組みを**自作で再現している**。

### 7. prev の意味

```js
setAppData((prev) => {
```

この `prev` は **現在の `appData`** を表す。

つまり

```js
prev = {
  patients: [...],
  records: [...],
};
```

になる。

### 8. prev.patients

```js
updater(prev.patients);
```

の `prev.patients` は **現在の patients 配列** である。

### 9. React state更新の重要ルール

Reactでは **state を直接変更しない** ため、`map` / `filter` / スプレッド構文 `...` を使って新しい配列を作る。

更新：

```js
patients.map((p) => (p.id === updated.id ? updated : p));
```

削除：

```js
patients.filter((p) => p.id !== id);
```

追加：

```js
[...patients, newPatient];
```

### 今日の理解ポイント

| 概念                            | 意味                              |
| ------------------------------- | --------------------------------- |
| `setPatients`                   | patients だけ更新するラッパー関数 |
| `updater`                       | `setPatients()` に渡した引数      |
| `typeof updater === "function"` | 関数か値かの判定                  |
| `updater(prev.patients)`        | 関数なら実行して新しい配列を作る  |
| `updater` をそのまま使う        | 配列なら直接 nextPatients にする  |
| `prev`                          | 現在の `appData`                  |

### 明日やること

`setPatients` と `onSaveData` の役割の違いを整理する。

| 関数          | 役割                           |
| ------------- | ------------------------------ |
| `setPatients` | React 画面更新（state の予約） |
| `onSaveData`  | サーバー保存（fetch / PUT）    |

Reactの基本思想 `UI = state` を理解する。

## 2026-03-16 学習ログ（setPatients / 関数の外と中 / prev / updater の理解）

### 1. 今回理解したいコード

```js
const [appData, setAppData] = useState({ patients: [], records: [] });

const setPatients = (updater) => {
  setAppData((prev) => {
    const nextPatients =
      typeof updater === "function" ? updater(prev.patients) : updater;

    return { ...prev, patients: nextPatients };
  });
};
```

このコードのポイントは、React が本当に持っている state は `appData` であり、
`patients` は単独の state ではなく `appData.patients` の一部だということ。

### 2. setPatients は React の関数ではなく、自分で作った関数

React がくれるのは本来これだけ。

```js
const [appData, setAppData] = useState({ patients: [], records: [] });
```

つまり React が持っているのは

- `appData`
- `setAppData`

の2つだけ。

`setPatients` は React がくれたものではなく、自分で作った便利関数。

```js
const setPatients = (updater) => {
  setAppData((prev) => {
    const nextPatients =
      typeof updater === "function" ? updater(prev.patients) : updater;

    return { ...prev, patients: nextPatients };
  });
};
```

これは一言でいうと、

`setAppData` を patients 専用に使いやすくしたラッパー関数。

### 3. 関数の「外」と「中」

このコードを理解するには、2つの関数があることを分けて考える必要がある。

```js
const setPatients = (updater) => {
  setAppData((prev) => {
    const nextPatients =
      typeof updater === "function" ? updater(prev.patients) : updater;

    return { ...prev, patients: nextPatients };
  });
};
```

外の関数：

```js
const setPatients = (updater) => {
```

ここが外。自分が呼ぶ側の関数。

例えばこう呼ぶ。

```js
setPatients((prev) => [...prev, newPatient]);
```

このときの `(prev) => [...prev, newPatient]` は、
`setPatients` の引数 `updater` に入る。

つまり

```js
updater = (prev) => [...prev, newPatient];
```

になる。

中の関数：

```js
setAppData((prev) => {
```

ここが中。これは React に渡している関数で、React があとで実行する関数。

この中の `prev` は React が渡してくる。

つまり

```js
prev = 前の appData;
```

例：

```js
prev = {
  patients: [...],
  records: [...],
};
```

### 4. prev が2つあるので混乱しやすい

今回いちばん大事だったのは、`prev` が2種類あること。

1つ目：外の prev

```js
setPatients((prev) => [...prev, newPatient]);
```

この `prev` は `patients` を表す。

つまり

```js
prev = appData.patients;
```

2つ目：中の prev

```js
setAppData((prev) => {
```

この `prev` は `appData` を表す。

つまり

```js
prev = {
  patients: [...],
  records: [...],
};
```

### 5. 外と中を図で整理

外：

```text
setPatients((prev) => [...prev, newPatient])
            ↑
      これは patients
```

中：

```text
setAppData((prev) => { ... })
             ↑
        これは appData
```

ここを混同すると、

- `prev` は `appData` なのか
- `patients` なのか

が分からなくなる。

でも実際は、

- 外の `prev` = `patients`
- 中の `prev` = `appData`

である。

### 6. updater は何者か

`updater` は引数。
ただし、その中身が関数のこともあるし、配列のこともある。

パターン1：関数を渡す

```js
setPatients((prev) => [...prev, newPatient]);
```

このとき

```js
updater = (prev) => [...prev, newPatient];
```

つまり `updater` は関数。

なので

```js
typeof updater === "function";
```

は `true`。

パターン2：配列を渡す

```js
const nextPatients = [...patients, newPatient];
setPatients(nextPatients);
```

このとき

```js
updater = nextPatients;
```

つまり `updater` は配列。

なので

```js
typeof updater === "function";
```

は `false`。

### 7. typeof updater === "function" の意味

この部分は、

```js
const nextPatients =
  typeof updater === "function" ? updater(prev.patients) : updater;
```

`updater` が関数なら、

```js
updater(prev.patients);
```

を実行する。

つまり

```js
(prev) => [...prev, newPatient];
```

に対して

```js
prev.patients;
```

を渡している。

結果、

```js
[...prev.patients, newPatient];
```

が作られる。

一方、`updater` が配列なら、そのまま使う。

```js
nextPatients = updater;
```

### 8. 本物の更新は setAppData

`setPatients` がなかったら、`patients` を更新するには本当はこう書く必要がある。

```js
setAppData((prev) => ({
  ...prev,
  patients: [...prev.patients, newPatient],
}));
```

つまり、本当の更新関数は `setAppData`。

`setPatients` はこれを短く、分かりやすくするための自作関数。

### 9. ...prev が必要な理由

```js
return { ...prev, patients: nextPatients };
```

ここでの `...prev` は、`patients` 以外のデータを消さないために必要。

今の state はこう。

```js
{
  patients: [...],
  records: [...],
}
```

もし `...prev` がなくてこうすると、

```js
return { patients: nextPatients };
```

新しい state は

```js
{
  patients: nextPatients,
}
```

だけになる。

すると `records` が消える。

だから `...prev` を使って、前の state を全部コピーしてから
`patients` だけ上書きする必要がある。

```js
return { ...prev, patients: nextPatients };
```

これで結果は

```js
{
  patients: nextPatients,
  records: 前のrecords,
}
```

になる。

### 10. React では直接 state を変更しない

React では state を直接変更するとバグの原因になる。

NG：

```js
prev.patients.push(newPatient);
return prev;
```

これは

- 元の配列を直接変更している
- 元のオブジェクトをそのまま返している

ので、React が変化をうまく検知できないことがある。

OK：

```js
return {
  ...prev,
  patients: [...prev.patients, newPatient],
};
```

これは

- 新しい配列を作る
- 新しいオブジェクトを作る

ので、React が「新しい state になった」と判断しやすい。

### 11. setPatients(prev => prev) の意味

```js
setPatients((prev) => prev);
```

これは

- 前の patients をそのまま返す

という意味。

つまり結果は `patients` は変わらない。
更新処理自体は走るが、返している値が同じなので、結果として state は変わらない。

### 12. 今回の一番大事な理解

今回の理解を一言でまとめるとこうなる。

- React が本当に持っている state は `appData`
- `patients` は `appData` の中の一部
- `setPatients` は自作の便利関数
- 外の `prev` は `patients`
- 中の `prev` は `appData`
- `...prev` は他の値（`records`）を消さないために必要
- React では直接変更せず、新しい配列・新しいオブジェクトを作る

### 13. 自分用の覚え方

迷ったらこう考える。

- `setPatients(...)` は外
- `setAppData((prev) => ...)` は中
- 外の `prev` は `patients`
- 中の `prev` は `appData`

### 14. 最後にコードを1本で見る

```js
const [appData, setAppData] = useState({ patients: [], records: [] });

const setPatients = (updater) => {
  setAppData((prev) => {
    const nextPatients =
      typeof updater === "function" ? updater(prev.patients) : updater;

    return { ...prev, patients: nextPatients };
  });
};

setPatients((prev) => [...prev, newPatient]);
```

この流れはこう。

1. 自分が `setPatients(...)` を呼ぶ
2. `updater` に関数が入る
3. `setAppData` に関数を渡す
4. React が中の `prev` に `appData` を渡す
5. `updater(prev.patients)` を実行する
6. 新しい `patients` を作る
7. `return { ...prev, patients: nextPatients }` で `appData` を更新する

## 2026-03-18 学習ログ（React データフロー / state管理 / setPatients の設計理解）

#### 1. Reactのデータの流れ（超重要）

Reactではデータは上から下へ流れる。

App
↓ props
PatientList
↓ props
PatientDetails

これを一方向データフロー（One-way Data Flow）という。

基本ルール

- データ → 親から子へ
- 更新要求 → 子から親へ

#### 2. stateを親(App)で管理する理由

今回のアプリでは state を App に集中させている。

```js
const [appData, setAppData] = useState({
  patients: [],
  records: [],
});
```

構造

appData
├ patients
└ records

理由

Single Source of Truth（データの真実は1か所にする）

もし子で state を持つと

- App.patients
- PatientList.patients

のようにデータが分裂する。

すると

- 更新したのに画面が変わらない
- 古いデータが残る

などのバグになる。

#### 3. 子コンポーネントはデータ本体を持たない

子は表示と操作だけ担当する。

例

```js
function PatientList({ patients }) {
```

これは App の patients を表示しているだけ。

子は患者データの本体を持っていない。

#### 4. 子が持ってよいstate

子が持つのは UI状態。

例えば

```js
const [selectedPatientId, setSelectedPatientId] = useState(null);
const [selectedRecordId, setSelectedRecordId] = useState(null);
const [activeView, setActiveView] = useState("list");
```

これは

- どの患者を選んでいるか
- どの画面を表示しているか

なので UI専用state。

#### 5. selectedPatientId を持つ理由

患者データ本体をコピーするとズレが起きる。

危険な例

```js
const [selectedPatient, setSelectedPatient] = useState(patient);
```

すると

- patients
- selectedPatient

の2つになる。

更新ズレが起きる可能性がある。

そのため

```js
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

にして

```js
patients.find((p) => p.id === selectedPatientId);
```

で取得する。

これにより患者データは1か所だけになる。

#### 6. setPatients を自作している理由

Appのstateは

```js
const [appData, setAppData] = useState({
  patients: [],
  records: [],
});
```

なので普通はこう更新する必要がある。

```js
setAppData((prev) => ({
  ...prev,
  patients: nextPatients,
}));
```

しかしこれを子が書くと Appの内部構造 を子が知る必要がある。

そこで

```js
const setPatients = (updater) => {
  setAppData((prev) => {
    const nextPatients =
      typeof updater === "function" ? updater(prev.patients) : updater;

    return { ...prev, patients: nextPatients };
  });
};
```

を作る。

これにより子は

```js
setPatients(nextPatients);
```

だけ書けばよい。

つまり Appの内部構造を隠す（カプセル化）。

#### 7. 患者追加の流れ

```js
const patientToAdd = { ...data, id: crypto.randomUUID() };

const nextPatients = [...patients, patientToAdd];

await onSaveData({ patients: nextPatients, records });

setPatients(nextPatients);
```

流れ

1. フォーム入力
2. patientToAdd作成
3. nextPatients作成
4. サーバー保存
5. Appのstate更新
6. React再描画
7. 新しいpatientsがpropsで子へ渡る

#### 8. React再描画の仕組み

```js
setPatients(nextPatients);
```

が実行されると

Appのstate変更
↓
ReactがAppを再実行
↓
新しいpropsが子に渡る
↓
子が再描画

つまり 親state更新 → 再描画 → 新しいprops の流れ。

#### 9. React設計まとめ

今回のアプリ設計は

- state集中（Single Source of Truth）
- 一方向データフロー
- 責任の分離
- カプセル化

というReactの基本設計を使っている。

### 今日の理解

- stateは親に集中させる
- 子はデータ本体を持たない
- propsは親のstateを表示する仕組み
- 更新は子→親の関数を呼ぶ
- setPatientsはappData構造を隠すため

## 2026-03-19

### 学習ログ（削除機能 / ラッパー関数 / 責任の分離）

---

#### 1. 削除処理の全体の流れ

削除機能は以下の流れで実装されている。

```text
DeleteButton
  ↓
PatientCard
  ↓
PatientList（ラッパー関数）
  ↓
App（データ削除・保存）
```

---

#### 2. App の役割（データの本体）

Appでは「実際の削除処理」を担当する。

```js
const deletePatient = async (id) => {
  const nextPatients = appData.patients.filter((p) => p.id !== id);
  const nextRecords = appData.records.filter((r) => r.patientId !== id);
  await onSaveData({ patients: nextPatients, records: nextRecords });
  setSelectedPatientId(null);
};
```

```js
const deleteRecord = async (id) => {
  const nextRecords = appData.records.filter((r) => r.id !== id);
  await onSaveData({ patients: appData.patients, records: nextRecords });
};
```

ポイント：

- `filter` を使って削除対象以外を残す
- `nextPatients / nextRecords` を作ってから保存
- データの責任はすべて App にある

---

#### 3. PatientList の役割（ラッパー関数）

削除後の画面制御は PatientList が担当する。

```js
const handleDeletePatient = async () => {
  if (!selectedPatient) return;
  await deletePatient(selectedPatient.id);
  setSelectedRecordId(null);
  setActiveView("list");
};
```

```js
const handleDeleteRecord = async (id) => {
  await deleteRecord(id);
  setSelectedRecordId(null);
  setActiveView("records");
};
```

ポイント：

- delete関数（App）を呼び出す
- その後にUI状態を更新する
- これが「ラッパー関数」

---

#### 4. ラッパー関数の理解

ラッパー関数とは、

「元の関数 + 追加処理」をまとめた関数

例：

```js
const handleDeleteRecord = async (id) => {
  await deleteRecord(id); // 元の関数（データ削除）
  setSelectedRecordId(null); // 追加処理（UI更新）
  setActiveView("records"); // 追加処理（画面遷移）
};
```

---

#### 5. 引数あり・なしの判断

判断基準：

- 関数の中で値が取れる → 引数いらない
- 外から渡さないと分からない → 引数いる

例：

```js
// 引数いらない（selectedPatientがある）
const handleDeletePatient = () => {
  deletePatient(selectedPatient.id);
};

// 引数いる（どのrecordか分からない）
const handleDeleteRecord = (id) => {
  deleteRecord(id);
};
```

---

#### 6. UIコンポーネントの役割

DeleteButton：

```js
export default function DeleteButton({ handleDelete }) {
  return <button onClick={handleDelete}>削除</button>;
}
```

PatientCard：

```js
<DeleteButton handleDelete={onDelete} />
```

ポイント：

- UIは処理を持たない
- ただ関数を呼ぶだけ

---

#### 7. 責任の分離（最重要）

今回の一番重要な学び：

- App → データの責任（削除・保存）
- PatientList → 画面状態の責任（遷移・選択解除）
- PatientCard / Button → UI表示

つまり

「UI・ロジック・データ」を分ける

---

#### 8. 今回の理解ポイントまとめ

- filterで削除する仕組み
- next配列を作ってから保存する流れ
- ラッパー関数の役割
- 引数あり / なしの判断
- propsの正しい受け渡し
- 責任の分離（最重要）

---

#### 9. 感想（重要）

削除処理を通して、

- stateの持ち場所
- 関数の役割分担
- UIとロジックの分離

が理解できてきた。

特に「ラッパー関数」と「責任の分離」は
React設計の基礎として重要。
