// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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
});
