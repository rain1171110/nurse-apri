# Plan: Room Refactor

## Goal

重複している「使用中の部屋番号を作る処理」を共通関数化し、読みやすく・直しやすくする。

## Step 1

`src/Utils.jsx` に `extractUsedRoomNumbers(patients, excludePatientId)` を追加する。

## Step 2

`src/PatientList.jsx` で `usedRooms` を共通関数呼び出しに置き換える。

- 変更前: `patients.map(...).filter(...)`
- 変更後: `extractUsedRoomNumbers(patients)`

## Step 3

`src/PatientList.jsx` で `usedRoomsForEdit` も共通関数呼び出しに置き換える。

- 変更前: `patients.filter(...).map(...).filter(...)`
- 変更後: `extractUsedRoomNumbers(patients, selectedPatient?.id)`

## Step 4

`schema` の呼び出しはそのまま維持する。

- `makePatientSchemaPartial(usedRooms)`

## Step 5

確認

- `usedRooms` が新規追加フォームで今まで通り機能する
- `usedRoomsForEdit` が編集時に「自分以外の重複」を正しく判定する
- エラーが出ないことを確認する
