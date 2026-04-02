import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

type AuthVariables = {
  adminId: string;
  adminEmail: string;
};

export const authMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HTTPException(401, {
      message: "Authentication required. Missing token",
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const jwtSecret = process.env.JWT_SECRET!;

  try {
    const payload = await verify(token, jwtSecret, "HS256");

    // Hono/jwt verify will throw if token is expired based on 'exp' claim

    if (!payload.sub || typeof payload.sub !== "string") {
      throw new Error("Invalid sub claim");
    }

    c.set("adminId", payload.sub);
    c.set("adminEmail", payload.email as string);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "JwtTokenExpired") {
      throw new HTTPException(401, {
        message: "Token expired. Please use refresh token",
      });
    }
    throw new HTTPException(401, { message: "Invalid token" });
  }

  await next();
});
