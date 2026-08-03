import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useForm, Controller } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField } from "@mui/material";
import { makePatientSchemaPartial } from "./schema";
import { extractUsedRoomNumbers } from "./Utils";

import type { Patient } from "./types";
import type { PatientInput, PatientOutput } from "./schema";

type AddPatientFormProps = {
  patients: Patient[];
  onSubmit: (data: PatientOutput) => Promise<Patient | undefined>;
  onErrorsChange?: (errors: FieldErrors<PatientInput>) => void;
  showAddForm: boolean;
  setShowAddForm: Dispatch<SetStateAction<boolean>>;
};

export default function AddPatientForm({
  patients,
  onSubmit,
  onErrorsChange,
  showAddForm,
  setShowAddForm,
}: AddPatientFormProps) {
  const usedRooms = useMemo(() => extractUsedRoomNumbers(patients), [patients]);
  const schema = useMemo(
    () => makePatientSchemaPartial(usedRooms),
    [usedRooms],
  );

  const handleInvalidSubmit = (formErrors: FieldErrors<PatientInput>): void => {
    onErrorsChange?.(formErrors);
  };

  const handleAddPatientSubmit = async (data: PatientOutput): Promise<void> => {
    const savedPatient = await onSubmit(data);

    if (!savedPatient) {
      return;
    }

    reset();
    setShowAddForm(false);
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientInput, unknown, PatientOutput>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: { name: "", room: "" },
  });

  if (!showAddForm) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">患者を追加</h3>
      </div>
      <form
        onSubmit={handleSubmit(handleAddPatientSubmit, handleInvalidSubmit)}
      >
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
              onErrorsChange?.({});
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
