# Dev Log

## 2026-02-17

### 今日の学び

1. Reactでは、親コンポ�Eネントが state 更新関数を子へ渡すことで、子から親へ状態変更を通知できる仕絁E��を理解した、E

2. 重褁E��屋番号チェチE��では、新規追加と編雁E��判定が異なる。編雁E��は自己重褁E��防ぐため、編雁E��の患老EDを除外する忁E��があると琁E��した、E

### 次のアクション

- 正常入劁E/ 重褁E��屁E/ 忁E��未入劁Eの3ケース検証
- 通信処琁E�E離に進むか判断

## 2026-02-22

### 学習ログ�E�Eeact-hook-form / エラー管琁E�E琁E���E�E

#### 1. handleSubmit / data / patient の関俁E

- `handleSubmit` は自刁E�E関数ではなぁE`react-hook-form` が提供する送信管琁E��数、E
- 送信時にフォーム入力を収集し、Zod 検証 OK のときだぁE`data` を渡してくる、E
- `patient` は親コンポ�Eネントから渡された「�Eの患老E��ータ�E�編雁E���E�」、E
- `data` はフォームに入力した値�E�編雁E���E変更部刁E��、E

```js
const updated = { ...patient, ...data };
```

これは「�Eの患老E��報に、変更した部刁E��け上書きした新しい患老E��ブジェクト」を作ってぁE��、E

※頁E��が重要E

- `{ ...data, ...patient }` にすると、古ぁE��報で上書きされ更新が反映されなぁE��E

#### 2. patients と selectedPatient の違い

Reactでは一覧用の state と表示用の state は別管琁E��なる、E

- `patients` は患老E��覧を描画するためのチE�Eタ�E��E体管琁E��E
- `selectedPatient` は画面に表示・編雁E��てぁE��1人の患老E

一覧を書き換えるだけでは、画面表示中の患老E�E更新されなぁE��E

```js
setSelectedPatient(updated);
```

これは「表示してぁE��患老E�E惁E��を新しいチE�Eタに差し替える」ために忁E��、E

#### 3. defaultValues と reset

- `defaultValues` は `useForm` 初回実行時に1度だけ読み込まれる初期値、E
- `selectedPatient` が変わってもフォームは自動更新されなぁE��E

そ�Eため患老E��刁E��替えた時�E�E�E

```js
useEffect(() => {
  reset(patient);
}, [patient, reset]);
```

- `reset` はフォーム冁E�� state を新しい患老E��ータで作り直す操作、E

#### 4. mode と reValidateMode

```js
mode: "onSubmit",
reValidateMode: "onSubmit",
```

- 初回の検証: 保存�Eタン押下時のみ
- エラー後�E再検証: 保存�Eタン押下時のみ

入力中にエラーが増減しなぁE��ぁE��挙動を固定してぁE��、E

#### 5. clearErrors が忁E��な琁E��

- エラーは保存時に `errors` に入り、そのまま残ることがある、E
- 編雁E��亁E��保存�E功時には「エラーが無ぁE��態」に戻す忁E��がある、E

```js
clearErrors();
```

これは `react-hook-form` 冁E��のエラーを空にする処琁E��E

#### 6. onErrorsChange({}) が忁E��な琁E��

- フォームのエラーは親コンポ�Eネントにも渡してぁE��、E
- 子フォーム `errors` ↁE親の `globalErrors`

そ�Eため `clearErrors()` だけでは親のエラー表示が残る、E

```js
onErrorsChange({});
```

これは「親へ、エラーはもう無ぁE��通知する」�E琁E��E

#### 7. 3つの役割の整琁E��最重要理解�E�E

| 操佁E                | 役割                                       |
| -------------------- | ------------------------------------------ |
| `setSelectedPatient` | 表示する患老E��変更�E�Eeact の state�E�E      |
| `reset`              | フォーム入力値を変更�E�フォーム冁E�� state�E�E|
| `clearErrors`        | エラー状態を消す�E�Eerrors`�E�E              |

React の state と `react-hook-form` の state は別管琁E��あり、それぞれ個別に更新が忁E��になる、E

### 今日の学び�E�まとめE��E

- React の state とフォームの state は別物
- `defaultValues` は自動更新されなぁE
- `reset` でフォームを作り直す忁E��がある
- エラーは子と親の2箁E��に存在する
- `clearErrors` と `onErrorsChange` は役割が違ぁE

## 2026-02-24

### 学習ログ�E�責務�E離 / 通信処琁E�E刁E���E�E

#### 1. 責務�E離とは

責務�E離とは「役割ごとにコードを刁E��る設計」�Eこと、E

例：レストラン

- 受仁EↁE注斁E��受ける（画面 / React コンポ�Eネント！E
- 厨房 ↁE料理を作る�E�通信 / API 処琁E��E

Reactアプリでも同じで、UI�E�表示�E�と通信�E�Eetch�E�を同じファイルに書かなぁE��とが重要、E

#### 2. 刁E��前�E問題点�E�EatientList.jsxに全部書ぁE��ぁE��状態！E

以前�E `PatientList.jsx` に以下をすべて書ぁE��ぁE���E�E

- 画面描画
- state管琁E
- エラー表示
- fetch通信
- JSON変換
- HTTPスチE�Eタス判宁E

```js
const res = await fetch("http://localhost:3001/api/data");
const data = await res.json();
```

こ�E状態だと�E�E

- URL変更 ↁEUIファイル修正
- 保存方式変更 ↁEUIファイル修正
- エラー仕様変更 ↁEUIファイル修正

つまり、画面と通信が強く結合してぁE���E�寁E��合�E�状態だった、E

#### 3. 刁E��後�E構造

通信処琁E�� `patientApi.js` に移動、E

`patientApi.js`�E�通信拁E��！E

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

`PatientList.jsx`�E�画面拁E��！E

```js
try {
  const data = await fetchAppData();
  setPatients(Array.isArray(data.patients) ? data.patients : []);
  setRecords(Array.isArray(data.records) ? data.records : []);
} catch (e) {
  setApiError("APIから読み込めませんでした");
}
```

画面は「データを取得して表示する」だけになり、E��信の詳細�E�Eetch / method / headers / JSON�E��E一刁E��らなぁE��造になった、E

#### 4. response.ok と throw の役割

```js
if (!response.ok) {
  throw new Error(`API error:${response.status}`);
}
```

- fetch は 500 エラーでも�E功扱ぁE�� response を返す
- そ�Eため自刁E��失敗を throw する忁E��がある

これにより画面側は�E�E

- 成功 ↁEtry 冁E��処琁E
- 失敁EↁEcatch で表示

だけを書け�Eよくなる、E

#### 5. なぜ責務�E離が重要か

変更に強くなる、E

| 変更冁E��       | 修正箁E��               |
| -------------- | ---------------------- |
| API URL変更    | `patientApi.js` のみ   |
| PUT ↁEPOST変更 | `patientApi.js` のみ   |
| 認証追加       | `patientApi.js` のみ   |
| 表示斁E��変更   | `PatientList.jsx` のみ |

UIを触らずに通信仕様を変更できる、E

#### 6. 学んだ設計上�EポインチE

- 画面は「何をしたぁE��」だけ書ぁE
- 通信は「どぁE��ってするか」を持つ
- JSON変換�E�ESON.stringify�E��E通信の責勁E
- HTTPスチE�Eタス判定！Eesponse.ok�E�も通信の責勁E

### 今日の学び�E�まとめE��E

- UIと通信を同じコンポ�Eネントに書くと修正篁E��が庁E��めE
- API処琁E��別ファイルに刁E��るとコードが読みめE��くなめE
- try/catch は画面表示のために使ぁE��E��信の失敗判定�EAPI側で行う
- 責務�E離により「変更に強ぁE��造」を作れめE

## 2026-02-27

### 学習ログ�E�EodチE��トコーチE/ safeParse / バリチE�Eションの仕絁E��琁E���E�E

#### 1. チE��トコードとは何か

チE��トコード�E「アプリの機�E」ではなく、�Eログラムが壊れてぁE��ぁE��確認するため�Eコード、E
ユーザーのためではなく、E��発老E��未来の自刁E���Eための安�E裁E��、E

手動確認！E

- フォームを開ぁE
- 入力すめE
- エラーを見る

チE��トコード！E

- 入力例を用愁E
- 自動で検査
- 正しいか採点

つまり、確認作業を人間からコンピュータに任せてぁE��、E

#### 2. 今回のコード�E全体構造

今回のチE��ト�E2つの役割に刁E��れてぁE��、E

1. `createPatientValidationCases`
   チE��トケース�E�問題集�E�を作る関数、E

- 正常入劁E
- 重褁E��屁E
- 忁E��未入劁E

ここでは検査はしてぁE��ぁE��E
ただの入力例と正解のセチE��、E

2. `runPatientValidationCases`
   チE��トケースめEつずつZodで検査し、結果をまとめた成績表を返す関数、E

#### 3. Zodが実際に動いてぁE��場所

Zodの検査が実行されるのはここ、E

```js
const result = schema.safeParse(testCase.input);
```

- `schema` = バリチE�Eションルール�E�検査機！E
- `input` = 患老E��ータ
- `safeParse` = 検査を実行するスイチE��
- `result` = 検査結果

`safeParse`は以下�Eオブジェクトを返す、E

成功�E�E

```js
{ success: true, data: ... }
```

失敗！E

```js
{ success: false, error: ... }
```

`result.success` は「合格か不合格か」を表すフラグ、E

#### 4. なぜ今まで `safeParse` を書かなくても動ぁE��ぁE��ぁE

フォームでは以下を使ってぁE��、E

```js
useForm({
  resolver: zodResolver(recordSchema),
});
```

`react-hook-form` の `zodResolver` が�E部でZodを実行してぁE��、E
つまり裏では `safeParse` 相当が毎回呼ばれてぁE��、E

| 場面     | Zodを実行してぁE��人     |
| -------- | ----------------------- |
| フォーム | react-hook-form�E��E動！E|
| チE��チE  | 自刁E��手動！E           |

#### 5. `expected` / `actual` / `ok` の意味

- `expected` ↁE人間が用意した正解
- `actual` ↁEZodが�Eした結果

```js
actual: result.success ? "valid" : "invalid";
```

`ok` は最終採点、E

- 合否が一致
- かつ�E�指定があれば�E�エラーの場所も一致

つまり「正しい結果」だけでなく「正しい琁E��」で失敗してぁE��かまで確認してぁE��、E

#### 6. `firstErrorPath` と `firstErrorMessage`

- `firstErrorPath`�E�最初にエラーが起きた頁E��名！Eroom` など�E�E
- `firstErrorMessage`�E�そのエラーの冁E��

Zodの `issues[0]` から取得してぁE��、E

#### 7. `.join(".")` を使ぁE��由

Zodのエラー場所は配�Eで返る、E

```js
["room"];
```

しかしテスト�E正解は斁E���E、E

```js
"room";
```

配�Eは `===` で比輁E��きなぁE��め、文字�Eに変換して比輁E��てぁE��、E

#### 8. 配�EぁE`===` で一致しなぁE��由

```js
["room"] === ["room"]; // false
```

配�Eは「中身」ではなく「メモリ上�E場所�E�箱�E�」を比輁E��る、E
`[]` を書くたびに新しい箱が作られるため一致しなぁE��E

#### 9. `window` に入れてぁE��琁E��

```js
window.runPatientValidationCases = runPatientValidationCases;
```

ブラウザのコンソールから直接

```js
runPatientValidationCases();
```

を実行できるようにするための入口、E

### 今日の琁E���E�重要E��E

- Zodは `schema` を作っただけでは動かなぁE
- `safeParse` を呼んだときに初めて検査が実行される
- フォームでは `react-hook-form` が�E動で呼んでぁE��
- チE��トコードでは自刁E��呼ぶ忁E��がある
- チE��トコード�EバリチE�Eションそ�Eも�Eではなく、バリチE�Eションが壊れてぁE��ぁE��確認する仕絁E��

## 2026-02-28

### 今日の学びまとめE

#### 1. safeParse の本当�E役割

- Zod は入力データをチェチE��する審査橁E
- safeParse はプログラムを止めずに合否を返す

`result.success`

- `true` ↁE保存してよいチE�Eタ
- `false` ↁE保存してはぁE��なぁE��ータ

つまり！E
safeParse = 患老E��ータをカルチE��録してよいか判定する裁E��

#### 2. React Hook Form の errors の正佁E

フォームの赤エラーは React が�EしてぁE��のではなく、E
Zod の safeParse に落ちた結果が表示されてぁE��だけ、E

- 保存時�E�EnSubmit�E�に検証が走めE
- 失敗すると errors に入めE
- `clearErrors()` はそ�E赤ペンを外す処琁E

#### 3. 保存後に忁E��だった、Eつの同期、E

患老E��雁E��グの原因は、患老E��ータぁEか所に存在してぁE��こと、E

- `patients`�E�一覧チE�Eタ�E�E
- `selectedPatient`�E�表示中の患老E��E
- `useForm` 冁E��の値 + `errors`�E�フォーム�E�E

そ�Eため保存後�E�E�E

- `onUpdate(updated)` ↁE一覧更新
- `reset(updated)` ↁEフォーム更新
- `clearErrors()` ↁEエラー解除

つまり：保存�E琁E�E本質は「状態�E同期」だった、E

#### 4. Vitest の意味

Vitest は画面のチE��トではなく、E
ロジチE��が壊れてぁE��ぁE��を監視する裁E��、E

役割�E�E

- `describe`�E�テスト�E見�EぁE
- `it`�E�Eつの確認頁E��
- `expect`�E�こぁE��る�Eず、とぁE��紁E��

`expect(result.success).toBe(true);`

= 「この患老E��ータは忁E��通るはず」と機械に監視させてぁE��、E

#### 5. validCases と invalidCases

チE��ト�E2種類忁E��だった！E

- `validCases`�E�通るべきデータが通るぁE
- `invalidCases`�E�落ちるべきデータが落ちるか

さらに

`expect(firstErrorPath).toBe(c.expectErrorPath);`

で、どの頁E��で落ちたか�E�Ege なのぁEroom なのか）まで保証してぁE��、E

### 今日の核忁E��いちばん重要E��E

あなた�E今日、Reactのフォームを作ってぁE��のではなく、E
「�E力データの正しさを機械に保証させる仕絁E��」を作ってぁE��した、E

これは
アプリを作る人 ↁEソフトウェアエンジニア
に上がるタイミングの学習�E容です、E

### 明日のチE�EチE

「なぜテストがあると“安忁E��てリファクタリングできる”�Eか、E
をやると、テスト�E価値が一気に腑に落ちます、E

## 2026-03-01 学習ログ�E�Eitest導�E / Zodリファクタリング�E�E

---

### 1. Vitestをターミナルで実行できるようになっぁE

```bash
npm exec vitest run
```

- ターミナルから自動テストを実行できた
- watchモードでは保存するたびにチE��トが自動実行される
- チE��ト�E役割は「正しいか確認」ではなぁE
  **リファクタリングしても壊れてぁE��ぁE��とを保証する保険**

---

### 2. フォーム入力とZodのズレを理解

ユーザーがフォームに入力！E

```html
<input name="age" />
```

画面では

```
70
```

と入力してぁE��が、JavaScriptに届く値は

```js
"70";
```

数値ではなく「文字�E」、E

そ�Eため、これだけでは失敗する！E

```js
z.number().safeParse("70");
// ❁E失敁E
```

---

### 3. preprocess の役割�E�検証前�E通訳�E�E

```js
z.preprocess((v) => Number(v), z.number());
```

処琁E�E流れ�E�E

```
"70"
ↁE
70 に変換
ↁE
number検証
```

つまめE
**Zodが理解できる形に直してから検証する仕絁E��、E*

---

### 4. optionalNumber の琁E���E�今日の核忁E��E

作�Eした関数�E�E

```js
export const optionalNumber = (min, max, msgMin, msgMax) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v == null ? "" : String(v).trim()))
    .transform((v) => (v === "" ? undefined : Number(v)))
    .refine((v) => v === undefined || Number.isFinite(v), {
      message: "数字を入力して下さぁE,
    })
    .refine((v) => v === undefined || v >= min, { message: msgMin })
    .refine((v) => v === undefined || v <= max, { message: msgMax });
```

これは単なる「数値チェチE��関数」ではなぁE��E

#### こ�E関数が定義してぁE��も�E

- 空欁EↁE未入力として扱ぁE
- 数字以夁EↁE「数字を入力して下さぁE��E
- 篁E��夁EↁEmin/maxエラー
- 空白付き ↁE自動補正

つまめE

> こ�Eアプリにおける「数値入力�E仕様」を定義してぁE��

Zodを使ってぁE��のではなぁE
**Zodでアプリのルールを作ってぁE��状慁E*と琁E��した、E

---

### 5. リファクタリング�E�重要E��E

修正前（頁E��ごとに別ルール�E�！E

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

修正後（ルールを統一�E�！E

```js
room: optionalNumber(1, 999, "部屋番号は1以丁E, "部屋番号は999以丁E),
age: optionalNumber(0, 150, "年齢は0以丁E, "年齢は150以丁E),
```

効果！E

- 数値入力�E仕様を1箁E��に雁E��E
- 封E��の仕様変更は `optionalNumber` だけ直せ�Eよい
- バグが�EりにくくなめE

---

### 6. チE��ト�E追加�E�仕様を守る�E�E

チE��トケースを追加�E�E

```js
{
  id: "room-not-number",
  label: "部屋番号が数字でなぁE,
  usedRooms: [101, 102],
  input: {
    name: "山田太郁E,
    room: "abc",
    age: "70",
    disease: "肺炁E,
    history: "高血圧",
    progress: "解熱傾吁E,
  },
  expectValid: false,
  expectErrorPath: "room",
  expectErrorMessage: "数字を入力して下さぁE,
}
```

チE��ト�E�E�E

```js
expect(firstIssue?.message).toBe(c.expectErrorMessage);
```

ここで琁E��したこと�E�E

- チE��ト�Eコードを守るも�EではなぁE
- **ユーザーに見える挙動（仕様）を守るも�E**

---

### 7. 今日の最重要理解

リファクタリングとは

```
コードを綺麗にすること
ではなぁE
ↁE
動きを変えずに壊れにくくすること
```

Vitestにより開発スタイルが変化した�E�E

- Before�E�ブラウザを触って確認する開発
- After�E�テストで安�Eを確保して変更できる開発

つまり今日、E
**「動け�EOKの学習アプリ」から「壊れなぁE��計�Eアプリ」へ一歩進んだ、E*

## 2026-03-02

### 学習ログ�E�EatientList 通信刁E�� DRAFT�E�E

#### 1. 通信刁E��とは

通信刁E��とは、`fetch` を別ファイルに置くことではなぁE��E
画面コンポ�Eネントがサーバ�Eと直接通信しなぁE��造にすること、E

役割刁E���E�E

| 役割             | 拁E��E          |
| ---------------- | -------------- |
| 画面表示・操佁E  | PatientList    |
| チE�Eタ管琁E�E保孁E| App            |
| チE�Eタ保管       | Express Server |

PatientListは「この状態にしたぁE��と提案するだけで、保存�EAppが行う、E

#### 2. 変更前（通信刁E��前！E

PatientList が直接保存してぁE���E�E

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

問題！E

- `patients` / `records` が変わるたびに自動保孁E
- PatientList が保存係になってしまぁE
- チE�Eタの正本が画面側に存在してしまぁE

#### 3. 変更後（通信刁E��DRAFT�E�E

自動保孁E`useEffect` を削除し、保存�Eタン方式へ変更、E

PatientList�E�E

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

ボタンで保存！E

```jsx
<button onClick={handleSave} disabled={isSaving}>
  保孁E
</button>
```

ポイント！E

- PatientList は `saveAppData` を呼ばなぁE
- 親に保存を依頼するだぁE

#### 4. Appが保存係になめE

App が保存�E琁E��拁E��！E

```js
import { saveAppData } from "./api/patientApi";

const onSaveData = async (payload) => {
  await saveAppData(payload);
};
```

そして PatientList に渡す！E

```jsx
<PatientList onErrorsChange={setGlobalErrors} onSaveData={onSaveData} />
```

これで通信は App に1箁E��だけ存在する、E

#### 5. サーバ�E側の修正琁E��

PUTの返り値を変更�E�E

変更前！E

```js
res.json({ ok: true });
```

変更後！E

```js
const next = { patients, records };
writeData(next);
res.json(next);
```

琁E���E�E
Reactが忁E��なのは「�E功したか」だけではなく、E
保存後�E正式なチE�Eタだから、E

#### 6. なぜ忁E��か�E�Eingle Source of Truth�E�E

チE�Eタの正解�E�正本�E��E1か所に雁E��る忁E��がある、E

もし PatientList が保存すると�E�E

- 画面ごとに保存�E琁E��生まれる
- `patients` と `records` の整合性が崩れる
- 上書き事故が起きる

Reactではこれを防ぐために
Single Source of Truth�E�単一の惁E��源）を作る、E

今回の正本は App、E

### 今日の結論（つまり！E

通信刁E��とは
「画面コンポ�Eネントが直接サーバ�E保存する構造」をめE��、E

- PatientList�E�変更案を作る
- App�E�保存して正本を管琁E��めE

とぁE��責任刁E��の設計である、E

これにより、アプリ全体�EチE�Eタ整合性が保たれる、E

## 2026-03-03

### 学習ログ�E�EPI通信 / HTTP / CSRF / ブラウザの仕絁E���E�E

#### 1. GET / POST / PUT は Express の仕様ではなぁE

最初、GETやPUTは Express 独自の機�Eだと思ってぁE��が違った、E
これは HTTP�E�Eebの通信ルール�E�そのも�E、E

- GET ↁEチE�Eタ取征E
- POST ↁE新規作�E
- PUT ↁE上書ぁE
- DELETE ↁE削除

Express はこ�E「命令」を受け取って処琁E��刁E��してぁE��だけ、E

```js
app.get("/api/data", ...);
app.put("/api/data", ...);
```

つまめEExpress は API を作ってぁE��のではなく、E
HTTPの受付係を実裁E��てぁE��だけ、E

#### 2. fetch は何をしてぁE��ぁE

```js
const response = await fetch(`${API_BASE}/data`);
```

`fetch` は「URLにチE�Eタを取りに行く命令」、E
ブラウザでURLを開く�Eと本質皁E��同じ通信�E�EET�E�を送ってぁE��、E

つまめE

- ブラウザでペ�Eジを開ぁE
- Reactでfetchする

は同じ仕絁E��の上にある、E

#### 3. /api を付ける理由

URLには役割がある、E

| 種顁E     | 役割                   |
| --------- | ---------------------- |
| /patients | 画面�E�人間用�E�E        |
| /api/data | チE�Eタ�E��Eログラム用�E�E|

`/api` は飾りではなく、機械専用入口であることを示す設計、E

これを�EけなぁE��

- ブラウザ閲覧
- プログラム通信

が混ざり、セキュリチE��が崩れる、E

#### 4. CSRF�E�クロスサイトリクエストフォージェリ�E�E

攻撁E��E��サーバ�Eを直接攻撁E��るわけではなぁE��E
ユーザーのブラウザに通信させる攻撁E��E

悪意サイト�E中に�E�E

```html
<form action="http://localhost:3001/data" method="POST"></form>
```

が仕込まれてぁE��と、E
ユーザーが�Eージを開ぁE��だけでサーバ�Eへリクエストが送られる、E

重要�Eイント！E

- 送信してぁE��のは攻撁E��E��はなく「ユーザーのブラウザ、E
- サーバ�Eから見ると正規操作に見えめE

#### 5. JSON送信の意味

Reactの保存�E琁E��E

```js
fetch("/api/data", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

普通�EHTMLフォームは `application/json` を送れなぁE��E
そ�Eため CSRF の一部を防ぎやすくなる、E

サーバ�E側で確認可能�E�E

```js
if (!req.is("application/json")) {
  return res.status(403).send("Forbidden");
}
```

ただしこれ�E完�Eな防御ではなぁE��E
`curl` めE��クリプトからは送れてしまぁE��E

#### 6. 本当�E防御は認証

`req.is()` は「門」でしかなぁE��E
本当�E鍵はログイン認証、E

セキュリチE��の段階！E

- APIと画面を�E離
- フォーム攻撁E��策！ESONチェチE���E�E
- CORS
- 認証�E�ログイン�E�EↁE本命
- 権限管琁E

#### 7. 海賊版サイト�Eタブ増殖�E正佁E

ウイルスではなく、ブラウザのJavaScriptが原因、E

```js
window.open("庁E��URL");
```

新しく開いた�Eージも同じ�E琁E��行うため、E
タブがネズミ算式に増える、E

攻撁E�E本質�E�E

- PC侵入ではなぁE
- ブラウザを操作してぁE��

ブラウザは、E
ユーザーが開ぁE��ペ�Eジの命令を実行する環墁E��から成立する、E

#### 8. 今日の核忁E��解

ブラウザは単なる閲覧ソフトではなぁE��E

- JavaScriptを実行する環墁E
- ネットワーク通信も行えめE

つまめE

Reactアプリも、悪意サイトも、同じ仕絁E��の上で動いてぁE��、E

そしてCSRFはサーバ�E攻撁E��はなく、E
「ユーザーのブラウザを利用したなりすまし通信」であると琁E��した、E

## 2026-03-03 学習ログ�E�通信刁E��DRAFT / 正本をAppへ�E�E

### 1) 何をしたか（結論！E

- `patients` / `records` の正本�E�Eingle Source of Truth�E�を `App.jsx` に移勁E
- `PatientList` は表示と操作だけを拁E��E
- API通信�E�Eetch/PUT�E��E `App.jsx` + apiファイルだけに置ぁE

### 2) なぁEApp に正本を置く�EぁE

`PatientList` が勝手に `useState(patients)` を持つと正本ぁEつになる、E
ↁEチE�Eタの刁E��（画面・保存�Eサーバ�Eがズレる）�E バグの原因、E

### 3) App.jsx 側�E�正本 appData を持つ

```js
const [appData, setAppData] = useState({ patients: [], records: [] });
```

初期値めE`[]` にしてぁE��のは、`patients.map()` / `records.filter()` を安�Eに動かすため、E

- `null` めE`{}` だと `.map()` が使えず落ちめE

### 4) App.jsx 側�E�読み込み�E�非同期�E�を App に雁E��E

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

`Array.isArray` は「本当に配�Eか？」�E型チェチE��、E

- `data.patients || []` だと `{}` が来たときにすり抜けて `.map()` で落ちめE

### 5) App.jsx 側�E�保存！EUT�E�も App に雁E��E

```js
const onSaveData = async (payload) => {
  const saved = await saveAppData(payload);
  setAppData(saved);
};
```

`PatientList` は「保存して」とお願いするだけ、E
実際の通信は App が担当、E

### 6) PatientList から App の正本を更新できるよう「窓口」を用愁E

PatientList 冁E�E `setPatients((prev)=>...)` を活かすため、App 側でラチE�E関数を作る、E

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

`{ ...prev, patients: nextPatients }` は records を消さなぁE��めE��EuseState`は部刁E��新ではなく丸ごと置き換え）、E

- `...prev` を書かなぁE�� records が消えめE

### 7) PatientList.jsx 側�E�propsで受け取って使ぁE

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

`PatientList` は「正本を持たなぁE��！E

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
  // ここでは useState で patients/records を作らなぁE
}
```

### 8) 保存�Eタン�E��E動保存をめE��て、忁E��な時だけ保存！E

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

- 「いつ保存が走るか」が明確で初忁E��E��刁E��りやすい
- 後で自動保存！EuseEffect`�E�に戻すこともできる

### 9) 学び�E�結論！E

- 責任の刁E���E�通信はApp、画面はPatientList�E�が一番大亁E
- 正本めEつにしなぁE��チE�Eタの刁E��が起きてバグめE
- 配�Eは `map/filter` を使ぁE��提なので、�E期値・型チェチE��が重要E

次は「�E動保存に戻すならどぁE��計するか�E�保存頻度・保存中の二重送信防止・差刁E��存）」に進めるけど、今�Eこ�EDRAFTが動ぁE��ぁE��ことが最高に価値ある、E

## 2026-03-04 学習ログ�E�EppData方式�E琁E���E�E

### 1) appData方式とは何か

```js
const [appData, setAppData] = useState({
  patients: [],
  records: [],
});
```

- `patients` と `records` めEつの箱で管琁E��てぁE��
- APIぁE`{ patients, records }` を丸ごと扱ぁE��め�E然な設訁E
- 正本�E�データの本体）�E `App` にある

### 2) setAppData は「箱ごと更新、E

```js
setAppData({ patients: newPatients });
```

こ�E書き方だと `records` が消える�Eで危険、E

### 3) 部刁E��新が忁E��になめE

子で「患老E��け更新したぁE/ 記録は触りたくなぁE��時は、以下�Eように書く忁E��がある、E

```js
setAppData((prev) => ({
  ...prev,
  patients: prev.patients.map(...),
}));
```

### 4) 自佁EsetPatients の正佁E

```js
const setPatients = (updater) => {
  setAppData((prev) => ({
    ...prev,
    patients: typeof updater === "function" ? updater(prev.patients) : updater,
  }));
};
```

これは `appData` の中の `patients` だけ安�Eに更新するためのショートカチE��、E

### 5) typeof updater === "function" の意味

`typeof updater === "function"` は「`updater` が関数だったら実行する」とぁE��意味、E

Reactの `setState` は2種類あるため、それに対応してぁE��、E

- `setState(newValue)`
- `setState((prev) => newValue)`

### 6) 今日一番大事な気づぁE

疑問�E�E

「同時に両方更新すればよくなぁE��、E

答え�E�E

- できる
- でも毎回コードが長くなめE
- ミスしやすい
- 責任が子に庁E��めE

だから「部刁E��新専用の窓口」を作る、E

### 今日の本質

- `appData` = 大きな箱
- `setAppData` = 箱ごと交揁E
- `setPatients` = 箱の中の患老E��け交揁E

### ぁE��モヤる理由

ぁE��触ってぁE��のは「stateの抽象化レベル」、E
これは初忁E��E��ーンを抜け始めた証拠、E

### 明日めE��こと�E�おすすめE��E

「�E作関数を消して、�E部 `setAppData` で書ぁE��みる」を1回やる、E

そうすると体感で刁E��る！E

- なぜ長くなるか
- なぜ�E作関数が楽ぁE

## 2026-03-07 学習ログ�E�Eeact 状態設計�E琁E���E�selectedPatient と selectedPatientId�E�E

### 1) チE�Eタの刁E��！Etateを増やしすぎる問題！E

最初�E次のように state を持ってぁE��、E

```js
const [patients, setPatients] = useState([]);
const [selectedPatient, setSelectedPatient] = useState(null);
```

こ�E場合、患老E��選ぶと以下になる、E

```js
setSelectedPatient(patient);
```

状態イメージ�E�E

```text
patients
 ━E{ id: 3, name: "田中" }

selectedPatient
 ━E{ id: 3, name: "田中" }
```

同じ患老E��ータぁE箁E��に存在する、E

こ�E状態で患老E��更新すると、E

- `patients` は更新されめE
- `selectedPatient` は古ぁE��まになる可能性があめE

そ�E結果、E

- 患老E��覧は新しい
- 患老E��細は古ぁE

とぁE��チE�Eタのズレ�E�同期ズレ�E�が起きる、E

### 2) 解決方法：selectedPatientId方弁E

患老E��ータは `patients` に1箁E��だけ持つ、E

```js
const [patients, setPatients] = useState([]);
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

患老E��選ぶとき�E ID だけ保存する、E

```js
setSelectedPatientId(patient.id);
```

表示するとき�E `patients` から探す、E

```js
const selectedPatient =
  patients.find((p) => p.id === selectedPatientId) ?? null;
```

状態イメージ�E�E

```text
patients
 ━E{ id: 3, name: "田中" }

selectedPatientId
 ━E3
```

患老E��ータは `patients` にしか存在しなぁE��E

そ�Eため、E

`patients` 更新 -> `find` 再実衁E-> `selectedPatient` も最新

となり、データのズレが起きにくい、E

### 3) React設計�E重要原剁E

Reactでは「stateは最小限にする」が重要、E

ルール�E�E

- 保存が忁E��なも�E -> state
- 計算できるも�E -> stateにしなぁE

今回の整琁E��E

- `patients` -> 保存データ
- `selectedPatientId` -> UI状慁E
- `selectedPatient` -> 計算結果

### 4) useMemoにつぁE��

次のコード�E、`patients` また�E `selectedPatientId` が変わったときだけ�E計算するため�Eも�E、E

```js
const selectedPatient = useMemo(() => {
  if (selectedPatientId === null) return null;
  return patients.find((p) => p.id === selectedPatientId) ?? null;
}, [patients, selectedPatientId]);
```

ただぁE`patients.find(...)` は軽ぁE�E琁E��ので、実務では以下�Eように直接書くことも多い、E

```js
const selectedPatient =
  patients.find((p) => p.id === selectedPatientId) ?? null;
```

### 今日の重要理解

- `patients` -> 本物チE�Eタ
- `selectedPatientId` -> 選択状慁E
- `selectedPatient` -> `patients` から計箁E

これによりチE�Eタの刁E��を防げる、E

React の Single Source of Truth�E�データの真実�E1箁E���E�を守る設計になる、E

### 次の一歩

`nurse-apri` の設計がさらに良くなる「React状態設計�E黁E��ルール」を学ぶと、E
`useState` をどこに置くべきかを素早く判断できるようになる、E

## 2026-03-08 学習ログ�E�実行時エラーの原因特定！E

### 発生したエラー

```text
Uncaught ReferenceError: Cannot access 'selectedPatient' before initialization
```

### 原因

- `selectedPatient` を作る前に、`patientRecords` 側で `selectedPatient` を読んでぁE��
- `const` は宣言前に参�Eすると実行時エラーになめE

### 修正

- 宣言頁E��調整して、�Eに `selectedPatient` を定義
- そ�E後に `patientRecords` を計算するよぁE��した

### 学び

- Reactでは state 設計だけでなく「宣言頁E��も重要E
- 値を使ぁE�E琁E�E、忁E��そ�E値の定義より後ろに置ぁE

### つまめE

`selectedPatientId` 設計�E正しかった、E
今回の問題�E設計ではなく、参照頁E���E期化前アクセス�E�だった、E

## 2026-03-08 学習ログ�E�Eeact基礎整琁E��E

### 1) stateは最小限にする

Reactでは「計算できるも�Eは state にしなぁE��が基本、E

悪ぁE��（データ刁E��）！E

```js
const [patients, setPatients] = useState([]);
const [selectedPatient, setSelectedPatient] = useState(null);
```

問題！E

- `patients` と `selectedPatient` の2箁E��に同じチE�Eタが存在する
- `patients` 更新 -> `selectedPatient` が古ぁE

とぁE��バグが起こる可能性がある、E

良ぁE��計！E

```js
const [patients, setPatients] = useState([]);
const [selectedPatientId, setSelectedPatientId] = useState(null);

const selectedPatient =
  patients.find((p) => p.id === selectedPatientId) ?? null;
```

保存してぁE��のは `patients` と `selectedPatientId` だけ、E
`selectedPatient` は計算値、E

これめESingle Source of Truth�E�真実�EチE�Eタは1つ�E�とぁE��、E

### 2) Reactは state が変わると再実行される

例！E

```js
setSelectedPatientId(3);
```

すると React はコンポ�Eネントをもう一度実行する、E

そ�E時、E

```js
const selectedPatient = patients.find((p) => p.id === selectedPatientId);
```

も�E計算される、E

つまめE`selectedPatient` は保存データではなく、毎回計算される値、E

### 3) 配�E操作！Eeactでよく使ぁE��E

`find`

- 最初�E1つを取征E

```js
patients.find((p) => p.id === selectedPatientId);
```

見つからなければ `undefined`、E

`map`

- 配�Eを変換する

```jsx
patients.map((p) => <li key={p.id}>{p.name}</li>);
```

Reactでは一覧表示によく使ぁE��E

`filter`

- 条件に合うも�Eだけ残す

```js
patients.filter((p) => p.id !== id);
```

削除処琁E��使ぁE��E

### 4) Reactの配�E更新パターン

追加�E�E

```js
setPatients((prev) => [...prev, newPatient]);
```

更新�E�E

```js
setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
```

削除�E�E

```js
setPatients((prev) => prev.filter((p) => p.id !== id));
```

### 5) immutable更新

Reactでは state を直接変更しなぁE��E

NG�E�E

```js
patient.age = 81;
```

OK�E�E

```js
const updated = { ...patient, age: 81 };
```

### 6) スプレチE��構文

```js
const updated = { ...patient, ...data };
```

意味�E�E

- `patient` をコピ�E
- `data` で上書ぁE

### 7) 三頁E��算孁E

`condition ? A : B`

例！E

```js
p.id === updated.id ? updated : p;
```

意味�E�E

- 条件 `true` -> `updated`
- 条件 `false` -> `p`

### 8) JavaScript演算孁E

optional chaining�E�E

```js
selectedPatient?.name;
```

- 存在すれば読む
- 無ければ `undefined`

null合体演算子！E

```js
value ?? defaultValue;
```

- `null` / `undefined` の時だぁE`defaultValue`

OR演算子！E

```js
value || defaultValue;
```

- falsy なめE`defaultValue`

falsy�E�E

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

`key` は React が要素を識別するための ID、E
これにより「どの要素が変わったか」を React が判断できる、E

### 今日の重要�EインチE

- state = 保存するデータ
- 変数 = 計算値

React設計�E基本�E�stateは最小限、E

## 2026-03-12 学習ログ�E�患老E��加処琁E�E琁E���E�E

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

処琁E�E頁E���E�E

1. フォーム送信
2. 入力データ取征E
3. `patientToAdd` 作�E
4. `nextPatients` 作�E
5. サーバ�E保孁E
6. フォームを閉じる
7. 入力リセチE��

### 2) handleSubmit の役割

`handleSubmit(async (data) => { ... })` は `react-hook-form` の送信管琁E��数、E

- 入力値を集める
- ZodでバリチE�Eション
- 問題なければ `data` を渡ぁE

### 3) patientToAdd�E�患老E��ータ作�E�E�E

```js
const patientToAdd = { ...data, id: crypto.randomUUID() };
```

意味�E�E

- フォーム入劁E`data` をコピ�E
- 新しいIDを追加
- 保存する患老E��ブジェクトを作る

### 4) nextPatients�E�新しい患老E��スト！E

```js
const nextPatients = [...patients, patientToAdd];
```

意味�E�E

- 既存�E列を壊さぁE
- 追加後�E新しい配�Eを作る

### 5) サーバ�E保孁E

```js
await onSaveData({ patients: nextPatients, records });
```

意味�E�E

- 追加後データをそのまま保存すめE
- `await` で保存完亁E��征E��てから次に進む

### 6) なぁE`setPatients(nextPatients)` を�Eに呼ばなぁE�EぁE

今回の設計では `onSaveData` 側が保存�E功後に state を更新する、E

```js
const onSaveData = async (payload) => {
  const saved = await saveAppData(payload);
  setAppData(saved);
};
```

こ�Eため、呼び出し�Eで先に `setPatients(nextPatients)` を実行すると、E
更新責務が2か所になって琁E��と保守が難しくなる、E

結論！E

- 更新責務�E `onSaveData` に雁E��E
- 呼び出し�Eは「保存依頼」に専念

## 2026-03-13

### 学習ログ�E�EelectedPatientId / addRecord / App に state を上げる理解�E�E

### 1) selectedPatientId を使ぁE��由

以前�E `selectedPatient` のように患老E��ブジェクトを直接使ぁE��E��があった、E
でめEReact では `patients` と `selectedPatient` の両方めEstate に持つと、同じ患老E��ータぁEか所に存在して刁E��しめE��ぁE��E

そ�Eため、E

```jsx
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

のように「IDだけを state に持つ」方が安�E、E

### 2) selectedPatient は state ではなく計算して作る

```jsx
const selectedPatient =
  selectedPatientId === null
    ? null
    : (patients.find((p) => p.id === selectedPatientId) ?? null);
```

意味:

- `selectedPatientId` ぁE`null` なら患老E��選択なので `null`
- `selectedPatientId` があるなめE`patients` 配�Eから一致する患老E��探ぁE
- 見つからなければ `null`

つまめE

- 選択状態�E ID で持つ
- 忁E��な患老E��ータは `patients` から探ぁE

とぁE��設計、E

### 3) patientRecords めEselectedPatientId から作る

```jsx
const patientRecords = useMemo(() => {
  if (selectedPatientId === null) return [];
  return records.filter((r) => r.patientId === selectedPatientId);
}, [records, selectedPatientId]);
```

意味:

- 患老E��選択なら空配�E
- 選択中なら、その患老EDに紐づく記録だけ取り�EぁE

ここでめE`selectedPatient.id` ではなぁE`selectedPatientId` を使ぁE��とで、ID参�E設計にそろってぁE��、E

### 4) patientId は record がどの患老E�Eも�Eかを表ぁE

record はこうぁE��構造になる、E

```js
{
  id: 171000000000,
  patientId: 2,
  note: "発熱あり"
}
```

役割:

- `id` -> 記録そ�Eも�EのID
- `patientId` -> こ�E記録がどの患老E�Eも�EぁE

つまめE`record -> patient` めE`patientId` で結�EつけてぁE��、E

### 5) addRecord めEApp に置く理由

以前�E PatientList 冁E��

```jsx
setRecords((prev) => [...prev, recordToAdd]);
```

としてぁE��。これ�E state を直接更新して画面を変える�E琁E��E

でも今�E `records` の本体�E App にあるので、E

- stateを持つ場所 = 更新責任を持つ場所

に合わせて、`addRecord` めEApp に置く方がよぁE��E

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

- 患老E��選択なら何もしなぁE
- 入力データに `patientId` と `id` を足して record を完�EさせめE
- `nextRecords` を作る
- `onSaveData` でサーバ�E保存すめE

### 7) なぁEawait onSaveData(...) が大事か

`await onSaveData(...)` があることで

- サーバ�E保孁E
- App state更新
- 画面描画

の頁E��を守れる、E

もし先に `setRecords(...)` すると、E

- 画面だけ�Eに変わめE
- サーバ�E保存失敁E

となり、画面と保存データがズレる危険がある、E

### 8) App に上げぁEstate は子で再�E持たなぁE

App で

```jsx
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

を持つなら、PatientList 側ではもう

```jsx
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

を作らなぁE��子�E props で受け取って使ぁE��E

つまめE

- App が持つ
- PatientList は受け取る

にする、E

### 9) 今�E PatientList で良ぁE��ころ

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

こ�E2つはとても良ぁE��E

琁E��:

- IDで選択状態を管琁E��てぁE��
- 忁E��なチE�Eタは配�Eから探してぁE��
- stateの刁E��を防げる

### 10) 今�E段階でまだ途中のところ

`updatePatient` めE`updateRecord` はまだ PatientList で

- `setPatients(...)`
- `setRecords(...)`

を使ってぁE��、E

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

これはまだ「画面state直接更新」�E設計が残ってぁE��、E
封E��皁E��はこれめEApp 側責任に寁E��るとさらにきれぁE��なる、E

### 今日の一番大事な琁E��

- `selectedPatientId` は選択状慁E
- `patientId` は record がどの患老E��属するか
- どちらも ID参�Eで設計すると刁E��りやすい
- `selectedPatient` めE`patientRecords` は state ではなく、`patients` / `records` から計算して作る
- `records` の本体が App にあるなら、`addRecord` めEApp に置く方が�E然

ひとことでまとめると:

- 本体データは App に置ぁE
- 選択�E ID で持つ
- 忁E��な値は配�Eから探して作る

### まとめE��つまり！E

- `patientToAdd` と `nextPatients` は「保存に渡す完�EチE�Eタ」を作るため
- 画面更新は `onSaveData` 成功後に一允E��琁E
- これで state の正解ぁEか所にまとまり、ズレが起きにくい

## 2026-03-12 学習ログ�E�Eeact / コンポ�Eネント�E離�E�E

### 1) AddPatientForm をコンポ�Eネント�E離

以前�E `PatientList` の中に追加フォームが直接書かれてぁE��、E

Before:

```jsx
{showAddForm && (
  <form onSubmit={handleSubmit(...)}>
    ...
  </form>
)}
```

こ�E状態では `PatientList` が次の責任を同時に持ってしまぁE��E

- 患老E��覧
- 追加フォーム
- バリチE�Eション
- 保存�E琁E

After:

追加フォームめE`AddPatientForm` として刁E��、E

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

`AddPatientForm` は次の責任を持つ、E

- 入力フォーム表示
- react-hook-form 管琁E
- Zod バリチE�Eション
- 新規患老E��ータ作�E
- 保存�E琁E��び出ぁE

保存�E琁E

```jsx
onSubmit={handleSubmit(async (data) => {
  const patientToAdd = { ...data, id: crypto.randomUUID() };
  const nextPatients = [...patients, patientToAdd];
  await onSaveData({ patients: nextPatients, records });
  setShowAddForm(false);
  reset();
})}
```

### 3) チE�Eタ追加の流れ

患老E��加の流れ:

1. AddPatientForm
2. `patientToAdd` 作�E
3. `nextPatients` 作�E
4. `onSaveData` 呼び出ぁE
5. App ぁEstate 更新
6. React 再描画
7. 画面更新

重要�EインチE 画面更新は state 更新のときに起こる、E

### 4) patientToAdd と nextPatients

`patientToAdd`:

- 新しく追加する患老E人

```js
const patientToAdd = { ...data, id: crypto.randomUUID() };
```

`nextPatients`:

- 追加後�E患老E��覧

```js
const nextPatients = [...patients, patientToAdd];
```

### 5) なぁEPatientList ぁEpatients を持たなぁE�EぁE

琁E��: 惁E��の刁E��を防ぐため、E

もし `PatientList` めEstate を持つと、E

- App の `patients`
- PatientList の `patients`

のように本物のチE�EタぁEつできる、E

これぁESingle Source of Truth�E�本物のチE�Eタは1つ�E�とぁE��老E��方、E

### 6) state を置く場所のルール

state は「誰が使ぁE��」で決める、E

- 1つのコンポ�Eネントだけ使ぁE-> そ�Eコンポ�Eネントに置ぁE
- 褁E��コンポ�Eネントで使ぁE-> 共通�E親に置ぁE

### 7) 今�Eアプリ構造

```text
App
 ━EPatientList
     ━EPatientDetails
     ━ENursingRecordList
     ━ENursingRecordItem
     ━EPatientVitals
     ━EAddPatientForm
```

`patients` は `PatientList` / `PatientDetails` / `AddPatientForm` で使ぁE��め、App に state を置く、E

### 8) リファクタリング結果

PatientList の役割:

- 患老E��覧表示
- 画面刁E��替ぁE
- 患老E��新
- 記録更新
- AddPatientForm の表示制御

AddPatientForm の役割:

- 追加フォーム
- 入力管琁E
- バリチE�Eション
- 保存�E琁E

### 今日の重要�EインチE

- state は「誰が使ぁE��」で置く場所を決める
- 褁E��コンポ�Eネントで使ぁE��ータは共通�E親に置ぁE
- Reactでは state が変わると画面が�E描画されめE

### 今日の一言まとめE

`PatientList` は `patients` を使ぁE�Eであり、`patients` の本物を持つ側ではなぁE��E

## 2026-03-13 学習ログ�E�削除処琁E/ patientId の琁E���E�E

### 1. record のチE�Eタ構造

看護記録�E�Eecord�E��E患老E��ータと紐づぁE��ぁE��、E

```js
{
  id: 101,         // 記録ID
  patientId: 2,    // 患老ED
  note: "発熱"
}
```

役割:

- `id` -> 記録そ�Eも�EのID
- `patientId` -> こ�E記録がどの患老E�Eも�EぁE

つまめE

`record -> patient`

とぁE��関係になってぁE��、E

### 2. patientId はどこで作られてぁE��ぁE

serverではなく、Reactアプリ側で作ってぁE��、E

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

としてぁE��ので

今選択してぁE��患老ED
ↁE
record に保孁E

される、E

### 3. 患老E��除時に record も削除する琁E��

削除処琁E

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

ポインチE

`records.filter((r) => r.patientId !== id)`

意味:

削除する患老E��紐づく記録を消す、E

もしこれがなぁE��

存在しなぁE��老E�E記録

が残ってしまぁE��E

これめE

孤児データ�E�Erphan data�E�E

とぁE��、E

### 4. p.id と r.patientId の違い

patients:

```js
patients.filter((p) => p.id !== id);
```

患老E��ータ:

```js
{ id: 2, name: "佐藤" }
```

なので `p.id` を比輁E��る、E

records:

```js
records.filter((r) => r.patientId !== id);
```

recordチE�Eタ:

```js
{ id: 101, patientId: 2 }
```

なので `patientId` で比輁E��る、E

### 5. なぁEawait が忁E��か

`await onSaveData(...)`

これは

サーバ�E保存完亁E

を征E��ため、E

もし await を消すと

保存が終わる前にUI処琁E��進む

可能性がある、E

つまめE

サーバ�E保孁E
ↁE
state更新
ↁE
画面描画

とぁE��頁E��を守るために忁E��、E

### 6. 今回の重要な琁E��

患老E��記録は

```text
patients
   ↁE
records
```

とぁE��リレーション構造になってぁE��、E

そ�Eため

患老E��除
ↁE
そ�E患老E�Erecord削除

が忁E��になる、E

これは

- SQL
- MongoDB
- Firebase

などでも同じ設計になる、E

### 今日の琁E���E�まとめE��E

- record は `patientId` で患老E��紐づぁE��ぁE��
- `patientId` は React側で作ってぁE��
- 患老E��除時�Eそ�E患老E�E記録も削除する忁E��がある
- `p.id` は患老ED、`r.patientId` は記録が属する患老ED
- `await` はサーバ�E保存完亁E��征E��ため

## 2026-03-14 学習ログ React state更新と保存�E琁E�E琁E���E�EpdatePatient / updateRecord�E�E

### 1. React の state 更新は「即更新ではなぁE��E

React の setState�E�侁E `setPatients`�E��E、その場で値を書き換える処琁E��はなぁE��E

React に対して、E

「次の描画で state を更新してください、E

とぁE��更新予紁E��出してぁE��だけ、E

侁E

```js
setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
```

こ�E時点ではまだ `appData.patients` は古ぁE��のまま、E

### 2. だからこ�Eコード�Eズレる可能性があめE

```js
setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

await onSaveData({
  patients: appData.patients,
  records: appData.records,
});
```

一見すると

- 患老E��新
- 保孁E

に見えるが、実際は

- `setPatients` -> 更新予紁E
- `onSaveData` -> 古ぁE`appData` を保孁E

になる可能性がある、E

つまり、更新前�EチE�Eタを保存してしまぁE��能性がある、E

### 3. 解決方況E

先に `next` チE�Eタを作る、E

保存するデータは自刁E��作ってから保存する、E

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

- 保存する�E刁E
- 更新した配�E

が完�Eに同じも�Eになる、E

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

### 5. updateRecord も同じ老E��

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

### 6. 設計�E老E��方

今回の設計�E目皁E�E「データ刁E��を防ぐこと」、E

そ�Eために、E

```text
チE�Eタの真実�E場所�E�Eingle Source of Truth�E�E
App
 ━Epatients
 ━Erecords
```

更新処琁E�� App に寁E��る、E

```text
App
 ━EaddPatient
 ━EupdatePatient
 ━EdeletePatient
 ━EaddRecord
 ━EupdateRecord
 ━EdeleteRecord
```

子コンポ�Eネント�E「表示 + 入力」だけ担当する、E

### 7. 今日の一番大事な琁E��

React では `setState` は即更新ではなぁE��E

なので、保存する�E列�E先に `next` を作ってから使ぁE��E

まとめE��趁E��要E��E

- `setState` は更新予紁E
- `appData` はまだ古ぁE

だから

`nextPatients` を作る
ↁE
それを保存すめE

## 2026-03-15 学習ログ�E�Eeact state更新 / setPatients の仕絁E���E�E

### 1. 自佁EsetPatients の役割

App では `patients` と `records` をまとめて `appData` とぁE�� state で管琁E��てぁE��、E

```js
const [appData, setAppData] = useState({
  patients: [],
  records: [],
});
```

そ�Eため `patients` だけ更新するための関数を�E作してぁE��、E

```js
const setPatients = (updater) => {
  setAppData((prev) => {
    const nextPatients =
      typeof updater === "function" ? updater(prev.patients) : updater;

    return { ...prev, patients: nextPatients };
  });
};
```

こ�E関数は **patients だけ更新するラチE��ー関数** として作られてぁE��、E

### 2. updater の意味

`setPatients()` に渡した値ぁE`updater` になる、E

例！E

```js
setPatients(nextPatients);
```

こ�E場吁E

```text
updater = nextPatients
```

になる、E

### 3. updater が関数かどぁE��を判宁E

```js
typeof updater === "function";
```

これは `updater` が関数かどぁE��をチェチE��してぁE��、E

### 4. updater が関数の場吁E

例！E

```js
setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
```

こ�E場吁E`updater` は関数なので

```js
nextPatients = updater(prev.patients);
```

が実行される、E

つまめE`prev.patients.map(...)` が実行されて、新しい配�Eが作られる、E

### 5. updater が関数じゃなぁE��吁E

例！E

```js
setPatients(nextPatients);
```

こ�E場吁E`updater` は配�Eなので

```js
nextPatients = updater;
```

になる、E

つまめE**渡された�E列をそ�Eまま使ぁE* とぁE��意味になる、E

### 6. なぜこの設計なのぁE

React の `setState` と同じ仕絁E��だから、E

React では

```js
setState(value);
setState((prev) => newValue);
```

の2つの書き方ができる、E

今回の `setPatients` は、この仕絁E��めE*自作で再現してぁE��**、E

### 7. prev の意味

```js
setAppData((prev) => {
```

こ�E `prev` は **現在の `appData`** を表す、E

つまめE

```js
prev = {
  patients: [...],
  records: [...],
};
```

になる、E

### 8. prev.patients

```js
updater(prev.patients);
```

の `prev.patients` は **現在の patients 配�E** である、E

### 9. React state更新の重要ルール

Reactでは **state を直接変更しなぁE* ため、`map` / `filter` / スプレチE��構文 `...` を使って新しい配�Eを作る、E

更新�E�E

```js
patients.map((p) => (p.id === updated.id ? updated : p));
```

削除�E�E

```js
patients.filter((p) => p.id !== id);
```

追加�E�E

```js
[...patients, newPatient];
```

### 今日の琁E��ポインチE

| 概念                            | 意味                              |
| ------------------------------- | --------------------------------- |
| `setPatients`                   | patients だけ更新するラチE��ー関数 |
| `updater`                       | `setPatients()` に渡した引数      |
| `typeof updater === "function"` | 関数か値か�E判宁E                 |
| `updater(prev.patients)`        | 関数なら実行して新しい配�Eを作る  |
| `updater` をそのまま使ぁE       | 配�Eなら直接 nextPatients にする  |
| `prev`                          | 現在の `appData`                  |

### 明日めE��こと

`setPatients` と `onSaveData` の役割の違いを整琁E��る、E

| 関数          | 役割                           |
| ------------- | ------------------------------ |
| `setPatients` | React 画面更新�E�Etate の予紁E��E|
| `onSaveData`  | サーバ�E保存！Eetch / PUT�E�E   |

Reactの基本思想 `UI = state` を理解する、E

## 2026-03-16 学習ログ�E�EetPatients / 関数の外と中 / prev / updater の琁E���E�E

### 1. 今回琁E��したぁE��ーチE

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

こ�Eコード�Eポイント�E、React が本当に持ってぁE�� state は `appData` であり、E
`patients` は単独の state ではなぁE`appData.patients` の一部だとぁE��こと、E

### 2. setPatients は React の関数ではなく、�E刁E��作った関数

React がくれるのは本来これだけ、E

```js
const [appData, setAppData] = useState({ patients: [], records: [] });
```

つまめEReact が持ってぁE��のは

- `appData`
- `setAppData`

の2つだけ、E

`setPatients` は React がくれたも�Eではなく、�E刁E��作った便利関数、E

```js
const setPatients = (updater) => {
  setAppData((prev) => {
    const nextPatients =
      typeof updater === "function" ? updater(prev.patients) : updater;

    return { ...prev, patients: nextPatients };
  });
};
```

これは一言でぁE��と、E

`setAppData` めEpatients 専用に使ぁE��すくしたラチE��ー関数、E

### 3. 関数の「外」と「中、E

こ�Eコードを琁E��するには、Eつの関数があることを�Eけて老E��る忁E��がある、E

```js
const setPatients = (updater) => {
  setAppData((prev) => {
    const nextPatients =
      typeof updater === "function" ? updater(prev.patients) : updater;

    return { ...prev, patients: nextPatients };
  });
};
```

外�E関数�E�E

```js
const setPatients = (updater) => {
```

ここが外。�E刁E��呼ぶ側の関数、E

例えばこう呼ぶ、E

```js
setPatients((prev) => [...prev, newPatient]);
```

こ�Eとき�E `(prev) => [...prev, newPatient]` は、E
`setPatients` の引数 `updater` に入る、E

つまめE

```js
updater = (prev) => [...prev, newPatient];
```

になる、E

中の関数�E�E

```js
setAppData((prev) => {
```

ここが中。これ�E React に渡してぁE��関数で、React があとで実行する関数、E

こ�E中の `prev` は React が渡してくる、E

つまめE

```js
prev = 前�E appData;
```

例！E

```js
prev = {
  patients: [...],
  records: [...],
};
```

### 4. prev ぁEつあるので混乱しやすい

今回ぁE��ばん大事だった�Eは、`prev` ぁE種類あること、E

1つ目�E�外�E prev

```js
setPatients((prev) => [...prev, newPatient]);
```

こ�E `prev` は `patients` を表す、E

つまめE

```js
prev = appData.patients;
```

2つ目�E�中の prev

```js
setAppData((prev) => {
```

こ�E `prev` は `appData` を表す、E

つまめE

```js
prev = {
  patients: [...],
  records: [...],
};
```

### 5. 外と中を図で整琁E

外！E

```text
setPatients((prev) => [...prev, newPatient])
            ↁE
      これは patients
```

中�E�E

```text
setAppData((prev) => { ... })
             ↁE
        これは appData
```

ここを混同すると、E

- `prev` は `appData` なのぁE
- `patients` なのぁE

が�Eからなくなる、E

でも実際は、E

- 外�E `prev` = `patients`
- 中の `prev` = `appData`

である、E

### 6. updater は何老E��

`updater` は引数、E
ただし、その中身が関数のこともあるし、E�E列�Eこともある、E

パターン1�E�関数を渡ぁE

```js
setPatients((prev) => [...prev, newPatient]);
```

こ�EとぁE

```js
updater = (prev) => [...prev, newPatient];
```

つまめE`updater` は関数、E

なので

```js
typeof updater === "function";
```

は `true`、E

パターン2�E��E列を渡ぁE

```js
const nextPatients = [...patients, newPatient];
setPatients(nextPatients);
```

こ�EとぁE

```js
updater = nextPatients;
```

つまめE`updater` は配�E、E

なので

```js
typeof updater === "function";
```

は `false`、E

### 7. typeof updater === "function" の意味

こ�E部刁E�E、E

```js
const nextPatients =
  typeof updater === "function" ? updater(prev.patients) : updater;
```

`updater` が関数なら、E

```js
updater(prev.patients);
```

を実行する、E

つまめE

```js
(prev) => [...prev, newPatient];
```

に対して

```js
prev.patients;
```

を渡してぁE��、E

結果、E

```js
[...prev.patients, newPatient];
```

が作られる、E

一方、`updater` が�E列なら、そのまま使ぁE��E

```js
nextPatients = updater;
```

### 8. 本物の更新は setAppData

`setPatients` がなかったら、`patients` を更新するには本当�Eこう書く忁E��がある、E

```js
setAppData((prev) => ({
  ...prev,
  patients: [...prev.patients, newPatient],
}));
```

つまり、本当�E更新関数は `setAppData`、E

`setPatients` はこれを短く、�EかりめE��くするため�E自作関数、E

### 9. ...prev が忁E��な琁E��

```js
return { ...prev, patients: nextPatients };
```

ここでの `...prev` は、`patients` 以外�EチE�Eタを消さなぁE��めに忁E��、E

今�E state はこう、E

```js
{
  patients: [...],
  records: [...],
}
```

もし `...prev` がなくてこうすると、E

```js
return { patients: nextPatients };
```

新しい state は

```js
{
  patients: nextPatients,
}
```

だけになる、E

すると `records` が消える、E

だから `...prev` を使って、前の state を�E部コピ�Eしてから
`patients` だけ上書きする忁E��がある、E

```js
return { ...prev, patients: nextPatients };
```

これで結果は

```js
{
  patients: nextPatients,
  records: 前�Erecords,
}
```

になる、E

### 10. React では直接 state を変更しなぁE

React では state を直接変更するとバグの原因になる、E

NG�E�E

```js
prev.patients.push(newPatient);
return prev;
```

これは

- 允E�E配�Eを直接変更してぁE��
- 允E�Eオブジェクトをそ�Eまま返してぁE��

ので、React が変化をうまく検知できなぁE��とがある、E

OK�E�E

```js
return {
  ...prev,
  patients: [...prev.patients, newPatient],
};
```

これは

- 新しい配�Eを作る
- 新しいオブジェクトを作る

ので、React が「新しい state になった」と判断しやすい、E

### 11. setPatients(prev => prev) の意味

```js
setPatients((prev) => prev);
```

これは

- 前�E patients をそのまま返す

とぁE��意味、E

つまり結果は `patients` は変わらなぁE��E
更新処琁E�E体�E走るが、返してぁE��値が同じなので、結果として state は変わらなぁE��E

### 12. 今回の一番大事な琁E��

今回の琁E��を一言でまとめるとこうなる、E

- React が本当に持ってぁE�� state は `appData`
- `patients` は `appData` の中の一部
- `setPatients` は自作�E便利関数
- 外�E `prev` は `patients`
- 中の `prev` は `appData`
- `...prev` は他�E値�E�Erecords`�E�を消さなぁE��めに忁E��E
- React では直接変更せず、新しい配�E・新しいオブジェクトを作る

### 13. 自刁E��の覚え方

迷ったらこう老E��る、E

- `setPatients(...)` は夁E
- `setAppData((prev) => ...)` は中
- 外�E `prev` は `patients`
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

こ�E流れはこう、E

1. 自刁E�� `setPatients(...)` を呼ぶ
2. `updater` に関数が�EめE
3. `setAppData` に関数を渡ぁE
4. React が中の `prev` に `appData` を渡ぁE
5. `updater(prev.patients)` を実行すめE
6. 新しい `patients` を作る
7. `return { ...prev, patients: nextPatients }` で `appData` を更新する

## 2026-03-18 学習ログ�E�Eeact チE�Eタフロー / state管琁E/ setPatients の設計理解�E�E

#### 1. ReactのチE�Eタの流れ�E�趁E��要E��E

ReactではチE�Eタは上から下へ流れる、E

App
ↁEprops
PatientList
ↁEprops
PatientDetails

これを一方向データフロー�E�Ene-way Data Flow�E�とぁE��、E

基本ルール

- チE�Eタ ↁE親から子へ
- 更新要汁EↁE子から親へ

#### 2. stateを親(App)で管琁E��る理由

今回のアプリでは state めEApp に雁E��させてぁE��、E

```js
const [appData, setAppData] = useState({
  patients: [],
  records: [],
});
```

構造

appData
━Epatients
━Erecords

琁E��

Single Source of Truth�E�データの真実�E1か所にする�E�E

もし子で state を持つと

- App.patients
- PatientList.patients

のようにチE�Eタが�E裂する、E

すると

- 更新したのに画面が変わらなぁE
- 古ぁE��ータが残る

などのバグになる、E

#### 3. 子コンポ�Eネント�EチE�Eタ本体を持たなぁE

子�E表示と操作だけ担当する、E

侁E

```js
function PatientList({ patients }) {
```

これは App の patients を表示してぁE��だけ、E

子�E患老E��ータの本体を持ってぁE��ぁE��E

#### 4. 子が持ってよいstate

子が持つのは UI状態、E

例えば

```js
const [selectedPatientId, setSelectedPatientId] = useState(null);
const [selectedRecordId, setSelectedRecordId] = useState(null);
const [activeView, setActiveView] = useState("list");
```

これは

- どの患老E��選んでぁE��ぁE
- どの画面を表示してぁE��ぁE

なので UI専用state、E

#### 5. selectedPatientId を持つ琁E��

患老E��ータ本体をコピ�Eするとズレが起きる、E

危険な侁E

```js
const [selectedPatient, setSelectedPatient] = useState(patient);
```

すると

- patients
- selectedPatient

の2つになる、E

更新ズレが起きる可能性がある、E

そ�Eため

```js
const [selectedPatientId, setSelectedPatientId] = useState(null);
```

にして

```js
patients.find((p) => p.id === selectedPatientId);
```

で取得する、E

これにより患老E��ータは1か所だけになる、E

#### 6. setPatients を�E作してぁE��琁E��

Appのstateは

```js
const [appData, setAppData] = useState({
  patients: [],
  records: [],
});
```

なので普通�Eこう更新する忁E��がある、E

```js
setAppData((prev) => ({
  ...prev,
  patients: nextPatients,
}));
```

しかしこれを子が書くと Appの冁E��構造 を子が知る忁E��がある、E

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

を作る、E

これにより子�E

```js
setPatients(nextPatients);
```

だけ書け�Eよい、E

つまめEAppの冁E��構造を隠す（カプセル化）、E

#### 7. 患老E��加の流れ

```js
const patientToAdd = { ...data, id: crypto.randomUUID() };

const nextPatients = [...patients, patientToAdd];

await onSaveData({ patients: nextPatients, records });

setPatients(nextPatients);
```

流れ

1. フォーム入劁E
2. patientToAdd作�E
3. nextPatients作�E
4. サーバ�E保孁E
5. Appのstate更新
6. React再描画
7. 新しいpatientsがpropsで子へ渡めE

#### 8. React再描画の仕絁E��

```js
setPatients(nextPatients);
```

が実行されると

Appのstate変更
ↁE
ReactがAppを�E実衁E
ↁE
新しいpropsが子に渡めE
ↁE
子が再描画

つまめE親state更新 ↁE再描画 ↁE新しいprops の流れ、E

#### 9. React設計まとめE

今回のアプリ設計�E

- state雁E���E�Eingle Source of Truth�E�E
- 一方向データフロー
- 責任の刁E��
- カプセル匁E

とぁE��Reactの基本設計を使ってぁE��、E

### 今日の琁E��

- stateは親に雁E��させめE
- 子�EチE�Eタ本体を持たなぁE
- propsは親のstateを表示する仕絁E��
- 更新は子�E親の関数を呼ぶ
- setPatientsはappData構造を隠すためE

## 2026-03-19

### 学習ログ�E�削除機�E / ラチE��ー関数 / 責任の刁E���E�E

---

#### 1. 削除処琁E�E全体�E流れ

削除機�Eは以下�E流れで実裁E��れてぁE��、E

```text
DeleteButton
  ↁE
PatientCard
  ↁE
PatientList�E�ラチE��ー関数�E�E
  ↁE
App�E�データ削除・保存！E
```

---

#### 2. App の役割�E�データの本体！E

Appでは「実際の削除処琁E��を拁E��する、E

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

ポイント！E

- `filter` を使って削除対象以外を残す
- `nextPatients / nextRecords` を作ってから保孁E
- チE�Eタの責任はすべて App にある

---

#### 3. PatientList の役割�E�ラチE��ー関数�E�E

削除後�E画面制御は PatientList が担当する、E

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

ポイント！E

- delete関数�E�Epp�E�を呼び出ぁE
- そ�E後にUI状態を更新する
- これが「ラチE��ー関数、E

---

#### 4. ラチE��ー関数の琁E��

ラチE��ー関数とは、E

「�Eの関数 + 追加処琁E��をまとめた関数

例！E

```js
const handleDeleteRecord = async (id) => {
  await deleteRecord(id); // 允E�E関数�E�データ削除�E�E
  setSelectedRecordId(null); // 追加処琁E��EI更新�E�E
  setActiveView("records"); // 追加処琁E��画面遷移�E�E
};
```

---

#### 5. 引数あり・なし�E判断

判断基準！E

- 関数の中で値が取れる ↁE引数ぁE��なぁE
- 外から渡さなぁE��刁E��らなぁEↁE引数ぁE��

例！E

```js
// 引数ぁE��なぁE��EelectedPatientがある！E
const handleDeletePatient = () => {
  deletePatient(selectedPatient.id);
};

// 引数ぁE���E�どのrecordか�EからなぁE��E
const handleDeleteRecord = (id) => {
  deleteRecord(id);
};
```

---

#### 6. UIコンポ�Eネント�E役割

DeleteButton�E�E

```js
export default function DeleteButton({ handleDelete }) {
  return <button onClick={handleDelete}>削除</button>;
}
```

PatientCard�E�E

```js
<DeleteButton handleDelete={onDelete} />
```

ポイント！E

- UIは処琁E��持たなぁE
- ただ関数を呼ぶだぁE

---

#### 7. 責任の刁E���E�最重要E��E

今回の一番重要な学び�E�E

- App ↁEチE�Eタの責任�E�削除・保存！E
- PatientList ↁE画面状態�E責任�E��E移・選択解除�E�E
- PatientCard / Button ↁEUI表示

つまめE

「UI・ロジチE��・チE�Eタ」を刁E��めE

---

#### 8. 今回の琁E��ポイントまとめE

- filterで削除する仕絁E��
- next配�Eを作ってから保存する流れ
- ラチE��ー関数の役割
- 引数あり / なし�E判断
- propsの正しい受け渡ぁE
- 責任の刁E���E�最重要E��E

---

#### 9. 感想�E�重要E��E

削除処琁E��通して、E

- stateの持ち場所
- 関数の役割刁E��
- UIとロジチE��の刁E��

が理解できてきた、E

特に「ラチE��ー関数」と「責任の刁E��」�E
React設計�E基礎として重要、E

## 2026-03-20

### 学習ログ�E�削除処琁E/ ラチE��ー関数 / イベント設計！E

---

### ① 削除処琁E�E全体構造

削除は1つのコンポ�EネントでめE��てぁE��のではなく、役割が�EかれてぁE��、E

- **DeleteButton**
  - ボタン表示のみ
  - `onClick` を実行するだけ（削除処琁E�EしなぁE��E

- **PatientCard**
  - `patient.id` を持ってぁE��
  - 押されたときに `onDelete(patient.id)` を呼ぶ
  - 削除対象を特定して親に渡す役割

- **PatientList**
  - 実際の削除処琁E��行う
  - `filter` を使って対象チE�Eタを除夁E
  - `onSaveData` を通して保存�Estate更新

---

### ② チE�Eタの流れ�E�重要E��E

削除の流れは以下�E通り

DeleteButton
ↁEクリチE��
ↁEPatientCard の handleDelete 実衁E
ↁEonDelete(patient.id)
ↁEPatientList の deletePatient(id)
ↁEfilterで削除
ↁEonSaveDataで保孁E
ↁEAppのstate更新
ↁE再描画

---

### ③ ラチE��ー関数の琁E��

ラチE��ー関数は難しいも�Eではなく、E

```jsx
const handleDelete = () => {
  onDelete(patient.id);
};
```

のように、E

**「忁E��な値をつけて親の関数を呼ぶための関数、E*

---

### ④ なぁE() => が忁E��か�E�重要E��E

```jsx
onClick={onDelete(patient.id)} ❁E
```

これはそ�E場で実行されてしまぁE

```jsx
onClick={() => onDelete(patient.id)} ✁E
```

これはクリチE��されたときに実行される

---

### ⑤ ルールまとめE

- 引数なぁEↁEそ�Eまま渡ぁE

```jsx
onClick = { handleDelete };
```

- 引数あり ↁEラチE��ー関数

```jsx
onClick={() => onDelete(patient.id)}
```

---

### ⑥ idを渡す理由�E�重要E��E

削除は忁E��対象を特定する忁E��があるため、E

```jsx
onDelete(patient.id);
```

のように **idを渡す設計が安�E**

- 選択状態に依存するとバグの原因になめE
- 一覧画面では特に危険

---

### ⑦ 設計�E琁E���E�Eeactの本質�E�E

- イベント�E **孁EↁE親に通知**
- stateは **親 ↁE子へ流れめE*

---

### ⑧ DeleteButtonの改喁E

```jsx
export default function DeleteButton({ onClick }) {
  return <button onClick={onClick}>削除</button>;
}
```

- UI専用コンポ�EネントになっぁE
- 再利用しやすい設訁E

---

### ⑨ 今日の一番大事な琁E��

- ボタンは削除してぁE��ぁE
- 削除は親がやめE
- 子�E「どれを削除するか」を伝えるだぁE

---

### ⑩ 一言まとめE

ラチE��ー関数 = イベンチE+ 忁E��な値を親に渡すため�E関数

## 2026-03-21

### 学習ログ�E�EiewMap / 画面刁E��替え設計�E琁E���E�E

---

### ① activeView と viewMap の関俁E

- `activeView` は「今どの画面を表示するか」を表ぁEstate
- `viewMap` は「画面名とコンポ�Eネント�E対応表、E

```txt
activeView�E�状態！EↁEviewMap[activeView] ↁE表示UI
```

---

### ② viewMap の正佁E

```jsx
const viewMap = {
  details: <PatientDetails />,
  vitals: <PatientVitals />,
  menu: <PatientMenu />,
};
```

- 配�EではなぁE**オブジェクチE*
- キー�E�Edetails"など�E�で管琁E��てぁE��

---

### ③ viewMap[activeView] の意味

```jsx
viewMap[activeView];
```

これは

```jsx
viewMap["details"];
```

のように変換され、E

対応するコンポ�Eネントを取り出してぁE��

---

### ④ 配�Eとの違い

- 配�E ↁEindex�E�E,1,2�E�で管琁E
- オブジェクチEↁE名前�E�Eetails, vitals�E�で管琁E

```txt
配�E = 頁E��で管琁E
オブジェクチE= 名前で管琁E
```

画面は「名前」で管琁E��た方が�EかりめE��ぁE��め、オブジェクトを使ぁE

---

### ⑤ [] 記法�E意味

```jsx
viewMap[activeView];
```

- これは配�EではなぁE**オブジェクトアクセス�E�ブラケチE��記法！E*
- 変数を使ってキーを指定できる

```txt
[] = チE�Eタ取得（オブジェクトから値を取り�Eす！E
```

---

### ⑥ ${} との違い

```js
`${value}`;
```

- 斁E���Eの中で変数を使ぁE��きに使ぁE

今回の `viewMap` とは無関俁E

```txt
${} = 斁E���E
[] = チE�Eタ取征E
```

---

### ⑦ ?? の役割

```jsx
viewMap[activeView] ?? <div>未実裁E/div>;
```

- 存在しなぁE��ーの場吁E`undefined` になめE
- `??` によって代替UIを表示

```txt
?? = フォールバック�E�保険�E�E
```

---

### ⑧ なぁEviewMap を使ぁE�EぁE

三頁E��算子との比輁E

```jsx
activeView === "details" ? (...) :
activeView === "vitals" ? (...) :
...
```

問題点

- 長くなると読みにくい

viewMapにすると

- 条件刁E��が1箁E��にまとまめE
- 追加・変更が簡十E
- 見通しが良くなめE

---

### ⑨ React設計とのつながり

- Reactは「state ↁEUI」�E仕絁E��
- viewMapはそ�Eルールを整琁E��たもの

```txt
state�E�EctiveView�E�EↁEUI�E�EiewMap�E�E
```

---

### ⑩ 今日の一番重要な琁E��

- viewMapは配�EではなくオブジェクチE
- []は配�Eではなく「オブジェクトアクセス、E
- activeViewをキーとしてUIを取り�EしてぁE��

---

### ⑪ 一言まとめE

```txt
viewMapは「画面吁EↁE表示コンポ�Eネント」�E対応表で、E
activeViewを使って表示するUIを取り�EしてぁE��
```

## 2026-03-22 学習ログ�E�EiewMap と CurrentView の琁E���E�E

### ① viewMap の役割

- `viewMap` は「画面ごとの表示方法（関数�E�」をまとめたオブジェクト、E
- 吁E�Eロパティには JSX ではなく「JSX を返す関数」を入れてぁE��、E

```js
const viewMap = {
  details: () => <PatientDetails />,
  records: () => <NursingRecordList />,
};
```

👉 画面そ�Eも�Eではなく「画面の作り方」を管琁E��てぁE��

---

### ② viewMap[activeView] の意味�E�重要E��E

```js
const CurrentView = viewMap[activeView];
```

これは

👉 オブジェクトから値めEつ取り出してぁE��だぁE

---

#### 刁E��して琁E��

```js
const activeView = "details";

viewMap[activeView]
// ↁE
viewMap["details"]
// ↁE
() => <PatientDetails />
```

つまめE

```js
const CurrentView = () => <PatientDetails />;
```

と同じ状態になめE

---

### ③ CurrentView の正佁E

- `CurrentView` は「関数が�Eった変数、E
- 関数を新しく作ってぁE��のではなく、E*viewMap に入ってぁE��関数を取り�EしてぁE��だぁE*

---

### ④ なぁECurrentView() と書く�EぁE

```js
CurrentView();
```

👉 関数を実行して JSX を作るため

---

#### 前との違い

【前、E

```js
viewMap[activeView];
```

👉 JSX�E�完�E品E��を直接表示してぁE��

【今、E

```js
viewMap[activeView];
```

👉 関数が返ってくるので、実行が忁E��E

---

### ⑤ 安�Eな表示方況E

```js
CurrentView ? CurrentView() : <div>未実裁E/div>;
```

- 関数があめEↁE実衁E
- 関数がなぁEↁE未実裁E

👉 undefined() を防ぐために忁E��E

---

### ⑥ 設計�E琁E���E�重要E��E

今回の変更で

- JSX�E�値�E�で管琁EↁE❁E
- 関数�E�作り方�E�で管琁EↁE✁E

に変わっぁE

---

### ⑦ 今�E琁E��まとめE

- viewMap は「画面の辞書、E
- activeView は「どの画面か�Eキー、E
- CurrentView は「取り�Eした関数、E
- CurrentView() で画面が生成される

---

### 明日の学習�EインチE

👉 `const CurrentView = viewMap[activeView];` の琁E��を深める

特にここを意識すめE

- オブジェクトから値を取り�EしてぁE��だぁE
- 関数を代入してぁE��だぁE
- 実行してぁE��わけではなぁE���E重要E��E

---

### 一言まとめE

👉 「関数を作ってぁE��」�EではなぁE
👉 「関数を取り�EしてぁE��だけ、E

## 2026-03-23 学習ログ�E�EctiveView / viewMap / CurrentView の完�E琁E���E�E

### ① activeView の役割

```js
const activeView = "records";
```

- 「今どの画面を表示するか」を表す値
- `viewMap` のキーと対応してぁE��

👉 画面を�Eり替えるスイチE��の役割

### ② viewMap の役割

```js
const viewMap = {
  details: () => <PatientDetails />,
  records: () => <NursingRecordList />,
};
```

- 画面ごとの表示方法（関数�E�をまとめたオブジェクチE
- JSXではなく「JSXを返す関数」を入れてぁE��

👉 画面そ�Eも�Eではなく「画面の作り方」を管琁E

### ③ viewMap[activeView] の意味�E�最重要E��E

```js
const CurrentView = viewMap[activeView];
```

刁E��:

```txt
activeView = "records"
ↁE
viewMap["records"]
ↁE
() => <NursingRecordList />
```

👉 関数を取り�EしてぁE��だぁE

### ④ CurrentView の正佁E

- 関数が�Eった変数
- 新しく作ってぁE��のではなく、`viewMap`から取り出してぁE��だぁE

### ⑤ 関数と実行�E違い�E�重要E��E

関数を取り�EぁE

```js
viewMap["details"];
```

👉 中身は `() => ...`

実行すめE

```js
viewMap["details"]();
```

👉 中身は JSX

まとめE

| 書き方           | 中身 |
| ---------------- | ---- |
| `viewMap[key]`   | 関数 |
| `viewMap[key]()` | JSX  |

### ⑥ なぁECurrentView() と書く�EぁE

```js
CurrentView();
```

👉 関数を実行して JSX を生成するためE

### ⑦ 安�Eな表示

```js
CurrentView ? CurrentView() : <div>未実裁E/div>;
```

- 関数があめEↁE実衁E
- 関数がなぁEↁE未実裁E

👉 `undefined()` を防ぁE

### ⑧ なぁEconst CurrentView を�Eに書く�EぁE

```js
const CurrentView = viewMap[activeView];
```

- 表示する画面を「�Eに決めてぁE��、E
- `return` の中をシンプルにするため

👉 準備と表示を�EけてぁE��

### ⑨ 設計�E本質�E�趁E��要E��E

今回の学びで

- JSX�E�完�E品E��で管琁EↁE❁E
- 関数�E�作り方�E�で管琁EↁE✁E

に変わっぁE

### ⑩ イメージまとめE

- `viewMap` ↁEメニュー表
- `activeView` ↁE注斁E
- `CurrentView` ↁE選ばれた料理
- `CurrentView()` ↁE料理を作る

### 今日の一言まとめE

👉 「関数を作ってぁE��」�EではなぁE
👉 「関数を取り�Eして、あとで実行してぁE��、E

## 2026-03-24 学習ログ�E�Eouter導�E / URLで画面管琁E��E

### ① viewMap の復翁E

`viewMap` は「画面の辞書」、E
値は JSX そ�Eも�Eではなく、JSX を返す関数として持つ、E

```js
const viewMap = {
  details: () => <PatientDetails />,
};
```

学び:

```js
const CurrentView = viewMap[activeView];
```

これは「関数を取り�EしてぁE��」、E

```js
CurrentView();
```

これは「関数を実行して画面を生成してぁE��」、E

つまめE

👉 画面 = 関数の戻り値

### ② Router の導�E

めE��たこと:

```bash
npm install react-router-dom
```

Router の役割:

👉 URL によって画面を�Eり替える

今までとの違い:

| 今まで        | Router    |
| ------------- | --------- |
| stateで管琁E  | URLで管琁E|
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
  <Route path="/test" element={<div>チE��チE/div>} />
</Routes>
```

学び:

👉 Router は 1 つだぁE
👉 今回は `main.jsx` に置く設訁E

### ④ よく出たエラーと琁E��

❁E`react-router-dom` がなぁE

👉 インスト�EルしてぁE��ぁE

```bash
npm install react-router-dom
```

❁E`useNavigate is not defined`

👉 import 忘れ

```js
import { useNavigate } from "react-router-dom";
```

❁ERouter ぁE個あめE

```txt
You cannot render a <Router> inside another <Router>
```

👉 `main` と `App` の両方に書ぁE��ぁE��

学び:

👉 Router は 1 つだぁE

### ⑤ useNavigate�E�画面遷移�E�E

```js
const navigate = useNavigate();

navigate("/test");
```

学び:

👉 ボタンで画面遷移できる

### ⑥ useParams�E�ERLから値取得！E

```js
const { id } = useParams();
```

侁E `/patient/123`

👉 `id = "123"`

### ⑦ チE�Eタ取得�E老E��方�E�趁E��要E��E

❁E間違ぁE

```js
PatientList.find(...)
```

👉 コンポ�Eネント�E配�EではなぁE

✁E正解:

```js
const patient = patients.find((p) => String(p.id) === id);
```

学び:

👉 チE�Eタは App が持つ
👉 子�E props でもらぁE

### ⑧ Router化�E本質�E�今日の一番大事！E

今まで:

```js
setSelectedPatientId(id);
setActiveView("details");
```

これから:

```js
navigate(`/patient/${id}`);
```

つまめE

👉 状態！Etate�E�を URL に持たせる

### 🔥 今日の琁E��まとめE��趁E��要E��E

👉 React の画面は3段階で管琁E��きる

① 関数�E�EiewMap�E�E
② state�E�EctiveView�E�E
③ URL�E�Eouter�E�EↁE今こぁE

## 2026-03-25 学習ログ�E�Eouter〜詳細画面への遷移�E�E

### ① Router の本質琁E��

```txt
main.jsx ↁERouter�E��E口�E�E
   ↁE
App.jsx ↁERoutes�E�ルール�E�E
   ↁE
Route ↁEどの画面を�Eすか
```

重要�EインチE

- Router は 1 つだけ！Eain に置く！E
- App では Routes を書ぁE
- Routes の中は Route だぁE

つまめE

👉 Router = URL と画面をつなぐ仕絁E��

### ② 画面遷移�E�EseNavigate�E�E

```js
navigate("/patient/1");
```

流れ:

```txt
クリチE��
ↁE
navigate
ↁE
URL変更
ↁE
Route が反忁E
ↁE
画面刁E��替ぁE
```

つまめE

👉 navigate は URL を変更するだぁE

### ③ URLから値を取得！EseParams�E�E

```js
const { id } = useParams();
```

侁E `/patient/5`

👉 `id = "5"`

### ④ チE�Eタの取得ロジチE��

```js
const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);
```

使ぁE�EぁE

| 関数     | 用送E        |
| -------- | ------------ |
| `find`   | 1件�E�患老E��E |
| `filter` | 褁E���E�記録�E�E|

### ⑤ 今日一番重要な琁E��

❁E最初�Eミス:

```js
PatientList.find(...)
```

👉 コンポ�EネントとチE�Eタを混同してぁE��

✁E正解:

```js
patients.find(...)
```

本質:

| 名前          | 正佁E          |
| ------------- | -------------- |
| `PatientList` | UI�E�部品E��E    |
| `patients`    | チE�Eタ�E��E列！E|

### ⑥ エラーから学んだこと

エラー:

```txt
Cannot read properties of undefined (reading 'id')
```

👉 変数ぁE`undefined`

学び:

- `map` の変数名ミスに注意すめE
- スコープを意識すめE
- `console.log` で確認すめE

### ⑦ 「飛�EなぁE���E正佁E

実際に起きてぁE��こと:

👉 URL は正しく変わってぁE��

本当�E問顁E

👉 `PatientPage` でチE�Eタが取れてぁE��かっぁE

学び:

👉 Router はチE�Eタを渡さなぁE

```jsx
<Route element={<PatientPage patients={...} records={...} />} />
```

👉 props で渡す忁E��がある

### ⑧ PatientPage の完�E形�E�今日�E�E

```jsx
import { useParams } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientPage({ patients, records }) {
  const { id } = useParams();

  const patient = patients.find((p) => String(p.id) === id);
  const patientRecords = records.filter((r) => String(r.patientId) === id);

  if (!patient) return <div>患老E��見つかりません</div>;

  return (
    <div>
      <PatientCard patient={patient} records={patientRecords} />
    </div>
  );
}
```

役割の刁E��:

- `PatientPage` ↁEURLから患老E��探す�E口
- `PatientCard` ↁE渡された患老E��表示する

### 🔥 今日の最重要まとめE

| 機�E        | 役割                         |
| ----------- | ---------------------------- |
| `Router`    | URL で画面を�Eり替える仕絁E�� |
| `navigate`  | URL を変更する命令           |
| `useParams` | URL から値を取り�EぁE        |
| props       | チE�Eタを子に渡す手段         |

👉 Router 自身はチE�Eタを渡さなぁE��データは props で渡す、E

## 2026-03-27 学習ログ�E�ルーチE��ングと props のズレを直す！E

### 1) 今日起きたこと

患老E��覧から遷移した先で、E

- メニュー�E�患老E��報 / バイタル / 看護記録�E�が消えめE
- `ReferenceError: PatientVitals is not defined`
- `Cannot read properties of undefined (reading 'room')`

が発生した、E

### 2) 原因の整琁E

#### 原因A: import してぁE��ぁE��ンポ�Eネントを使ってぁE��

```jsx
// App.jsx
<Route path="/patient/:id/vitals" element={<PatientVitals ... />} />
```

こ�Eように使ってぁE��のに、�E頭で import がなぁE��実行時エラーになる、E

```jsx
import PatientVitals from "./PatientVitals";
import NursingRecordList from "./NursingRecordList";
```

#### 原因B: 1人刁E��忁E��なのに、�E体�E列を渡してぁE��

`PatientVitals` / `NursingRecordList` は、E人刁E�E患老E��ータ」を前提にしてぁE��、E

しかぁERoute 側で次のように渡してぁE��、E

```jsx
<PatientVitals patients={appData.patients} records={appData.records} />
```

こ�E状態で `patients.room` を読むと落ちる、E

```jsx
{patients.room}号室 {patients.name} さん
```

配�Eに `room` はなぁE��めE`undefined` になる、E

### 3) 学んだ直し方�E�手頁E��E

#### 手頁E: URLから id を取めE

```jsx
import { useParams } from "react-router-dom";

const { id } = useParams();
```

#### 手頁E: 全体かめE人を探ぁE

```jsx
const patient = patients.find((p) => String(p.id) === id);
```

#### 手頁E: そ�E患老E�E記録だけに絞る

```jsx
const patientRecords = records.filter((r) => String(r.patientId) === id);
```

#### 手頁E: 画面では 1人チE�Eタを使ぁE

```jsx
<p>
  {patient.room}号室 {patient.name} さん
</p>
```

### 4) ルーチE��ングの老E��方�E�今日の核忁E��E

Route には「表示部品を直接置く」より、E

- URLから id を取征E
- 対象 patient を特宁E
- 子コンポ�Eネントへ渡ぁE

とぁE��流れを作るコンチE��を置くと安定する、E

例（老E��方�E�E

```jsx
<Route path="/patient/:id" element={<PatientPage ... />} />
<Route path="/patient/:id/vitals" element={<PatientPage ... />} />
<Route path="/patient/:id/records" element={<PatientPage ... />} />
```

`PatientPage` で id 解決と props 整琁E��してから、E
`PatientCard` / `PatientVitals` / `NursingRecordList` を�Eし�Eける、E

### 5) 今日のまとめE��つまり！E

- 画面エラーの多くは「データの形のズレ」で起きる
- `patients`�E��E列）と `patient`�E�E件�E�を混ぜると落ちめE
- URL�E�Ed�E��E 1人特宁EↁE忁E��なpropsで表示、�E頁E��老E��ると迷ぁE��くい
- import不足は実行時 `is not defined` の定番原因

## 2026-04-03

### 学習ログまとめE��Eeact基礁E-> 実裁E��で�E�E

### 1. チE�Eタ取得！EseParams + find�E�E

```js
const { id } = useParams();
const patient = patients.find((p) => String(p.id) === id);
```

ポインチE

- `useParams()` で取得しぁE`id` は string
- 比輁E��に `String(p.id)` で型をそろえる

### 2. 配�Eから抽出�E�Eilter�E�E

```js
const patientRecords = records.filter((r) => String(r.patientId) === id);
```

ポインチE

- `filter` は条件に合う要素だけを残す
- 「どの配�Eを対象にするか」が重要E

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

ポインチE

- `map` は配�EをUIに変換する
- `key` は忁E��E
- `?.` は値がなぁE��き�Eエラーを防ぁE

### 4. オプショナルチェーン�E�E.�E�E

```js
r.vitals?.temperature;
```

意味:

- `vitals` があれ�E値を取征E
- なければ `undefined` を返してエラーを回避

### 5. コンポ�Eネント�E割

```jsx
<RecordItem record={r} />;

export default function RecordItem({ record }) {
  return <p>{record.date}</p>;
}
```

ポインチE

- コンポ�Eネント�E再利用できる部品E
- `props` でチE�Eタを渡ぁE

### 6. propsの琁E��

```jsx
<RecordItem record={r} />
```

ポインチE

- `record` は props の名前
- `r` は渡す実データ

つまめE

- 親 -> 子へチE�Eタを渡ぁE

### 7. stateを親に持つ琁E��

ポインチE

- state を親に雁E��E��るとチE�Eタ刁E��を防げる
- 親ぁEstate 管琁E��子�E表示中忁E

### 8. 削除処琁E��Eilter + state更新�E�E

```js
const handleDelete = (id) => {
  const nextRecords = records.filter((r) => r.id !== id);
  setRecords(nextRecords);
};
```

ポインチE

- 削除は「対象以外を残す、E
- state は新しい配�Eで更新する

### 9. 親 -> 子イベンチE

```jsx
<RecordItem onDelete={handleDelete} />
<button onClick={() => onDelete(record.id)}>削除</button>
```

ポインチE

- 親が�E琁E��持つ
- 子が実行�Eきっかけを作る

### 10. filter条件の琁E��

単体条件:

```js
r.id === 3; // 3だけ残す
r.id !== 3; // 3を削除
```

褁E��条件:

```js
r.id === 2 || r.id === 4;
```

includes�E�実務でよく使ぁE��E

```js
[2, 4].includes(r.id);
```

否定！Eと4を削除�E�E

```js
![2, 4].includes(r.id);
```

### 今回の最重要まとめE��本質�E�E

Reactの設訁E

- state -> 親が持つ
- props -> 子に渡ぁE
- イベンチE-> 子から親に伝えめE

配�E操佁E

- `filter` -> 条件に合うも�Eを残す
- `map` -> 表示に変換する
- `includes` -> 褁E��条件を簡潔に書ぁE

### つまめE

今回の学びは「部品を刁E��る」「データの流れをそろえる」「�E列操作でUIを作る」�E3つ、E
こ�E3つを守ると、Reactのコード�E読みめE��く、壊れにくくなる、E

## 2026-04-07

### 学習ログまとめE

今日は主に React Router / props / state の責任篁E�� / 編雁E��面の設訁Eを整琁E��た日でした、E

#### 1. NursingRecordItem is not defined の意味

エラー:

ReferenceError: NursingRecordItem is not defined

これは、App.jsx で <NursingRecordItem /> を使ってぁE��のに、import できてぁE��ぁE�E名前が定義されてぁE��ぁE��ぁE��意味、E

学び:

- JSXで使ぁE��ンポ�Eネント�E忁E�� import が忁E��E
- エラー斁E�E is not defined は「その名前が存在しなぁE��と読む

#### 2. Route の path は親子関係で老E��めE

親RouteぁE

<Route path="/patient/:id" ...>

なら、子Routeでさらに

path="patient/:id/records/:recordId"

と書く�Eは重褁E��E

正しくは
path="records/:recordId"

学び:

- 子Routeでは親の path をもぁE��度書かなぁE
- useParams() の値は Route で書ぁE��名前と一致させめE

#### 3. setIsEditing is not a function の原因

PatientDetail.jsx めENursingRecordItem.jsx で

setIsEditing(true)

を呼んでぁE��が、その setIsEditing ぁEprops で渡されてぁE��かった、E

学び:

- 使ぁE��数は props で受け取るか、�E刁E�E中で定義する忁E��がある
- ○○ is not a function は「関数だと思って呼んだが違った」と読む

#### 4. isEditing はどこで持つべきか

今回一番大事だったところ、E

結諁E

- patients, records などの実データ -> App が持つ
- isEditing, isAdding などの画面表示用 state -> そ�E画面のコンポ�Eネントが持つ

侁E

const [isEditing, setIsEditing] = useState(false);

めENursingRecordItem めEPatientDetail の中で持つのはOK、E

学び:

- isEditing はサーバ�E保存するデータではなぁE
- これは「今その画面で編雁E��ォームを見せるか」とぁE�� UI状慁E
- なので チE�Eタの刁E��にはならなぁE

#### 5. チE�Eタの刁E��とは何か

前に学んだ「データの刁E��」�E、E

侁E
const [patients, setPatients] = useState([...]);
const [selectedPatient, setSelectedPatient] = useState(patientObject);

のように、同じ意味のチE�Eタを褁E��の state で持つこと、E

学び:

- patients と selectedPatient の両方に患老E��ータを持つとズレめE
- だから基本は 允E��ータは1か所
- 今回の isEditing は允E��ータではなぁE�Eで刁E��ではなぁE

#### 6. extractUsedRoomNumbers is not defined

エラー:

ReferenceError: extractUsedRoomNumbers is not defined

原因:
App.jsx めEPatientDetail.jsx で使ってぁE��のに import してぁE��かった、E

学び:

- util関数も使ぁE��めEimport 忁E��E
- is not defined は「その名前がなぁE��E

#### 7. Cannot read properties of undefined (reading 'filter')

エラー:

Cannot read properties of undefined (reading 'filter')

原因:
extractUsedRoomNumbers(patients.id) と書ぁE��ぁE��ため、patients は配�Eなのに .id を取ろうとして undefined になった、E

正しくは
extractUsedRoomNumbers(patients, id)

学び:

- patients は配�E
- 配�Eに .id はなぁE
- util関数には「�E列そのも�E」を渡ぁE

#### 8. updatePatient is not a function

エラー:

updatePatient is not a function

原因:
PatientDetail.jsx では updatePatient(updated) を呼んでぁE��のに、親の App.jsx から updatePatient めEprops で渡してぁE��かった、E

学び:

- 子で使ぁE��数は親から渡す忁E��がある
- props 名がずれてぁE��も同じエラーになめE

#### 9. Maximum update depth exceeded

エラー:

Maximum update depth exceeded

原因候裁E
useEffect の中で親の state を更新し続けて再描画ループになった、E

特に怪しかった�Eはこれ:

useEffect(() => {
if (onErrorsChange) onErrorsChange(errors);
}, [errors, onErrorsChange]);

学び:

- useEffect の中で親の setState を呼ぶとループしめE��ぁE
- errors のようなオブジェクト�E参�Eが変わりやすい
- 同じ冁E��の errors を何度も親に送らなぁE��夫が忁E��E

#### 10. useRef を使ったガード�E意味

提案されたコーチE

const prevErrorSignatureRef = useRef("");

useEffect(() => {
const signature = JSON.stringify(errors);
if (signature === prevErrorSignatureRef.current) return;
prevErrorSignatureRef.current = signature;
if (onErrorsChange) onErrorsChange(errors);
}, [errors, onErrorsChange]);

何をしてぁE��ぁE

- 前回の errors を文字�Eで覚えておく
- 今回の errors と同じなら親へ送らなぁE
- 違う時だぁEonErrorsChange(errors) を呼ぶ

学び:

- useRef は「前回�E値を覚えておく箱、E
- 同じエラー冁E��なら�E琁E��止められる
- 無限ループ対策に使える

#### 11. PatientDetail と NursingRecordItem の編雁E�E違い

PatientDetail:

- 患老E��報の表示
- isEditing めEtrue にすると、同じ画面冁E��患老E��報フォームを表示

NursingRecordItem:

- 看護記録1件の表示
- isEditing めEtrue にすると、その記録の編雁E��ォームを表示

学び:

- 「患老E��報の編雁E��と「記録の編雁E���E別
- 同じ「編雁E��でも責任のあるコンポ�Eネントが違う

### 今日の一番大事な琁E��

1. App が持つも�E

- patients
- records
- add / update / delete
- 保存�E琁E

2. 吁E��面が持つも�E

- isEditing
- isAdding
- フォームの開閉
- 画面冁E��け�EUI状慁E

3. チE�Eタの刁E��とは

- 同じ意味の実データを褁E�� state で持つこと
- isEditing は実データではなぁE�Eで刁E��ではなぁE

### 今日のコード理解キーワーチE

- is not defined -> 名前が存在しなぁE
- is not a function -> 関数として呼んだが関数ではなぁE
- Cannot read properties of undefined -> undefined.xxx をしようとした
- Maximum update depth exceeded -> state更新ルーチE

## 2026-04-08

### 学習ログ

チE�Eマ：prevErrorSignatureRef / JSON.stringify(errors) / 子�E親のエラー通知の流れ

#### 1. 今日めE��たこと

今日は、フォームのエラー通知まわりのコードを中忁E��確認した、E

扱った主なコード�Eこれ、E

`js
const prevErrorSignatureRef = useRef("");

useEffect(() => {
const signature = JSON.stringify(errors);
if (signature === prevErrorSignatureRef.current) return;
prevErrorSignatureRef.current = signature;
if (onErrorsChange) onErrorsChange(errors);
}, [errors, onErrorsChange]);
`

最初�E

- prevErrorSignatureRef の名前の意味
- なぁEJSON.stringify(errors) を使ぁE�EぁE
- if (signature === prevErrorSignatureRef.current) return; の意味
- 親の globalErrors とのつながり

があぁE��ぁE��ったが、少しずつ整琁E��きた、E

#### 2. prevErrorSignatureRef の意味

単語を刁E��るとこう、E

- prev = 前回の
- Error = エラー
- Signature = 識別用の印、特徴
- Ref = 参�E

つまり�E体では、E

「前回�Eエラー冁E��の識別斁E���Eを覚えておく ref、E

とぁE��意味になる、E

今�Eコードでは、errors そ�Eも�Eではなく、E
JSON.stringify(errors) で作った文字�Eを前回値として保存してぁE��、E

#### 3. 子と親の関俁E

今日の大事な琁E��ポイント�Eここ、E

子コンポ�Eネント�E:

`js
useEffect(() => {
  if (onErrorsChange) onErrorsChange(errors);
}, [errors, onErrorsChange]);
`

これは「子�E errors が変わったら、親へ通知する処琁E��だった、E

親コンポ�Eネント�E:

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

これは「親が受け取っぁEglobalErrors を表示用に管琁E��る�E琁E��だった、E

つまり流れはこう、E

`子�E errors が変わめE
ↁE
子�E useEffect が動ぁE
ↁE
onErrorsChange(errors) を呼ぶ
ↁE
親の globalErrors が更新されめE
ↁE
親の useEffect([globalErrors]) が動ぁE
ↁE
displayErrors に反映する`

#### 4. なぜガードが忁E��だった�EぁE

允E�Eままだと、子で同じ errors を何回も親に送ってしまぁE��能性がある、E

そうすると親では毎回:

- globalErrors が更新されたことになめE
- 再レンダーが増えめE
- 表示処琁E��タイマ�Eが何度も動ぁE

とぁE��無駁E��起きる、E

そ�Eため、E

`js
if (signature === prevErrorSignatureRef.current) return;
`

を�Eれて、前回と同じ冁E��の errors なら親に再通知しなぁE��ぁE��した、E

#### 5. なぁEJSON.stringify(errors) を使ぁE�EぁE

errors はオブジェクトなので、そのままだと中身ではなく参照で比輁E��れる、E

たとえ�E:

`js
const a = { message: "忁E��E };
const b = { message: "忁E��E };

console.log(a === b); // false
`

中身が同じでも、別、E��作られたオブジェクト�E false になる、E

だから errors もそのままでは比輁E��づらい、E

そこで:

`js
const signature = JSON.stringify(errors);
`

として、オブジェクトを比輁E��めE��ぁE��字�Eに変換してぁE��、E

JSON.stringify(errors) の目皁E�E「errors を比輁E��めE��ぁE��字�Eにするため」、E

#### 6. JSON と data.json の違い

| 用送E                  | 冁E��                                                       |
| ---------------------- | ---------------------------------------------------------- |
| JSON.stringify(errors) | フロント�Eで使ぁE��エラー比輁E��。一時的な斁E���E化、E        |
| server/data.json       | サーバ�E側で使ぁE��患老E��記録の保存用。実際のアプリチE�Eタ、E|

同じ「JSON」とぁE��言葉でも、比輁E��の斁E���E化と保存ファイルでは役割が違ぁE��E

#### 7. useRef("") が空斁E��なのに大丈夫な琁E��

`js
const prevErrorSignatureRef = useRef("");
`

最初�E prevErrorSignatureRef.current === "" だが、それ�E初期値であってずっと空斁E���EままではなぁE��E

1回目の流れ�E�Errors が空オブジェクト�E場合！E

`js
const signature = JSON.stringify(errors); // "{}"

if ("{}" === "") return; // false なので止まらなぁE

prevErrorSignatureRef.current = "{}"; // ここで更新されめE
`

2回目以降（同ぁEerrors の場合！E

`js
if ("{}" === "{}") return; // true なので止まめEↁE親へ送らなぁE
`

#### 8. なぁEerrors が空だと "{}" になる�EぁE

`js
JSON.stringify({}); // "{}"
`

- {} はオブジェクチE
- "{}" は斁E���E

こ�E2つは別物、ESON.stringify はオブジェクトを斁E���Eに変換する、E

#### 9. 今日の一番大事な琁E��

`js
const signature = JSON.stringify(errors);
if (signature === prevErrorSignatureRef.current) return;
`

これは「今回のエラー冁E��」と「前回保存しておいたエラー冁E��」が同じなら、親へ送らず終わるとぁE��意味、E

こ�Eコード�E体�E、E*同じ errors を何回も親に通知しなぁE��め�EガーチE*である、E

#### 10. 今日の琁E��ポイントを一言ずつ

- prevErrorSignatureRef は、前回�Eエラー冁E��の斁E���Eを覚えておく ref
- 子�E useEffect は親への通知
- 親の useEffect は表示処琁E
- errors はオブジェクトなので、そのままだと比輁E��にくい
- だから JSON.stringify(errors) で斁E���Eにする
- useRef("") の空斁E���E初期値で、E回目の実行後に更新されめE
- JSON は形式、data.json はそ�E形式で保存されたファイル

#### 11. 次回�E復習スタート地点

- if (signature === prevErrorSignatureRef.current) return; を�E刁E�E言葉で説明すめE
- なぁEerrors ではなぁEsignature を保存してぁE��のか整琁E��めE
- なぁEref で持って、state では持たなぁE�Eか確認すめE

#### 12. 趁E��くまとめると

同じエラー冁E��を親に何度も送らなぁE��めに、errors めEJSON.stringify で斁E���E化し、前回�E斁E���Eと ref で比輁E��てぁE��、E

## 2026-04-09 ### 学習ログまとめE

今日は主に、エラー比輁E�E仕絁E�� と React / Router の復翁Eを進めた、E

#### 1. if (signature === prevErrorSignatureRef.current) return; の琁E��

こ�E1行�E、E

「今回の errors の中身が前回と同じなら、同じ通知をもぁE��度しなぁE��めに止める、E

とぁE��意味、E

ポインチE

- signature は JSON.stringify(errors) で作った比輁E��の斁E���E
- prevErrorSignatureRef.current は前回のエラー冁E��を覚えてぁE��
- 同じなめEreturn で処琁E��亁E
- 役割は 同じエラー通知の繰り返し防止

#### 2. なぁEerrors ではなぁEsignature を保存する�EぁE

errors はオブジェクトなので、そのまま === で比べてめE
「中身が同じか」ではなく「同じオブジェクトか」を見てしまぁE��E

そ�Eため、E

const signature = JSON.stringify(errors);

で斁E���Eにして、中身ベ�Eスで比輁E��めE��くしてぁE��、E

整琁E

- errors -> オブジェクチE
- signature -> 比輁E��めE��ぁE��字�E
- 前老E�E比輁E��にくい
- 後老E�E比輁E��めE��ぁE

#### 3. ref で持って、state で持たなぁE��由

prevErrorSignatureRef.current は、E

- 画面に表示しなぁE
- 前回値を覚えるだぁE
- 変わっても�E描画は不要E

なので state ではなぁEref を使ぁE��E

琁E��:

- state にすると更新時に再描画が起きる
- 今回は UI に見せる値ではなぁE
- ただ比輁E��に覚えておきたいだぁE

つまり、E

- 表示用の値 -> state
- 比輁E��・メモ用の値 -> ref

とぁE��使ぁE�Eけを確認した、E

#### 4. errors が空のとぁE"{}" になる理由

errors が空のとき�E空オブジェクト、E

{}

これめE

JSON.stringify(errors)

すると

"{}"

になる、E

流れ:

- errors が空
- signature = "{}"
- 前回めE"{}" なめEreturn

つまり、E

空エラー状態が続いてぁE��だけなら、同じ通知を何度もしなぁE

とぁE��仕絁E��、E

#### 5. useEffect の流れ

useEffect(() => {
const signature = JSON.stringify(errors);
if (signature === prevErrorSignatureRef.current) return;
prevErrorSignatureRef.current = signature;
if (onErrorsChange) onErrorsChange(errors);
}, [errors, onErrorsChange]);

こ�E処琁E�E頁E��は、E

- 今�E errors を文字�Eにする
- 前回と同じか比輁E��めE
- 違うなめEref に保存すめE
- 親へ errors を渡ぁE

大事な琁E��:

比輁E-> 保孁E-> 親に通知

であって、いきなり親へ渡してぁE��わけではなぁE��E

#### 6. なぜ�Eに保存してから親へ通知するのぁE

prevErrorSignatureRef.current = signature;
if (onErrorsChange) onErrorsChange(errors);

こ�E頁E��にすることで、親の setState による再描画が起きても、次回�E

「もぁE��じ�E容は保存済み、E

と判定しめE��くなる、E

今日の琁E��:

- 先に親へ通知すると、同じ�E容でも無駁E��更新につながりめE��ぁE
- 親の state 更新 -> 再描画 -> effect 再実衁Eの流れがあり得る
- だから 先に ref に記録しておく のがよぁE

#### 7. if (onErrorsChange) onErrorsChange(errors); の琁E��

これは

「onErrorsChange が渡されてぁE��ときだけ実行する、E

とぁE��意味、E

ポインチE

- if の条件は onErrorsChange
- 関数が渡されてぁE��ば truthy
- 渡されてぁE��ければ undefined で falsy
- そ�Eため安�Eに呼べめE

#### 8. truthy / falsy の琁E��

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

今回のコードでは、E

- onErrorsChange が関数なめEtruthy
- undefined なめEfalsy

だから

if (onErrorsChange)

で「その関数ある�E�」を確認できる、E

#### 9. if と ?. の使ぁE�EぁE

ただ「あれ�E呼ぶだけ、E
onErrorsChange?.(errors);

前後に処琁E��ある:
if (onErrorsChange) {
prevErrorSignatureRef.current = signature;
onErrorsChange(errors);
}

今日の整琁E

- 1行で安�Eに呼ぶだぁE-> ?.
- 褁E��の処琁E��まとめたぁE-> if

#### 10. Router の復習に戻っぁE

Router では、E

今どの画面か�E activeView ではなぁEURL が表ぁE

ことを確認した、E

侁E

- / -> 患老E��覧
- /patient/:id -> 患老E�Eージ
- /patient/:id/vitals -> バイタル一覧
- /patient/:id/records -> 看護記録一覧

大事な老E��方:

- BrowserRouter は main.jsx に1回だけ置ぁE
- App.jsx では <Routes> と <Route> を書ぁE
- :id は変わる値が�Eる場所
- useParams() で id を取り�EぁE
- patients.find(...) で患老E��探ぁE

つまり、E

選択中の患老E�� state に持つより、URL の id から探ぁE

とぁE��老E��方を�E確認した、E

#### 11. 今日解決したエラー

エラー冁E��はこれだった、E

TypeError: console.tabele is not a function

原因:

console.table と書くべきところめE
console.tabele とスペルミスしてぁE��、E

結果:

- PatientDetail.jsx 冁E��例外が発甁E
- React ぁEAn error occurred in the <PatientDetail> component. と追加で警告を出してぁE��

学び:

- まず見るべき�E 最初�E1衁E
- どのファイルの何行目ぁE
- 何が not a function なのぁE

今回は
PatientDetail.jsx:75 と console.tabele is not a function
が本体だった、E

### 今日の大事な琁E��を一言でまとめると

エラー比輁E

- errors はそ�Eままだと比輁E��にくい
- JSON.stringify(errors) で比輁E��斁E���Eにする
- 前回と同じなら通知しなぁE
- 前回値は ref で持つ

関数呼び出ぁE

- if (onErrorsChange) は「その関数ある�E�」�E確誁E
- ?. は「あれ�E呼ぶ」�E短ぁE��き方

Router:

- どの画面か�E state ではなぁEURL
- どの患老E��は URL の id
- useParams() で受け取って find() する

## 2026-04-11

### 学習ログまとめE

今日は React Router の続きを進めて、URL と画面表示のつながりをかなり整琁E��きました、E

#### 今日のチE�EチE

React Router で、E

- URL で患老E��区別する
- そ�EURLに合う画面を表示する
- URL から患老EDを取り�Eして、患老E人と記録一覧を作る

ことを理解しました、E

#### 1. React Router の役割刁E��

- main.jsx に BrowserRouter を置ぁE
- App.jsx に Routes と Route を書ぁE
- 吁E�Eージで useParams() めEuseNavigate() を使ぁE

整琁E��ると、E

| Hook / コンポ�EネンチE| 役割                                   |
| --------------------- | -------------------------------------- |
| BrowserRouter         | アプリ全体で Router を使えるようにする |
| Route                 | URL ごとに表示する画面を決める         |
| useParams()           | URL の id を取り�EぁE                  |
| useNavigate()         | コードから画面遷移する                 |

#### 2. URL と画面の対忁E

侁E

- / -> 患老E��覧
- /patient/:id -> 患老E�Eージ
- /patient/:id/vitals -> バイタル一覧
- /patient/:id/records -> 看護記録一覧

つまめE

- :id -> どの患老E��
- vitals / records -> どの画面ぁE

とぁE��意味、E

#### 3. useParams() で id を取めE

`js
const { id } = useParams();
`

これは URL の :id を取り�Eす書き方、E

たとえ�E /patient/5/vitals なら、id は "5"、E

大事なポインチE

useParams() で取れる値は斁E���E、E

#### 4. find() と filter() の違い

`js
const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);
`

| 関数     | 意味                         |
| -------- | ---------------------------- |
| find()   | 条件に合うも�EめEつ取り出ぁE |
| filter() | 条件に合うも�Eを�E部取り出ぁE|

- patient -> 今�E患老E人
- patientRecords -> そ�E患老E��関係ある記録一覧

#### 5. r.id と r.patientId の違い

- r.id -> 記録そ�Eも�EのID
- r.patientId -> そ�E記録がどの患老E�Eも�Eかを表すID

記録一覧を患老E��とに絞るとき�E、E

`js
String(r.patientId) === id
`

と書く、E

#### 6. props の受け渡ぁE

`jsx
<PatientCard patient={patient} records={patientRecords} />
`

- 左 -> 子で受け取る名前
- 右 -> 親が持ってぁE��変数

#### 7. 配�Eの扱ぁE

- patient は患老E人なので patient.name のように使ぁE
- patientRecords は配�E

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

- patientRecords の中身めE件ずつ取り出ぁE
- r は1件刁E�E記録
- そ�E1件めE<tr> 1行に変換する

#### 9. key={r.id} の意味

`jsx

<tr key={r.id}>
`

React に吁E��を区別させるために忁E��、E

#### 10. ?. の意味

`js
r.vitals?.T
`

- vitals があれ�E T を読む
- vitals がなければエラーになりにくくする

#### 11. 刁E��代入

`js
const { T, P, R, SBP, DBP, SPO2 } = r.vitals ?? {};
`

r.vitals の中の値を取り�Eして、短く使ぁE��すくする書き方、E

#### 12. 血圧表示の整形

`js
const bpText = formatBpText(SBP, DBP);
const bpDisplay = bpText === "--" ? "--" : ${bpText}mmHg;
`

- formatBpText(SBP, DBP) -> 血圧を見やすく整える
- 三頁E��算孁E? : -> 条件によって表示を�Eり替える

#### 13. navigate() の役割

`js
const navigate = useNavigate();
navigate(/patient//vitals);
`

コード�E中で URL を変えて画面遷移するためのも�E、E

流れ:

`navigate() で URL が変わめE
ↁE
Route がその URL に合う画面を表示する`

#### 今日できたこと

PatientVitals の形をかなり読めるようになりました、E

`jsx
export default function PatientVitals({ patients, records = [] }) {
const { id } = useParams();

const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);

if (!patient) return <div>患老E��見つかりません</div>;

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

### 今日の大事な一言まとめE

- id は URL から取る
- patient は1人
- patientRecords は配�E
- 画面遷移は navigate()
- URLに合う画面表示は Route

### 次回�E再開ポインチE

useNavigate() を使った�Eタン遷移の整琁E��、PatientPage / PatientVitals / NursingRecordList を実際のコードとしてつなぐ、E

特にこ�E確認から始める予定、E

`jsx
const navigate = useNavigate();

<button onClick={() => navigate(/patient//records)}>
看護記録
</button>
`

こ�Eボタンを押すと、その患老E�E看護記録一覧ペ�Eジに移動する、とぁE��流れの続きから、E

## 2026-04-12

### 学習ログ

#### 1. Router 化で患老E��決める方法が変わっぁE

前�E selectedPatientId で「今どの患老E��見てぁE��か」を管琁E��てぁE��、E
でも今�E Router を使ってぁE��ので、患老E�E URL の id で決まるよぁE��なった、E

侁E

`js
const { id } = useParams();
`

つまり、E

- 剁E-> state で患老E��覚えめE
- 仁E-> URL で患老E��決める

になった、E

#### 2. addRecord は selectedPatientId ではなぁEpatientId を使ぁE��に変更した

前�E selectedPatientId ぁEnull だと追加できなかった、E
今�E NursingRecordList から id を渡してぁE��ので、addRecord は引数の patientId を使え�Eよい形になった、E

完�E形:

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
- 新規追加では patientId を渡ぁE

#### 3. NursingRecordList めERouter 前提に整琁E��ぁE

NursingRecordList で useParams() を使ぁE��今�E患老E�E記録だけを表示する形にした、E

`js
const { id } = useParams();
const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);
`

さらに追加処琁E��、E

`js
const handleSubmit = async (data) => {
  await addRecord(data, id);
  setIsAdding(false);
  setFormData(createEmptyRecord());
};
`

にして、保存が終わってからフォームを閉じる形にした、E

#### 4. NursingRecordItem めErecordId で開く形にした

詳細画面では props で record を直接もらぁE�Eではなく、URL の recordId から自刁E��探す形にした、E

`js
const { id, recordId } = useParams();

const patient = patients.find((p) => String(p.id) === id);
const record = records.find(
(r) => String(r.id) === recordId && String(r.patientId) === id
);
`

学んだこと:

- find -> 1件探ぁE
- filter -> 条件に合うも�E全部を集める

#### 5. selectedPatientId は今�E設計では不要になっぁE

PatientList.jsx を見直した結果、もぁEselectedPatientId を使ってぁE��かった、E
そ�Eため App.jsx からも消せた、E

消したもの:

- const [selectedPatientId, setSelectedPatientId] = useState(null);
- PatientList に渡してぁE�� selectedPatientId 系 props
- deletePatient の中の setSelectedPatientId(null)

学んだこと:

患老E��覚える役割ぁEstate から URL に移った、E

#### 6. PatientList の props を整琁E��ぁE

PatientList は今使ってぁE�� props だけ受け取る形に整琁E��た、E

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

App.jsx 側の / route も、それに合わせて整琁E��た、E

#### 7. 患老E�Eージの構�Eを見直した

最初�E PatientPage の中に PatientCard を常に置ぁE��ぁE��ので、E

- /patient/:id/detail
- /patient/:id/vitals
- /patient/:id/records

でもメニュー画面が残ってぁE��、E

そこで構�Eを変更した、E

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

if (!patient) return <div>患老E��見つかりません</div>;

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
- /patient/:id/detail -> 患老E��報画面だぁE
- /patient/:id/vitals -> バイタル画面だぁE
- /patient/:id/records -> 看護記録画面だぁE

とぁE��形に近づぁE��、E

#### 8. App.jsx の nested route を整琁E��ぁE

PatientMenu めEindex route に置き、PatientDetail めEdetail route にした、E

老E��方:

- index -> 患老E��ニュー
- detail -> 患老E��報
- vitals -> バイタル
- records -> 記録一覧
- records/:recordId -> 記録詳細

これで「患老E��報をクリチE��した時だけ患老E��報画面を�Eす」ため�E土台ができた、E

#### 9. PatientCard のボタン遷移を整琁E��ぁE

PatientCard.jsx で吁E�EタンめERouter に合わせた、E

`js
onClick={() => navigate(/patient//detail)}
onClick={() => navigate(/patient//vitals)}
onClick={() => navigate(/patient//records)}
`

ここで大事だった�Eは、E

navigate("/patient/:id")

はダメ、とぁE��こと、E

琁E��:

:id は Route 定義で使ぁE��箱」、E
navigate() では実際の値が忁E��、E

正しくは:

`js
navigate(/patient/)
`

学んだこと:

/ patient / :id は設計図、Epatient/5 は実際の住所、E

#### 10. DeleteButton の props 名も確認しぁE

DeleteButton.jsx は今こぁE��ってぁE��、E

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

で合ってぁE��ことを確認した、E

### 今日の大事な琁E��

今日ぁE��ばん大事だった�Eはこれ、E

1. Router 化すると、患老E��決める中忁E�E URL になめE
   - 剁E-> selectedPatientId
   - 仁E-> useParams() の id

2. メニュー画面と詳細画面は別 route に刁E��めE
   - /patient/:id -> メニュー
   - /patient/:id/detail -> 患老E��報

3. :id は Route 定義の箱であって、実際の移動�EではなぁE
   - Route: path="/patient/:id"
   - 移勁E navigate(/patient/)

### 次回やること

次回�Eここから再開、E

- PatientCard の 戻めEボタンをどぁE��るか確誁E
- 実際に動かして、E
  - 患老E��ードを押ぁE-> メニュー画面
  - 患老E��報を押ぁE-> 患老E��報画面だけ表示
    になってぁE��か確誁E
- 忁E��なめEPatientDetail / PatientVitals / NursingRecordList の戻り�Eを微調整

つまり今日は、E

患老E��択を state から URL ベ�Eスに刁E��替え、患老E��ニュー画面と患老E��報画面めEroute で刁E��る形まで進めた日でした、E

## 2026-04-13

### 学習ログ

#### 1. PatientPage の役割

PatientPage は

`jsx
return <Outlet />;
`

だけを書ぁE��、親ルート�E箱 だと確認できた、E
自刁E��患老E��探す部品ではなく、子ルートを表示する場所 になってぁE��、E

#### 2. PatientMenu の役割

PatientMenu は

- useParams() で id を読む
- patients.find(...) で患老E��1人探ぁE
- PatientCard に渡ぁE

とぁE��、患老E��ニュー画面の入口 の役割だと整琁E��きた、E

つまめE/patient/:id のときに、実際に患老E��探してぁE��のは PatientMenu、E

#### 3. PatientCard の役割

PatientCard は、患老E��探す部品ではなく、E
渡されぁEpatient を表示する見た目の部品Eだと琁E��できた、E

- 患老E��報へ進む
- バイタルへ進む
- 看護記録へ進む
- 一覧に戻めE
- 削除する

とぁE��ボタン表示を担当してぁE��、E

つまめE

- PatientMenu が探ぁE
- PatientCard が表示する

とぁE��役割刁E��、E

#### 4. props でチE�Eタを渡す流れ

PatientCard の patient は、�E刁E��作ってぁE��のではなく、E
PatientMenu から props で渡されてぁE�� と琁E��できた、E

`jsx
<PatientCard patient={patient} onDelete={deletePatient} />
`

こ�E形で、見つけた患老E��ータを子に渡してぁE��、E

#### 5. 削除処琁E�E流れ

削除の本体�E PatientCard ではなく、App の deletePatient だと整琁E��きた、E

流れはこう、E

`App ぁEdeletePatient を持つ
ↁE
PatientMenu に渡ぁE
ↁE
PatientCard には onDelete とぁE��名前で渡ぁE
ↁE
DeleteButton を押しためEonDelete(patient.id) が動く`

つまり、削除処琁E�E本体�E親にあって、子�Eお願いしてぁE��だけ、E

#### 6. onClick={() => ...} の意味

`jsx
onClick={() => onDelete(patient.id)}
`

の () => は、今すぐ実行せず、クリチE��した時だけ実行するためEと琁E��できた、E

もし

`jsx
onClick={onDelete(patient.id)}
`

と書くと、クリチE��前にそ�E場で実行されてしまぁE��E

#### 7. メニュー画面から戻れなかった理由

前�E

`js
navigate(/patient/)
`

になってぁE��ので、メニュー画面にぁE��時に押しても同じ場所に戻るだけだった、E

そこめE

`js
navigate("/")
`

にしたことで、一覧に戻れる ようになった、E

#### 8. setPatients と setRecords の今�E状慁E

App.jsx にある

`js
const setPatients = ...
const setRecords = ...
`

は、今�Eコードでは未使用 と確認できた�E��E 削除済み�E�、E
今�E更新の中忁E�E onSaveData({ patients, records }) になってぁE��、E

### 今日の琁E��のポインチE

今日ぁE��ばん大事だった�Eは、E

- 親ルート�E箱
- 患老E��探す部品E
- 表示する部品E
- 削除の本体を持つ部品E

を�Eけて老E��られるよぁE��なったこと、E

| 部品E       | 役割                               |
| ----------- | ---------------------------------- |
| PatientPage | 親ルート�E箱�E�Eutlet を返すだけ！E |
| PatientMenu | useParams で id を読み、患老E��探ぁE|
| PatientCard | 渡されぁEpatient を表示する        |
| App         | deletePatient など処琁E�E本体を持つ |

今日は、React Router の役割刁E��と props の流れ、削除処琁E�Eつながり を整琁E��きた日だった、E

### 明日の再開ポインチE

PatientDetail / PatientVitals / NursingRecordList でも同じよぁE��「誰ぁEid を読み、誰が表示してぁE��か」をそろえて見ると、理解がさらに深まる、E

## 2026-04-14

### 学習ログ

#### チE�EチE

React Routerで、誰ぁEid を読み、誰がデータを準備し、誰が表示するのぁEを整琁E��た、E
あわせて、看護記録追加時�E patient.id と patientId の関俁Eを理解した、E

#### 1. 今日琁E��したこと

##### ① PatientPage の役割

PatientPage は、患老E�Eージ全体�EチE�Eタ準備係、E
URL から id を読み、E

- patient を探ぁE
- patientRecords を集める
- Outlet context で子に渡ぁE

とぁE��役割を持つ、E

つまり、どの患老E�Eペ�Eジか決めるのは PatientPage の仕亁Eだと琁E��した、E

##### ② PatientDetail / PatientVitals / NursingRecordList の役割

子コンポ�Eネント�E、親が渡したチE�Eタを受け取って、それぞれ�E画面の表示めE��作を拁E��すめE形に整琁E��きた、E

- PatientDetail -> 患老E��報の表示・編雁E
- PatientVitals -> バイタル一覧の表示
- NursingRecordList -> 看護記録一覧の表示・追加操佁E

つまり、親がデータをそろえ、子が表示めE��面操作をする とぁE��設計が見えてきた、E

##### ③ useOutletContext() の意味

useOutletContext() を使ぁE��、PatientPage が渡した

- patient
- patientRecords

を子で受け取れる、E

これによって、子コンポ�Eネント�Eで毎回

`js
const { id } = useParams();
const patient = patients.find(...);
const patientRecords = records.filter(...);
`

を書かなくてよくなる、E

つまり、�E通�EチE�Eタ準備を親に雁E��ることで、子�E役割が見やすくなめEと琁E��した、E

##### ④ PatientVitals がかなり整琁E��きた

PatientVitals は最終的に、E

- useParams() を使わなぁE
- patient と patientRecords めEuseOutletContext() で受け取る
- 表示と画面遷移だけを拁E��すめE

形に近づぁE��、E

また、戻る�Eタンなどは id ではなぁEpatient.id を使って書けると琁E��した、E

つまり、PatientVitals はかなりきれいな表示専用コンポ�Eネントに近づぁE��、E

##### ⑤ NursingRecordList の役割

NursingRecordList も、E

- patient
- patientRecords

を親から受け取り、E

- 一覧を表示する
- 記録追加フォームを開ぁE
- addRecord を呼ぶ

とぁE��役割に整琁E��きた、E

ここで持ってぁE��

- isAdding
- formData

は、患老E��ータそ�Eも�Eではなく画面の中だけで使ぁEI用の state だと琁E��した、E

つまり、これ�EチE�Eタの刁E��ではなく、画面の状態管琁Eだと整琁E��きた、E

#### 2. 今日ぁE��ばん大事だった理解

##### patientId と patient.id の違い

ここが今日の大きな学びだった、E

`js
const addRecord = async (record, patientId) => {
`

こ�E patientId は、E��数の引数名（箱の名前�E�、E

一方で、E

`js
addRecord(data, patient.id)
`

の patient.id は、今見てぁE��患老E�E実際のID、E

つまり、E

- patientId -> 箱の名前
- patient.id -> そ�E箱に入れる本物の値

とぁE��関係だと琁E��した、E

##### なぁEpatient.id を渡す�EぁE

新しい看護記録には、E

「この記録は誰のも�Eか、E

を�Eれる忁E��があるから、E

たとえ�E、フォーム入力だけ�E data にはまだ患老E��報がなぁE��E
そこで

`js
addRecord(data, patient.id)
`

とすることで、E��数の中で

`js
{
  ...record,
  patientId,
  id: Date.now(),
}
`

とぁE��形の新しい記録が作れる、E

つまり、patient.id を渡す�Eは、記録に「誰の記録か」を付けるためEだと琁E��できた、E

#### 3. コード�E整琁E��刁E��ったこと

##### PatientDetail で注意する点

PatientDetail では useParams() を消したあとに、E

`js
navigate(/patient/)
`

のままだとエラーになる、E
こ�E場合�E

`js
navigate(/patient/)
`

に直す忁E��がある、E

また、E��屋番号の重褁E��ェチE��では、編雁E��てぁE��本人を除外するために

`js
extractUsedRoomNumbers(patients, patient?.id)
`

とする忁E��があると刁E��った、E

つまり、親から patient を受け取る設計にしたら、id めEpatient.id から使ぁE��向にそろえる のが大事だと刁E��った、E

#### 4. 今日の琁E��を�Eとことで言ぁE��

PatientPage がデータ準備係、子コンポ�Eネントが表示・操作俁EとぁE��形がかなり見えてきた、E

さらに、patient.id めEaddRecord に渡すことで、新しい記録に patientId を付けて患老E��記録をつなげる ことも理解できた、E

#### 5. 次回やること

- PatientDetail / PatientVitals / NursingRecordList を今�E設計で最終確認すめE
- PatientPage 側の Outlet context の流れをもぁE��度復習すめE
- addRecord と updatePatient の流れを、App側の責任として整琁E��めE

## 2026-04-15

### 今日めE��たこと

- PatientDetail / PatientVitals / NursingRecordList / NursingRecordItem の役割を整琁E
- PatientPage の Outlet context の流れを復翁E
- addRecord / updatePatient / updateRecord / deleteRecord めEApp 側の責任として整琁E
- records と records/:recordId のルーチE��ングを�E弟ルートで整琁E

---

### 学んだこと

#### 1. PatientPage の役割

PatientPage は URL の :id を使って、今表示する患老E人刁E�EチE�Eタを作る場所、E

作ってぁE��も�E�E�E

- patient
- patientRecords
- usedRoomsForEdit

そして忁E��な関数と一緒に Outlet context で子に渡す、E

**つまり、PatientPage は患老E�Eージ全体�E中継地点、E*

---

#### 2. Outlet context の流れ

流れはこう、E

1. App が�E体データと更新関数を持つ
2. PatientPage が今�E患老E��のチE�Eタを作る
3. 子コンポ�Eネントが useOutletContext() で受け取る

これで子�Eで毎回 useParams() めEfind/filter をしなくてよくなる、E

**つまり、探す仕事を PatientPage に雁E��て、子�E表示と操作に雁E��する、E*

---

#### 3. PatientDetail

PatientDetail は patient / updatePatient / usedRoomsForEdit めEuseOutletContext() で受け取る形に整琁E��た、E

isEditing は患老E��ータではなぁEUI 状態なので、PatientDetail の中で持ってよい、E

保存時は

`js
const updated = { ...patient, ...data };
await updatePatient(updated);
`

とする、E

**つまり、PatientDetail は患老E��報の表示と編雁EI拁E��、E*

---

#### 4. PatientVitals

PatientVitals は

`js
const { patient, patientRecords } = useOutletContext();
`

で受け取る形に整琁E��た、E

自刁E��患老E��探したり記録を絞り込んだりせず、受け取っぁEpatientRecords を表示する、E

**つまり、PatientVitals は表示拁E��、E*

---

#### 5. NursingRecordList

NursingRecordList めE

`js
const { patient, patientRecords, addRecord } = useOutletContext();
`

の形に寁E��た、E

記録追加では

`js
await addRecord(data, patient.id);
`

のように、E

- data = 記録冁E��
- patient.id = こ�E患老E�EID

を渡す忁E��があると確認した、E

**つまり、NursingRecordList は記録一覧表示と新規追加拁E��、E*

---

#### 6. NursingRecordItem

patientRecords は配�Eなので、そのまま1件の記録としては使えなぁE��E

そ�Eため

`js
const { recordId } = useParams();
const record = patientRecords.find((r) => String(r.id) === recordId);
`

として、E�E列�E中から1件取り出す忁E��があると琁E��した、E

ここで刁E��ったこと�E�E

- PatientPage は患老E��位まで選ぶ
- NursingRecordItem はそ�E患老E�E記録一覧の中から1件を選ぶ
- だから
  recordId を読むために useParams() が忁E��、E

**つまり、NursingRecordItem は1件の記録の表示・編雁E�E削除拁E��、E*

---

#### App 側の責任

- addRecord
- updatePatient
- updateRecord
- deleteRecord

はすべて App 側で全体�E列を更新する責任を持つ、E

子コンポ�Eネント�E、�E力を受け取って App の関数を呼ぶだけ、E

**つまり、子�Eお願いする側、本当�E更新処琁E�E App が持つ、E*

---

#### ルーチE��ング

今日は記録一覧と記録詳細を�E弟ルートで整琁E��た、E

`jsx
<Route path="records" element={<NursingRecordList onErrorsChange={setGlobalErrors} />} />
<Route path="records/:recordId" element={<NursingRecordItem onErrorsChange={setGlobalErrors} />} />
`

こ�E形にした琁E��は、E

- records は一覧画面
- records/:recordId は詳細画面

として刁E��た方が今�E設計に合ってぁE��わかりやすいから、E

---

### 今日つまずいたところ

- PatientPage に props を渡しておらず、patients.find(...) でエラーになっぁE
- usedRoomsForEdit めEcontext でもらぁE�Eに、同じ名前で再定義しよぁE��した
- record = record.find(...) と書ぁE��しまっぁE
- DeleteButton の prop 名�E onClick に合わせる忁E��があっぁE

---

### 今日の一番大事な琁E��

- App = 全体データを持って更新する親
- PatientPage = 今�E患老E�Eージ用に仕�Eけして渡す中継地点
- 吁E��コンポ�EネンチE= 受け取って表示・操作する担彁E

**つまり、探す仕事�E PatientPage、更新の本体�E App、表示と入力�E子コンポ�Eネント、E*

---

### 次回やること

- PatientPage の Outlet context に updateRecord / deleteRecord を含める最終確誁E
- App.jsx 側の props を減らして Outlet context に統一する
- 患老E�Eージまわりの完�Eコードを最終確認すめE

**つまり、今日は患老E�Eージまわりの役割刁E��とチE�Eタの流れをかなり整琁E��きた日だった、E*

## 2026-04-16

### 1. 今日めE��たこと

- PatientPage を親にして、Outlet context で子ルートへ値を渡す設計を確認しぁE
- updateRecord / deleteRecord めEOutlet context に含めてよいか整琁E��ぁE
- PatientMenu を残すかどぁE��整琁E��ぁE
- PatientMenu で useOutletContext() を使ったとき�Eエラー原因を確認しぁE
- PatientMenu から患老E��除したあとに患老E��覧へ戻る�E琁E��整琁E��ぁE
- PatientCard に渡ぁEprops 名�Eズレによるエラーを修正した

---

### 2. 今日の琁E��ポインチE

#### ① Outlet context は「親の Outlet の子ルート」で使ぁE

useOutletContext() はどこでも使えるわけではなぁE��E

使えるのは、E

- 親コンポ�Eネントで <Outlet context={...} /> を書ぁE��ぁE��
- そ�E Outlet の子ルートとして描画されたコンポ�EネンチE

だけ、E

今回なら、E

- 親: PatientPage
- 孁E PatientMenu, PatientDetail, PatientVitals, NursingRecordList, NursingRecordItem

とぁE��関係が忁E��、E

---

#### ② エラーの原因

出てぁE��エラー:

`js
Cannot destructure property 'patient' of 'useOutletContext(...)' as it is null.
`

原因は、PatientMenu ぁEPatientPage の子ルートではなく、外に置かれてぁE��こと、E

ダメだった形

`jsx
<Route index element={<PatientMenu ... />} />
<Route path="/patient/:id" element={<PatientPage ... />} />
`

これだと PatientMenu は PatientPage の <Outlet /> の子ではなぁE�Eで、E
useOutletContext() ぁEnull になる、E

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

「患老E��報」「バイタル」「看護記録」などを選ぶ最初�E画面として、E
PatientMenu を置く設計�E自然、E

整琁E��ると役割はこうなる、E

- PatientPage:
  URL の id を見て患老E��ータを探ぁE
  Outlet context で子に値を渡す親
- PatientMenu:
  /patient/:id で最初に見せるメニュー画面
- PatientDetail / PatientVitals / NursingRecordList / NursingRecordItem:
  吁E��細画面

---

#### ④ Outlet context に入れるも�E

PatientPage でまとめて渡すものは、患老E�Eージ配下で使ぁE��の、E

今回の形では次を�Eれる想定で整琁E��た、E

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

- updateRecord / deleteRecord めEOutlet context に入れてよい
- PatientMenu で削除も使ぁE�Eで deletePatient も�Eれる忁E��がある

---

#### ⑤ PatientMenu の実裁E

最終的に PatientMenu は useOutletContext() で受け取る形にした、E

`jsx
import { useOutletContext, useNavigate } from "react-router-dom";
import PatientCard from "./PatientCard";

export default function PatientMenu() {
const navigate = useNavigate();
const { patient, deletePatient } = useOutletContext();

if (!patient) return <div>患老E��見つかりません</div>;

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

#### ⑥ props 名�Eズレで出たエラー

出てぁE��エラー:

`js
PatientCard.jsx:48 Uncaught TypeError: onDelete is not a function
`

原因は、PatientCard 側は onDelete を受け取る前提なのに、E
PatientMenu 側で onClick={handleDelete} を渡してぁE��こと、E

ダメだった形

`jsx
<PatientCard patient={patient} onClick={handleDelete} />
`

正しい形

`jsx
<PatientCard patient={patient} onDelete={handleDelete} />
`

つまり、E

- 渡す�Eの props 吁E
- 受け取る側の props 吁E

は一致させる忁E��があると琁E��した、E

---

#### ⑦ 削除後�E遷移允E

最初�E削除後に

`js
navigate(/patient/)
`

としてぁE��が、これ�E削除済みの患老E�Eージへ戻ろうとしてしまぁE�Eで不�E然、E

削除後�E患老E��もう存在しなぁE��め、患老E��覧へ戻す、E

`js
navigate("/")
`

---

### 3. 今日の重要な学び

- useOutletContext() は「親の Outlet の子」でしか使えなぁE
- ルート�E入れ子構造がとても重要E
- PatientMenu は忁E��なら残してよい
- ただぁEPatientMenu めEOutlet context で統一する
- props の名前がズレると is not a function エラーになめE
- 削除後�E存在しなぁE�Eージではなく一覧へ戻ぁE

---

### 4. 今�E設計�E整琁E

親:

- App.jsx
- PatientPage.jsx

患老E�Eージ配丁E

- PatientMenu.jsx
- PatientDetail.jsx
- PatientVitals.jsx
- NursingRecordList.jsx
- NursingRecordItem.jsx

チE�Eタの流れ:

- App.jsx がデータと更新関数を持つ
- PatientPage.jsx ぁEpatient と patientRecords を作る
- PatientPage.jsx ぁEOutlet context で子に渡ぁE
- 子画面は useOutletContext() で受け取る

---

### 5. 次回やること

- App.jsx の patient まわりの route を最終完�E形で整える
- PatientPage.jsx の Outlet context を最終確認すめE
- PatientMenu / PatientDetail / PatientVitals / NursingRecordList / NursingRecordItem の受け取り方を統一確認すめE
- 忁E��なめEPatientCard の役割をもぁE��度整琁E��めE

---

### 6. 一言まとめE

今日は

「PatientMenu めEPatientPage の子ルートに置き、Outlet context で統一して使ぁE��E

ことが一番大きな学びだった、E

また、E

- useOutletContext() は親子関係が正しくなぁE��使えなぁE
- props 名�Eズレがエラー原因になめE

ことも整琁E��きた、E

## 2026-04-18 学習ログ�E�EatientPage・schema・Hook の頁E��を整琁E��E

### 1. 今日めE��たこと

- `PatientPage` の役割を整琁E��ぁE
- `PatientMenu / PatientVitals / NursingRecordList / NursingRecordItem / PatientDetail` の受け取り方を確認しぁE
- `useOutletContext()` でチE�Eタを受け取る形を統一してぁE��ことを確認しぁE
- `usedRoomsForEdit` をなぁE`PatientPage` で作るのか整琁E��ぁE
- `schema.js` をなぜ�EけてぁE��のか整琁E��ぁE
- `runPatientValidationCases()` と `safeParse()` の意味を確認しぁE
- 患老E��報画面でコンソールぁE回�Eる理由を確認しぁE

### 2. 設計�E琁E��

#### PatientPage の役割

`PatientPage` は、今開ぁE��ぁE��患老E�Eージ専用のチE�Eタを作って、子コンポ�Eネントに渡す中継所、E

```jsx
const { id } = useParams();
const patient = patients.find((p) => String(p.id) === id);
const patientRecords = records.filter((r) => String(r.patientId) === id);
```

ここで、E

- 今�E患老E(`patient`)
- そ�E患老E�E記録一覧 (`patientRecords`)

を作ってぁE��、E

さらに Outlet context で子に渡してぁE��、E

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

患老E�Eージ配下�E子コンポ�Eネント�E、基本皁E�� `useOutletContext()` で受け取る、E

- `PatientMenu`
- `PatientDetail`
- `PatientVitals`
- `NursingRecordList`
- `NursingRecordItem`

`recordId` のように URL で決まる値だぁE`useParams()` を使ぁE��E

### 3. Hook の頁E��の琁E��

React の Hook は、名前ではなく頁E��で覚えられてぁE��と老E��る、E

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

こ�E形だと、E

- `record` がなぁE�� -> `useMemo` まで行かなぁE
- `record` がある時 -> `useMemo` まで行く

となり、呼ばれる Hook の数・頁E��が変わる可能性がある、E

#### 直し方

Hook は `return` より前に置く、E

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

if (!patient) return <div>患老E��見つかりません</div>;
if (!record) return <div>記録が見つかりません</div>;
```

#### 今日の琁E��

- Hook は毎回同じ頁E��で呼ばれる忁E��がある
- `if (...) return` の後ろに Hook を置くと危なぁE��とがあめE

### 4. usedRoomsForEdit めEPatientPage に置く理由

```js
const usedRoomsForEdit = extractUsedRoomNumbers(patients, patient.id);
```

これは、今選択してぁE��患老E��人を除ぁE��使用中の部屋番号一覧を作ってぁE��、E

侁E

- 田中 101号室
- 佐藤 102号室
- 鈴木 103号室

佐藤さんを編雁E��てぁE��時�E、結果は `[101, 103]` になるイメージ、E

#### なぁEApp ではなぁEPatientPage なのぁE

`App` は全体管琁E�E場所で、まだ「今どの患老E��見てぁE��か」�E責任を深く持たせなぁE��ぁE��自然、E

`PatientPage` はすでに

```js
const { id } = useParams();
const patient = patients.find(...);
```

で今�E患老E��特定してぁE��ので、その流れで

- 今�E患老E��除外した部屋一覧
- そ�E患老E��用の値

を作るのが�E然、E

#### 今日の琁E��

- `usedRoomsForEdit` は全体用ではなく「今�E患老E��用の値、E
- だから `PatientPage` に置くほぁE��役割に合ってぁE��

### 5. schema.js を�Eける琁E��

結諁E `schema.js` にしなぁE��ぁE��なぁE��ぁE�� Zod の決まり�EなぁE��`jsx` に書くこともできる、E

でも�EけてぁE��琁E��は、見た目 (UI) と入力ルールを�Eけるため、E

#### 今�E役割刁E��

- `PatientDetail.jsx` -> 画面表示、フォーム操佁E
- `schema.js` -> バリチE�Eションルール、確認用ロジチE��

schema 側にあるも�E:

- `optionalNumber`
- `makePatientSchemaPartial`
- `createPatientValidationCases`
- `runPatientValidationCases`
- `recordSchema`

これら�E全部、見た目ではなくルールめE��認用のロジチE��、E

#### 今日の琁E��

- schema は UI ではなく�E力チェチE��のルール
- `.js` に刁E��る�Eは整琁E��めE��く、�E利用めE��ストもしやすい

### 6. runPatientValidationCases() の意味

`runPatientValidationCases()` は、schema が正しく動くかを確認するため�E採点処琁E��E

イメージ:

- `makePatientSchemaPartial` = 採点ルール
- `createPatientValidationCases` = 問題集
- `runPatientValidationCases` = 採点する先生

めE��てぁE��こと:

```js
const schema = makePatientSchemaPartial(testCase.usedRooms);
const result = schema.safeParse(testCase.input);
```

- チE��トケースごとに schema を作る
- 入力をチェチE��する
- `valid / invalid` を確認すめE

### 7. safeParse() の琁E��

`safeParse()` は、�E力が schema に合ってぁE��かを安�Eに採点するも�E、E

成功晁E

```js
{ success: true, data: ... }
```

失敗時:

```js
{ success: false, error: ... }
```

`duplicate-room` の侁E

- `usedRooms = [101, 102]`
- 入劁E`room = "101"`

まぁE`optionalNumber()` の `transform` で `"101"` ぁE`101` に変換される、E

そ�E征E`superRefine()` で

```js
if (usedRooms.includes(data.room)) {
  ctx.addIssue({
    path: ["room"],
    message: "こ�E部屋番号は既に使用されてぁE��ぁE,
  });
}
```

が走る、E

結果として:

- `room` にエラーがつぁE
- `success: false` になめE

#### 今日の琁E��

- `safeParse()` は「変換 + チェチE�� + 結果を返す、E
- 例外で止めるとぁE��より、�E劁E失敗を返して確認しめE��ぁE

### 8. 患老E��報クリチE��時にコンソールぁE回�Eる理由

患老E��報画面に入った時、`PatientDetail.jsx` の次の処琁E��動いてぁE��、E

```jsx
useEffect(() => {
  if (!import.meta.env.DEV) return;
  const results = runPatientValidationCases();
  console.table(results);
}, []);
```

#### 直接の原因

- `console.table(results)` が表示してぁE��

#### 2回見える理由

開発環墁E+ `StrictMode` の影響で、`useEffect` が確認�Eために2回実行されることがあるため、E

#### 今日の琁E��

- 2回表示される�Eは Zod の仕様ではなぁE
- schema が勝手に2回表示してぁE��わけでもなぁE
- `useEffect` の中で `console.table()` してぁE��、それが開発中に2回見えてぁE��

### 9. 今日の大事な琁E��まとめE

- `PatientPage` は今�E患老E��用チE�Eタを作る中継所
- 子コンポ�Eネント�E `useOutletContext()` で受け取る
- Hook は毎回同じ頁E��で呼ばれる忁E��がある
- `usedRoomsForEdit` は「今�E患老E��人を除ぁE��使用部屋一覧、E
- schema は UI ではなく�E力ルール
- `runPatientValidationCases()` は schema の確認用
- `safeParse()` は安�Eに採点して成功/失敗を返す
- コンソール2回表示は `useEffect + StrictMode` の影響

### 10. 次回やること

- `optionalNumber()` の `.transform()` ぁE回ある理由を理解する
- `recordSchema` の見方も患老Eschema と同じ老E��方で整琁E��めE
- 忁E��なめE`NursingRecordItem` の Hook の置き場所を最終確認すめE
- schema と form のつながりをもぁE��段深く整琁E��めE

## 2026-04-19 学習ログ�E�Echema と form、AddPatientForm の役割刁E��を整琁E��E

### 1. 今日めE��たこと

今日は主に、schema と form のつながりを整琁E��たあと、AddPatientForm の設計を見直した、E

- `optionalNumber()` の `.transform()` ぁE回ある理由を確認しぁE
- `recordSchema` めEpatient schema と同じ見方で読めるよう整琁E��ぁE
- `schema` と `form` のつながりを整琁E��ぁE
- `NursingRecordItem` の Hook の置き場所につぁE��確認しぁE
- `AddPatientForm` めE`NursingRecordForm` に近い形へ整琁E��ぁE
- 「なぁEPatientList で追加処琁E��絁E��立てる�Eか」を整琁E��ぁE

---

### 2. 琁E��したこと

#### ① `optionalNumber()` の `.transform()` ぁE回ある理由

`transform` ぁE回ある�Eは、役割が違ぁE��ら、E

- 1回目
  入力値をいったん同じ形にそろえる
  侁E `undefined` ↁE`""`, `12` ↁE`"12"`, `" 12 "` ↁE`"12"`

- 2回目
  そろえた値を最終的な型に変えめE
  侁E `""` ↁE`undefined`, `"12"` ↁE`12`

つまり、E
**「まず形をそろえて、そのあと本当�E型に変える、E*
とぁE��2段階になってぁE��、E

---

#### ② `recordSchema` の見方

`recordSchema` めEpatient schema と同じで、E
**「看護記録1件のルール表、E* として見る、E

- `z.object({ ... })`
  ↁE記録1件全体�E形
- `date`
  ↁE日付�Eルール
- `vitals`
  ↁEバイタルとぁE��箱の中のルール
- `content`
  ↁE記録冁E��のルール
- `author`
  ↁE記録老E�Eルール

つまり、E
**patient schema めErecordSchema も「データ1件の設計図」とぁE��見方は同じ、E*

---

#### ③ schema と form のつながり

form と schema の役割は刁E��れてぁE��、E

- `form`
  ↁE入力を雁E��めE
- `schema`
  ↁE入力ルールをチェチE��する
- `resolver`
  ↁEform と schema をつなぁE
- `errors`
  ↁEschema のチェチE��結果

たとえ�E `useForm({ resolver: zodResolver(recordSchema) })` は、E
**「このフォームの入力�E recordSchema でチェチE��してください、E*
とぁE��意味になる、E

つまり、E
**form は受付、schema はルール表、errors はチェチE��結果、E*

---

#### ④ `NursingRecordItem` の Hook の置き場所

`isEditing` のような state は、E
**記録チE�Eタ本体ではなぁEUI の一時状慁E* なので子コンポ�Eネントに置ぁE��よい、E

- `records` などの本体データ
  ↁE親で持つ
- `isEditing` のような表示用状慁E
  ↁE子で持てめE

つまり、E
**「本体データ」と「画面の状態」�E刁E��て老E��る、E*

---

### 3. `AddPatientForm` で整琁E��たこと

#### 変更剁E

`AddPatientForm` の中で保存�E琁E��で直接書ぁE��ぁE��、E

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

こ�E形は動くけれど、E
フォーム自身が保存�E琁E��で知ってぁE��状態だった、E

#### 変更征E

`AddPatientForm` は、�E功したら親の `onSubmit(data)` を呼ぶだけに整琁E��た、E

```jsx
<form
  onSubmit={handleSubmit(async (data) => {
    await onSubmit(data);
    reset();
    setShowAddForm(false);
  })}
>
```

こ�E形にすると役割が�Eかれる、E

- `AddPatientForm`
  ↁE入力を受ける、検証する、�E功後に reset して閉じめE
- 親�E�EatientList�E�E
  ↁE保存用のチE�Eタを絁E��立てて onSaveData を呼ぶ

つまり、E
**保存�E親、フォームの後片付けは孁E*
とぁE��刁E��になった、E

### 4. なぁEPatientList でめE��のぁE

ここが今日ぁE��ばん大事だった、E

最初�E
「なぁEApp ではなぁEPatientList で追加処琁E��めE��のか、E
が曖昧だった、E

整琁E��るとこうなる、E

- App
  ↁEアプリ全体�E土台。patients、records、onSaveData を持つ
- PatientList
  ↁE患老E��覧画面。追加フォームを開ぁE閉じる責任を持つ
- AddPatientForm
  ↁE入力するだぁE

PatientList は患老E��覧画面なので、E
「追加フォームから受け取っぁEdata を患老E��覧にどぁE��すか、E
を老E��る�Eが�E然、E

一方で、実際に保存する本体�E App 側の onSaveData、E

つまり、E
PatientList は保存そのも�EをしてぁE��のではなく、保存するため�E材料を作って App に渡してぁE��、E

### 5. 今日の琁E��を一言でまとめる

- schema はチE�Eタのルール表
- form は入力を雁E��めE
- resolver はそ�E橋渡ぁE
- errors は schema の結果
- AddPatientForm は入力と後片付けを担当すめE
- PatientList は患老E��加の斁E��でチE�Eタを絁E��立てめE
- App は全体データを本当に保存すめE

つまり、E
**「�E力する場所」「画面として絁E��立てる場所」「本当に保存する場所」を刁E��て老E��る�Eが大事、E*

### 6. 次回やること

- addPatient めEPatientList に置く形と App に上げる形の違いを比べめE
- NursingRecordForm と AddPatientForm の共通点・違いを整琁E��めE
- schema ↁEform ↁEsubmit ↁEApp更新 の流れめE本で説明できるようにする

## 2026-04-20 学習ログ�E�Eeact-hook-form の handleSubmit と自刁E��作る関数の違いを整琁E��E

### 今日めE��たこと

今日は主に、`handleSubmit` とぁE��名前ぁE種類あるよぁE��見えて混乱してぁE��ところを整琁E��た、E

確認した�E容は次の2つ、E

```js
const handleSubmit = async (data) => {
  const updatedRecord = { ...record, ...data };
  await updateRecord(updatedRecord);
  setIsEditing(false);
  navigate(`/patient/${patient.id}/records`);
};

<form
  onSubmit={handleSubmit(async (data) => {
    await onSubmit(data);
    reset();
    setShowAddForm(false);
  })}
>
```

こ�E2つを比べながら、E

- 上�E自刁E��定義した関数なのぁE
- 下�E handleSubmit は react-hook-form のも�EなのぁE
- 無名関数と名前つき関数の違いは何か
- 刁E��て書くべきか、その場で書ぁE��もよぁE�EぁE

を整琁E��た、E

### 1. react-hook-form の handleSubmit と自刁E�E関数は別物

同じ handleSubmit とぁE��名前でも、中身は同じではなぁE��E

react-hook-form の handleSubmit

これは useForm() から取り出すライブラリの関数、E

役割は、E

- フォームの入力値を集める
- schema でチェチE��する
- 問題なければ次の関数を実行すめE

つまり、E
フォーム送信の入口、E

自刁E��書く関数

たとえ�E次のようなも�E、E

```js
const handleSubmit = async (data) => {
  const updatedRecord = { ...record, ...data };
  await updateRecord(updatedRecord);
  setIsEditing(false);
  navigate(`/patient/${patient.id}/records`);
};
```

これはライブラリのも�Eではなく、E
自刁E��定義した普通�E関数、E

役割は、E

- 受け取っぁEdata を使って更新チE�Eタを作る
- updateRecord(updatedRecord) を呼ぶ
- 編雁E��ードを終えめE
- 一覧画面へ戻めE

つまり、E
送信成功後に何をするかを書く関数、E

### 2. 下�E <form onSubmit={handleSubmit(...) }> の読み方

次のコードでは、E

```jsx
<form
  onSubmit={handleSubmit(async (data) => {
    await onSubmit(data);
    reset();
    setShowAddForm(false);
  })}
>
```

外�Eの handleSubmit は
react-hook-form の handleSubmit、E

一方、中の

```js
async (data) => {
  await onSubmit(data);
  reset();
  setShowAddForm(false);
};
```

は
自刁E��そ�E場で書ぁE��無名関数、E

つまりこの形は、E

handleSubmit
ↁEライブラリの送信入口
async (data) => { ... }
ↁE自刁E��書ぁE��送信後�E処琁E

とぁE��絁E��合わせ、E

### 3. 無名関数と名前つき関数

ここも整琁E��た、E

無名関数

```js
async (data) => {
  await onSubmit(data);
  reset();
  setShowAddForm(false);
};
```

これは名前がつぁE��ぁE��ぁE��数、E
でも、�E刁E��書ぁE��関数であることに変わり�EなぁE��E

名前つき関数

```js
const handleAddPatientSubmit = async (data) => {
  await onSubmit(data);
  reset();
  setShowAddForm(false);
};
```

こ�Eあと

```jsx
<form onSubmit={handleSubmit(handleAddPatientSubmit)}>
```

と書け�E、E

handleSubmit
ↁEreact-hook-form のも�E
handleAddPatientSubmit
ↁE自刁E�E送信後�E琁E

と見�Eけやすくなる、E

### 4. 刁E��なくても動くが、�Eけると読みめE��ぁE

無名関数をその場で書ぁE��も問題なく動く、E

```jsx
<form
  onSubmit={handleSubmit(async (data) => {
    await onSubmit(data);
    reset();
    setShowAddForm(false);
  })}
>
```

ただし、�E琁E��長くなると

- 保孁E
- reset
- close
- navigate
- error クリア

などぁEか所に雁E��って、読みづらくなる、E

そこで、次のように刁E��ると見やすい、E

```js
const handleAddPatientSubmit = async (data) => {
  await onSubmit(data);
  reset();
  setShowAddForm(false);
};
```

```jsx
<form onSubmit={handleSubmit(handleAddPatientSubmit)}>
```

つまり、E
刁E��なくても動くが、理解しやすさのために刁E��ることがある、E

### 5. handleSubmit とぁE��名前を�E刁E��使ぁE��混乱しやすい

今日の学びとしてかなり大きかった�Eはここ、E

react-hook-form にめEhandleSubmit があり、E
自刁E��めE`const handleSubmit = async (data) => { ... }` と書けてしまぁE��E

すると、E

- どっちがライブラリのも�EぁE
- どっちが�E刁E�E関数ぁE

が見えにくくなる、E

そ�Eため、�E刁E��作る関数には

- handleRecordSubmit
- handlePatientSubmit
- handleAddPatientSubmit

のように、役割がわかる名前をつける方が整琁E��めE��ぁEと琁E��した、E

### 6. 「�Eに書ぁE��ある」と「�Eに動く」�E別

これも今日の大事な琁E��だった、E

たとえ�E、E

```js
const handleAddPatientSubmit = async (data) => {
  await onSubmit(data);
  reset();
  setShowAddForm(false);
};
```

ぁEuseForm() より前に書ぁE��あっても、E
そ�E中の reset() はそ�E場ですぐ実行されるわけではなぁE��E

関数は、定義しただけでは動かなぁE��E
実際に呼ばれた時に初めて中の処琁E��動く、E

つまり、E

- 関数は先に定義されめE
- useForm() で reset などが用意される
- 送信ボタンが押された時に関数が実行される

とぁE��頁E��になる、E

なので、E
関数の中で reset() を使ってぁE��も、E��信時にはもう使える状態だから大丈夫
とぁE��ことを理解した、E

### 7. 今日のまとめE

今日は、handleSubmit とぁE��名前が�Eてきた時に、E

- これは react-hook-form のも�EぁE
- これは自刁E��作った関数ぁE

を見�Eける練習をした、E

整琁E��ると次の通り、E

- useForm() から取り出ぁEhandleSubmit
  ↁEライブラリの送信入口
- const handleRecordSubmit = async (data) => { ... }
  ↁE自刁E��作る送信後�E処琁E
- async (data) => { ... }
  ↁE自刁E��書ぁE��無名関数
- 無名関数でも動ぁE
- ただし、名前をつけて刁E��ると読みめE��ぁE
- 「�Eに書ぁE��ある」と「�Eに実行される」�E別

つまり、E
フォーム送信では「�E口」と「送信後�E仕事」を刁E��て老E��ることが大亁E
と琁E��した、E

## 2026-04-21 学習ログ�E�EddPatient の置き場所・Form比輁E�EチE�Eタの流れ整琁E��E

### 1. 今日めE��たこと

今日は主に3つ整琁E��た、E

- addPatient めE`PatientList` に置く形と `App` に上げる形の違い
- `NursingRecordForm` と `AddPatientForm` の共通点・違い
- `schema ↁEform ↁEsubmit ↁEApp更新` の流れめE本で説明できるように整琁E

---

### 2. addPatient めEPatientList に置く形と App に上げる形の違い

#### PatientList に置く形

- `patients` の state めE`PatientList` が持つ
- `addPatient` めE`PatientList` の中に置ぁE
- 小さぁE��プリではわかりやすい
- ただし、別画面でも患老E��ータを使ぁE��くなると管琁E��にくい

#### App に上げる形

- `App` ぁE`patients` と `records` をまとめて持つ
- `addPatient` めE`App` に置ぁE
- アプリ全体で同じチE�Eタを�E有できる
- `patients` と `records` の整合が取りめE��ぁE
- チE�Eタの刁E��を防ぎやすい

#### 今日の琁E��

今�E看護記録アプリは一覧画面だけではなく、詳細・バイタル・看護記録など褁E��画面で患老E��ータを使ぁE�Eで、`App` でまとめて管琁E��る方が合ってぁE��と琁E��した、E

---

### 3. AddPatientForm と NursingRecordForm の共通点・違い

#### 共通点

- どちらも入力を受け取る `Form`
- `react-hook-form` を使ってぁE��
- `zod` の `schema` でバリチE�Eションする
- `handleSubmit` を通して、OKなら親にチE�Eタを渡ぁE

#### AddPatientForm

- 新しい患老E��追加するためのフォーム
- 作るチE�Eタは `patient`
- submit 後�E `patients` を増やぁE

#### NursingRecordForm

- 看護記録を追加・編雁E��るため�Eフォーム
- 作るチE�Eタは `record`
- submit 後�E `records` を増やす、また�E更新する
- `record` は `patientId` と結�Eつく忁E��がある

#### 今日の琁E��

2つの Form は役割の流れは似てぁE��が、最終的に作るチE�Eタの種類と、更新する配�Eが違ぁE��整琁E��きた、E

---

### 4. schema ↁEform ↁEsubmit ↁEApp更新 の流れ

今日ここめE本で説明できるように整琁E��た、E

#### ① schema

- 入力ルールを決める
- 例：氏名は忁E��、E��屋番号は数字、など

#### ② form

- ユーザーが�E力する場所
- `useForm` で入力値を管琁E��めE
- `zodResolver(schema)` で schema とつなぁE

#### ③ submit

- `handleSubmit` が最初に schema チェチE��をすめE
- 問題なければ `onSubmit(data)` が動ぁE
- `data` は入力済みの完�EチE�Eタ

#### ④ App更新

- Form は親にチE�Eタを渡ぁE
- 実際に `patients` めE`records` を更新するのは親、最終的には `App`
- 忁E��なめE`id` をつける
- `onSaveData` で保存すめE
- `App` の state が更新されることで全画面に反映されめE

---

### 5. 今日の一番大事な琁E��

- Form の役割は「�E力を雁E��て、正しい形のチE�Eタを親に渡すこと、E
- App の役割は「アプリ全体�E state を更新すること、E

つまり、E

- `schema` = ルール
- `form` = 入力場所
- `submit` = 親へ渡ぁE
- `App更新` = アプリ全体�EチE�Eタ管琁E

とぁE��流れで老E��ると整琁E��めE��ぁE��わかった、E

---

### 6. 自刁E�E言葉でまとめる

`AddPatientForm` めE`NursingRecordForm` も、まぁEschema で入力チェチE��をして、form で値を集めて、submit で親に渡すところまでは同じ、E 
違うのは、患老E��ータを作るのか、看護記録チE�Eタを作るのかとぁE��点、E 
そして最終的に state を更新する責任は Form ではなぁE`App` 側にある、E 
今�Eアプリは褁E��画面で同じチE�Eタを使ぁE�Eで、`addPatient` めE`App` に上げる設計�E方が�E然、E

---

### 7. 次回やること

- `AddPatientForm` と `NursingRecordForm` をコード上で対応させて見比べめE
- `onSubmit` がどこからどこへ渡ってぁE��かを props の流れで整琁E��めE
- `App` が最終的な更新拁E��になってぁE��構造をコードで確認すめE

## 2026-04-23 学習ログ�E�EddPatientForm / NursingRecordForm / onSubmit の流れを整琁E��E

### 1. 今日めE��たこと

- AddPatientForm のコードを読んで、フォームの役割を整琁E��ぁE
- PatientList のコードを読んで、AddPatientForm から渡されぁEonSubmit の正体を確認しぁE
- App のコードを読んで、最終的な更新拁E��が App であることを確認しぁE
- NursingRecordForm のコードを読んで、AddPatientForm と同じ設計パターンで作られてぁE��ことを整琁E��ぁE
- Validation Errors が残り続ける原因を確認し、onErrorsChange の役割を理解した

### 2. 琁E��したこと

#### ① AddPatientForm は最終更新をしてぁE��ぁE

AddPatientForm は、E

- 入力を受け取る
- schema でバリチE�Eションする
- onSubmit(data) を親に渡ぁE

とぁE��役割だけを持ってぁE��、E
自刁E�� patients めEappData を直接更新してぁE��わけではなぁE��E

つまり、AddPatientForm は入力�E入口、E

#### ② AddPatientForm の onSubmit の正体�E PatientList の関数

PatientList では、E

- addPatientSubmit を定義する
- そ�E関数めEonSubmit={addPatientSubmit} として AddPatientForm に渡ぁE

とぁE��流れになってぁE��、E

そ�Eため、AddPatientForm の中の

await onSubmit(data);

は、実際には

await addPatientSubmit(data);

と同じ意味になる、E

つまり、props の onSubmit は親から渡された関数の別名、E

#### ③ PatientList も最終更新はしてぁE��ぁE

PatientList の addPatientSubmit では、E

- 入力データに id をつける
- nextPatients を作る
- onSaveData({ patients: nextPatients, records }) を呼ぶ

ところまで行ってぁE��、E

でめEPatientList 自身ぁEsetAppData してぁE��わけではなぁE��E

つまり、PatientList は追加チE�Eタの絁E��立て役、E

#### ④ 最終更新拁E���E App

App の onSaveData で、E

- saveAppData(payload) で API に保存すめE
- 戻り値をチェチE��する
- setAppData(saved) を実行すめE

とぁE��流れになってぁE��、E

ここで実際に state を更新してぁE��ので、E
最終更新拁E���E App だと琁E��した、E

### 3. フォームの流れを一本で整琁E

患老E��加の流れはこうなる、E

AddPatientForm
-> onSubmit(data)
-> PatientList の addPatientSubmit(data)
-> onSaveData(...)
-> App の onSaveData(payload)
-> saveAppData(payload)
-> setAppData(saved)

つまり、E

フォームは入力を雁E��めE
親がデータを絁E��立てめE
App が最後に更新する

とぁE��流れ、E

### 4. AddPatientForm と NursingRecordForm の共通点

両方とも次の型で作られてぁE��と刁E��った、E

- useForm を使ぁE
- zodResolver(schema) を使ぁE
- errors を持つ
- Controller で入力欁E��つなぁE
- handleSubmit(...) を通す
- 親から受け取っぁEonSubmit を呼ぶ
- 自刁E��は最終更新しなぁE

つまり、E
入力頁E��は違うけど、フォームの設計パターンは同じ、E

### 5. AddPatientForm と NursingRecordForm の違い

#### AddPatientForm

- 氏名、E��屋番号を�E力すめE
- patients を見て重褁E��屋番号をチェチE��する
- 保存後に reset() してフォームを閉じる

#### NursingRecordForm

- 日付、記録老E��バイタル、記録冁E��を�E力すめE
- recordSchema で検証する
- initialValues を受け取り、忁E��に応じて reset(initialValues) する

つまり、E
骨絁E��は同じで、中身だけ違ぁE��E

### 6. Validation Errors が残る琁E��

Validation Errors の表示は、フォームそ�Eも�Eではなく、App 側の globalErrors / displayErrors によるも�E、E

そ�Eため、E

- フォーム冁E�Eエラー表示が消えてめE
- 親のエラー状態が更新されなければ

下�Eパネルに古ぁE��ラーが残ることがある、E

### 7. onErrorsChange の琁E��

onErrorsChange は、フォームのエラー状態を親へ伝えるため�E props、E

AddPatientForm 側では、E

- errors が変わったら
- onErrorsChange(errors) を呼んで
- 親に最新のエラー状態を渡してぁE��

もし onErrorsChange を渡し忘れると、E
親に最新の状態が伝わらず、古ぁE��ラー表示が残りめE��ぁE��E

### 8. onErrorsChange?.({}) の意味

これは、E

- onErrorsChange があれ�E
- 空のオブジェクチE{} を渡ぁE

とぁE��意味、E

{} はここでは「今�Eエラーなし」を表す、E

つまめEonErrorsChange?.({}) は、E
親にエラー状態を空へ戻してもらぁE��め�E通知、E

### 9. 今日のぁE��ばん大事な学び

フォームは更新してぁE��ように見えても、E
実際には入力を受け取って親へ渡してぁE��だけで、E
本当に state を更新してぁE��のは App だった、E

つまり、E

- AddPatientForm = 入力�E入口
- PatientList = 追加チE�Eタの絁E��立て役
- App = 最終更新拁E��E

とぁE��役割刁E��を理解できた、E

### 10. 次回やること

- NursingRecordForm の onSubmit がどこで受け取られてぁE��か追ぁE
- addRecord / updateRecord ぁEApp につながる流れを整琁E��めE
- 患老E��加 と 記録追加 の流れを並べて比輁E��めE

つまり今日の学びは、E
「フォームは入口、親が中継、App が最終更新、E
とぁE��設計をコードで確認できたこと、E


