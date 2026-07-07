const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function run() {
  try {
    console.log("Fetching all users in database...");
    const users = await db.user.findMany();
    console.log("Total users:", users.length);
    console.log("Users list:", users);
  } catch (err) {
    console.error("Error fetching users:", err);
  } finally {
    await db.$disconnect();
  }
}

run();
