const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function run() {
  try {
    const email = "rahalhaml2005@gmail.com";
    console.log(`Searching for user with email: ${email}...`);
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log("No user found with this email. It is already deleted / clean.");
      return;
    }

    console.log("User found:", user);
    console.log("Deleting user and all associated records (cascade)...");
    await db.user.delete({
      where: { id: user.id }
    });
    console.log("User successfully deleted from database!");
  } catch (err) {
    console.error("Error deleting user:", err);
  } finally {
    await db.$disconnect();
  }
}

run();
