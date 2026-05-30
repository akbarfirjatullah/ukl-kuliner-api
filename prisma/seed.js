const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.ADMIN_NAME ?? 'Admin UKL';
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@uklrecipe.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin12345';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: hashedPassword,
      role: Role.ADMIN
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN
    }
  });

  console.log('Seed berhasil dijalankan.');
  console.log(`Email admin: ${adminEmail}`);
  console.log('Password admin disembunyikan demi keamanan.');
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
