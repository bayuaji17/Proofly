import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../src/app.js";
import * as qrcodeQueries from "../src/db/queries/qrcodes.js";
import * as scanLogQueries from "../src/db/queries/scan-logs.js";
import * as notificationQueries from "../src/db/queries/notifications.js";

// Mock dependencies
vi.mock("../src/db/queries/qrcodes.js", () => ({
  bulkCreate: vi.fn(),
  lockBatch: vi.fn(),
  findExistingSerialNumbers: vi.fn(),
  findByBatchId: vi.fn(),
  findAllByBatchId: vi.fn(),
  findBySerialNumber: vi.fn(),
  incrementScanCount: vi.fn(),
}));

vi.mock("../src/db/queries/scan-logs.js", () => ({
  create: vi.fn(),
  findByQrCodeId: vi.fn(),
}));

vi.mock("../src/db/queries/notifications.js", () => ({
  create: vi.fn(),
}));

vi.mock("../src/db/connection.js", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn().mockResolvedValue({
      query: vi.fn(),
      release: vi.fn(),
    }),
  },
}));

describe("Proofly API — Verify", () => {
  const dummyQrRecord = {
    id: "qr-id-1",
    batch_id: "batch-id-1",
    serial_number: "ABCD-EFGH-JKMN",
    status: "unscanned",
    scan_count: 0,
    created_at: new Date().toISOString(),
    batch_number: "BATCH-001",
    production_date: "2026-01-01",
    expiry_date: "2027-01-01",
    product_id: "prod-id-1",
    product_name: "Test Product",
    product_category: "Electronics",
    product_photo_url: "https://example.com/photo.jpg",
    admin_id: "admin-id-1",
  };

  const dummyScanLog = {
    id: "scan-1",
    qr_code_id: "qr-id-1",
    latitude: null,
    longitude: null,
    city: null,
    country: null,
    user_agent: "test-agent",
    ip_address: "127.0.0.1",
    scanned_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("POST /api/verify", () => {
    it("Should return genuine on first scan", async () => {
      vi.mocked(qrcodeQueries.findBySerialNumber).mockResolvedValue(
        { ...dummyQrRecord, scan_count: 0 } as any,
      );
      vi.mocked(qrcodeQueries.incrementScanCount).mockResolvedValue(
        { ...dummyQrRecord, scan_count: 1, status: "genuine" } as any,
      );
      vi.mocked(scanLogQueries.create).mockResolvedValue(dummyScanLog as any);
      vi.mocked(scanLogQueries.findByQrCodeId).mockResolvedValue([
        dummyScanLog as any,
      ]);

      const res = await app.request("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial_number: "ABCD-EFGH-JKMN" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("genuine");
      expect(json.scan_number).toBe(1);
      expect(json.max_scan).toBe(3);
      expect(json.product.name).toBe("Test Product");
      expect(json.batch.batch_number).toBe("BATCH-001");
    });

    it("Should return genuine on third scan", async () => {
      vi.mocked(qrcodeQueries.findBySerialNumber).mockResolvedValue(
        { ...dummyQrRecord, scan_count: 2 } as any,
      );
      vi.mocked(qrcodeQueries.incrementScanCount).mockResolvedValue(
        { ...dummyQrRecord, scan_count: 3, status: "genuine" } as any,
      );
      vi.mocked(scanLogQueries.create).mockResolvedValue(dummyScanLog as any);
      vi.mocked(scanLogQueries.findByQrCodeId).mockResolvedValue([]);

      const res = await app.request("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial_number: "ABCD-EFGH-JKMN" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("genuine");
      expect(json.scan_number).toBe(3);
    });

    it("Should return counterfeit on fourth scan", async () => {
      vi.mocked(qrcodeQueries.findBySerialNumber).mockResolvedValue(
        { ...dummyQrRecord, scan_count: 3 } as any,
      );
      vi.mocked(qrcodeQueries.incrementScanCount).mockResolvedValue(
        { ...dummyQrRecord, scan_count: 4, status: "counterfeit" } as any,
      );
      vi.mocked(scanLogQueries.create).mockResolvedValue(dummyScanLog as any);
      vi.mocked(scanLogQueries.findByQrCodeId).mockResolvedValue([]);
      vi.mocked(notificationQueries.create).mockResolvedValue({} as any);

      const res = await app.request("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial_number: "ABCD-EFGH-JKMN" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("counterfeit");
      expect(json.scan_number).toBe(4);
      expect(json.message).toBeDefined();
      expect(notificationQueries.create).toHaveBeenCalled();
    });

    it("Should return not_found for invalid serial", async () => {
      vi.mocked(qrcodeQueries.findBySerialNumber).mockResolvedValue(null);

      const res = await app.request("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial_number: "XXXX-XXXX-XXXX" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("not_found");
    });

    it("Should normalize serial number (lowercase, spaces, dashes)", async () => {
      vi.mocked(qrcodeQueries.findBySerialNumber).mockResolvedValue(null);

      await app.request("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial_number: "abcd efgh jkmn" }),
      });

      // Should have been called with normalized+formatted version
      expect(qrcodeQueries.findBySerialNumber).toHaveBeenCalledWith(
        "ABCD-EFGH-JKMN",
      );
    });

    it("Should accept location data", async () => {
      vi.mocked(qrcodeQueries.findBySerialNumber).mockResolvedValue(
        { ...dummyQrRecord, scan_count: 0 } as any,
      );
      vi.mocked(qrcodeQueries.incrementScanCount).mockResolvedValue(
        { ...dummyQrRecord, scan_count: 1, status: "genuine" } as any,
      );
      vi.mocked(scanLogQueries.create).mockResolvedValue(dummyScanLog as any);
      vi.mocked(scanLogQueries.findByQrCodeId).mockResolvedValue([]);

      const res = await app.request("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serial_number: "ABCD-EFGH-JKMN",
          latitude: -6.2,
          longitude: 106.8,
          accuracy: 15.5,
        }),
      });

      expect(res.status).toBe(200);
      expect(scanLogQueries.create).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: -6.2,
          longitude: 106.8,
        }),
      );
    });

    it("Should return 400 on empty serial number", async () => {
      const res = await app.request("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial_number: "" }),
      });

      expect(res.status).toBe(400);
    });
  });
});
