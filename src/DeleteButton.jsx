export default function DeleteButton({ onDelete }) {
  const handleDelete = () => {
    const ok = window.confirm("この患者を削除しますか？");

    if (!ok) return;

    onDelete();
  };
  return (
    <button type="button" className="btn-danger" onClick={handleDelete}>
      削除
    </button>
  );
}
