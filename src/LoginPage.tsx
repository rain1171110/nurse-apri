import type { FormEvent } from "react";

export default function LoginPage() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }
  return (
    <form onSubmit={handleSubmit}>
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
