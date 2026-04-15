import { describe, it, expect } from "vitest";
import {
  generateSerialNumber,
  generateBulkSerialNumbers,
} from "../src/utils/serial-generator.js";

describe("Serial Number Generator", () => {
  const FORMAT_REGEX = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;
  const AMBIGUOUS_CHARS = ["0", "O", "1", "I", "L"];

  describe("generateSerialNumber()", () => {
    it("Should return format XXXX-XXXX-XXXX", () => {
      const sn = generateSerialNumber();
      expect(sn).toMatch(FORMAT_REGEX);
      expect(sn.length).toBe(14); // 12 chars + 2 dashes
    });

    it("Should not contain ambiguous characters (0, O, 1, I, L)", () => {
      // Generate 100 serial numbers and check none contain ambiguous chars
      for (let i = 0; i < 100; i++) {
        const sn = generateSerialNumber();
        for (const ch of AMBIGUOUS_CHARS) {
          expect(sn).not.toContain(ch);
        }
      }
    });
  });

  describe("generateBulkSerialNumbers()", () => {
    it("Should return the requested count", () => {
      const serials = generateBulkSerialNumbers(50);
      expect(serials).toHaveLength(50);
    });

    it("Should return all unique serial numbers", () => {
      const serials = generateBulkSerialNumbers(1000);
      const uniqueSet = new Set(serials);
      expect(uniqueSet.size).toBe(1000);
    });

    it("Should all match the expected format", () => {
      const serials = generateBulkSerialNumbers(100);
      for (const sn of serials) {
        expect(sn).toMatch(FORMAT_REGEX);
      }
    });
  });
});
