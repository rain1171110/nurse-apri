// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { fetchAppData } from "./api/appDataApi";

vi.mock("./api/appDataApi", () => ({
  fetchAppData: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
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
      <MemoryRouter>
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
});
