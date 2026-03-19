export default function DeleteButton({ onClick }) {
  return (
    <button type="button" className="btn-danger" onClick={onClick}>
      削除
    </button>
  );
}
