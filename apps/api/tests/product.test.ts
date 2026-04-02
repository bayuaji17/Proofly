import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../src/app.js";
import * as productQueries from "../src/db/queries/products.js";
import { sign } from "hono/jwt";

// Mock database query dependencies
vi.mock("../src/db/queries/products.js", () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  toggleArchive: vi.fn(),
  hasLockedBatches: vi.fn(),
}));

describe("Proofly API — Products", () => {
  const dummyProduct = {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    admin_id: "11111111-2222-3333-4444-555555555555",
    name: "Test Product",
    category: "Electronics",
    description: "This is a test product description for validation",
    photo_url: "https://example.com/photo.jpg",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    batch_count: 0,
    qr_code_count: 0,
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

  // ── POST /api/products ──

  describe("POST /api/products", () => {
    it("Should return 201 on successful product creation", async () => {
      vi.mocked(productQueries.create).mockResolvedValue(dummyProduct as any);

      const res = await app.request("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          name: "Test Product",
          category: "Electronics",
          description: "This is a test product description for validation",
          photo_url: "https://example.com/photo.jpg",
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.name).toBe("Test Product");
      expect(productQueries.create).toHaveBeenCalled();
    });

    it("Should return 400 on invalid input", async () => {
      const res = await app.request("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          name: "AB", // too short
          // missing required fields
        }),
      });

      expect(res.status).toBe(400);
    });

    it("Should return 401 without token", async () => {
      const res = await app.request("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test",
          category: "Cat",
          description: "Description here is valid",
          photo_url: "https://example.com/photo.jpg",
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/products ──

  describe("GET /api/products", () => {
    it("Should return 200 with paginated products", async () => {
      vi.mocked(productQueries.findAll).mockResolvedValue({
        rows: [dummyProduct as any],
        total: 1,
      });

      const res = await app.request("/api/products?page=1&page_size=20", {
        method: "GET",
        headers: { Authorization: `Bearer ${validToken}` },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.total).toBe(1);
      expect(json.page).toBe(1);
      expect(json.page_size).toBe(20);
    });
  });

  // ── GET /api/products/:id ──

  describe("GET /api/products/:id", () => {
    it("Should return 200 with product detail", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(
        dummyProduct as any,
      );

      const res = await app.request(`/api/products/${dummyProduct.id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${validToken}` },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(dummyProduct.id);
    });

    it("Should return 404 if product not found", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        "/api/products/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/products/:id ──

  describe("PUT /api/products/:id", () => {
    it("Should return 200 on successful update", async () => {
      const updated = { ...dummyProduct, name: "Updated Product" };
      vi.mocked(productQueries.findById).mockResolvedValue(
        dummyProduct as any,
      );
      vi.mocked(productQueries.update).mockResolvedValue(updated as any);

      const res = await app.request(`/api/products/${dummyProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ name: "Updated Product" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe("Updated Product");
    });

    it("Should return 404 if product does not exist", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        "/api/products/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${validToken}`,
          },
          body: JSON.stringify({ name: "Something" }),
        },
      );

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/products/:id ──

  describe("DELETE /api/products/:id", () => {
    it("Should return 200 on successful deletion", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(
        dummyProduct as any,
      );
      vi.mocked(productQueries.hasLockedBatches).mockResolvedValue(false);
      vi.mocked(productQueries.remove).mockResolvedValue(true);

      const res = await app.request(`/api/products/${dummyProduct.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${validToken}` },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe("Product deleted successfully");
    });

    it("Should return 409 if product has locked batches", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(
        dummyProduct as any,
      );
      vi.mocked(productQueries.hasLockedBatches).mockResolvedValue(true);

      const res = await app.request(`/api/products/${dummyProduct.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${validToken}` },
      });

      expect(res.status).toBe(409);
    });

    it("Should return 404 if product does not exist", async () => {
      vi.mocked(productQueries.findById).mockResolvedValue(null);

      const res = await app.request(
        "/api/products/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /api/products/:id/archive ──

  describe("PATCH /api/products/:id/archive", () => {
    it("Should return 200 and toggle archive status", async () => {
      vi.mocked(productQueries.toggleArchive).mockResolvedValue({
        id: dummyProduct.id,
        is_active: false,
      });

      const res = await app.request(
        `/api/products/${dummyProduct.id}/archive`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(dummyProduct.id);
      expect(json.data.is_active).toBe(false);
    });

    it("Should return 404 if product does not exist", async () => {
      vi.mocked(productQueries.toggleArchive).mockResolvedValue(null);

      const res = await app.request(
        "/api/products/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff/archive",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );

      expect(res.status).toBe(404);
    });
  });
});
