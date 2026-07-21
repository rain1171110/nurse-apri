type DeleteButtonProps = {
  onDelete: () => Promise<void>;
};

export default function DeleteButton({ onDelete }: DeleteButtonProps) {
  const handleDelete = async (): Promise<void> => {
    const ok = window.confirm("この患者を削除しますか？");

    if (!ok) return;

    await onDelete();
  };
  return (
    <button type="button" className="btn-danger" onClick={handleDelete}>
      削除
    </button>
  );
}
