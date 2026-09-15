// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";
import { loginApi } from "./api/authApi";

vi.mock("./api/authApi", () => ({
  loginApi: vi.fn(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("入力したログイン情報でloginApiが呼ばれる", async () => {
    const onLoginSuccess = vi.fn();
    const user = userEvent.setup();

    vi.mocked(loginApi).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={onLoginSuccess} />}
          />
          <Route path="/" element={<p>患者一覧</p>} />
        </Routes>
      </MemoryRouter>,
    );
    const emailInput = screen.getByLabelText("メールアドレス");
    const passwordInput = screen.getByLabelText("パスワード");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    const loginButton = screen.getByRole("button", { name: "ログインボタン" });
    await user.click(loginButton);

    expect(loginApi).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("ログインに成功したら患者一覧画面へ移動する", async () => {
    const onLoginSuccess = vi.fn();
    onLoginSuccess.mockResolvedValue(undefined);

    vi.mocked(loginApi).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={onLoginSuccess} />}
          />
          <Route path="/" element={<p>患者一覧</p>} />
        </Routes>
      </MemoryRouter>,
    );
    const emailInput = screen.getByLabelText("メールアドレス");
    const passwordInput = screen.getByLabelText("パスワード");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    const loginButton = screen.getByRole("button", { name: "ログインボタン" });
    await user.click(loginButton);

    const message = await screen.findByText("患者一覧");
    expect(message).toBeInTheDocument();
  });

  it("ログインに失敗したらエラーメッセージを表示する", async () => {
    const onLoginSuccess = vi.fn();
    vi.mocked(loginApi).mockRejectedValue(new Error("ログインに失敗しました"));

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={onLoginSuccess} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    const emailInput = screen.getByLabelText("メールアドレス");
    const passwordInput = screen.getByLabelText("パスワード");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    const loginButton = screen.getByRole("button", { name: "ログインボタン" });
    await user.click(loginButton);

    const message = await screen.findByText("ログインに失敗しました");
    expect(message).toBeInTheDocument();
  });
});
