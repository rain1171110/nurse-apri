// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import PatientDetail from "./PatientDetail";

describe("PatientDetail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("編集ボタン押すと編集フォームが表示される", async () => {
    const user = userEvent.setup();

    const patient = {
      id: "patient1",
      name: "田中",
      room: 101,
    };

    const updatePatient = vi.fn();
    const usedRoomsForEdit: number[] = [];

    render(
      <MemoryRouter initialEntries={["/detail"]}>
        <Routes>
          <Route
            element={
              <Outlet context={{ patient, updatePatient, usedRoomsForEdit }} />
            }
          >
            <Route
              path="/detail"
              element={<PatientDetail onErrorsChange={vi.fn()} />}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const editButton = screen.getByRole("button", {
      name: "編集",
    });
    await user.click(editButton);

    expect(
      await screen.findByRole("heading", { name: "患者情報を編集" }),
    ).toBeInTheDocument();
  });

  it("編集フォームに現在の氏名・部屋番号が入っている確認", async () => {
    const user = userEvent.setup();

    const patient = {
      id: "patient1",
      name: "田中",
      room: 101,
    };

    const updatePatient = vi.fn();
    const usedRoomsForEdit: number[] = [];

    render(
      <MemoryRouter initialEntries={["/detail"]}>
        <Routes>
          <Route
            element={
              <Outlet context={{ patient, updatePatient, usedRoomsForEdit }} />
            }
          >
            <Route
              path="/detail"
              element={<PatientDetail onErrorsChange={vi.fn()} />}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const editButton = screen.getByRole("button", {
      name: "編集",
    });
    await user.click(editButton);
    expect(
      await screen.findByRole("heading", { name: "患者情報を編集" }),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText("氏名");
    const roomInput = screen.getByLabelText("病室");

    expect(nameInput).toHaveValue("田中");
    expect(roomInput).toHaveValue(101);
  });

  it("キャンセルをオスと編集フォームが閉じる", async () => {
    const user = userEvent.setup();

    const patient = {
      id: "patient1",
      name: "田中",
      room: 101,
    };

    const updatePatient = vi.fn();
    const usedRoomsForEdit: number[] = [];

    render(
      <MemoryRouter initialEntries={["/detail"]}>
        <Routes>
          <Route
            element={
              <Outlet context={{ patient, updatePatient, usedRoomsForEdit }} />
            }
          >
            <Route
              path="/detail"
              element={<PatientDetail onErrorsChange={vi.fn()} />}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const editButton = screen.getByRole("button", {
      name: "編集",
    });
    await user.click(editButton);
    expect(
      await screen.findByRole("heading", { name: "患者情報を編集" }),
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", {
      name: "キャンセル",
    });

    await user.click(cancelButton);

    expect(
      screen.queryByRole("heading", { name: "患者情報を編集" }),
    ).not.toBeInTheDocument();

    expect(updatePatient).not.toHaveBeenCalled();
  });

    it("編集フォームを開いた後、氏名を田中から山田に変更", async () => {
    const user = userEvent.setup();

    const patient = {
      id: "patient1",
      name: "田中",
      room: 101,
    };

    const updatePatient = vi.fn();
    const usedRoomsForEdit: number[] = [];

    render(
      <MemoryRouter initialEntries={["/detail"]}>
        <Routes>
          <Route
            element={
              <Outlet context={{ patient, updatePatient, usedRoomsForEdit }} />
            }
          >
            <Route
              path="/detail"
              element={<PatientDetail onErrorsChange={vi.fn()} />}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const editButton = screen.getByRole("button", {
      name: "編集",
    });
    await user.click(editButton);
    expect(
      await screen.findByRole("heading", { name: "患者情報を編集" }),
    ).toBeInTheDocument();

    
    expect(
      screen.queryByRole("heading", { name: "患者情報を編集" }),
    ).not.toBeInTheDocument();

    expect(updatePatient).not.toHaveBeenCalled();
  });
});
