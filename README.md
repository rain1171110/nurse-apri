# Nurse Apri | 看護記録管理アプリ

## アプリ概要

患者情報・看護記録・バイタル情報を管理できる、看護師向けの記録管理アプリです。

ユーザーごとに患者データを分離し、ログインしたユーザーが自分の患者情報と看護記録を追加・閲覧・編集・削除できます。

**デモアプリ：** https://nurse-apri.vercel.app

> 学習・ポートフォリオ用のアプリです。動作確認には架空の情報を使用してください。
>
> 公開DBはRenderの無料プランを使用しており、現在のDBの有効期限は2026年11月9日です。

## 作成した理由

看護師として働く中で、患者情報や看護記録を効率よく管理する重要性を感じたため作成しました。

現場で扱う情報を患者ごとに整理し、必要な情報を確認しやすくすることを目的としています。

## 使用技術

### フロントエンド

- React
- TypeScript
- Vite
- React Router
- React Hook Form
- Zod
- MUI
- dayjs

### バックエンド・データベース

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- bcryptjs
- jsonwebtoken
- cookie-parser
- cors

### テスト

- Vitest
- Testing Library
- Supertest

### デプロイ

- フロントエンド：Vercel
- バックエンド：Render
- データベース：Render PostgreSQL

## 主な機能

### 認証・データ分離

- ユーザーの新規登録
- ログイン・ログアウト
- bcryptjsによるパスワードのハッシュ化
- HttpOnly Cookieを使用したJWT認証
- 再読み込み後のログイン状態の復元
- ユーザーごとの患者・看護記録データの分離
- APIでの患者・看護記録の所有者確認

### 患者情報

- 患者情報の追加・表示・編集・削除
- 氏名・部屋番号による部分一致検索
- 氏名・部屋番号・年齢・疾患・既往歴・経過の管理
- 使用中の部屋番号の重複チェック

### 看護記録・バイタル

- 看護記録の追加・表示・編集・削除
- 患者ごとの看護記録表示
- 体温・脈拍・呼吸数・血圧・SpO2の管理

### フォーム・エラー処理

- Zodによる入力検証
- 保存中のボタン無効化
- 保存失敗時の入力内容保持
- APIエラーの表示

## データの流れ

1. 画面操作をReactコンポーネント・App.tsxで受け取る
2. フロントエンドのAPI関数からExpress APIへリクエストを送る
3. APIで認証・入力検証・所有者確認を行う
4. Prismaを通じてPostgreSQLのデータを取得・更新する
5. APIから結果を返す
6. Reactのstateを更新し、画面へ反映する

## API一覧

| メソッド | URL                | 内容                                 |
| -------- | ------------------ | ------------------------------------ |
| POST     | /api/auth/register | ユーザー登録                         |
| POST     | /api/auth/login    | ログイン                             |
| POST     | /api/auth/logout   | ログアウト                           |
| GET      | /api/data          | ログインユーザーの患者・看護記録取得 |
| GET      | /api/patients      | ログインユーザーの患者一覧取得       |
| POST     | /api/patients      | 患者追加                             |
| PUT      | /api/patients/:id  | 患者更新                             |
| DELETE   | /api/patients/:id  | 患者削除                             |
| POST     | /api/records       | 看護記録追加                         |
| PUT      | /api/records/:id   | 看護記録更新                         |
| DELETE   | /api/records/:id   | 看護記録削除                         |

患者・看護記録のAPIには認証が必要です。他のユーザーのデータへの操作を制限しています。

## TypeScript化で工夫した点

- 患者情報・看護記録・バイタルサインの型を共通化した
- API関数の引数と戻り値に型を設定した
- `Omit`を使い、登録・更新時に必要なデータを表現した
- `Pick`を使い、各コンポーネントが利用するOutlet Contextを明示した
- Zodの入力前と変換後を`z.input`と`z.output`で分けた
- React Hook Formに入力値と変換後データの型を設定した
- 保存結果を`Promise<T | undefined>`などで表現し、成功・失敗に応じて画面の処理を分けた
- 年齢の未入力を`null`として扱い、`??`を使用して0歳を保持した
- フロントエンドとバックエンドの両方を型チェックするようにした

## テスト

### フロントエンド

入力検証に加え、実際のフォーム操作や画面遷移を検証しています。

- 患者情報の必須項目・数値範囲・重複チェック
- 看護記録・バイタルの入力検証
- 患者追加フォームの表示・キャンセル
- 保存成功時のフォーム終了
- 保存失敗時の入力内容保持
- 氏名・部屋番号検索、検索クリア、部分一致検索
- 患者カードから詳細画面への遷移
- 患者編集フォームの初期値・保存・キャンセル

### API

Supertestのagentで2人のユーザーのCookieを保持し、認証と所有者の制限を検証しています。

`server/index.test.ts`は2026年10月21日に20件すべて成功しています。

- ログアウト後の保護APIへのアクセス拒否
- 他ユーザーの患者の取得・更新・削除制限
- 他ユーザーの患者への看護記録追加制限
- 他ユーザーの看護記録の更新・削除制限
- 不正な入力に対する400
- 存在しない患者・看護記録に対する404
- 患者一覧・患者と看護記録データの取得
- `GET /api/data`で、他ユーザーの患者・看護記録が含まれないこと

### 実行コマンド

DBを使用するテストは、`.env.test`に設定したテスト用DBで実行します。
Git Bashでは、各テストコマンドの先頭に`DOTENV_CONFIG_PATH=.env.test`を付けてください。

テストを一括実行します。

```bash
DOTENV_CONFIG_PATH=.env.test npm test
```

監視モードで実行します。

```bash
DOTENV_CONFIG_PATH=.env.test npm run test:watch
```

APIテストだけ実行します。

```bash
DOTENV_CONFIG_PATH=.env.test npx vitest run server/index.test.ts
```

型チェックを実行します。

```bash
npm run typecheck
```

Prisma Client生成・型チェック・フロントエンドの本番用ビルドを実行します。

```bash
npm run build
```

> APIテストはDBにテストデータを作成・削除します。テスト用DBで実行してください。

## セットアップ方法

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクト直下の`.env`に、PostgreSQLの接続URLと認証用の秘密鍵を設定します。

```dotenv
DATABASE_URL=YOUR_POSTGRESQL_CONNECTION_URL
SHADOW_DATABASE_URL=YOUR_SHADOW_POSTGRESQL_CONNECTION_URL
JWT_SECRET=YOUR_RANDOM_SECRET
VITE_API_BASE=http://localhost:3001/api
```

`DATABASE_URL`と`JWT_SECRET`の実際の値はGitに登録しないでください。
`VITE_`で始まる変数はフロントエンドに公開されるため、秘密情報を設定しません。

APIテスト用に`.env.test`を作成し、`.env`をコピーした後、`.env.test`の`DATABASE_URL`をテスト用DBの接続先に変更します。

```bash
cp .env .env.test
```

`.env.test`は`.gitignore`で無視されるため、Gitに登録しないでください。

秘密鍵は次のコマンドで生成できます。

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### 3. Prisma Client生成・マイグレーション適用

接続先を確認してから実行します。

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. 起動

フロントエンドを起動します。

```bash
npm run dev
```

別のターミナルでAPIサーバーを起動します。

```bash
npm run api
```

開発画面：http://localhost:5173

初回は新規登録画面でアカウントを作成してください。

## デプロイ設定

### Vercel

- Build Command：`npm run build`
- Output Directory：`dist`
- 環境変数：`VITE_API_BASE=https://nurse-apri.onrender.com/api`

React Routerのページへ直接アクセス・再読み込みできるよう、`vercel.json`で`index.html`へのrewriteを設定しています。

### Render Web Service

- Build Command：`npm install && npx prisma generate && npx prisma migrate deploy`
- Start Command：`npm run api`
- 環境変数：`DATABASE_URL`・`JWT_SECRET`・`NODE_ENV=production`
- `DATABASE_URL`には、同じSingaporeリージョンのRender PostgreSQLのInternal Database URLを使用

### 公開環境の認証設定

- CORSで`https://nurse-apri.vercel.app`を許可
- フロントエンドのAPI通信に`credentials: "include"`を指定
- 本番の認証Cookieに`HttpOnly`・`Secure`・`SameSite=None`を指定
- ログアウト時も同じCookie設定で削除

## 公開環境の動作確認

架空の情報を使って本番環境を確認しています。動作確認には実際の患者情報を使用しないでください。

| 確認日         | 確認項目                                             | 結果 |
| -------------- | ---------------------------------------------------- | ---- |
| 2026年10月13日 | ログイン後の患者一覧表示・再読み込み後のログイン維持 | 成功 |
| 2026年10月13日 | ログアウト後のログイン画面表示・`/login`の再読み込み | 成功 |
| 2026年10月13日 | 患者メニューでログアウトボタンが非表示になること     | 成功 |
| 2026年10月13日 | 患者詳細・バイタル・看護記録一覧・詳細の表示         | 成功 |
| 2026年10月13日 | 患者名・部屋番号検索と検索クリア                     | 成功 |
| 2026年10月13日 | 患者の追加・編集・削除                               | 成功 |
| 2026年10月13日 | 看護記録の追加・編集・削除                           | 成功 |
| 2026年10月10日 | 新規登録、アカウントA・Bの患者データ分離             | 成功 |

## 画面イメージ

### ログイン画面（/login）

![ログイン画面（/login）](./screenshots/login.png)

### 新規登録画面（/register）

![新規登録画面（/register）](./screenshots/register.png)

### 患者一覧画面

![患者一覧画面](./screenshots/patient-list.png)

### 患者メニュー画面

![患者メニュー画面](./screenshots/patient-menu.png)

### 患者情報画面

![患者情報画面](./screenshots/patient-detail.png)

### 看護記録一覧画面

![看護記録一覧画面](./screenshots/record-list.png)

### 看護記録追加画面

![看護記録追加画面](./screenshots/record-add.png)

### バイタルサイン一覧画面

![バイタルサイン一覧画面](./screenshots/patient-vitals.png)

### 看護記録詳細画面

![看護記録詳細画面](./screenshots/record-detail.png)

## 今後の改善予定

- 入力エラーの表示を分かりやすくする
- 公開DBの期限（2026年11月9日）後もデモを継続できる方法を整える
