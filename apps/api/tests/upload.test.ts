import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../src/app.js";
import * as storageService from "../src/services/storage.service.js";
import { sign } from "hono/jwt";

// Mock storage service (no real R2 calls in tests)
vi.mock("../src/services/storage.service.js", () => ({
  validateFileExtension: vi.fn(),
  getPresignedUploadUrl: vi.fn(),
  getPublicUrl: vi.fn(),
  deleteObject: vi.fn(),
  extractKeyFromUrl: vi.fn(),
}));

describe("Proofly API — Upload (Presigned URL)", () => {
  let validToken: string;

  beforeEach(async () => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = "test_secret";

    validToken = await sign(
      {
        sub: "11111111-2222-3333-4444-555555555555",
        email: "admin@proofly.test",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "test_secret",
      "HS256",
    );

    // Default mock implementations
    vi.mocked(storageService.validateFileExtension).mockImplementation(
      () => undefined,
    );
    vi.mocked(storageService.getPresignedUploadUrl).mockResolvedValue(
      "https://r2.example.com/presigned-url",
    );
    vi.mocked(storageService.getPublicUrl).mockReturnValue(
      "https://pub.r2.dev/products/test-key/photo.jpg",
    );
  });

  // ── POST /api/upload/presign ──

  describe("POST /api/upload/presign", () => {
    const validBody = {
      filename: "product-photo.jpg",
      content_type: "image/jpeg",
      file_size: 1024 * 1024, // 1MB
    };

    it("Should return 200 with presigned URL data", async () => {
      const res = await app.request("/api/upload/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify(validBody),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveProperty("upload_url");
      expect(json.data).toHaveProperty("public_url");
      expect(json.data).toHaveProperty("key");
      expect(storageService.validateFileExtension).toHaveBeenCalledWith(
        "product-photo.jpg",
      );
      expect(storageService.getPresignedUploadUrl).toHaveBeenCalled();
    });

    it("Should return 401 without auth token", async () => {
      const res = await app.request("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });

      expect(res.status).toBe(401);
    });

    it("Should return 400 for invalid content_type (application/pdf)", async () => {
      const res = await app.request("/api/upload/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          ...validBody,
          content_type: "application/pdf",
        }),
      });

      expect(res.status).toBe(400);
    });

    it("Should return 400 for file_size exceeding 5MB", async () => {
      const res = await app.request("/api/upload/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          ...validBody,
          file_size: 10 * 1024 * 1024, // 10MB
        }),
      });

      expect(res.status).toBe(400);
    });

    it("Should return 400 for missing filename", async () => {
      const res = await app.request("/api/upload/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          content_type: "image/jpeg",
          file_size: 1024,
        }),
      });

      expect(res.status).toBe(400);
    });

    it("Should return 400 when file extension is invalid", async () => {
      const { HTTPException } = await import("hono/http-exception");
      vi.mocked(storageService.validateFileExtension).mockImplementation(
        () => {
          throw new HTTPException(400, {
            message: 'Invalid file extension ".exe". Allowed: .jpg, .jpeg, .png, .webp',
          });
        },
      );

      const res = await app.request("/api/upload/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          filename: "malware.exe",
          content_type: "image/jpeg", // spoofed content_type passes Zod but fails extension check
          file_size: 1024,
        }),
      });

      expect(res.status).toBe(400);
    });

    it("Should accept all valid image types", async () => {
      for (const contentType of [
        "image/jpeg",
        "image/png",
        "image/webp",
      ] as const) {
        const ext = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
        const res = await app.request("/api/upload/presign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            filename: `photo.${ext}`,
            content_type: contentType,
            file_size: 512 * 1024,
          }),
        });

        expect(res.status).toBe(200);
      }
    });
  });
});
