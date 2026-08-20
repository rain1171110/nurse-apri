import { useState, type FormEvent } from "react";
import { loginApi } from "./api/authApi";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const loginData = {
      email,
      password,
    };
    try {
      setApiError("");
      await loginApi(loginData);
      navigate("/");
    } catch (error) {
      console.error("ログインに失敗しました", error);

      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("ログインに失敗しました");
      }
    }
  }
  return (
    <form onSubmit={handleSubmit}>
      {apiError && <p>ログインに失敗しました</p>}
      <label htmlFor="email">メールアドレス</label>
      <input id="email" name="email" type="email" />

      <label htmlFor="password">パスワード</label>
      <input id="password" name="password" type="password" />

      <button type="submit" className="btn-primary">
        ログインボタン
      </button>
    </form>
  );
}
