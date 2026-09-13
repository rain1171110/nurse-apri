// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPage from "./RegisterPage";
import { registerApi } from "./api/authApi";
import { MemoryRouter } from "react-router-dom";

vi.mock("./api/authApi", () => ({
  registerApi: vi.fn(),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("入力した登録情報でregisterApiが呼ばれる", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    const emailInput = screen.getByLabelText("新規メールアドレス");
    const passwordInput = screen.getByLabelText("新規パスワード");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    const registerButton = screen.getByRole("button", { name: "登録ボタン" });
    await user.click(registerButton);

    expect(registerApi).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("登録に失敗したらエラーメッセージを表示する", async () => {
    vi.mocked(registerApi).mockRejectedValue(new Error("登録に失敗しました"));

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    const emailInput = screen.getByLabelText("新規メールアドレス");
    const passwordInput = screen.getByLabelText("新規パスワード");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    const registerButton = screen.getByRole("button", { name: "登録ボタン" });
    await user.click(registerButton);

    expect(await screen.findByText("登録に失敗しました")).toBeTruthy();
  });
});
