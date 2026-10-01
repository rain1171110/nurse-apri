// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
    const onErrorsChange = vi.fn();

    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={setShowAddForm}
        onErrorsChange={onErrorsChange}
      />,
    );
    const cancelButton = screen.getByRole("button", {
      name: "キャンセル",
    });
    const nameInput = screen.getByLabelText("氏名");
    await user.type(nameInput, "testName");
    expect(nameInput).toHaveValue("testName");
    await user.click(cancelButton);

    expect(setShowAddForm).toHaveBeenCalledWith(false);
    expect(nameInput).toHaveValue("");
    expect(onErrorsChange).toHaveBeenCalledWith({});
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

  it("氏名は空欄、部屋番号は入力済み", async () => {
    const onSubmit = vi.fn();
    const onErrorsChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={vi.fn()}
        onErrorsChange={onErrorsChange}
      />,
    );

    const roomInput = screen.getByLabelText("部屋番号");
    await user.type(roomInput, "999");

    const saveButton = screen.getByRole("button", { name: "保存" });
    await user.click(saveButton);

    expect(onErrorsChange).toHaveBeenCalled();
    expect(await screen.findByText("氏名は必須です")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("氏名に数字が含まれる場合はエラーを表示", async () => {
    const onSubmit = vi.fn();
    const onErrorsChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={vi.fn()}
        onErrorsChange={onErrorsChange}
      />,
    );

    const nameInput = await screen.findByLabelText("氏名");
    const roomInput = await screen.findByLabelText("部屋番号");
    await user.type(nameInput, "test123");
    await user.type(roomInput, "999");

    const saveButton = screen.getByRole("button", {
      name: "保存",
    });
    await user.click(saveButton);

    expect(
      await screen.findByText("氏名に数字を含めることはできません"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onErrorsChange).toHaveBeenCalled();
  });

  it("氏名のエラーを修正すると保存処理に渡される", async () => {
    const onSubmit = vi.fn();
    const onErrorsChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={vi.fn()}
        onErrorsChange={onErrorsChange}
      />,
    );

    const nameInput = await screen.findByLabelText("氏名");
    const roomInput = await screen.findByLabelText("部屋番号");
    await user.type(nameInput, "test123");
    await user.type(roomInput, "101");

    const saveButton = screen.getByRole("button", {
      name: "保存",
    });
    await user.click(saveButton);
    expect(
      await screen.findByText("氏名に数字を含めることはできません"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onErrorsChange).toHaveBeenCalled();

    await user.clear(nameInput);
    await user.type(nameInput, "testName");

    await user.click(saveButton);
    expect(onSubmit).toHaveBeenCalledWith({ name: "testName", room: 101 });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("氏名は入力済み、部屋番号は空欄", async () => {
    const onSubmit = vi.fn();
    const onErrorsChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={vi.fn()}
        onErrorsChange={onErrorsChange}
      />,
    );

    const nameInput = screen.getByLabelText("氏名");
    await user.type(nameInput, "testName");

    const saveButton = screen.getByRole("button", { name: "保存" });
    await user.click(saveButton);

    expect(onErrorsChange).toHaveBeenCalled();
    expect(await screen.findByText("部屋番号は必須です")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("氏名は入力済み、部屋番号が重複している", async () => {
    const onSubmit = vi.fn();
    const onErrorsChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[{ id: "testId", name: "testName", room: 101 }]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={vi.fn()}
        onErrorsChange={onErrorsChange}
      />,
    );

    const nameInput = screen.getByLabelText("氏名");
    await user.type(nameInput, "testName");

    const roomInput = await screen.findByLabelText("部屋番号");
    await user.type(roomInput, "101");

    const saveButton = screen.getByRole("button", { name: "保存" });
    await user.click(saveButton);

    expect(
      await screen.findByText("この部屋番号は既に使用されています"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onErrorsChange).toHaveBeenCalled();
  });

  it("保存成功したら、フォーム内容リセットする", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      id: "testId",
      name: "testName",
      room: 999,
    });
    const onErrorsChange = vi.fn();
    const setShowAddForm = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={setShowAddForm}
        onErrorsChange={onErrorsChange}
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

    await waitFor(() => {
      expect(setShowAddForm).toHaveBeenCalledWith(false);
      expect(nameInput).toHaveValue("");
      expect(roomInput).toHaveValue("");
    });
  });

  it("保存が undefined を返した場合に入力内容を残す", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onErrorsChange = vi.fn();
    const setShowAddForm = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={setShowAddForm}
        onErrorsChange={onErrorsChange}
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
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({ name: "testName", room: 999 });
    });

    expect(nameInput).toHaveValue("testName");
    expect(roomInput).toHaveValue("999");
    expect(setShowAddForm).not.toHaveBeenCalled();
  });

  it("部屋番号は999以下", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onErrorsChange = vi.fn();
    const setShowAddForm = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={setShowAddForm}
        onErrorsChange={onErrorsChange}
      />,
    );

    const nameInput = await screen.findByLabelText("氏名");
    const roomInput = await screen.findByLabelText("部屋番号");
    await user.type(nameInput, "testName");
    await user.type(roomInput, "1000");

    const saveButton = screen.getByRole("button", {
      name: "保存",
    });
    await user.click(saveButton);

    expect(await screen.findByText("部屋番号は999以下")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onErrorsChange).toHaveBeenCalled();
  });

  it("部屋番号が0なら保存されず、エラーを表示する", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onErrorsChange = vi.fn();
    const setShowAddForm = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={setShowAddForm}
        onErrorsChange={onErrorsChange}
      />,
    );

    const nameInput = await screen.findByLabelText("氏名");
    const roomInput = await screen.findByLabelText("部屋番号");
    await user.type(nameInput, "testName");
    await user.type(roomInput, "0");

    const saveButton = screen.getByRole("button", {
      name: "保存",
    });
    await user.click(saveButton);

    expect(await screen.findByText("部屋番号は1以上")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onErrorsChange).toHaveBeenCalled();
  });

  it("部屋番号が1なら保存処理に渡される", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onErrorsChange = vi.fn();
    const setShowAddForm = vi.fn();
    const user = userEvent.setup();

    render(
      <AddPatientForm
        patients={[]}
        onSubmit={onSubmit}
        showAddForm={true}
        setShowAddForm={setShowAddForm}
        onErrorsChange={onErrorsChange}
      />,
    );

    const nameInput = await screen.findByLabelText("氏名");
    const roomInput = await screen.findByLabelText("部屋番号");
    await user.type(nameInput, "testName");
    await user.type(roomInput, "1");

    const saveButton = screen.getByRole("button", {
      name: "保存",
    });
    await user.click(saveButton);

    expect(onSubmit).toHaveBeenCalledWith({ name: "testName", room: 1 });
  });
});
