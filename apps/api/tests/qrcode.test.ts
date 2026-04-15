import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../src/app.js";
import * as batchQueries from "../src/db/queries/batches.js";
import * as productQueries from "../src/db/queries/products.js";
import * as qrcodeQueries from "../src/db/queries/qrcodes.js";
import { sign } from "hono/jwt";

// Mock database query dependencies
vi.mock("../src/db/queries/batches.js", () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByProductId: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  isLocked: vi.fn(),
}));

vi.mock("../src/db/queries/products.js", () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  toggleArchive: vi.fn(),
  hasLockedBatches: vi.fn(),
}));

vi.mock("../src/db/queries/qrcodes.js", () => ({
  bulkCreate: vi.fn(),
  lockBatch: vi.fn(),
  findExistingSerialNumbers: vi.fn(),
  findByBatchId: vi.fn(),
  findAllByBatchId: vi.fn(),
}));

// Mock pool.connect for transaction
vi.mock("../src/db/connection.js", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn().mockResolvedValue({
      query: vi.fn(),
      release: vi.fn(),
    }),
  },
}));

describe("Proofly API — QR Codes", () => {
  const batchId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  const dummyBatch = {
    id: batchId,
    product_id: "11111111-aaaa-bbbb-cccc-dddddddddddd",
    batch_number: "BATCH-001",
    quantity: 5,
    production_date: "2026-01-01",
    expiry_date: "2027-01-01",
    is_locked: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    qr_code_count: 0,
    total_scans: 0,
    product_name: "Test Product",
  };

  const lockedBatch = { ...dummyBatch, is_locked: true };

  const dummyQrCodes = [
    {
      id: "qr-1",
      batch_id: batchId,
      serial_number: "ABCD-EFGH-JKMN",
      status: "unscanned",
      scan_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: "qr-2",
      batch_id: batchId,
      serial_number: "PQRS-TUVW-XY23",
      status: "unscanned",
      scan_count: 0,
      created_at: new Date().toISOString(),
    },
  ];

  let validToken: string;

  beforeEach(async () => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = "test_secret";
    process.env.FRONTEND_BASEURL = "http://localhost:3000";

    validToken = await sign(
      {
        sub: "11111111-2222-3333-4444-555555555555",
        email: "admin@proofly.test",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "test_secret",
      "HS256",
    );

    // Re-mock pool.connect for each test
    const { pool } = await import("../src/db/connection.js");
    vi.mocked(pool.connect).mockResolvedValue({
      query: vi.fn(),
      release: vi.fn(),
    } as any);
  });

  // ── POST /api/batches/:batchId/generate ──

  describe("POST /api/batches/:batchId/generate", () => {
    it("Should return 201 on successful QR code generation", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(dummyBatch as any);
      vi.mocked(qrcodeQueries.findExistingSerialNumbers).mockResolvedValue([]);
      vi.mocked(qrcodeQueries.bulkCreate).mockResolvedValue(5);
      vi.mocked(qrcodeQueries.lockBatch).mockResolvedValue(undefined);

      const res = await app.request(`/api/batches/${batchId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.batch_id).toBe(batchId);
      expect(json.data.total_generated).toBe(5);
      expect(json.data.serial_numbers).toHaveLength(5);
    });

    it("Should return 404 if batch not found", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        `/api/batches/${batchId}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
        },
      );

      expect(res.status).toBe(404);
    });

    it("Should return 409 if batch is already locked", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(lockedBatch as any);

      const res = await app.request(
        `/api/batches/${batchId}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
        },
      );

      expect(res.status).toBe(409);
    });

    it("Should return 401 without token", async () => {
      const res = await app.request(
        `/api/batches/${batchId}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/batches/:batchId/qrcodes ──

  describe("GET /api/batches/:batchId/qrcodes", () => {
    it("Should return 200 with paginated QR codes", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(
        lockedBatch as any,
      );
      vi.mocked(qrcodeQueries.findByBatchId).mockResolvedValue({
        rows: dummyQrCodes as any,
        total: 2,
      });

      const res = await app.request(
        `/api/batches/${batchId}/qrcodes?page=1&page_size=20`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(2);
      expect(json.total).toBe(2);
      expect(json.page).toBe(1);
    });

    it("Should return 404 if batch not found", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        `/api/batches/${batchId}/qrcodes`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/batches/:batchId/download ──

  describe("GET /api/batches/:batchId/download", () => {
    it("Should return 404 if batch not found", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        `/api/batches/${batchId}/download`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(404);
    });

    it("Should return 400 if batch is not locked (QR not generated)", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(dummyBatch as any);

      const res = await app.request(
        `/api/batches/${batchId}/download`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(400);
    });
  });
});
