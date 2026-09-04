import { beforeAll, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./index.js";
import { prisma } from "./db.js";

const agent = request.agent(app);
const otherAgent = request.agent(app);

const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: "test-password",
};
const testUserB = {
  email: `test-b-${Date.now()}@example.com`,
  password: "test-password",
};

beforeAll(async () => {
  const registerResponse = await agent
    .post("/api/auth/register")
    .send(testUser);
  expect(registerResponse.status).toBe(201);
  const registerResponseB = await otherAgent
    .post("/api/auth/register")
    .send(testUserB);
  expect(registerResponseB.status).toBe(201);

  const loginResponse = await agent.post("/api/auth/login").send(testUser);
  expect(loginResponse.status).toBe(200);

  const loginResponseB = await otherAgent
    .post("/api/auth/login")
    .send(testUserB);
  expect(loginResponseB.status).toBe(200);
});

afterAll(async () => {
  await prisma.patient.deleteMany({
    where: {
      user: {
        email: testUser.email,
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [testUser.email, testUserB.email],
      },
    },
  });
});

describe("POST /api/auth/logout", () => {
  it("ログアウト後は保護されたAPIへアクセスできない", async () => {
    const logoutAgent = request.agent(app);

    const loginResponse = await logoutAgent
      .post("/api/auth/login")
      .send(testUser);
    expect(loginResponse.status).toBe(200);

    const logoutResponse = await logoutAgent.post("/api/auth/logout");
    expect(logoutResponse.status).toBe(200);

    const protectedResponse = await logoutAgent.get("/api/data");
    expect(protectedResponse.status).toBe(401);
  });
});

describe("GET /api/patients", () => {
  it("他のユーザーの患者は取得できない", async () => {
    const registerResponse = await otherAgent
      .post("/api/auth/register")
      .send(testUserB);

    expect(registerResponse.status).toBe(201);

    const loginResponse = await otherAgent
      .post("/api/auth/login")
      .send(testUserB);
    expect(loginResponse.status).toBe(200);
    const uniqueRoom = Math.floor(Math.random() * 999) + 1;
    const createPatientResponse = await agent.post("/api/patients").send({
      name: "テスト患者",
      room: uniqueRoom,
    });
    expect(createPatientResponse.status).toBe(201);

    const getPatientResponse = await otherAgent.get("/api/patients");
    expect(getPatientResponse.status).toBe(200);

    const patientIds = getPatientResponse.body.map(
      (patient: { id: string }) => patient.id,
    );
    expect(patientIds).not.toContain(createPatientResponse.body.id);
  });
});

describe("POST /api/patients", () => {
  it("不正な患者データなら400を返す", async () => {
    const response = await agent.post("/api/patients").send({
      name: "",
      room: 0,
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid patient data / 無効な患者データ");
  });
});

describe("PUT /api/patients/:id", () => {
  it("他のユーザーの患者は更新できない", async () => {
    const createPatientResponse = await otherAgent.post("/api/patients").send({
      name: "他ユーザーの患者",
      room: 998,
    });
    expect(createPatientResponse.status).toBe(201);

    const updatePatientResponse = await agent
      .put(`/api/patients/${createPatientResponse.body.id}`)
      .send({
        name: "更新しようとした患者",
        room: 998,
      });
    expect(updatePatientResponse.status).toBe(404);
  });
  it("存在しない患者を更新すると404を返す", async () => {
    const response = await agent
      .put("/api/patients/00000000-0000-0000-0000-000000000000")
      .send({
        name: "テスト患者",
        room: 999,
      });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      "Patient not found / 患者が見つかりません",
    );
  });
});

describe("DELETE /api/patients/:id", () => {
  it("存在しない患者を削除すると404を返す", async () => {
    const response = await agent.delete(
      "/api/patients/00000000-0000-0000-0000-000000000000",
    );
    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      "Patient not found / 患者が見つかりません",
    );
  });
});

describe("GET /api/patients", () => {
  it("患者一覧を取得すると200を返す", async () => {
    const response = await agent.get("/api/patients");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("POST /api/records", () => {
  it("不正な看護記録データなら400を返す", async () => {
    const response = await agent.post("/api/records").send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Invalid record data / 無効な看護記録データ",
    );
  });
});

describe("DELETE /api/records/:id", () => {
  it("存在しない看護記録を削除すると404を返す", async () => {
    const response = await agent.delete(
      "/api/records/00000000-0000-0000-0000-000000000000",
    );
    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      "Record not found / 看護記録が見つかりません",
    );
  });
});

describe("PUT /api/records/:id", () => {
  it("存在しない看護記録を更新したら404を返す", async () => {
    const uniqueRoom = Math.floor(Math.random() * 999) + 1;
    const createPatientResponse = await agent.post("/api/patients").send({
      name: "更新テスト用患者",
      room: uniqueRoom,
    });
    expect(createPatientResponse.status).toBe(201);

    const response = await agent
      .put("/api/records/00000000-0000-0000-0000-000000000000")
      .send({
        patientId: createPatientResponse.body.id,
        date: "3000-12-19",
        author: "test author",
        vitals: {},
      });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      "Record not found / 看護記録が見つかりません",
    );
  });
});

describe("GET /api/data", () => {
  it("患者と看護記録のデータを取得すると200を返す", async () => {
    const response = await agent.get("/api/data");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.patients)).toBe(true);
    expect(Array.isArray(response.body.records)).toBe(true);
  });
});

describe("PUT /api/records/:id", () => {
  it("不正な看護記録データなら400を返す", async () => {
    const response = await agent
      .put("/api/records/00000000-0000-0000-0000-000000000000")
      .send({
        patientId: "00000000-0000-0000-0000-000000000000",
        date: "",
        author: "",
        vitals: {},
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Invalid record data / 無効な看護記録データ",
    );
  });
});

describe("PUT /api/patients/:id", () => {
  it("不正な患者データなら400を返す", async () => {
    const response = await agent
      .put("/api/patients/00000000-0000-0000-0000-000000000000")
      .send({
        name: "",
        room: "",
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid patient data / 無効な患者データ");
  });
});
