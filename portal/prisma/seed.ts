import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";
  const email = process.env.ADMIN_EMAIL ?? "admin@nexus.local";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin user "${username}" already exists — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`✓ Admin user created: ${username}`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  → Change this password after first login.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
