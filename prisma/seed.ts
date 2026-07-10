import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function main() {
  console.log('🌱 Seeding database...')

  // Check if users already exist
  const existingUsers = await prisma.user.count()
  if (existingUsers > 0) {
    console.log(`✅ Users already exist (${existingUsers}), skipping seed`)
    return
  }

  // Create default users
  await prisma.user.createMany({
    data: [
      {
        username: 'gpo',
        password: simpleHash('gpo123'),
        name: 'Gram Panchayat Officer',
        nameMarathi: 'ग्रामपंचायत अधिकारी',
        role: 'gpo',
      },
      {
        username: 'operator',
        password: simpleHash('op123'),
        name: 'Operator',
        nameMarathi: 'ऑपरेटर',
        role: 'operator',
      },
    ],
  })

  // Create default financial years
  await prisma.financialYear.createMany({
    data: [
      { yearLabel: '2023-24', startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31'), isActive: true, isCurrent: false },
      { yearLabel: '2024-25', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isActive: true, isCurrent: true },
      { yearLabel: '2025-26', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), isActive: false, isCurrent: false },
    ],
  })

  // Create default floor info
  await prisma.floorInfo.createMany({
    data: [
      { floorNo: 0, floorName: 'Ground Floor', floorNameMr: 'तळ मजला', factor: 1.0 },
      { floorNo: 1, floorName: 'First Floor', floorNameMr: 'पहिला मजला', factor: 1.2 },
      { floorNo: 2, floorName: 'Second Floor', floorNameMr: 'दुसरा मजला', factor: 1.4 },
      { floorNo: 3, floorName: 'Third Floor', floorNameMr: 'तिसरा मजला', factor: 1.6 },
    ],
  })

  // Create default tax masters
  await prisma.taxMaster.createMany({
    data: [
      { taxName: 'Property Tax', taxNameMr: 'मालमत्ता कर', taxType: 'property', taxRate: 12.5 },
      { taxName: 'Water Tax', taxNameMr: 'पाणी कर', taxType: 'water', taxRate: 5.0 },
      { taxName: 'Light Tax', taxNameMr: 'दिवा कर', taxType: 'light', taxRate: 3.0 },
      { taxName: 'Profession Tax', taxNameMr: 'व्यवसाय कर', taxType: 'profession', taxRate: 2.5 },
      { taxName: 'Miscellaneous Tax', taxNameMr: 'इतर कर', taxType: 'misc', taxRate: 1.0 },
      { taxName: 'Sanitation Tax', taxNameMr: 'स्वच्छता कर', taxType: 'misc', taxRate: 2.0 },
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log('   Users: gpo/gpo123, operator/op123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
