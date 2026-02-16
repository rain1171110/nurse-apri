import {
  TEMP_OPTIONS,
  PULSE_OPTIONS,
  RR_OPTIONS,
  SBP_OPTIONS,
  DBP_OPTIONS,
  AUTHOR_OPTIONS,
  formatDate,
  SPO2_OPTIONS,
} from "./Utils";
import Box from "@mui/material/Box";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recordSchema } from "./schema";

export default function NursingRecordForm({
  initialValues,
  onSubmit,
  showDate = false,
  onErrorsChange,
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(recordSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    if (onErrorsChange) {
      onErrorsChange(errors);
    }
  }, [errors, onErrorsChange]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {showDate && (
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ? dayjs(field.value) : null}
                onChange={(newValue) => field.onChange(formatDate(newValue))}
                slotProps={{
                  textField: {
                    error: !!errors.date,
                    helperText: errors.date?.message,
                  },
                }}
              />
            )}
          />
        )}
        <Box>
          <Controller
            name="author"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={AUTHOR_OPTIONS}
                value={String(field.value ?? "")}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") field.onChange(value);
                }}
                onChange={(_, value) => field.onChange(value ?? "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="記録者"
                    error={!!errors.author}
                    helperText={errors.author?.message}
                  />
                )}
              />
            )}
          />
        </Box>
        <Box>
          <Controller
            name="vitals.T"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={TEMP_OPTIONS}
                value={String(field.value ?? "")}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") field.onChange(value);
                }}
                onChange={(_, value) => field.onChange(value ?? "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="体温"
                    error={!!errors.vitals?.T}
                    helperText={errors.vitals?.T?.message}
                  />
                )}
              />
            )}
          />
        </Box>
        ℃
        <Box>
          <Controller
            name="vitals.P"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={PULSE_OPTIONS}
                value={String(field.value ?? "")}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") field.onChange(value);
                }}
                onChange={(_, value) => field.onChange(value ?? "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="脈拍"
                    error={!!errors.vitals?.P}
                    helperText={errors.vitals?.P?.message}
                  />
                )}
              />
            )}
          />
        </Box>
        回
        <Box>
          <Controller
            name="vitals.R"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={RR_OPTIONS}
                value={String(field.value ?? "")}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") field.onChange(value);
                }}
                onChange={(_, value) => field.onChange(value ?? "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="呼吸"
                    error={!!errors.vitals?.R}
                    helperText={errors.vitals?.R?.message}
                  />
                )}
              />
            )}
          />
        </Box>
        回
        <Box>
          <Controller
            name="vitals.SBP"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={SBP_OPTIONS}
                value={String(field.value ?? "")}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") field.onChange(value);
                }}
                onChange={(_, value) => field.onChange(value ?? "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="収縮期"
                    error={!!errors.vitals?.SBP}
                    helperText={errors.vitals?.SBP?.message}
                  />
                )}
              />
            )}
          />
        </Box>
        mmHg
        <Box>
          <Controller
            name="vitals.DBP"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={DBP_OPTIONS}
                value={String(field.value ?? "")}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") field.onChange(value);
                }}
                onChange={(_, value) => field.onChange(value ?? "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="拡張期"
                    error={!!errors.vitals?.DBP}
                    helperText={errors.vitals?.DBP?.message}
                  />
                )}
              />
            )}
          />
        </Box>
        mmHg
        <Box>
          <Controller
            name="vitals.SPO2"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={SPO2_OPTIONS}
                value={String(field.value ?? "")}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") field.onChange(value);
                }}
                onChange={(_, value) => field.onChange(value ?? "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="SPO2"
                    error={!!errors.vitals?.SPO2}
                    helperText={errors.vitals?.SPO2?.message}
                  />
                )}
              />
            )}
          />
        </Box>
        %
        <div>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="記録内容"
                error={!!errors.content}
                helperText={errors.content?.message}
              />
            )}
          />
        </div>
        <button type="submit" className="btn-primary">
          記録を保存する
        </button>
      </form>
    </>
  );
}
