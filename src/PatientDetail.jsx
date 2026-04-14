import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { makePatientSchemaPartial, runPatientValidationCases } from "./schema";

import { TextField } from "@mui/material";
import { useNavigate, useOutletContext } from "react-router-dom";

export default function PatientDetail({
  onErrorsChange,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { patient,updatePatient,usedRoomsForEdit } = useOutletContext();


  const defaultValues = useMemo(
    () => ({
      name: patient?.name ?? "",
      room: patient?.room ?? "",
      age: patient?.age ?? "",
      disease: patient?.disease ?? "",
      history: patient?.history ?? "",
      progress: patient?.progress ?? "",
    }),
    [patient],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
  } = useForm({
    resolver: zodResolver(makePatientSchemaPartial(usedRoomsForEdit)),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues,
  });

  useEffect(() => {
    if (!patient) return;
    reset({
      name: patient.name ?? "",
      room: patient.room ?? "",
      age: patient.age ?? "",
      disease: patient.disease ?? "",
      history: patient.history ?? "",
      progress: patient.progress ?? "",
    });
  }, [patient, reset]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const results = runPatientValidationCases();
    console.table(results);
  }, []);

  if (!patient) {
    return <div>患者が見つかりません</div>;
  }

  return (
    <div className="container-sm">
      {/* ヘッダー */}
      <div className="section-header mb-lg">
        <h2 className="section-title">患者情報</h2>
      </div>

      {/* 患者基本情報（編集中は非表示） */}
      {!isEditing && (
        <div className="card mb-lg">
          <div className="card-header">
            <h3 className="card-title">{patient.name}</h3>
          </div>

          <div className="card-body">
            <div className="mb-md">
              <small className="text-secondary">病室</small>
              <p className="font-medium text-lg">{patient.room}号室</p>
            </div>

            <div className="mb-md">
              <small className="text-secondary">年齢</small>
              <p className="font-medium text-lg">{patient.age}歳</p>
            </div>

            <div>
              <small className="text-secondary">病名</small>
              <p className="font-medium">{patient.disease}</p>
            </div>
            <div>
              <small className="text-secondary">既往歴</small>
              <p className="font-medium">{patient.history}</p>
            </div>
            <div>
              <small className="text-secondary">これまでの経過</small>
              <p className="font-medium">{patient.progress}</p>
            </div>
          </div>
        </div>
      )}

      {/* 編集フォーム */}
      {isEditing && (
        <div className="card mb-lg">
          <div className="card-header">
            <h3 className="card-title">患者情報を編集</h3>
          </div>

          <form
            onSubmit={handleSubmit(async (data) => {
              const updated = { ...patient, ...data };
              await updatePatient(updated);
              reset(updated);
              clearErrors();
              if (onErrorsChange) {
                onErrorsChange?.({});
              }
              setIsEditing(false);
            })}
          >
            <div className="card-body">
              <div className="form-group">
                <label className="form-label form-required">氏名</label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <label className="form-label form-required">病室</label>
                <Controller
                  name="room"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      error={!!errors.room}
                      helperText={errors.room?.message}
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <label className="form-label">年齢</label>
                <Controller
                  name="age"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      error={!!errors.age}
                      helperText={errors.age?.message}
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <label className="form-label">病名</label>
                <Controller
                  name="disease"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.disease}
                      helperText={errors.disease?.message}
                    />
                  )}
                />
              </div>
              <div className="form-group">
                <label className="form-label">既往歴</label>
                <Controller
                  name="history"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.history}
                      helperText={errors.history?.message}
                    />
                  )}
                />
              </div>
              <div className="form-group">
                <label className="form-label">これまでの経過</label>
                <Controller
                  name="progress"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.progress}
                      helperText={errors.progress?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  clearErrors();
                  if (onErrorsChange) {
                    onErrorsChange({});
                  }
                  setIsEditing(false);
                }}
              >
                キャンセル
              </button>
              <button type="submit" className="btn-primary">
                保存
              </button>
            </div>
          </form>
        </div>
      )}

      {/* アクションボタン */}
      {!isEditing && (
        <div className="form-actions">
          <button
            onClick={() => navigate(`/patient/${patient.id}`)}
            className="btn-secondary"
          >
            メニューに戻る
          </button>
          <button onClick={() => setIsEditing(true)} className="btn-primary">
            編集
          </button>
        </div>
      )}
    </div>
  );
}
