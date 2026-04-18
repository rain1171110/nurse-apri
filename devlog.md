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

## 2026-03-20

### 学習ログ（削除処理 / ラッパー関数 / イベント設計）

---

### ① 削除処理の全体構造

削除は1つのコンポーネントでやっているのではなく、役割が分かれている。

- **DeleteButton**
  - ボタン表示のみ
  - `onClick` を実行するだけ（削除処理はしない）

- **PatientCard**
  - `patient.id` を持っている
  - 押されたときに `onDelete(patient.id)` を呼ぶ
  - 削除対象を特定して親に渡す役割

- **PatientList**
  - 実際の削除処理を行う
  - `filter` を使って対象データを除外
  - `onSaveData` を通して保存・state更新

---

### ② データの流れ（重要）

削除の流れは以下の通り

DeleteButton
→ クリック
→ PatientCard の handleDelete 実行
→ onDelete(patient.id)
→ PatientList の deletePatient(id)
→ filterで削除
→ onSaveDataで保存
→ Appのstate更新
→ 再描画

---

### ③ ラッパー関数の理解

ラッパー関数は難しいものではなく、

```jsx
const handleDelete = () => {
  onDelete(patient.id);
};
```

のように、

**「必要な値をつけて親の関数を呼ぶための関数」**

---

### ④ なぜ () => が必要か（重要）

```jsx
onClick={onDelete(patient.id)} ❌
```

これはその場で実行されてしまう

```jsx
onClick={() => onDelete(patient.id)} ✅
```

これはクリックされたときに実行される

---

### ⑤ ルールまとめ

- 引数なし → そのまま渡す

```jsx
onClick = { handleDelete };
```

- 引数あり → ラッパー関数

```jsx
onClick={() => onDelete(patient.id)}
```

---

### ⑥ idを渡す理由（重要）

削除は必ず対象を特定する必要があるため、

```jsx
onDelete(patient.id);
```

のように **idを渡す設計が安全**

- 選択状態に依存するとバグの原因になる
- 一覧画面では特に危険

---

### ⑦ 設計の理解（Reactの本質）

- イベントは **子 → 親に通知**
- stateは **親 → 子へ流れる**

---

### ⑧ DeleteButtonの改善

```jsx
export default function DeleteButton({ onClick }) {
  return <button onClick={onClick}>削除</button>;
}
```

- UI専用コンポーネントになった
- 再利用しやすい設計

---

### ⑨ 今日の一番大事な理解

- ボタンは削除していない
- 削除は親がやる
- 子は「どれを削除するか」を伝えるだけ

---

### ⑩ 一言まとめ

ラッパー関数 = イベント + 必要な値を親に渡すための関数

## 2026-03-21

### 学習ログ（viewMap / 画面切り替え設計の理解）

---

### ① activeView と viewMap の関係

- `activeView` は「今どの画面を表示するか」を表す state
- `viewMap` は「画面名とコンポーネントの対応表」

```txt
activeView（状態） → viewMap[activeView] → 表示UI
```

---

### ② viewMap の正体

```jsx
const viewMap = {
  details: <PatientDetails />,
  vitals: <PatientVitals />,
  menu: <PatientMenu />,
};
```

- 配列ではなく **オブジェクト**
- キー（"details"など）で管理している

---

### ③ viewMap[activeView] の意味

```jsx
viewMap[activeView];
```

これは

```jsx
viewMap["details"];
```

のように変換され、

対応するコンポーネントを取り出している

---

### ④ 配列との違い

- 配列 → index（0,1,2）で管理
- オブジェクト → 名前（details, vitals）で管理

```txt
配列 = 順番で管理
オブジェクト = 名前で管理
```

画面は「名前」で管理した方が分かりやすいため、オブジェクトを使う

---

### ⑤ [] 記法の意味

```jsx
viewMap[activeView];
```

- これは配列ではなく **オブジェクトアクセス（ブラケット記法）**
- 変数を使ってキーを指定できる

```txt
[] = データ取得（オブジェクトから値を取り出す）
```

---

### ⑥ ${} との違い

```js
`${value}`;
```

- 文字列の中で変数を使うときに使う

今回の `viewMap` とは無関係

```txt
${} = 文字列
[] = データ取得
```

---

### ⑦ ?? の役割

```jsx
viewMap[activeView] ?? <div>未実装</div>;
```

- 存在しないキーの場合 `undefined` になる
- `??` によって代替UIを表示

```txt
?? = フォールバック（保険）
```

---

### ⑧ なぜ viewMap を使うのか

三項演算子との比較

```jsx
activeView === "details" ? (...) :
activeView === "vitals" ? (...) :
...
```

問題点

- 長くなると読みにくい

viewMapにすると

- 条件分岐が1箇所にまとまる
- 追加・変更が簡単
- 見通しが良くなる

---

### ⑨ React設計とのつながり

- Reactは「state → UI」の仕組み
- viewMapはそのルールを整理したもの

```txt
state（activeView） → UI（viewMap）
```

---

### ⑩ 今日の一番重要な理解

- viewMapは配列ではなくオブジェクト
- []は配列ではなく「オブジェクトアクセス」
- activeViewをキーとしてUIを取り出している

---

### ⑪ 一言まとめ

```txt
viewMapは「画面名 → 表示コンポーネント」の対応表で、
activeViewを使って表示するUIを取り出している
```

## 2026-03-22 学習ログ（viewMap と CurrentView の理解）

### ① viewMap の役割

- `viewMap` は「画面ごとの表示方法（関数）」をまとめたオブジェクト。
- 各プロパティには JSX ではなく「JSX を返す関数」を入れている。

```js
const viewMap = {
  details: () => <PatientDetails />,
  records: () => <NursingRecordList />,
};
```

👉 画面そのものではなく「画面の作り方」を管理している

---

### ② viewMap[activeView] の意味（重要）

```js
const CurrentView = viewMap[activeView];
```

これは

👉 オブジェクトから値を1つ取り出しているだけ

---

#### 分解して理解

```js
const activeView = "details";

viewMap[activeView]
// ↓
viewMap["details"]
// ↓
() => <PatientDetails />
```

つまり

```js
const CurrentView = () => <PatientDetails />;
```

と同じ状態になる

---

### ③ CurrentView の正体

- `CurrentView` は「関数が入った変数」
- 関数を新しく作っているのではなく、**viewMap に入っている関数を取り出しているだけ**

---

### ④ なぜ CurrentView() と書くのか

```js
CurrentView();
```

👉 関数を実行して JSX を作るため

---

#### 前との違い

【前】

```js
viewMap[activeView];
```

👉 JSX（完成品）を直接表示していた

【今】

```js
viewMap[activeView];
```

👉 関数が返ってくるので、実行が必要

---

### ⑤ 安全な表示方法

```js
CurrentView ? CurrentView() : <div>未実装</div>;
```

- 関数がある → 実行
- 関数がない → 未実装

👉 undefined() を防ぐために必要

---

### ⑥ 設計の理解（重要）

今回の変更で

- JSX（値）で管理 → ❌
- 関数（作り方）で管理 → ✅

に変わった

---

### ⑦ 今の理解まとめ

- viewMap は「画面の辞書」
- activeView は「どの画面かのキー」
- CurrentView は「取り出した関数」
- CurrentView() で画面が生成される

---

### 明日の学習ポイント

👉 `const CurrentView = viewMap[activeView];` の理解を深める

特にここを意識する

- オブジェクトから値を取り出しているだけ
- 関数を代入しているだけ
- 実行しているわけではない（←重要）

---

### 一言まとめ

👉 「関数を作っている」のではなく
👉 「関数を取り出しているだけ」

## 2026-03-23 学習ログ（activeView / viewMap / CurrentView の完全理解）

### ① activeView の役割

```js
const activeView = "records";
```

- 「今どの画面を表示するか」を表す値
- `viewMap` のキーと対応している

👉 画面を切り替えるスイッチの役割

### ② viewMap の役割

```js
const viewMap = {
  details: () => <PatientDetails />,
  records: () => <NursingRecordList />,
};
```

- 画面ごとの表示方法（関数）をまとめたオブジェクト
- JSXではなく「JSXを返す関数」を入れている

👉 画面そのものではなく「画面の作り方」を管理

### ③ viewMap[activeView] の意味（最重要）

```js
const CurrentView = viewMap[activeView];
```

分解:

```txt
activeView = "records"
↓
viewMap["records"]
↓
() => <NursingRecordList />
```

👉 関数を取り出しているだけ

### ④ CurrentView の正体

- 関数が入った変数
- 新しく作っているのではなく、`viewMap`から取り出しているだけ

### ⑤ 関数と実行の違い（重要）

関数を取り出す:

```js
viewMap["details"];
```

👉 中身は `() => ...`

実行する:

```js
viewMap["details"]();
```

👉 中身は JSX

まとめ:

| 書き方           | 中身 |
| ---------------- | ---- |
| `viewMap[key]`   | 関数 |
| `viewMap[key]()` | JSX  |

### ⑥ なぜ CurrentView() と書くのか

```js
CurrentView();
```

👉 関数を実行して JSX を生成するため

### ⑦ 安全な表示

```js
CurrentView ? CurrentView() : <div>未実装</div>;
```

- 関数がある → 実行
- 関数がない → 未実装

👉 `undefined()` を防ぐ

### ⑧ なぜ const CurrentView を先に書くのか

```js
const CurrentView = viewMap[activeView];
```

- 表示する画面を「先に決めている」
- `return` の中をシンプルにするため

👉 準備と表示を分けている

### ⑨ 設計の本質（超重要）

今回の学びで

- JSX（完成品）で管理 → ❌
- 関数（作り方）で管理 → ✅

に変わった

### ⑩ イメージまとめ

- `viewMap` → メニュー表
- `activeView` → 注文
- `CurrentView` → 選ばれた料理
- `CurrentView()` → 料理を作る

### 今日の一言まとめ

👉 「関数を作っている」のではなく
👉 「関数を取り出して、あとで実行している」

## 2026-03-24 学習ログ（Router導入 / URLで画面管理）

### ① viewMap の復習

`viewMap` は「画面の辞書」。
値は JSX そのものではなく、JSX を返す関数として持つ。

```js
const viewMap = {
  details: () => <PatientDetails />,
};
```

学び:

```js
const CurrentView = viewMap[activeView];
```

これは「関数を取り出している」。

```js
CurrentView();
```

これは「関数を実行して画面を生成している」。

つまり:

👉 画面 = 関数の戻り値

### ② Router の導入

やったこと:

```bash
npm install react-router-dom
```

Router の役割:

👉 URL によって画面を切り替える

今までとの違い:

| 今まで        | Router    |
| ------------- | --------- |
| stateで管理   | URLで管理 |
| setActiveView | navigate  |
| viewMap       | Route     |

### ③ Router の基本構造

`main.jsx`

```jsx
<Router>
  <Routes>
    <Route path="/*" element={<App />} />
  </Routes>
</Router>
```

`App.jsx`

```jsx
<Routes>
  <Route path="/" element={<PatientList />} />
  <Route path="/test" element={<div>テスト</div>} />
</Routes>
```

学び:

👉 Router は 1 つだけ
👉 今回は `main.jsx` に置く設計

### ④ よく出たエラーと理解

❌ `react-router-dom` がない

👉 インストールしていない

```bash
npm install react-router-dom
```

❌ `useNavigate is not defined`

👉 import 忘れ

```js
import { useNavigate } from "react-router-dom";
```

❌ Router が2個ある

```txt
You cannot render a <Router> inside another <Router>
```

👉 `main` と `App` の両方に書いていた

学び:

👉 Router は 1 つだけ

### ⑤ useNavigate（画面遷移）

```js
const navigate = useNavigate();

navigate("/test");
```

学び:

👉 ボタンで画面遷移できる

### ⑥ useParams（URLから値取得）

```js
const { id } = useParams();
```

例: `/patient/123`

👉 `id = "123"`

### ⑦ データ取得の考え方（超重要）

❌ 間違い:

```js
PatientList.find(...)
```

👉 コンポーネントは配列ではない

✅ 正解:

```js
const patient = patients.find((p) => String(p.id) === id);
```

学び:

👉 データは App が持つ
👉 子は props でもらう

### ⑧ Router化の本質（今日の一番大事）

今まで:

```js
setSelectedPatientId(id);
setActiveView("details");
```

これから:

```js
navigate(`/patient/${id}`);
```

つまり:

👉 状態（state）を URL に持たせる

### 🔥 今日の理解まとめ（超重要）

👉 React の画面は3段階で管理できる

① 関数（viewMap）
② state（activeView）
③ URL（Router） ← 今ここ

## 2026-03-25 学習ログ（Router〜詳細画面への遷移）

### ① Router の本質理解

```txt
main.jsx → Router（入口）
   ↓
App.jsx → Routes（ルール）
   ↓
Route → どの画面を出すか
```

重要ポイント:

- Router は 1 つだけ（main に置く）
- App では Routes を書く
- Routes の中は Route だけ

つまり:

👉 Router = URL と画面をつなぐ仕組み

### ② 画面遷移（useNavigate）

```js
navigate("/patient/1");
```

流れ:

```txt
クリック
↓
navigate
↓
URL変更
↓
Route が反応
↓
画面切り替え
```

つまり:

👉 navigate は URL を変更するだけ

### ③ URLから値を取得（useParams）

```js
const { id } = useParams();
```

例: `/patient/5`

👉 `id = "5"`

### ④ データの取得ロジック

```js
const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);
```

使い分け:

| 関数     | 用途         |
| -------- | ------------ |
| `find`   | 1件（患者）  |
| `filter` | 複数（記録） |

### ⑤ 今日一番重要な理解

❌ 最初のミス:

```js
PatientList.find(...)
```

👉 コンポーネントとデータを混同している

✅ 正解:

```js
patients.find(...)
```

本質:

| 名前          | 正体           |
| ------------- | -------------- |
| `PatientList` | UI（部品）     |
| `patients`    | データ（配列） |

### ⑥ エラーから学んだこと

エラー:

```txt
Cannot read properties of undefined (reading 'id')
```

👉 変数が `undefined`

学び:

- `map` の変数名ミスに注意する
- スコープを意識する
- `console.log` で確認する

### ⑦ 「飛ばない」の正体

実際に起きていたこと:

👉 URL は正しく変わっていた

本当の問題:

👉 `PatientPage` でデータが取れていなかった

学び:

👉 Router はデータを渡さない

```jsx
<Route element={<PatientPage patients={...} records={...} />} />
```

👉 props で渡す必要がある

### ⑧ PatientPage の完成形（今日）

```jsx
import { useParams } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientPage({ patients, records }) {
  const { id } = useParams();

  const patient = patients.find((p) => String(p.id) === id);
  const patientRecords = records.filter((r) => String(r.patientId) === id);

  if (!patient) return <div>患者が見つかりません</div>;

  return (
    <div>
      <PatientCard patient={patient} records={patientRecords} />
    </div>
  );
}
```

役割の分担:

- `PatientPage` → URLから患者を探す入口
- `PatientCard` → 渡された患者を表示する

### 🔥 今日の最重要まとめ

| 機能        | 役割                         |
| ----------- | ---------------------------- |
| `Router`    | URL で画面を切り替える仕組み |
| `navigate`  | URL を変更する命令           |
| `useParams` | URL から値を取り出す         |
| props       | データを子に渡す手段         |

👉 Router 自身はデータを渡さない。データは props で渡す。

## 2026-03-27 学習ログ（ルーティングと props のズレを直す）

### 1) 今日起きたこと

患者一覧から遷移した先で、

- メニュー（患者情報 / バイタル / 看護記録）が消える
- `ReferenceError: PatientVitals is not defined`
- `Cannot read properties of undefined (reading 'room')`

が発生した。

### 2) 原因の整理

#### 原因A: import していないコンポーネントを使っていた

```jsx
// App.jsx
<Route path="/patient/:id/vitals" element={<PatientVitals ... />} />
```

このように使っているのに、先頭で import がないと実行時エラーになる。

```jsx
import PatientVitals from "./PatientVitals";
import NursingRecordList from "./NursingRecordList";
```

#### 原因B: 1人分が必要なのに、全体配列を渡していた

`PatientVitals` / `NursingRecordList` は「1人分の患者データ」を前提にしている。

しかし Route 側で次のように渡していた。

```jsx
<PatientVitals patients={appData.patients} records={appData.records} />
```

この状態で `patients.room` を読むと落ちる。

```jsx
{patients.room}号室 {patients.name} さん
```

配列に `room` はないため `undefined` になる。

### 3) 学んだ直し方（手順）

#### 手順1: URLから id を取る

```jsx
import { useParams } from "react-router-dom";

const { id } = useParams();
```

#### 手順2: 全体から1人を探す

```jsx
const patient = patients.find((p) => String(p.id) === id);
```

#### 手順3: その患者の記録だけに絞る

```jsx
const patientRecords = records.filter((r) => String(r.patientId) === id);
```

#### 手順4: 画面では 1人データを使う

```jsx
<p>
  {patient.room}号室 {patient.name} さん
</p>
```

### 4) ルーティングの考え方（今日の核心）

Route には「表示部品を直接置く」より、

- URLから id を取得
- 対象 patient を特定
- 子コンポーネントへ渡す

という流れを作るコンテナを置くと安定する。

例（考え方）:

```jsx
<Route path="/patient/:id" element={<PatientPage ... />} />
<Route path="/patient/:id/vitals" element={<PatientPage ... />} />
<Route path="/patient/:id/records" element={<PatientPage ... />} />
```

`PatientPage` で id 解決と props 整理をしてから、
`PatientCard` / `PatientVitals` / `NursingRecordList` を出し分ける。

### 5) 今日のまとめ（つまり）

- 画面エラーの多くは「データの形のズレ」で起きる
- `patients`（配列）と `patient`（1件）を混ぜると落ちる
- URL（id）→ 1人特定 → 必要なpropsで表示、の順で考えると迷いにくい
- import不足は実行時 `is not defined` の定番原因

## 2026-04-03

### 学習ログまとめ（React基礎 -> 実装まで）

### 1. データ取得（useParams + find）

```js
const { id } = useParams();
const patient = patients.find((p) => String(p.id) === id);
```

ポイント:

- `useParams()` で取得した `id` は string
- 比較前に `String(p.id)` で型をそろえる

### 2. 配列から抽出（filter）

```js
const patientRecords = records.filter((r) => String(r.patientId) === id);
```

ポイント:

- `filter` は条件に合う要素だけを残す
- 「どの配列を対象にするか」が重要

### 3. mapで画面表示

```jsx
patientRecords.map((r) => (
  <div key={r.id}>
    <p>{r.date}</p>
    <p>{r.vitals?.temperature}</p>
    <p>{r.vitals?.pulse}</p>
  </div>
));
```

ポイント:

- `map` は配列をUIに変換する
- `key` は必須
- `?.` は値がないときのエラーを防ぐ

### 4. オプショナルチェーン（?.）

```js
r.vitals?.temperature;
```

意味:

- `vitals` があれば値を取得
- なければ `undefined` を返してエラーを回避

### 5. コンポーネント分割

```jsx
<RecordItem record={r} />;

export default function RecordItem({ record }) {
  return <p>{record.date}</p>;
}
```

ポイント:

- コンポーネントは再利用できる部品
- `props` でデータを渡す

### 6. propsの理解

```jsx
<RecordItem record={r} />
```

ポイント:

- `record` は props の名前
- `r` は渡す実データ

つまり:

- 親 -> 子へデータを渡す

### 7. stateを親に持つ理由

ポイント:

- state を親に集約するとデータ分裂を防げる
- 親が state 管理、子は表示中心

### 8. 削除処理（filter + state更新）

```js
const handleDelete = (id) => {
  const nextRecords = records.filter((r) => r.id !== id);
  setRecords(nextRecords);
};
```

ポイント:

- 削除は「対象以外を残す」
- state は新しい配列で更新する

### 9. 親 -> 子イベント

```jsx
<RecordItem onDelete={handleDelete} />
<button onClick={() => onDelete(record.id)}>削除</button>
```

ポイント:

- 親が処理を持つ
- 子が実行のきっかけを作る

### 10. filter条件の理解

単体条件:

```js
r.id === 3; // 3だけ残す
r.id !== 3; // 3を削除
```

複数条件:

```js
r.id === 2 || r.id === 4;
```

includes（実務でよく使う）:

```js
[2, 4].includes(r.id);
```

否定（2と4を削除）:

```js
![2, 4].includes(r.id);
```

### 今回の最重要まとめ（本質）

Reactの設計:

- state -> 親が持つ
- props -> 子に渡す
- イベント -> 子から親に伝える

配列操作:

- `filter` -> 条件に合うものを残す
- `map` -> 表示に変換する
- `includes` -> 複数条件を簡潔に書く

### つまり

今回の学びは「部品を分ける」「データの流れをそろえる」「配列操作でUIを作る」の3つ。
この3つを守ると、Reactのコードは読みやすく、壊れにくくなる。

## 2026-04-07

### 学習ログまとめ

今日は主に React Router / props / state の責任範囲 / 編集画面の設計 を整理した日でした。

#### 1. NursingRecordItem is not defined の意味

エラー:

ReferenceError: NursingRecordItem is not defined

これは、App.jsx で <NursingRecordItem /> を使っているのに、import できていない・名前が定義されていないという意味。

学び:

- JSXで使うコンポーネントは必ず import が必要
- エラー文の is not defined は「その名前が存在しない」と読む

#### 2. Route の path は親子関係で考える

親Routeが

<Route path="/patient/:id" ...>

なら、子Routeでさらに

path="patient/:id/records/:recordId"

と書くのは重複。

正しくは
path="records/:recordId"

学び:

- 子Routeでは親の path をもう一度書かない
- useParams() の値は Route で書いた名前と一致させる

#### 3. setIsEditing is not a function の原因

PatientDetail.jsx や NursingRecordItem.jsx で

setIsEditing(true)

を呼んでいたが、その setIsEditing が props で渡されていなかった。

学び:

- 使う関数は props で受け取るか、自分の中で定義する必要がある
- ○○ is not a function は「関数だと思って呼んだが違った」と読む

#### 4. isEditing はどこで持つべきか

今回一番大事だったところ。

結論:

- patients, records などの実データ -> App が持つ
- isEditing, isAdding などの画面表示用 state -> その画面のコンポーネントが持つ

例:

const [isEditing, setIsEditing] = useState(false);

を NursingRecordItem や PatientDetail の中で持つのはOK。

学び:

- isEditing はサーバー保存するデータではない
- これは「今その画面で編集フォームを見せるか」という UI状態
- なので データの分裂にはならない

#### 5. データの分裂とは何か

前に学んだ「データの分裂」は、

例:
const [patients, setPatients] = useState([...]);
const [selectedPatient, setSelectedPatient] = useState(patientObject);

のように、同じ意味のデータを複数の state で持つこと。

学び:

- patients と selectedPatient の両方に患者データを持つとズレる
- だから基本は 元データは1か所
- 今回の isEditing は元データではないので分裂ではない

#### 6. extractUsedRoomNumbers is not defined

エラー:

ReferenceError: extractUsedRoomNumbers is not defined

原因:
App.jsx や PatientDetail.jsx で使っているのに import していなかった。

学び:

- util関数も使うなら import 必須
- is not defined は「その名前がない」

#### 7. Cannot read properties of undefined (reading 'filter')

エラー:

Cannot read properties of undefined (reading 'filter')

原因:
extractUsedRoomNumbers(patients.id) と書いていたため、patients は配列なのに .id を取ろうとして undefined になった。

正しくは
extractUsedRoomNumbers(patients, id)

学び:

- patients は配列
- 配列に .id はない
- util関数には「配列そのもの」を渡す

#### 8. updatePatient is not a function

エラー:

updatePatient is not a function

原因:
PatientDetail.jsx では updatePatient(updated) を呼んでいるのに、親の App.jsx から updatePatient を props で渡していなかった。

学び:

- 子で使う関数は親から渡す必要がある
- props 名がずれていても同じエラーになる

#### 9. Maximum update depth exceeded

エラー:

Maximum update depth exceeded

原因候補:
useEffect の中で親の state を更新し続けて再描画ループになった。

特に怪しかったのはこれ:

useEffect(() => {
if (onErrorsChange) onErrorsChange(errors);
}, [errors, onErrorsChange]);

学び:

- useEffect の中で親の setState を呼ぶとループしやすい
- errors のようなオブジェクトは参照が変わりやすい
- 同じ内容の errors を何度も親に送らない工夫が必要

#### 10. useRef を使ったガードの意味

提案されたコード:

const prevErrorSignatureRef = useRef("");

useEffect(() => {
const signature = JSON.stringify(errors);
if (signature === prevErrorSignatureRef.current) return;
prevErrorSignatureRef.current = signature;
if (onErrorsChange) onErrorsChange(errors);
}, [errors, onErrorsChange]);

何をしているか:

- 前回の errors を文字列で覚えておく
- 今回の errors と同じなら親へ送らない
- 違う時だけ onErrorsChange(errors) を呼ぶ

学び:

- useRef は「前回の値を覚えておく箱」
- 同じエラー内容なら処理を止められる
- 無限ループ対策に使える

#### 11. PatientDetail と NursingRecordItem の編集の違い

PatientDetail:

- 患者情報の表示
- isEditing を true にすると、同じ画面内で患者情報フォームを表示

NursingRecordItem:

- 看護記録1件の表示
- isEditing を true にすると、その記録の編集フォームを表示

学び:

- 「患者情報の編集」と「記録の編集」は別
- 同じ「編集」でも責任のあるコンポーネントが違う

### 今日の一番大事な理解

1. App が持つもの

- patients
- records
- add / update / delete
- 保存処理

2. 各画面が持つもの

- isEditing
- isAdding
- フォームの開閉
- 画面内だけのUI状態

3. データの分裂とは

- 同じ意味の実データを複数 state で持つこと
- isEditing は実データではないので分裂ではない

### 今日のコード理解キーワード

- is not defined -> 名前が存在しない
- is not a function -> 関数として呼んだが関数ではない
- Cannot read properties of undefined -> undefined.xxx をしようとした
- Maximum update depth exceeded -> state更新ループ

## 2026-04-08

### 学習ログ

テーマ：prevErrorSignatureRef / JSON.stringify(errors) / 子→親のエラー通知の流れ

#### 1. 今日やったこと

今日は、フォームのエラー通知まわりのコードを中心に確認した。

扱った主なコードはこれ。

`js
const prevErrorSignatureRef = useRef("");

useEffect(() => {
const signature = JSON.stringify(errors);
if (signature === prevErrorSignatureRef.current) return;
prevErrorSignatureRef.current = signature;
if (onErrorsChange) onErrorsChange(errors);
}, [errors, onErrorsChange]);
`

最初は

- prevErrorSignatureRef の名前の意味
- なぜ JSON.stringify(errors) を使うのか
- if (signature === prevErrorSignatureRef.current) return; の意味
- 親の globalErrors とのつながり

があいまいだったが、少しずつ整理できた。

#### 2. prevErrorSignatureRef の意味

単語を分けるとこう。

- prev = 前回の
- Error = エラー
- Signature = 識別用の印、特徴
- Ref = 参照

つまり全体では、

「前回のエラー内容の識別文字列を覚えておく ref」

という意味になる。

今のコードでは、errors そのものではなく、
JSON.stringify(errors) で作った文字列を前回値として保存している。

#### 3. 子と親の関係

今日の大事な理解ポイントはここ。

子コンポーネント側:

`js
useEffect(() => {
  if (onErrorsChange) onErrorsChange(errors);
}, [errors, onErrorsChange]);
`

これは「子の errors が変わったら、親へ通知する処理」だった。

親コンポーネント側:

`js
useEffect(() => {
if (Object.keys(globalErrors).length > 0) {
Promise.resolve().then(() => {
setDisplayErrors(globalErrors);
});

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setDisplayErrors({});
    }, 10000);

}

return () => {
if (timerRef.current) clearTimeout(timerRef.current);
};
}, [globalErrors]);
`

これは「親が受け取った globalErrors を表示用に管理する処理」だった。

つまり流れはこう。

`子の errors が変わる
↓
子の useEffect が動く
↓
onErrorsChange(errors) を呼ぶ
↓
親の globalErrors が更新される
↓
親の useEffect([globalErrors]) が動く
↓
displayErrors に反映する`

#### 4. なぜガードが必要だったのか

元のままだと、子で同じ errors を何回も親に送ってしまう可能性がある。

そうすると親では毎回:

- globalErrors が更新されたことになる
- 再レンダーが増える
- 表示処理やタイマーが何度も動く

という無駄が起きる。

そのため、

`js
if (signature === prevErrorSignatureRef.current) return;
`

を入れて、前回と同じ内容の errors なら親に再通知しないようにした。

#### 5. なぜ JSON.stringify(errors) を使うのか

errors はオブジェクトなので、そのままだと中身ではなく参照で比較される。

たとえば:

`js
const a = { message: "必須" };
const b = { message: "必須" };

console.log(a === b); // false
`

中身が同じでも、別々に作られたオブジェクトは false になる。

だから errors もそのままでは比較しづらい。

そこで:

`js
const signature = JSON.stringify(errors);
`

として、オブジェクトを比較しやすい文字列に変換している。

JSON.stringify(errors) の目的は「errors を比較しやすい文字列にするため」。

#### 6. JSON と data.json の違い

| 用途                   | 内容                                                       |
| ---------------------- | ---------------------------------------------------------- |
| JSON.stringify(errors) | フロント側で使う。エラー比較用。一時的な文字列化。         |
| server/data.json       | サーバー側で使う。患者や記録の保存用。実際のアプリデータ。 |

同じ「JSON」という言葉でも、比較用の文字列化と保存ファイルでは役割が違う。

#### 7. useRef("") が空文字なのに大丈夫な理由

`js
const prevErrorSignatureRef = useRef("");
`

最初は prevErrorSignatureRef.current === "" だが、それは初期値であってずっと空文字のままではない。

1回目の流れ（errors が空オブジェクトの場合）:

`js
const signature = JSON.stringify(errors); // "{}"

if ("{}" === "") return; // false なので止まらない

prevErrorSignatureRef.current = "{}"; // ここで更新される
`

2回目以降（同じ errors の場合）:

`js
if ("{}" === "{}") return; // true なので止まる → 親へ送らない
`

#### 8. なぜ errors が空だと "{}" になるのか

`js
JSON.stringify({}); // "{}"
`

- {} はオブジェクト
- "{}" は文字列

この2つは別物。JSON.stringify はオブジェクトを文字列に変換する。

#### 9. 今日の一番大事な理解

`js
const signature = JSON.stringify(errors);
if (signature === prevErrorSignatureRef.current) return;
`

これは「今回のエラー内容」と「前回保存しておいたエラー内容」が同じなら、親へ送らず終わるという意味。

このコード全体は、**同じ errors を何回も親に通知しないためのガード**である。

#### 10. 今日の理解ポイントを一言ずつ

- prevErrorSignatureRef は、前回のエラー内容の文字列を覚えておく ref
- 子の useEffect は親への通知
- 親の useEffect は表示処理
- errors はオブジェクトなので、そのままだと比較しにくい
- だから JSON.stringify(errors) で文字列にする
- useRef("") の空文字は初期値で、1回目の実行後に更新される
- JSON は形式、data.json はその形式で保存されたファイル

#### 11. 次回の復習スタート地点

- if (signature === prevErrorSignatureRef.current) return; を自分の言葉で説明する
- なぜ errors ではなく signature を保存しているのか整理する
- なぜ ref で持って、state では持たないのか確認する

#### 12. 超短くまとめると

同じエラー内容を親に何度も送らないために、errors を JSON.stringify で文字列化し、前回の文字列と ref で比較している。

## 2026-04-09 ### 学習ログまとめ

今日は主に、エラー比較の仕組み と React / Router の復習 を進めた。

#### 1. if (signature === prevErrorSignatureRef.current) return; の理解

この1行は、

「今回の errors の中身が前回と同じなら、同じ通知をもう一度しないために止める」

という意味。

ポイント:

- signature は JSON.stringify(errors) で作った比較用の文字列
- prevErrorSignatureRef.current は前回のエラー内容を覚えている
- 同じなら return で処理終了
- 役割は 同じエラー通知の繰り返し防止

#### 2. なぜ errors ではなく signature を保存するのか

errors はオブジェクトなので、そのまま === で比べても
「中身が同じか」ではなく「同じオブジェクトか」を見てしまう。

そのため、

const signature = JSON.stringify(errors);

で文字列にして、中身ベースで比較しやすくしている。

整理:

- errors -> オブジェクト
- signature -> 比較しやすい文字列
- 前者は比較しにくい
- 後者は比較しやすい

#### 3. ref で持って、state で持たない理由

prevErrorSignatureRef.current は、

- 画面に表示しない
- 前回値を覚えるだけ
- 変わっても再描画は不要

なので state ではなく ref を使う。

理由:

- state にすると更新時に再描画が起きる
- 今回は UI に見せる値ではない
- ただ比較用に覚えておきたいだけ

つまり、

- 表示用の値 -> state
- 比較用・メモ用の値 -> ref

という使い分けを確認した。

#### 4. errors が空のとき "{}" になる理由

errors が空のときは空オブジェクト。

{}

これを

JSON.stringify(errors)

すると

"{}"

になる。

流れ:

- errors が空
- signature = "{}"
- 前回も "{}" なら return

つまり、

空エラー状態が続いているだけなら、同じ通知を何度もしない

という仕組み。

#### 5. useEffect の流れ

useEffect(() => {
const signature = JSON.stringify(errors);
if (signature === prevErrorSignatureRef.current) return;
prevErrorSignatureRef.current = signature;
if (onErrorsChange) onErrorsChange(errors);
}, [errors, onErrorsChange]);

この処理の順番は、

- 今の errors を文字列にする
- 前回と同じか比較する
- 違うなら ref に保存する
- 親へ errors を渡す

大事な理解:

比較 -> 保存 -> 親に通知

であって、いきなり親へ渡しているわけではない。

#### 6. なぜ先に保存してから親へ通知するのか

prevErrorSignatureRef.current = signature;
if (onErrorsChange) onErrorsChange(errors);

この順番にすることで、親の setState による再描画が起きても、次回は

「もう同じ内容は保存済み」

と判定しやすくなる。

今日の理解:

- 先に親へ通知すると、同じ内容でも無駄な更新につながりやすい
- 親の state 更新 -> 再描画 -> effect 再実行 の流れがあり得る
- だから 先に ref に記録しておく のがよい

#### 7. if (onErrorsChange) onErrorsChange(errors); の理解

これは

「onErrorsChange が渡されているときだけ実行する」

という意味。

ポイント:

- if の条件は onErrorsChange
- 関数が渡されていれば truthy
- 渡されていなければ undefined で falsy
- そのため安全に呼べる

#### 8. truthy / falsy の理解

falsy の代表:

- false
- 0
- ""
- null
- undefined
- NaN

truthy の代表:

- "hello"
- 1
- []
- {}
- 関数

今回のコードでは、

- onErrorsChange が関数なら truthy
- undefined なら falsy

だから

if (onErrorsChange)

で「その関数ある？」を確認できる。

#### 9. if と ?. の使い分け

ただ「あれば呼ぶだけ」:
onErrorsChange?.(errors);

前後に処理がある:
if (onErrorsChange) {
prevErrorSignatureRef.current = signature;
onErrorsChange(errors);
}

今日の整理:

- 1行で安全に呼ぶだけ -> ?.
- 複数の処理をまとめたい -> if

#### 10. Router の復習に戻った

Router では、

今どの画面かは activeView ではなく URL が表す

ことを確認した。

例:

- / -> 患者一覧
- /patient/:id -> 患者ページ
- /patient/:id/vitals -> バイタル一覧
- /patient/:id/records -> 看護記録一覧

大事な考え方:

- BrowserRouter は main.jsx に1回だけ置く
- App.jsx では <Routes> と <Route> を書く
- :id は変わる値が入る場所
- useParams() で id を取り出す
- patients.find(...) で患者を探す

つまり、

選択中の患者を state に持つより、URL の id から探す

という考え方を再確認した。

#### 11. 今日解決したエラー

エラー内容はこれだった。

TypeError: console.tabele is not a function

原因:

console.table と書くべきところを
console.tabele とスペルミスしていた。

結果:

- PatientDetail.jsx 内で例外が発生
- React が An error occurred in the <PatientDetail> component. と追加で警告を出していた

学び:

- まず見るべきは 最初の1行
- どのファイルの何行目か
- 何が not a function なのか

今回は
PatientDetail.jsx:75 と console.tabele is not a function
が本体だった。

### 今日の大事な理解を一言でまとめると

エラー比較:

- errors はそのままだと比較しにくい
- JSON.stringify(errors) で比較用文字列にする
- 前回と同じなら通知しない
- 前回値は ref で持つ

関数呼び出し:

- if (onErrorsChange) は「その関数ある？」の確認
- ?. は「あれば呼ぶ」の短い書き方

Router:

- どの画面かは state ではなく URL
- どの患者かは URL の id
- useParams() で受け取って find() する

## 2026-04-11

### 学習ログまとめ

今日は React Router の続きを進めて、URL と画面表示のつながりをかなり整理できました。

#### 今日のテーマ

React Router で、

- URL で患者を区別する
- そのURLに合う画面を表示する
- URL から患者IDを取り出して、患者1人と記録一覧を作る

ことを理解しました。

#### 1. React Router の役割分担

- main.jsx に BrowserRouter を置く
- App.jsx に Routes と Route を書く
- 各ページで useParams() や useNavigate() を使う

整理すると、

| Hook / コンポーネント | 役割                                   |
| --------------------- | -------------------------------------- |
| BrowserRouter         | アプリ全体で Router を使えるようにする |
| Route                 | URL ごとに表示する画面を決める         |
| useParams()           | URL の id を取り出す                   |
| useNavigate()         | コードから画面遷移する                 |

#### 2. URL と画面の対応

例:

- / -> 患者一覧
- /patient/:id -> 患者ページ
- /patient/:id/vitals -> バイタル一覧
- /patient/:id/records -> 看護記録一覧

つまり

- :id -> どの患者か
- vitals / records -> どの画面か

という意味。

#### 3. useParams() で id を取る

`js
const { id } = useParams();
`

これは URL の :id を取り出す書き方。

たとえば /patient/5/vitals なら、id は "5"。

大事なポイント:

useParams() で取れる値は文字列。

#### 4. find() と filter() の違い

`js
const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);
`

| 関数     | 意味                         |
| -------- | ---------------------------- |
| find()   | 条件に合うものを1つ取り出す  |
| filter() | 条件に合うものを全部取り出す |

- patient -> 今の患者1人
- patientRecords -> その患者に関係ある記録一覧

#### 5. r.id と r.patientId の違い

- r.id -> 記録そのもののID
- r.patientId -> その記録がどの患者のものかを表すID

記録一覧を患者ごとに絞るときは、

`js
String(r.patientId) === id
`

と書く。

#### 6. props の受け渡し

`jsx
<PatientCard patient={patient} records={patientRecords} />
`

- 左 -> 子で受け取る名前
- 右 -> 親が持っている変数

#### 7. 配列の扱い

- patient は患者1人なので patient.name のように使う
- patientRecords は配列

`jsx

<p>記録数: {patientRecords.length}</p>
`

一覧表示:

`jsx
patientRecords.map((r) => ...)
`

#### 8. map() の意味

`jsx
{patientRecords.map((r) => (

  <tr key={r.id}>
    <td>{r.date}</td>
  </tr>
))}
`

- patientRecords の中身を1件ずつ取り出す
- r は1件分の記録
- その1件を <tr> 1行に変換する

#### 9. key={r.id} の意味

`jsx

<tr key={r.id}>
`

React に各行を区別させるために必要。

#### 10. ?. の意味

`js
r.vitals?.T
`

- vitals があれば T を読む
- vitals がなければエラーになりにくくする

#### 11. 分割代入

`js
const { T, P, R, SBP, DBP, SPO2 } = r.vitals ?? {};
`

r.vitals の中の値を取り出して、短く使いやすくする書き方。

#### 12. 血圧表示の整形

`js
const bpText = formatBpText(SBP, DBP);
const bpDisplay = bpText === "--" ? "--" : ${bpText}mmHg;
`

- formatBpText(SBP, DBP) -> 血圧を見やすく整える
- 三項演算子 ? : -> 条件によって表示を切り替える

#### 13. navigate() の役割

`js
const navigate = useNavigate();
navigate(/patient//vitals);
`

コードの中で URL を変えて画面遷移するためのもの。

流れ:

`navigate() で URL が変わる
↓
Route がその URL に合う画面を表示する`

#### 今日できたこと

PatientVitals の形をかなり読めるようになりました。

`jsx
export default function PatientVitals({ patients, records = [] }) {
const { id } = useParams();

const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);

if (!patient) return <div>患者が見つかりません</div>;

return (

<div>
<p>{patient.room}号室 {patient.name} さん</p>
<p>記録数: {patientRecords.length}</p>
<table>
<tbody>
{patientRecords.map((r) => (
<tr key={r.id}>
<td>{r.date}</td>
<td>{r.vitals?.T}</td>
</tr>
))}
</tbody>
</table>
</div>
);
}
`

### 今日の大事な一言まとめ

- id は URL から取る
- patient は1人
- patientRecords は配列
- 画面遷移は navigate()
- URLに合う画面表示は Route

### 次回の再開ポイント

useNavigate() を使ったボタン遷移の整理と、PatientPage / PatientVitals / NursingRecordList を実際のコードとしてつなぐ。

特にこの確認から始める予定。

`jsx
const navigate = useNavigate();

<button onClick={() => navigate(/patient//records)}>
看護記録
</button>
`

このボタンを押すと、その患者の看護記録一覧ページに移動する、という流れの続きから。

## 2026-04-12

### 学習ログ

#### 1. Router 化で患者を決める方法が変わった

前は selectedPatientId で「今どの患者を見ているか」を管理していた。
でも今は Router を使っているので、患者は URL の id で決まるようになった。

例:

`js
const { id } = useParams();
`

つまり、

- 前 -> state で患者を覚える
- 今 -> URL で患者を決める

になった。

#### 2. addRecord は selectedPatientId ではなく patientId を使う形に変更した

前は selectedPatientId が null だと追加できなかった。
今は NursingRecordList から id を渡しているので、addRecord は引数の patientId を使えばよい形になった。

完成形:

`js
const addRecord = async (record, patientId) => {
const recordToAdd = {
...record,
patientId,
id: Date.now(),
};

const nextRecords = [...appData.records, recordToAdd];
await onSaveData({
patients: appData.patients,
records: nextRecords,
});
};
`

学んだこと:

- 一覧表示では patientId を読む
- 新規追加では patientId を渡す

#### 3. NursingRecordList を Router 前提に整理した

NursingRecordList で useParams() を使い、今の患者の記録だけを表示する形にした。

`js
const { id } = useParams();
const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);
`

さらに追加処理も、

`js
const handleSubmit = async (data) => {
  await addRecord(data, id);
  setIsAdding(false);
  setFormData(createEmptyRecord());
};
`

にして、保存が終わってからフォームを閉じる形にした。

#### 4. NursingRecordItem を recordId で開く形にした

詳細画面では props で record を直接もらうのではなく、URL の recordId から自分で探す形にした。

`js
const { id, recordId } = useParams();

const patient = patients.find((p) => String(p.id) === id);
const record = records.find(
(r) => String(r.id) === recordId && String(r.patientId) === id
);
`

学んだこと:

- find -> 1件探す
- filter -> 条件に合うもの全部を集める

#### 5. selectedPatientId は今の設計では不要になった

PatientList.jsx を見直した結果、もう selectedPatientId を使っていなかった。
そのため App.jsx からも消せた。

消したもの:

- const [selectedPatientId, setSelectedPatientId] = useState(null);
- PatientList に渡していた selectedPatientId 系 props
- deletePatient の中の setSelectedPatientId(null)

学んだこと:

患者を覚える役割が state から URL に移った。

#### 6. PatientList の props を整理した

PatientList は今使っている props だけ受け取る形に整理した。

`js
export default function PatientList({
  onErrorsChange,
  onSaveData,
  patients,
  records,
  isLoading,
  apiError,
})
`

App.jsx 側の / route も、それに合わせて整理した。

#### 7. 患者ページの構成を見直した

最初は PatientPage の中に PatientCard を常に置いていたので、

- /patient/:id/detail
- /patient/:id/vitals
- /patient/:id/records

でもメニュー画面が残っていた。

そこで構成を変更した。

PatientPage.jsx:

`jsx
import { Outlet } from "react-router-dom";

export default function PatientPage() {
return <Outlet />;
}
`

PatientMenu.jsx:

`jsx
import { useParams } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientMenu({ patients, records, deletePatient }) {
const { id } = useParams();

const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);

if (!patient) return <div>患者が見つかりません</div>;

return (
<PatientCard
      patient={patient}
      records={patientRecords}
      onDelete={deletePatient}
    />
);
}
`

これで

- /patient/:id -> メニュー画面
- /patient/:id/detail -> 患者情報画面だけ
- /patient/:id/vitals -> バイタル画面だけ
- /patient/:id/records -> 看護記録画面だけ

という形に近づいた。

#### 8. App.jsx の nested route を整理した

PatientMenu を index route に置き、PatientDetail を detail route にした。

考え方:

- index -> 患者メニュー
- detail -> 患者情報
- vitals -> バイタル
- records -> 記録一覧
- records/:recordId -> 記録詳細

これで「患者情報をクリックした時だけ患者情報画面を出す」ための土台ができた。

#### 9. PatientCard のボタン遷移を整理した

PatientCard.jsx で各ボタンを Router に合わせた。

`js
onClick={() => navigate(/patient//detail)}
onClick={() => navigate(/patient//vitals)}
onClick={() => navigate(/patient//records)}
`

ここで大事だったのは、

navigate("/patient/:id")

はダメ、ということ。

理由:

:id は Route 定義で使う「箱」。
navigate() では実際の値が必要。

正しくは:

`js
navigate(/patient/)
`

学んだこと:

/ patient / :id は設計図、/patient/5 は実際の住所。

#### 10. DeleteButton の props 名も確認した

DeleteButton.jsx は今こうなっていた。

`jsx
export default function DeleteButton({ onClick }) {
  return (
    <button type="button" className="btn-danger" onClick={onClick}>
      削除
    </button>
  );
}
`

なので PatientCard.jsx 側の

`jsx
<DeleteButton onClick={() => onDelete(patient.id)} />
`

で合っていることを確認した。

### 今日の大事な理解

今日いちばん大事だったのはこれ。

1. Router 化すると、患者を決める中心は URL になる
   - 前 -> selectedPatientId
   - 今 -> useParams() の id

2. メニュー画面と詳細画面は別 route に分ける
   - /patient/:id -> メニュー
   - /patient/:id/detail -> 患者情報

3. :id は Route 定義の箱であって、実際の移動先ではない
   - Route: path="/patient/:id"
   - 移動: navigate(/patient/)

### 次回やること

次回はここから再開。

- PatientCard の 戻る ボタンをどうするか確認
- 実際に動かして、
  - 患者カードを押す -> メニュー画面
  - 患者情報を押す -> 患者情報画面だけ表示
    になっているか確認
- 必要なら PatientDetail / PatientVitals / NursingRecordList の戻り先を微調整

つまり今日は、

患者選択を state から URL ベースに切り替え、患者メニュー画面と患者情報画面を route で分ける形まで進めた日でした。

## 2026-04-13

### 学習ログ

#### 1. PatientPage の役割

PatientPage は

`jsx
return <Outlet />;
`

だけを書いた、親ルートの箱 だと確認できた。
自分で患者を探す部品ではなく、子ルートを表示する場所 になっている。

#### 2. PatientMenu の役割

PatientMenu は

- useParams() で id を読む
- patients.find(...) で患者を1人探す
- PatientCard に渡す

という、患者メニュー画面の入口 の役割だと整理できた。

つまり /patient/:id のときに、実際に患者を探しているのは PatientMenu。

#### 3. PatientCard の役割

PatientCard は、患者を探す部品ではなく、
渡された patient を表示する見た目の部品 だと理解できた。

- 患者情報へ進む
- バイタルへ進む
- 看護記録へ進む
- 一覧に戻る
- 削除する

というボタン表示を担当している。

つまり

- PatientMenu が探す
- PatientCard が表示する

という役割分担。

#### 4. props でデータを渡す流れ

PatientCard の patient は、自分で作っているのではなく、
PatientMenu から props で渡されている と理解できた。

`jsx
<PatientCard patient={patient} onDelete={deletePatient} />
`

この形で、見つけた患者データを子に渡している。

#### 5. 削除処理の流れ

削除の本体は PatientCard ではなく、App の deletePatient だと整理できた。

流れはこう。

`App が deletePatient を持つ
↓
PatientMenu に渡す
↓
PatientCard には onDelete という名前で渡す
↓
DeleteButton を押したら onDelete(patient.id) が動く`

つまり、削除処理の本体は親にあって、子はお願いしているだけ。

#### 6. onClick={() => ...} の意味

`jsx
onClick={() => onDelete(patient.id)}
`

の () => は、今すぐ実行せず、クリックした時だけ実行するため と理解できた。

もし

`jsx
onClick={onDelete(patient.id)}
`

と書くと、クリック前にその場で実行されてしまう。

#### 7. メニュー画面から戻れなかった理由

前は

`js
navigate(/patient/)
`

になっていたので、メニュー画面にいる時に押しても同じ場所に戻るだけだった。

そこを

`js
navigate("/")
`

にしたことで、一覧に戻れる ようになった。

#### 8. setPatients と setRecords の今の状態

App.jsx にある

`js
const setPatients = ...
const setRecords = ...
`

は、今のコードでは未使用 と確認できた（→ 削除済み）。
今の更新の中心は onSaveData({ patients, records }) になっている。

### 今日の理解のポイント

今日いちばん大事だったのは、

- 親ルートの箱
- 患者を探す部品
- 表示する部品
- 削除の本体を持つ部品

を分けて考えられるようになったこと。

| 部品        | 役割                               |
| ----------- | ---------------------------------- |
| PatientPage | 親ルートの箱（Outlet を返すだけ）  |
| PatientMenu | useParams で id を読み、患者を探す |
| PatientCard | 渡された patient を表示する        |
| App         | deletePatient など処理の本体を持つ |

今日は、React Router の役割分担と props の流れ、削除処理のつながり を整理できた日だった。

### 明日の再開ポイント

PatientDetail / PatientVitals / NursingRecordList でも同じように「誰が id を読み、誰が表示しているか」をそろえて見ると、理解がさらに深まる。

## 2026-04-14

### 学習ログ

#### テーマ

React Routerで、誰が id を読み、誰がデータを準備し、誰が表示するのか を整理した。
あわせて、看護記録追加時の patient.id と patientId の関係 を理解した。

#### 1. 今日理解したこと

##### ① PatientPage の役割

PatientPage は、患者ページ全体のデータ準備係。
URL から id を読み、

- patient を探す
- patientRecords を集める
- Outlet context で子に渡す

という役割を持つ。

つまり、どの患者のページか決めるのは PatientPage の仕事 だと理解した。

##### ② PatientDetail / PatientVitals / NursingRecordList の役割

子コンポーネントは、親が渡したデータを受け取って、それぞれの画面の表示や操作を担当する 形に整理できた。

- PatientDetail -> 患者情報の表示・編集
- PatientVitals -> バイタル一覧の表示
- NursingRecordList -> 看護記録一覧の表示・追加操作

つまり、親がデータをそろえ、子が表示や画面操作をする という設計が見えてきた。

##### ③ useOutletContext() の意味

useOutletContext() を使うと、PatientPage が渡した

- patient
- patientRecords

を子で受け取れる。

これによって、子コンポーネント側で毎回

`js
const { id } = useParams();
const patient = patients.find(...);
const patientRecords = records.filter(...);
`

を書かなくてよくなる。

つまり、共通のデータ準備を親に集めることで、子の役割が見やすくなる と理解した。

##### ④ PatientVitals がかなり整理できた

PatientVitals は最終的に、

- useParams() を使わない
- patient と patientRecords を useOutletContext() で受け取る
- 表示と画面遷移だけを担当する

形に近づいた。

また、戻るボタンなどは id ではなく patient.id を使って書けると理解した。

つまり、PatientVitals はかなりきれいな表示専用コンポーネントに近づいた。

##### ⑤ NursingRecordList の役割

NursingRecordList も、

- patient
- patientRecords

を親から受け取り、

- 一覧を表示する
- 記録追加フォームを開く
- addRecord を呼ぶ

という役割に整理できた。

ここで持っている

- isAdding
- formData

は、患者データそのものではなく画面の中だけで使うUI用の state だと理解した。

つまり、これはデータの分裂ではなく、画面の状態管理 だと整理できた。

#### 2. 今日いちばん大事だった理解

##### patientId と patient.id の違い

ここが今日の大きな学びだった。

`js
const addRecord = async (record, patientId) => {
`

この patientId は、関数の引数名（箱の名前）。

一方で、

`js
addRecord(data, patient.id)
`

の patient.id は、今見ている患者の実際のID。

つまり、

- patientId -> 箱の名前
- patient.id -> その箱に入れる本物の値

という関係だと理解した。

##### なぜ patient.id を渡すのか

新しい看護記録には、

「この記録は誰のものか」

を入れる必要があるから。

たとえば、フォーム入力だけの data にはまだ患者情報がない。
そこで

`js
addRecord(data, patient.id)
`

とすることで、関数の中で

`js
{
  ...record,
  patientId,
  id: Date.now(),
}
`

という形の新しい記録が作れる。

つまり、patient.id を渡すのは、記録に「誰の記録か」を付けるため だと理解できた。

#### 3. コードの整理で分かったこと

##### PatientDetail で注意する点

PatientDetail では useParams() を消したあとに、

`js
navigate(/patient/)
`

のままだとエラーになる。
この場合は

`js
navigate(/patient/)
`

に直す必要がある。

また、部屋番号の重複チェックでは、編集している本人を除外するために

`js
extractUsedRoomNumbers(patients, patient?.id)
`

とする必要があると分かった。

つまり、親から patient を受け取る設計にしたら、id も patient.id から使う方向にそろえる のが大事だと分かった。

#### 4. 今日の理解をひとことで言うと

PatientPage がデータ準備係、子コンポーネントが表示・操作係 という形がかなり見えてきた。

さらに、patient.id を addRecord に渡すことで、新しい記録に patientId を付けて患者と記録をつなげる ことも理解できた。

#### 5. 次回やること

- PatientDetail / PatientVitals / NursingRecordList を今の設計で最終確認する
- PatientPage 側の Outlet context の流れをもう一度復習する
- addRecord と updatePatient の流れを、App側の責任として整理する

## 2026-04-15

### 今日やったこと

- PatientDetail / PatientVitals / NursingRecordList / NursingRecordItem の役割を整理
- PatientPage の Outlet context の流れを復習
- addRecord / updatePatient / updateRecord / deleteRecord を App 側の責任として整理
- records と records/:recordId のルーティングを兄弟ルートで整理

---

### 学んだこと

#### 1. PatientPage の役割

PatientPage は URL の :id を使って、今表示する患者1人分のデータを作る場所。

作っているもの：

- patient
- patientRecords
- usedRoomsForEdit

そして必要な関数と一緒に Outlet context で子に渡す。

**つまり、PatientPage は患者ページ全体の中継地点。**

---

#### 2. Outlet context の流れ

流れはこう。

1. App が全体データと更新関数を持つ
2. PatientPage が今の患者用のデータを作る
3. 子コンポーネントが useOutletContext() で受け取る

これで子側で毎回 useParams() や find/filter をしなくてよくなる。

**つまり、探す仕事を PatientPage に集めて、子は表示と操作に集中する。**

---

#### 3. PatientDetail

PatientDetail は patient / updatePatient / usedRoomsForEdit を useOutletContext() で受け取る形に整理した。

isEditing は患者データではなく UI 状態なので、PatientDetail の中で持ってよい。

保存時は

`js
const updated = { ...patient, ...data };
await updatePatient(updated);
`

とする。

**つまり、PatientDetail は患者情報の表示と編集UI担当。**

---

#### 4. PatientVitals

PatientVitals は

`js
const { patient, patientRecords } = useOutletContext();
`

で受け取る形に整理した。

自分で患者を探したり記録を絞り込んだりせず、受け取った patientRecords を表示する。

**つまり、PatientVitals は表示担当。**

---

#### 5. NursingRecordList

NursingRecordList も

`js
const { patient, patientRecords, addRecord } = useOutletContext();
`

の形に寄せた。

記録追加では

`js
await addRecord(data, patient.id);
`

のように、

- data = 記録内容
- patient.id = この患者のID

を渡す必要があると確認した。

**つまり、NursingRecordList は記録一覧表示と新規追加担当。**

---

#### 6. NursingRecordItem

patientRecords は配列なので、そのまま1件の記録としては使えない。

そのため

`js
const { recordId } = useParams();
const record = patientRecords.find((r) => String(r.id) === recordId);
`

として、配列の中から1件取り出す必要があると理解した。

ここで分かったこと：

- PatientPage は患者単位まで選ぶ
- NursingRecordItem はその患者の記録一覧の中から1件を選ぶ
- だから
  recordId を読むために useParams() が必要。

**つまり、NursingRecordItem は1件の記録の表示・編集・削除担当。**

---

#### App 側の責任

- addRecord
- updatePatient
- updateRecord
- deleteRecord

はすべて App 側で全体配列を更新する責任を持つ。

子コンポーネントは、入力を受け取って App の関数を呼ぶだけ。

**つまり、子はお願いする側、本当の更新処理は App が持つ。**

---

#### ルーティング

今日は記録一覧と記録詳細を兄弟ルートで整理した。

`jsx
<Route path="records" element={<NursingRecordList onErrorsChange={setGlobalErrors} />} />
<Route path="records/:recordId" element={<NursingRecordItem onErrorsChange={setGlobalErrors} />} />
`

この形にした理由は、

- records は一覧画面
- records/:recordId は詳細画面

として分けた方が今の設計に合っていてわかりやすいから。

---

### 今日つまずいたところ

- PatientPage に props を渡しておらず、patients.find(...) でエラーになった
- usedRoomsForEdit を context でもらうのに、同じ名前で再定義しようとした
- record = record.find(...) と書いてしまった
- DeleteButton の prop 名は onClick に合わせる必要があった

---

### 今日の一番大事な理解

- App = 全体データを持って更新する親
- PatientPage = 今の患者ページ用に仕分けして渡す中継地点
- 各子コンポーネント = 受け取って表示・操作する担当

**つまり、探す仕事は PatientPage、更新の本体は App、表示と入力は子コンポーネント。**

---

### 次回やること

- PatientPage の Outlet context に updateRecord / deleteRecord を含める最終確認
- App.jsx 側の props を減らして Outlet context に統一する
- 患者ページまわりの完成コードを最終確認する

**つまり、今日は患者ページまわりの役割分担とデータの流れをかなり整理できた日だった。**

## 2026-04-16

### 1. 今日やったこと

- PatientPage を親にして、Outlet context で子ルートへ値を渡す設計を確認した
- updateRecord / deleteRecord を Outlet context に含めてよいか整理した
- PatientMenu を残すかどうか整理した
- PatientMenu で useOutletContext() を使ったときのエラー原因を確認した
- PatientMenu から患者削除したあとに患者一覧へ戻る処理を整理した
- PatientCard に渡す props 名のズレによるエラーを修正した

---

### 2. 今日の理解ポイント

#### ① Outlet context は「親の Outlet の子ルート」で使う

useOutletContext() はどこでも使えるわけではない。

使えるのは、

- 親コンポーネントで <Outlet context={...} /> を書いていて
- その Outlet の子ルートとして描画されたコンポーネント

だけ。

今回なら、

- 親: PatientPage
- 子: PatientMenu, PatientDetail, PatientVitals, NursingRecordList, NursingRecordItem

という関係が必要。

---

#### ② エラーの原因

出ていたエラー:

`js
Cannot destructure property 'patient' of 'useOutletContext(...)' as it is null.
`

原因は、PatientMenu が PatientPage の子ルートではなく、外に置かれていたこと。

ダメだった形

`jsx
<Route index element={<PatientMenu ... />} />
<Route path="/patient/:id" element={<PatientPage ... />} />
`

これだと PatientMenu は PatientPage の <Outlet /> の子ではないので、
useOutletContext() が null になる。

正しい形

`jsx
<Route path="/patient/:id" element={<PatientPage ... />}>
  <Route index element={<PatientMenu />} />
  <Route path="detail" element={<PatientDetail />} />
  <Route path="vitals" element={<PatientVitals />} />
  <Route path="records" element={<NursingRecordList />} />
  <Route path="records/:recordId" element={<NursingRecordItem />} />
</Route>
`

---

#### ③ PatientMenu はあってよい

「患者情報」「バイタル」「看護記録」などを選ぶ最初の画面として、
PatientMenu を置く設計は自然。

整理すると役割はこうなる。

- PatientPage:
  URL の id を見て患者データを探す
  Outlet context で子に値を渡す親
- PatientMenu:
  /patient/:id で最初に見せるメニュー画面
- PatientDetail / PatientVitals / NursingRecordList / NursingRecordItem:
  各詳細画面

---

#### ④ Outlet context に入れるもの

PatientPage でまとめて渡すものは、患者ページ配下で使うもの。

今回の形では次を入れる想定で整理した。

`js
{
  patient,
  patientRecords,
  updatePatient,
  addRecord,
  updateRecord,
  deleteRecord,
  deletePatient,
  usedRoomsForEdit,
}
`

特に今日確認したこと:

- updateRecord / deleteRecord を Outlet context に入れてよい
- PatientMenu で削除も使うので deletePatient も入れる必要がある

---

#### ⑤ PatientMenu の実装

最終的に PatientMenu は useOutletContext() で受け取る形にした。

`jsx
import { useOutletContext, useNavigate } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientMenu() {
const navigate = useNavigate();
const { patient, deletePatient } = useOutletContext();

if (!patient) return <div>患者が見つかりません</div>;

const handleDelete = async (id) => {
await deletePatient(id);
navigate("/");
};

return (
<div>
<PatientCard patient={patient} onDelete={handleDelete} />
</div>
);
}
`

---

#### ⑥ props 名のズレで出たエラー

出ていたエラー:

`js
PatientCard.jsx:48 Uncaught TypeError: onDelete is not a function
`

原因は、PatientCard 側は onDelete を受け取る前提なのに、
PatientMenu 側で onClick={handleDelete} を渡していたこと。

ダメだった形

`jsx
<PatientCard patient={patient} onClick={handleDelete} />
`

正しい形

`jsx
<PatientCard patient={patient} onDelete={handleDelete} />
`

つまり、

- 渡す側の props 名
- 受け取る側の props 名

は一致させる必要があると理解した。

---

#### ⑦ 削除後の遷移先

最初は削除後に

`js
navigate(/patient/)
`

としていたが、これは削除済みの患者ページへ戻ろうとしてしまうので不自然。

削除後は患者がもう存在しないため、患者一覧へ戻す。

`js
navigate("/")
`

---

### 3. 今日の重要な学び

- useOutletContext() は「親の Outlet の子」でしか使えない
- ルートの入れ子構造がとても重要
- PatientMenu は必要なら残してよい
- ただし PatientMenu も Outlet context で統一する
- props の名前がズレると is not a function エラーになる
- 削除後は存在しないページではなく一覧へ戻す

---

### 4. 今の設計の整理

親:

- App.jsx
- PatientPage.jsx

患者ページ配下:

- PatientMenu.jsx
- PatientDetail.jsx
- PatientVitals.jsx
- NursingRecordList.jsx
- NursingRecordItem.jsx

データの流れ:

- App.jsx がデータと更新関数を持つ
- PatientPage.jsx が patient と patientRecords を作る
- PatientPage.jsx が Outlet context で子に渡す
- 子画面は useOutletContext() で受け取る

---

### 5. 次回やること

- App.jsx の patient まわりの route を最終完成形で整える
- PatientPage.jsx の Outlet context を最終確認する
- PatientMenu / PatientDetail / PatientVitals / NursingRecordList / NursingRecordItem の受け取り方を統一確認する
- 必要なら PatientCard の役割をもう一度整理する

---

### 6. 一言まとめ

今日は

「PatientMenu を PatientPage の子ルートに置き、Outlet context で統一して使う」

ことが一番大きな学びだった。

また、

- useOutletContext() は親子関係が正しくないと使えない
- props 名のズレがエラー原因になる

ことも整理できた。

## 2026-04-18 学習ログ（PatientPage・schema・Hook の順番を整理）

### 1. 今日やったこと

- `PatientPage` の役割を整理した
- `PatientMenu / PatientVitals / NursingRecordList / NursingRecordItem / PatientDetail` の受け取り方を確認した
- `useOutletContext()` でデータを受け取る形を統一していることを確認した
- `usedRoomsForEdit` をなぜ `PatientPage` で作るのか整理した
- `schema.js` をなぜ分けているのか整理した
- `runPatientValidationCases()` と `safeParse()` の意味を確認した
- 患者情報画面でコンソールが2回出る理由を確認した

### 2. 設計の理解

#### PatientPage の役割

`PatientPage` は、今開いている患者ページ専用のデータを作って、子コンポーネントに渡す中継所。

```jsx
const { id } = useParams();
const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);
```

ここで、

- 今の患者 (`patient`)
- その患者の記録一覧 (`patientRecords`)

を作っている。

さらに Outlet context で子に渡している。

```jsx
<Outlet
  context={{
    patient,
    patientRecords,
    updatePatient,
    addRecord,
    updateRecord,
    deleteRecord,
    deletePatient,
    usedRoomsForEdit,
  }}
/>
```

#### 受け取り方の統一

患者ページ配下の子コンポーネントは、基本的に `useOutletContext()` で受け取る。

- `PatientMenu`
- `PatientDetail`
- `PatientVitals`
- `NursingRecordList`
- `NursingRecordItem`

`recordId` のように URL で決まる値だけ `useParams()` を使う。

### 3. Hook の順番の理解

React の Hook は、名前ではなく順番で覚えられていると考える。

#### 問題になる形

```jsx
const record = patientRecords.find((r) => String(r.id) === recordId);

if (!record) return <div>記録が見つかりません</div>;

const initialValues = useMemo(() => {
  return {
    date: record?.date || "",
    vitals: record?.vitals || {},
    content: record?.content || "",
    author: record?.author || "",
  };
}, [record]);
```

この形だと、

- `record` がない時 -> `useMemo` まで行かない
- `record` がある時 -> `useMemo` まで行く

となり、呼ばれる Hook の数・順番が変わる可能性がある。

#### 直し方

Hook は `return` より前に置く。

```jsx
const record = patientRecords.find((r) => String(r.id) === recordId);

const initialValues = useMemo(() => {
  return {
    date: record?.date || "",
    vitals: record?.vitals || {},
    content: record?.content || "",
    author: record?.author || "",
  };
}, [record]);

if (!patient) return <div>患者が見つかりません</div>;
if (!record) return <div>記録が見つかりません</div>;
```

#### 今日の理解

- Hook は毎回同じ順番で呼ばれる必要がある
- `if (...) return` の後ろに Hook を置くと危ないことがある

### 4. usedRoomsForEdit を PatientPage に置く理由

```js
const usedRoomsForEdit = extractUsedRoomNumbers(patients, patient.id);
```

これは、今選択している患者本人を除いた使用中の部屋番号一覧を作っている。

例:

- 田中 101号室
- 佐藤 102号室
- 鈴木 103号室

佐藤さんを編集している時は、結果は `[101, 103]` になるイメージ。

#### なぜ App ではなく PatientPage なのか

`App` は全体管理の場所で、まだ「今どの患者を見ているか」の責任を深く持たせないほうが自然。

`PatientPage` はすでに

```js
const { id } = useParams();
const patient = patients.find(...);
```

で今の患者を特定しているので、その流れで

- 今の患者を除外した部屋一覧
- その患者専用の値

を作るのが自然。

#### 今日の理解

- `usedRoomsForEdit` は全体用ではなく「今の患者専用の値」
- だから `PatientPage` に置くほうが役割に合っている

### 5. schema.js を分ける理由

結論: `schema.js` にしないといけないという Zod の決まりはない。`jsx` に書くこともできる。

でも分けている理由は、見た目 (UI) と入力ルールを分けるため。

#### 今の役割分担

- `PatientDetail.jsx` -> 画面表示、フォーム操作
- `schema.js` -> バリデーションルール、確認用ロジック

schema 側にあるもの:

- `optionalNumber`
- `makePatientSchemaPartial`
- `createPatientValidationCases`
- `runPatientValidationCases`
- `recordSchema`

これらは全部、見た目ではなくルールや確認用のロジック。

#### 今日の理解

- schema は UI ではなく入力チェックのルール
- `.js` に分けるのは整理しやすく、再利用やテストもしやすい

### 6. runPatientValidationCases() の意味

`runPatientValidationCases()` は、schema が正しく動くかを確認するための採点処理。

イメージ:

- `makePatientSchemaPartial` = 採点ルール
- `createPatientValidationCases` = 問題集
- `runPatientValidationCases` = 採点する先生

やっていること:

```js
const schema = makePatientSchemaPartial(testCase.usedRooms);
const result = schema.safeParse(testCase.input);
```

- テストケースごとに schema を作る
- 入力をチェックする
- `valid / invalid` を確認する

### 7. safeParse() の理解

`safeParse()` は、入力が schema に合っているかを安全に採点するもの。

成功時:

```js
{ success: true, data: ... }
```

失敗時:

```js
{ success: false, error: ... }
```

`duplicate-room` の例:

- `usedRooms = [101, 102]`
- 入力 `room = "101"`

まず `optionalNumber()` の `transform` で `"101"` が `101` に変換される。

その後 `superRefine()` で

```js
if (usedRooms.includes(data.room)) {
  ctx.addIssue({
    path: ["room"],
    message: "この部屋番号は既に使用されています",
  });
}
```

が走る。

結果として:

- `room` にエラーがつく
- `success: false` になる

#### 今日の理解

- `safeParse()` は「変換 + チェック + 結果を返す」
- 例外で止めるというより、成功/失敗を返して確認しやすい

### 8. 患者情報クリック時にコンソールが2回出る理由

患者情報画面に入った時、`PatientDetail.jsx` の次の処理が動いている。

```jsx
useEffect(() => {
  if (!import.meta.env.DEV) return;
  const results = runPatientValidationCases();
  console.table(results);
}, []);
```

#### 直接の原因

- `console.table(results)` が表示している

#### 2回見える理由

開発環境 + `StrictMode` の影響で、`useEffect` が確認のために2回実行されることがあるため。

#### 今日の理解

- 2回表示されるのは Zod の仕様ではない
- schema が勝手に2回表示しているわけでもない
- `useEffect` の中で `console.table()` していて、それが開発中に2回見えている

### 9. 今日の大事な理解まとめ

- `PatientPage` は今の患者専用データを作る中継所
- 子コンポーネントは `useOutletContext()` で受け取る
- Hook は毎回同じ順番で呼ばれる必要がある
- `usedRoomsForEdit` は「今の患者本人を除いた使用部屋一覧」
- schema は UI ではなく入力ルール
- `runPatientValidationCases()` は schema の確認用
- `safeParse()` は安全に採点して成功/失敗を返す
- コンソール2回表示は `useEffect + StrictMode` の影響

### 10. 次回やること

- `optionalNumber()` の `.transform()` が2回ある理由を理解する
- `recordSchema` の見方も患者 schema と同じ考え方で整理する
- 必要なら `NursingRecordItem` の Hook の置き場所を最終確認する
- schema と form のつながりをもう一段深く整理する
