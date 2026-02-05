import prisma from '../lib/prisma';

async function checkAssetCompanies() {
  try {
    console.log('Checking asset-company associations...\n');
    
    // Get all assets with company info
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        title: true,
        companyId: true,
        Company: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            name: true,
            companyId: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
    
    console.log(`Total assets: ${assets.length}\n`);
    
    const assetsWithCompany = assets.filter(a => a.companyId);
    const assetsWithoutCompany = assets.filter(a => !a.companyId);
    
    console.log(`Assets WITH company: ${assetsWithCompany.length}`);
    console.log(`Assets WITHOUT company: ${assetsWithoutCompany.length}\n`);
    
    if (assetsWithCompany.length > 0) {
      console.log('Assets with companies:');
      assetsWithCompany.forEach((asset, index) => {
        console.log(`${index + 1}. "${asset.title}"`);
        console.log(`   Company: ${asset.Company?.name || 'N/A'}`);
        console.log(`   Company ID: ${asset.companyId}`);
        console.log('');
      });
    }
    
    if (assetsWithoutCompany.length > 0) {
      console.log('\n⚠️  Assets WITHOUT companies:');
      assetsWithoutCompany.forEach((asset, index) => {
        console.log(`${index + 1}. "${asset.title}"`);
        console.log(`   Uploader: ${asset.uploader.name}`);
        console.log(`   Uploader's Company ID: ${asset.uploader.companyId || 'None'}`);
        console.log('');
      });
    }
    
    // Get all companies
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            Asset: true,
          },
        },
      },
    });
    
    console.log('\n📊 Companies Summary:');
    companies.forEach((company) => {
      console.log(`- ${company.name}: ${company._count.Asset} assets`);
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssetCompanies();
