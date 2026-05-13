export default function DeleteButton({ onDelete, patient }) {
  const handleDelete = () => {
    const ok = window.confirm(`${patient.name}さんを削除しますか？`);

    if (!ok) return;

    onDelete();
  };
  return (
    <button type="button" className="btn-danger" onClick={handleDelete}>
      削除
    </button>
  );
}
