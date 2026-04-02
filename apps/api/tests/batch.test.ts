import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../src/app.js";
import * as batchQueries from "../src/db/queries/batches.js";
import * as productQueries from "../src/db/queries/products.js";
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

describe("Proofly API — Batches", () => {
  const productId = "11111111-aaaa-bbbb-cccc-dddddddddddd";

  const dummyProduct = {
    id: productId,
    admin_id: "11111111-2222-3333-4444-555555555555",
    name: "Test Product",
    category: "Electronics",
    description: "A test product",
    photo_url: "https://example.com/photo.jpg",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    batch_count: 0,
    qr_code_count: 0,
  };

  const dummyBatch = {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    product_id: productId,
    batch_number: "BATCH-001",
    quantity: 100,
    production_date: "2026-01-01",
    expiry_date: "2027-01-01",
    is_locked: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    qr_code_count: 0,
    total_scans: 0,
    product_name: "Test Product",
  };

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
  });

  // ── POST /api/products/:productId/batches ──

  describe("POST /api/products/:productId/batches", () => {
    it("Should return 201 on successful batch creation", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(
        dummyProduct as any,
      );
      vi.mocked(batchQueries.create).mockResolvedValue(dummyBatch as any);

      const res = await app.request(
        `/api/products/${productId}/batches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            batch_number: "BATCH-001",
            quantity: 100,
            production_date: "2026-01-01",
            expiry_date: "2027-01-01",
          }),
        },
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.batch_number).toBe("BATCH-001");
      expect(batchQueries.create).toHaveBeenCalled();
    });

    it("Should return 404 if product does not exist", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        `/api/products/${productId}/batches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            batch_number: "BATCH-001",
            quantity: 100,
            production_date: "2026-01-01",
            expiry_date: "2027-01-01",
          }),
        },
      );

      expect(res.status).toBe(404);
    });

    it("Should return 409 on duplicate batch_number", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(
        dummyProduct as any,
      );
      vi.mocked(batchQueries.create).mockRejectedValue({ code: "23505" });

      const res = await app.request(
        `/api/products/${productId}/batches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            batch_number: "BATCH-001",
            quantity: 100,
            production_date: "2026-01-01",
            expiry_date: "2027-01-01",
          }),
        },
      );

      expect(res.status).toBe(409);
    });

    it("Should return 401 without token", async () => {
      const res = await app.request(
        `/api/products/${productId}/batches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batch_number: "BATCH-001",
            quantity: 100,
            production_date: "2026-01-01",
            expiry_date: "2027-01-01",
          }),
        },
      );

      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/products/:productId/batches ──

  describe("GET /api/products/:productId/batches", () => {
    it("Should return 200 with list of batches", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(
        dummyProduct as any,
      );
      vi.mocked(batchQueries.findByProductId).mockResolvedValue([
        dummyBatch as any,
      ]);

      const res = await app.request(
        `/api/products/${productId}/batches`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].batch_number).toBe("BATCH-001");
    });

    it("Should return 404 if product does not exist", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        `/api/products/${productId}/batches`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/batches/:id ──

  describe("GET /api/batches/:id", () => {
    it("Should return 200 with batch detail", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(dummyBatch as any);

      const res = await app.request(`/api/batches/${dummyBatch.id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${validToken}` },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(dummyBatch.id);
      expect(json.data.product_name).toBe("Test Product");
    });

    it("Should return 404 if batch not found", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        "/api/batches/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/batches/:id ──

  describe("PUT /api/batches/:id", () => {
    it("Should return 200 on successful update", async () => {
      const updated = { ...dummyBatch, quantity: 200 };
      vi.mocked(batchQueries.findById).mockResolvedValue(dummyBatch as any);
      vi.mocked(batchQueries.update).mockResolvedValue(updated as any);

      const res = await app.request(`/api/batches/${dummyBatch.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ quantity: 200 }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.quantity).toBe(200);
    });

    it("Should return 409 if batch is locked", async () => {
      const lockedBatch = { ...dummyBatch, is_locked: true };
      vi.mocked(batchQueries.findById).mockResolvedValue(lockedBatch as any);

      const res = await app.request(`/api/batches/${dummyBatch.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ quantity: 200 }),
      });

      expect(res.status).toBe(409);
    });

    it("Should return 404 if batch not found", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        "/api/batches/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
          body: JSON.stringify({ quantity: 200 }),
        },
      );

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/batches/:id ──

  describe("DELETE /api/batches/:id", () => {
    it("Should return 200 on successful deletion", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(dummyBatch as any);
      vi.mocked(batchQueries.remove).mockResolvedValue(true);

      const res = await app.request(`/api/batches/${dummyBatch.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${validToken}` },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe("Batch deleted successfully");
    });

    it("Should return 409 if batch is locked", async () => {
      const lockedBatch = { ...dummyBatch, is_locked: true };
      vi.mocked(batchQueries.findById).mockResolvedValue(lockedBatch as any);

      const res = await app.request(`/api/batches/${dummyBatch.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${validToken}` },
      });

      expect(res.status).toBe(409);
    });

    it("Should return 404 if batch not found", async () => {
      vi.mocked(batchQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        "/api/batches/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(404);
    });
  });
});
