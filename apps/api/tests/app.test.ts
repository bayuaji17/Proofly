import { describe, it, expect } from "vitest";
import app from "../src/app.js";

describe("Proofly API — App", () => {
  it("GET / should return health check message", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("message");
    expect(json.message).toBe("Proofly API is running 🟢");
  });

  it("GET /nonexistent should return 404", async () => {
    const res = await app.request("/nonexistent");
    expect(res.status).toBe(404);
  });
});
