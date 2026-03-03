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
