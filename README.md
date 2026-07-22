# 看護記録管理アプリ

## アプリ概要

患者情報と看護記録を管理できる、看護師向けの記録管理アプリです。

患者ごとに看護記録やバイタル情報を確認でき、患者情報・看護記録の追加、表示、編集、削除ができます。

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

### バックエンド

- Node.js
- Express
- JSON file（学習用の簡易データ保存）

### テスト

- Vitest

## 主な機能

### 患者情報

- 患者情報の追加
- 患者情報の表示
- 患者情報の編集
- 患者情報の削除

### 看護記録

- 看護記録の追加
- 看護記録の表示
- 看護記録の編集
- 看護記録の削除

### その他

- バイタル情報の管理
- フォームバリデーション
- 患者ごとの看護記録表示
- 使用中の部屋番号の重複チェック

## CRUDの流れ

```txt
画面操作
↓
App.tsx
↓
api/patientApi.ts / api/recordApi.ts
↓
Express API（server/index.js）
↓
server/data.json
↓
Reactのstateを更新
↓
画面へ反映
```

## API一覧

| メソッド | URL               | 内容                     |
| -------- | ----------------- | ------------------------ |
| GET      | /api/data         | 患者情報・看護記録の取得 |
| POST     | /api/patients     | 患者追加                 |
| PUT      | /api/patients/:id | 患者更新                 |
| DELETE   | /api/patients/:id | 患者削除                 |
| POST     | /api/records      | 看護記録追加             |
| PUT      | /api/records/:id  | 看護記録更新             |
| DELETE   | /api/records/:id  | 看護記録削除             |

## TypeScript化で工夫した点

- 患者情報、看護記録、バイタルサインの型を共通化した
- API関数の引数と戻り値に型を設定した
- `Omit`を使い、登録・更新時に必要なデータを表現した
- `Pick`を使い、各コンポーネントが利用するOutlet Contextを明示した
- Zodの入力前と変換後を`z.input`と`z.output`で分けた
- React Hook Formに入力値と変換後データの型を設定した
- APIが失敗した場合を考慮し、`Promise<T | undefined>`や`Promise<boolean>`で結果を表現した

## テスト

Vitestを使用し、患者情報と看護記録のバリデーションをテストしています。

主なテスト内容：

- 患者氏名の必須チェック
- 使用中の部屋番号の重複チェック
- 部屋番号の数値変換
- 年齢の範囲チェック
- 看護記録の必須項目チェック
- バイタルサインの範囲チェック

テストを監視モードで実行します。

```bash
npm run test:watch
```

TypeScriptのコンパイルと本番用ビルドを確認します。

```bash
npm run build
```

## セットアップ方法

依存パッケージをインストールします。

```bash
npm install
```

フロントエンドを起動します。

```bash
npm run dev
```

別のターミナルでAPIサーバーを起動します。

```bash
npm run api
```

## デプロイ

- フロントエンド：Vercel
- バックエンド：Render

現在は学習用としてJSON fileにデータを保存しています。

本番運用を想定する場合は、データベースへ移行する予定です。

## 画面イメージ

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

## 今後の予定

- データベース連携
- ログイン・ログアウト機能
- ユーザーごとの権限管理
- 患者検索機能
- テスト範囲の拡大