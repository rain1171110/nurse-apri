import { useState, type FormEvent } from "react";
import { registerApi } from "./api/authApi";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const registerData = {
      email,
      password,
    };
    try {
      setApiError("");
      await registerApi(registerData);
      navigate("/login");
    } catch (error) {
      console.error("登録に失敗しました", error);

      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("登録に失敗しました");
      }
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      {apiError && <p className="text-error">{apiError}</p>}

      <label htmlFor="email">新規メールアドレス</label>
      <input id="email" name="email" type="email" required />
      <br />

      <label htmlFor="password">新規パスワード</label>
      <input id="password" name="password" type="password" required />
      <br />

      <button type="submit" className="btn-primary">
        登録ボタン
      </button>
      <br />

      <Link to="/login" className="login-link">
        戻る
      </Link>
    </form>
  );
}
