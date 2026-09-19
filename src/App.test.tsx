// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { fetchAppData } from "./api/appDataApi";
import { logoutApi } from "./api/authApi";

vi.mock("./api/appDataApi", () => ({
  fetchAppData: vi.fn(),
}));

vi.mock("./api/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api/authApi")>();
  return {
    ...actual,
    logoutApi: vi.fn(),
  };
});

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
});
