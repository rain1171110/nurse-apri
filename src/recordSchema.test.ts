import { createRecordValidationCases, recordSchema } from "./schema";
import { describe, it, expect } from "vitest";

const cases = createRecordValidationCases();
const validCases = cases.filter((c) => c.expectValid);
const invalidCases = cases.filter((c) => !c.expectValid);

describe("Record Schema Validation", () => {
  validCases.forEach((c) => {
    it(`should validate successfully for case: ${c.label}`, () => {
      const result = recordSchema.safeParse(c.input);
      expect(result.success).toBe(true);
    });
  });
});

describe("Record Schema Validation - Invalid Cases", () => {
  invalidCases.forEach((c) => {
    it(`should fail validation for case: ${c.label}`, () => {
      const result = recordSchema.safeParse(c.input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        const firstErrorPath = firstIssue?.path.join(".") ?? "";
        expect(firstErrorPath).toBe(c.expectErrorPath);
        if (c.expectErrorMessage) {
          expect(firstIssue?.message).toBe(c.expectErrorMessage);
        }
      }
    });
  });
});
