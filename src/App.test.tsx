// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { fetchAppData } from "./api/appDataApi";
import { loginApi, logoutApi } from "./api/authApi";

vi.mock("./api/appDataApi", () => ({
  fetchAppData: vi.fn(),
}));

vi.mock("./api/authApi", () => ({
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
  registerApi: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("データ取得中は読み込み中の表示をする", () => {
    vi.mocked(fetchAppData).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("読み込み中…")).toBeInTheDocument();
  });

  it("データ取得に失敗したらエラーメッセージを表示する", async () => {
    vi.mocked(fetchAppData).mockRejectedValue(new Error("Network Error"));
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByText("APIから読み込めませんでした"),
    ).toBeInTheDocument();
  });

  it("未ログインならログイン画面を表示する", async () => {
    vi.mocked(fetchAppData).mockRejectedValue(new Error("API error:401"));
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("button", { name: "ログインボタン" }),
    ).toBeInTheDocument();
  });

  it("ログイン済みなら患者一覧を表示する", async () => {
    vi.mocked(fetchAppData).mockResolvedValue({ patients: [], records: [] });
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText("患者一覧")).toBeInTheDocument();
  });

  it("ログアウトボタンを押したらログイン画面を表示する", async () => {
    vi.mocked(fetchAppData).mockResolvedValue({ patients: [], records: [] });
    vi.mocked(logoutApi).mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    const logoutButton = await screen.findByRole("button", {
      name: "ログアウトボタン",
    });
    await user.click(logoutButton);

    expect(logoutApi).toHaveBeenCalledTimes(1);

    expect(
      await screen.findByRole("button", { name: "ログインボタン" }),
    ).toBeInTheDocument();
  });

  it("ログアウトに失敗したらエラーを表示してログイン状態を維持する", async () => {
    vi.mocked(fetchAppData).mockResolvedValue({ patients: [], records: [] });
    vi.mocked(logoutApi).mockRejectedValue(
      new Error("ログアウトに失敗しました"),
    );

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    const logoutButton = await screen.findByRole("button", {
      name: "ログアウトボタン",
    });
    await user.click(logoutButton);

    expect(logoutApi).toHaveBeenCalledTimes(1);

    expect(
      await screen.findByText("ログアウトに失敗しました"),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("button", { name: "ログアウトボタン" }),
    ).toBeInTheDocument();
  });

  it("未ログイン状態からログインに成功したら、患者一覧を表示する", async () => {
    vi.mocked(loginApi).mockResolvedValue(undefined);
    vi.mocked(fetchAppData)
      .mockRejectedValueOnce(new Error("API error:401"))
      .mockResolvedValueOnce({ patients: [], records: [] });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const emailInput = await screen.findByLabelText("メールアドレス");
    const passwordInput = screen.getByLabelText("パスワード");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    const loginButton = screen.getByRole("button", { name: "ログインボタン" });
    await user.click(loginButton);

    expect(loginApi).toHaveBeenCalledTimes(1);

    expect(loginApi).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });

    const message = await screen.findByText("患者一覧");
    expect(message).toBeInTheDocument();
  });
});
