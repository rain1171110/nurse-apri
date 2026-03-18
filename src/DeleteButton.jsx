export default function DeleteButton({ handleDelete }) {
  return (
    <button type="button" className="btn-danger" onClick={handleDelete}>
      削除
    </button>
  );
}
