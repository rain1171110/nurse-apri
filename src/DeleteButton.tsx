type DeleteButtonProps = {
  onDelete: () => Promise<void>;
  alertMessage: string;
};

export default function DeleteButton({ onDelete,alertMessage }: DeleteButtonProps) {
  const handleDelete = async (): Promise<void> => {
    const ok = window.confirm(alertMessage);

    if (!ok) return;

    await onDelete();
  };
  return (
    <button type="button" className="btn-danger" onClick={handleDelete}>
      削除
    </button>
  );
}
