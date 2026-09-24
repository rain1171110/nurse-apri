// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import AddPatientForm from "./AddPatientForm";
import userEvent from "@testing-library/user-event";

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
    expect(
      screen.queryByRole("heading", { name: "患者を追加" }),
    ).not.toBeInTheDocument();
  });

  it("showAddFormがtrueならフォームを表示する", () => {
    const onSubmit = vi.fn();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "患者を追加" }),
    ).toBeInTheDocument();
  });

  it("「キャンセル」を押すとフォームを閉じる処理のテスト", async () => {
    const onSubmit = vi.fn();
    const setShowAddForm = vi.fn();

    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={setShowAddForm}
      />,
    );
    const cancelButton = screen.getByRole("button", {
      name: "キャンセル",
    });
    await user.click(cancelButton);

    expect(setShowAddForm).toHaveBeenCalledWith(false);
  });


  it("「保存」を押すと、onSubmitに入力値が渡されるか", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={vi.fn()}
      />,
    );

    const nameInput = await screen.findByLabelText("氏名");
    const roomInput = await screen.findByLabelText("部屋番号");
    await user.type(nameInput, "testName");
    await user.type(roomInput, "999");

    const saveButton = screen.getByRole("button", {
      name: "保存",
    });
    await user.click(saveButton);

    expect(onSubmit).toHaveBeenCalledWith({ name: "testName", room: 999 });
  });

});
