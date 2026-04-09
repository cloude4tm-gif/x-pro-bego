import { Router } from "express";
import { db, xproAdminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, verifyPassword, hashPassword } from "../../lib/auth.js";

const router = Router();

router.post("/admin/token", async (req, res): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;
    const username = body.username;
    const password = body.password;

    if (!username || !password) {
      res.status(422).json({ detail: "Username and password required" });
      return;
    }

    let admin = await db.select().from(xproAdminsTable).where(eq(xproAdminsTable.username, username)).limit(1).then(r => r[0]);

    if (!admin) {
      const allAdmins = await db.select().from(xproAdminsTable).limit(1);
      if (allAdmins.length === 0 && username === "admin") {
        const hashed = await hashPassword(password);
        const [newAdmin] = await db.insert(xproAdminsTable).values({
          username: "admin",
          hashedPassword: hashed,
          isSudo: true,
        }).returning();
        admin = newAdmin;
      } else {
        res.status(401).json({ detail: "Incorrect username or password" });
        return;
      }
    }

    const valid = await verifyPassword(password, admin.hashedPassword);
    if (!valid) {
      res.status(401).json({ detail: "Incorrect username or password" });
      return;
    }

    const token = signToken(admin);
    res.json({ access_token: token, token_type: "bearer" });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

export default router;
