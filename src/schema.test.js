import {
  createPatientValidationCases,
  makePatientSchemaPartial,
} from "./schema";
import { describe, it, expect } from "vitest";

const cases = createPatientValidationCases();
const validCases = cases.filter((c) => c.expectValid);
const invalidCases = cases.filter((c) => !c.expectValid);

describe("Patient Schema Validation", () => {
  validCases.forEach((c) => {
    it(`should validate successfully for case: ${c.label}`, () => {
      const schema = makePatientSchemaPartial(c.usedRooms);
      const result = schema.safeParse(c.input);
      expect(result.success).toBe(true);
    });
  });
});

describe("Patient Schema Validation - Invalid Cases", () => {
  invalidCases.forEach((c) => {
    it(`should fail validation for case: ${c.label}`, () => {
      const schema = makePatientSchemaPartial(c.usedRooms);
      const result = schema.safeParse(c.input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        const firstErrorPath = firstIssue?.path.join(".") || "";
        expect(firstErrorPath).toBe(c.expectErrorPath);
        if (c.expectErrorMessage) {
          expect(firstIssue?.message).toBe(c.expectErrorMessage);
        }
      }
    });
  });
});
