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

let nextRoom = 900;
const createUniqueRoom = (): number => {
  return nextRoom++;
};

beforeAll(async () => {
  const registerResponse = await agent
    .post("/api/auth/register")
    .set("Origin", "http://localhost:5173")
    .send(testUser);
  expect(registerResponse.status).toBe(201);
  const registerResponseB = await otherAgent
    .post("/api/auth/register")
    .set("Origin", "http://localhost:5173")
    .send(testUserB);
  expect(registerResponseB.status).toBe(201);

  const loginResponse = await agent
    .post("/api/auth/login")
    .set("Origin", "http://localhost:5173")
    .send(testUser);
  expect(loginResponse.status).toBe(200);
  const loginResponseB = await otherAgent
    .post("/api/auth/login")
    .set("Origin", "http://localhost:5173")
    .send(testUserB);
  expect(loginResponseB.status).toBe(200);
});

afterAll(async () => {
  await prisma.patient.deleteMany({
    where: {
      user: {
        email: {
          in: [testUser.email, testUserB.email],
        },
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

describe("POST /api/auth/register", () => {
  it("許可されていない送信元は403になる", async () => {
    const response = await request
      .agent(app)
      .post("/api/auth/register")
      .set("Origin", "https://evil.example")
      .send(testUser);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Request origin is not allowed");
  });
});

describe("POST /api/auth/logout", () => {
  it("ログアウト後は保護されたAPIへアクセスできない", async () => {
    const logoutAgent = request.agent(app);

    const loginResponse = await logoutAgent
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5173")
      .send(testUser);
    expect(loginResponse.status).toBe(200);

    const logoutResponse = await logoutAgent
      .post("/api/auth/logout")
      .set("Origin", "http://localhost:5173");
    expect(logoutResponse.status).toBe(200);

    const protectedResponse = await logoutAgent.get("/api/data");
    expect(protectedResponse.status).toBe(401);
  });
});

describe("GET /api/patients", () => {
  it("他のユーザーの患者は取得できない", async () => {
    const uniqueRoom = createUniqueRoom();

    const createPatientResponse = await agent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
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

describe("GET /api/data", () => {
  it("一度もログインしてないユーザーはデータを取得できない", async () => {
    const notAuthenticatedAgent = request.agent(app);

    const response = await notAuthenticatedAgent.get("/api/data");

    expect(response.status).toBe(401);
  });

  it("ログインユーザは自分の患者だけを取得できる", async () => {
    const uniqueRoom = createUniqueRoom();

    const createPatientResponse = await agent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "テスト患者",
        room: uniqueRoom,
      });
    expect(createPatientResponse.status).toBe(201);

    const otherUniqueRoom = createUniqueRoom();
    const createOtherPatientResponse = await otherAgent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "他ユーザーの患者",
        room: otherUniqueRoom,
      });
    expect(createOtherPatientResponse.status).toBe(201);

    const getDataResponse = await agent.get("/api/data");
    expect(getDataResponse.status).toBe(200);

    const patientIds = getDataResponse.body.patients.map(
      (patient: { id: string }) => patient.id,
    );
    expect(patientIds).toContain(createPatientResponse.body.id);
    expect(patientIds).not.toContain(createOtherPatientResponse.body.id);

    const getOtherDataResponse = await otherAgent.get("/api/data");
    expect(getOtherDataResponse.status).toBe(200);

    const otherPatientIds = getOtherDataResponse.body.patients.map(
      (patient: { id: string }) => patient.id,
    );
    expect(otherPatientIds).toContain(createOtherPatientResponse.body.id);
    expect(otherPatientIds).not.toContain(createPatientResponse.body.id);
  });

  it("ログインユーザーは自分の看護記録だけを取得できる", async () => {
    const uniqueRoom = createUniqueRoom();

    const createPatientResponse = await agent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "テスト患者",
        room: uniqueRoom,
      });
    expect(createPatientResponse.status).toBe(201);

    const otherUniqueRoom = createUniqueRoom();

    const createOtherPatientResponse = await otherAgent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "他のテスト患者",
        room: otherUniqueRoom,
      });
    expect(createOtherPatientResponse.status).toBe(201);

    const createRecordResponse = await agent
      .post("/api/records")
      .set("Origin", "http://localhost:5173")
      .send({
        patientId: createPatientResponse.body.id,
        date: "2026-09-05",
        author: "test author",
        vitals: {},
      });
    expect(createRecordResponse.status).toBe(201);

    const createOtherRecordResponse = await otherAgent
      .post("/api/records")
      .set("Origin", "http://localhost:5173")
      .send({
        patientId: createOtherPatientResponse.body.id,
        date: "2026-09-05",
        author: "other test author",
        vitals: {},
      });
    expect(createOtherRecordResponse.status).toBe(201);

    const agentDataResponse = await agent.get("/api/data");
    const otherAgentDataResponse = await otherAgent.get("/api/data");

    const agentRecordIds = agentDataResponse.body.records.map(
      (record: { id: string }) => record.id,
    );

    const otherAgentRecordIds = otherAgentDataResponse.body.records.map(
      (record: { id: string }) => record.id,
    );

    expect(agentRecordIds).toContain(createRecordResponse.body.id);
    expect(agentRecordIds).not.toContain(createOtherRecordResponse.body.id);

    expect(otherAgentRecordIds).toContain(createOtherRecordResponse.body.id);
    expect(otherAgentRecordIds).not.toContain(createRecordResponse.body.id);
  });
});

describe("POST /api/patients", () => {
  it("不正な患者データなら400を返す", async () => {
    const response = await agent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "",
        room: 0,
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid patient data / 無効な患者データ");
  });

  it("部屋番号が重複していたら409を返す", async () => {
    const uniqueRoom = createUniqueRoom();

    const firstResponse = await agent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "最初のテスト患者",
        room: uniqueRoom,
      });
    expect(firstResponse.status).toBe(201);

    const duplicateResponse = await agent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "重複するテスト患者",
        room: uniqueRoom,
      });
    expect(duplicateResponse.status).toBe(409);
  });
});

describe("PUT /api/patients/:id", () => {
  it("他のユーザーの患者は更新できない", async () => {
    const uniqueRoom = createUniqueRoom();

    const createPatientResponse = await otherAgent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "他ユーザーの患者",
        room: uniqueRoom,
      });
    expect(createPatientResponse.status).toBe(201);

    const updatePatientResponse = await agent
      .put(`/api/patients/${createPatientResponse.body.id}`)
      .set("Origin", "http://localhost:5173")
      .send({
        name: "更新しようとした患者",
        room: uniqueRoom,
      });
    expect(updatePatientResponse.status).toBe(404);

    const ownerPatientsResponse = await otherAgent.get("/api/patients");

    expect(ownerPatientsResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createPatientResponse.body.id,
          name: "他ユーザーの患者",
        }),
      ]),
    );
  });

  it("存在しない患者を更新すると404を返す", async () => {
    const uniqueRoom = createUniqueRoom();

    const response = await agent
      .put("/api/patients/00000000-0000-0000-0000-000000000000")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "テスト患者",
        room: uniqueRoom,
      });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      "Patient not found / 患者が見つかりません",
    );
  });
});

describe("DELETE /api/patients/:id", () => {
  it("他のユーザーの患者は削除できない", async () => {
    const uniqueRoom = createUniqueRoom();

    const createPatientResponse = await otherAgent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "他ユーザーの患者",
        room: uniqueRoom,
      });
    expect(createPatientResponse.status).toBe(201);

    const deletePatientResponse = await agent
      .delete(`/api/patients/${createPatientResponse.body.id}`)
      .set("Origin", "http://localhost:5173");
    expect(deletePatientResponse.status).toBe(404);
  });

  it("存在しない患者を削除すると404を返す", async () => {
    const response = await agent
      .delete("/api/patients/00000000-0000-0000-0000-000000000000")
      .set("Origin", "http://localhost:5173");

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
  it("他のユーザーの患者には看護記録を追加できない", async () => {
    const uniqueRoom = createUniqueRoom();

    const createPatientResponse = await otherAgent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "他ユーザの患者",
        room: uniqueRoom,
      });
    expect(createPatientResponse.status).toBe(201);

    const createRecordResponse = await agent
      .post("/api/records")
      .set("Origin", "http://localhost:5173")
      .send({
        patientId: createPatientResponse.body.id,
        date: "2026-09-05",
        author: "test author",
        vitals: {},
      });
    expect(createRecordResponse.status).toBe(404);
  });

  it("不正な看護記録データなら400を返す", async () => {
    const response = await agent
      .post("/api/records")
      .set("Origin", "http://localhost:5173")
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Invalid record data / 無効な看護記録データ",
    );
  });
});

describe("DELETE /api/records/:id", () => {
  it("他のユーザーの看護記録は削除できない", async () => {
    const uniqueRoom = createUniqueRoom();

    const createPatientResponse = await otherAgent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "他ユーザの患者",
        room: uniqueRoom,
      });
    expect(createPatientResponse.status).toBe(201);
    const createRecordResponse = await otherAgent
      .post("/api/records")
      .set("Origin", "http://localhost:5173")
      .send({
        patientId: createPatientResponse.body.id,
        date: "2026-09-05",
        author: "test author",
        vitals: {},
      });
    expect(createRecordResponse.status).toBe(201);
    const deleteResponse = await agent
      .delete(`/api/records/${createRecordResponse.body.id}`)
      .set("Origin", "http://localhost:5173");
    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body.error).toBe(
      "Record not found / 看護記録が見つかりません",
    );
  });

  it("存在しない看護記録を削除すると404を返す", async () => {
    const response = await agent
      .delete("/api/records/00000000-0000-0000-0000-000000000000")
      .set("Origin", "http://localhost:5173");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      "Record not found / 看護記録が見つかりません",
    );
  });
});

describe("PUT /api/records/:id", () => {
  it("他のユーザーの看護記録は更新できない", async () => {
    const uniqueRoom = createUniqueRoom();

    const createPatientResponse = await otherAgent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "更新テスト患者",
        room: uniqueRoom,
      });
    expect(createPatientResponse.status).toBe(201);
    const createRecordResponse = await otherAgent
      .post("/api/records")
      .set("Origin", "http://localhost:5173")
      .send({
        patientId: createPatientResponse.body.id,
        date: "2026-09-05",
        author: "test author",
        vitals: {},
      });
    expect(createRecordResponse.status).toBe(201);

    const updateRecordResponse = await agent
      .put(`/api/records/${createRecordResponse.body.id}`)
      .set("Origin", "http://localhost:5173")
      .send({
        patientId: createPatientResponse.body.id,
        date: "2026-09-05",
        author: "test author",
        vitals: {},
      });
    expect(updateRecordResponse.status).toBe(404);
  });

  it("存在しない看護記録を更新したら404を返す", async () => {
    const uniqueRoom = createUniqueRoom();

    const createPatientResponse = await agent
      .post("/api/patients")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "更新テスト用患者",
        room: uniqueRoom,
      });
    expect(createPatientResponse.status).toBe(201);

    const response = await agent
      .put("/api/records/00000000-0000-0000-0000-000000000000")
      .set("Origin", "http://localhost:5173")
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
  it("不正な看護記録データなら400を返す", async () => {
    const response = await agent
      .put("/api/records/00000000-0000-0000-0000-000000000000")
      .set("Origin", "http://localhost:5173")
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

describe("GET /api/data", () => {
  it("患者と看護記録のデータを取得すると200を返す", async () => {
    const response = await agent.get("/api/data");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.patients)).toBe(true);
    expect(Array.isArray(response.body.records)).toBe(true);
  });
});

describe("PUT /api/patients/:id", () => {
  it("不正な患者データなら400を返す", async () => {
    const response = await agent
      .put("/api/patients/00000000-0000-0000-0000-000000000000")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "",
        room: "",
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid patient data / 無効な患者データ");
  });
});
