// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useParams } from "react-router-dom";
import PatientList from "./PatientList";

function PatientDetailForTest() {
  const { id } = useParams();
  return <h1>患者ID:{id}</h1>;
}

describe("PatientList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("氏名で検索すると一致する患者だけを表示する", async () => {
    const user = userEvent.setup();

    const patients = [
      { id: "patient1", name: "田中", room: 101 },
      { id: "patient2", name: "山本", room: 202 },
    ];

    render(
      <MemoryRouter>
        <PatientList
          patients={patients}
          isLoading={false}
          onErrorsChange={vi.fn()}
          addPatient={vi.fn().mockResolvedValue(undefined)}
        />
      </MemoryRouter>,
    );

    const searchInput = screen.getByLabelText("患者検索");
    await user.type(searchInput, "田中");

    expect(
      screen.getByRole("heading", { name: "101号室 田中" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "202号室 山本" }),
    ).not.toBeInTheDocument();
  });

  it("部屋番号で検索すると一致する患者だけを表示する", async () => {
    const user = userEvent.setup();

    const patients = [
      { id: "patient1", name: "田中", room: 101 },
      { id: "patient2", name: "山本", room: 202 },
    ];

    render(
      <MemoryRouter>
        <PatientList
          patients={patients}
          isLoading={false}
          onErrorsChange={vi.fn()}
          addPatient={vi.fn().mockResolvedValue(undefined)}
        />
      </MemoryRouter>,
    );

    const searchInput = screen.getByLabelText("患者検索");
    await user.type(searchInput, "101");

    expect(
      screen.getByRole("heading", { name: "101号室 田中" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "202号室 山本" }),
    ).not.toBeInTheDocument();
  });

  it("検索結果が0件ならメッセージを表示する", async () => {
    const user = userEvent.setup();

    const patients = [
      { id: "patient1", name: "田中", room: 101 },
      { id: "patient2", name: "山本", room: 202 },
    ];

    render(
      <MemoryRouter>
        <PatientList
          patients={patients}
          isLoading={false}
          onErrorsChange={vi.fn()}
          addPatient={vi.fn().mockResolvedValue(undefined)}
        />
      </MemoryRouter>,
    );

    const searchInput = screen.getByLabelText("患者検索");

    await user.type(searchInput, "999号室 岡﨑");

    expect(screen.getByText("該当する患者がいません")).toBeInTheDocument();
  });

  it("検索文字を消すと全患者が再表示されるテスト", async () => {
    const user = userEvent.setup();

    const patients = [
      { id: "patient1", name: "田中", room: 101 },
      { id: "patient2", name: "山本", room: 202 },
    ];

    render(
      <MemoryRouter>
        <PatientList
          patients={patients}
          isLoading={false}
          onErrorsChange={vi.fn()}
          addPatient={vi.fn().mockResolvedValue(undefined)}
        />
      </MemoryRouter>,
    );

    const searchInput = screen.getByLabelText("患者検索");

    await user.type(searchInput, "田中");
    expect(
      screen.queryByRole("heading", { name: "202号室 山本" }),
    ).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(
      screen.getByRole("heading", { name: "101号室 田中" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "202号室 山本" }),
    ).toBeInTheDocument();
  });

  it("氏名の一部分でも検索できるテスト", async () => {
    const user = userEvent.setup();

    const patients = [
      { id: "patient1", name: "田中", room: 101 },
      { id: "patient3", name: "山田", room: 303 },
      { id: "patient2", name: "山本", room: 202 },
    ];

    render(
      <MemoryRouter>
        <PatientList
          patients={patients}
          isLoading={false}
          onErrorsChange={vi.fn()}
          addPatient={vi.fn().mockResolvedValue(undefined)}
        />
      </MemoryRouter>,
    );

    const searchInput = screen.getByLabelText("患者検索");

    await user.type(searchInput, "田");
    expect(
      screen.queryByRole("heading", { name: "202号室 山本" }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "101号室 田中" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "303号室 山田" }),
    ).toBeInTheDocument();
  });

  it("患者のカードをクリックすると詳細画面へ移動する", async () => {
    const user = userEvent.setup();

    const patients = [
      { id: "patient1", name: "田中", room: 101 },
      { id: "patient3", name: "山田", room: 303 },
      { id: "patient2", name: "山本", room: 202 },
    ];

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <PatientList
                patients={patients}
                isLoading={false}
                onErrorsChange={vi.fn()}
                addPatient={vi.fn().mockResolvedValue(undefined)}
              />
            }
          />
          <Route path="/patient/:id" element={<PatientDetailForTest />} />
        </Routes>
      </MemoryRouter>,
    );
    const patientHeading = screen.getByRole("heading", {
      name: "101号室 田中",
    });
    await user.click(patientHeading);

    expect(
      await screen.findByRole("heading", { name: "患者ID:patient1" }),
    ).toBeInTheDocument();
  });

  it("山本のカードをクリックすると山本の詳細画面へ移動する", async () => {
    const user = userEvent.setup();

    const patients = [
      { id: "patient1", name: "田中", room: 101 },
      { id: "patient3", name: "山田", room: 303 },
      { id: "patient2", name: "山本", room: 202 },
    ];

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <PatientList
                patients={patients}
                isLoading={false}
                onErrorsChange={vi.fn()}
                addPatient={vi.fn().mockResolvedValue(undefined)}
              />
            }
          />
          <Route path="/patient/:id" element={<PatientDetailForTest />} />
        </Routes>
      </MemoryRouter>,
    );
    const patientHeading = screen.getByRole("heading", {
      name: "202号室 山本",
    });
    await user.click(patientHeading);

    expect(
      await screen.findByRole("heading", { name: "患者ID:patient2" }),
    ).toBeInTheDocument();
  });
});
