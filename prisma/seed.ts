import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin1234!", 10);
  await prisma.user.upsert({
    where: { email: "admin@parstv.ir" },
    update: { passwordHash, role: "ADMIN", name: "مدیر فروشگاه" },
    create: {
      email: "admin@parstv.ir",
      passwordHash,
      role: "ADMIN",
      name: "مدیر فروشگاه",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
