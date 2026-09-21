// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import AddPatientForm from "./AddPatientForm";

describe("AddPatientForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("showAddFormがfalseならフォームを表示しない", () => {
    const onSubmit = vi.fn();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={false}
        setShowAddForm={vi.fn()}
      />,
    );
  });
  expect(
    screen.queryByRole("heading", { name: "患者を追加" }),
  ).not.toBeInTheDocument();
});
