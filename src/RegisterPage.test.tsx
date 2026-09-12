// @vitest-environment jsdom
import { getByRole, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RegisterPage from "./RegisterPage";
import { registerApi } from "./api/authApi";
import { MemoryRouter } from "react-router-dom";
import { click } from "@testing-library/user-event/dist/cjs/convenience/click.js";
import { email } from "zod";

vi.mock("./api/authApi", () => ({
  registerApi: vi.fn(),
}));

describe("RegisterPage", () => {
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
});
