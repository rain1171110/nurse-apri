import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./apiError";

describe("getErrorMessage", () => {
  it("Failed to fetchを日本語へ変換する", () => {
    const error = new Error("Failed to fetch");
    const result = getErrorMessage(error, "予期しないエラー");
    expect(result).toBe("サーバーへ接続できません");
  });
  it("通常のErrorなら元のメッセ―ジを返す", () => {
    const error = new Error("看護記録の追加に失敗しました");
    const result = getErrorMessage(error, "予期しないエラー");
    expect(result).toBe("看護記録の追加に失敗しました");
  });
  it("Errorではない値を受け取ったら、予備メッセ―ジを返す", () => {
    const error = "エラー文字列";
    const result = getErrorMessage(error, "予期しないエラー");
    expect(result).toBe("予期しないエラー");
  });
});
