import { PrismaClient } from '../app/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'Amish@altiorainfotech.com';
  const newPassword = 'NewPassword123!'; // Change this to your desired password
  
  try {
    console.log(`Looking for user: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true }
    });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    console.log('User found:', user);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log('\n✅ Password updated successfully!');
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);
    console.log('\nPlease save this password securely and change it after first login.');
    
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
