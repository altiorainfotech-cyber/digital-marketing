import prisma from '../lib/prisma';

async function checkCompanies() {
  try {
    console.log('Checking companies in database...\n');
    
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            User: true,
            Asset: true,
          },
        },
      },
    });
    
    console.log(`Found ${companies.length} companies:\n`);
    
    if (companies.length === 0) {
      console.log('No companies found. Creating a default company...\n');
      
      const newCompany = await prisma.company.create({
        data: {
          name: 'Altiora Infotech',
        },
      });
      
      console.log('✅ Created company:', newCompany.name);
      console.log('   ID:', newCompany.id);
    } else {
      companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Users: ${company._count.User}`);
        console.log(`   Assets: ${company._count.Asset}`);
        console.log(`   Created: ${company.createdAt}`);
        console.log('');
      });
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompanies();
