export default function DeleteButton({ onDelete }) {
  return (
    <button type="button" className="btn-danger" onClick={onDelete}>
      削除
    </button>
  );
}
