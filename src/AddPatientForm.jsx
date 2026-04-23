import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField } from "@mui/material";
import { useMemo } from "react";
import { makePatientSchemaPartial } from "./schema";
import { extractUsedRoomNumbers } from "./Utils";

export default function AddPatientForm({
  patients,
  onSubmit,
  onErrorsChange,
  showAddForm,
  setShowAddForm,
}) {
  const prevErrorSignatureRef = useRef("");
  const usedRooms = useMemo(() => extractUsedRoomNumbers(patients), [patients]);
  const schema = useMemo(
    () => makePatientSchemaPartial(usedRooms),
    [usedRooms],
  );

  const handleAddPatientSubmit = async (data) => {
    await onSubmit(data);
    reset();
    setShowAddForm(false);
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: { name: "", room: "" },
  });

  useEffect(() => {
    const signature = JSON.stringify(errors);
    if (signature === prevErrorSignatureRef.current) return;
    prevErrorSignatureRef.current = signature;
    if (onErrorsChange) onErrorsChange(errors);
  }, [errors, onErrorsChange]);

  if (!showAddForm) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">患者を追加</h3>
      </div>
      <form onSubmit={handleSubmit(handleAddPatientSubmit)}>
        <div className="card-body">
          <div className="form-group">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="氏名"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </div>
          <div className="form-group">
            <Controller
              name="room"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="部屋番号"
                  error={!!errors.room}
                  helperText={errors.room?.message}
                />
              )}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            保存
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              reset();
              // onErrorsChange?.({});
              setShowAddForm(false);
            }}
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
