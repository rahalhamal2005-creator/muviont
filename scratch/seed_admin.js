import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const email = "rahalhamal2005@gmail.com";
  const password = "hamal2000";
  const passwordHash = hashPassword(password);

  console.log(`Setting up Super Admin user: ${email}`);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
    },
    create: {
      email,
      name: "Rahal Hamal",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Super Admin user set up successfully:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
