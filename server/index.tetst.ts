import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./index.js";

describe("POST /pai/patients", () => {
  it("不正な患者データなら400を返す", async () => {
    const response = await request(app).post("/api/patients").send({
      name: "",
      room: 0,
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid patient data / 無効な患者データ");
  });
});
