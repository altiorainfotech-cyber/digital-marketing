# Fix for 401 Authentication Error

## Problem
You're getting `POST /api/auth/callback/credentials 401` when trying to sign in.

## Root Cause
The most likely cause is that **no admin user exists in the database yet**.

## Solution Options

### Option 1: Use the Web Interface (Recommended)

1. **Start the development server** (if not already running):
   ```bash
   cd dascms
   npm run dev
   ```

2. **Create an API route to create admin user**:
   
   Create a temporary file `dascms/app/api/setup/admin/route.ts`:
   
   ```typescript
   import { NextResponse } from 'next/server';
   import { prisma } from '@/lib/prisma';
   import bcrypt from 'bcryptjs';
   
   export async function POST() {
     try {
       // Check if admin exists
       const adminCount = await prisma.user.count({
         where: { role: 'ADMIN' },
       });
   
       if (adminCount > 0) {
         return NextResponse.json({ 
           error: 'Admin user already exists' 
         }, { status: 400 });
       }
   
       // Create admin
       const hashedPassword = await bcrypt.hash('admin123456', 10);
       
       const user = await prisma.user.create({
         data: {
           name: 'Admin User',
           email: 'admin@example.com',
           password: hashedPassword,
           role: 'ADMIN',
         },
       });
   
       // Create audit log
       await prisma.auditLog.create({
         data: {
           userId: user.id,
           action: 'CREATE',
           resourceType: 'USER',
           resourceId: user.id,
           metadata: {
             role: 'ADMIN',
             createdBy: 'system',
             source: 'setup API',
           },
         },
       });
   
       return NextResponse.json({
         success: true,
         message: 'Admin user created',
         credentials: {
           email: 'admin@example.com',
           password: 'admin123456',
         },
       });
     } catch (error) {
       console.error('Error creating admin:', error);
       return NextResponse.json({ 
         error: 'Failed to create admin user',
         details: error instanceof Error ? error.message : 'Unknown error'
       }, { status: 500 });
     }
   }
   ```

3. **Call the API**:
   ```bash
   curl -X POST http://localhost:3000/api/setup/admin
   ```

4. **Sign in** with:
   - Email: `admin@example.com`
   - Password: `admin123456`

5. **Delete the setup API** after use for security:
   ```bash
   rm -rf dascms/app/api/setup
   ```

### Option 2: Use Neon Console

1. Go to [Neon Console](https://console.neon.tech/)
2. Select your database
3. Open the SQL Editor
4. Run this SQL:

```sql
-- Create admin user
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@example.com',
  '$2b$10$YourHashedPasswordHere',  -- See below for hash
  'ADMIN',
  NOW(),
  NOW()
);
```

To generate the password hash, run this locally:
```bash
npx tsx scripts/test-auth.ts
```

### Option 3: Fix the Script Connection Issue

The scripts are having trouble connecting to Neon. This appears to be a known issue with the `@neondatabase/serverless` package and environment variable handling.

**Workaround**: Use the web interface (Option 1) instead.

## After Creating Admin User

1. **Sign in** at `http://localhost:3000/auth/signin`
2. **Change the password** immediately
3. **Delete any temporary setup routes** you created

## Verify It's Working

After creating the admin user, you should be able to:

1. Navigate to `http://localhost:3000/auth/signin`
2. Enter the credentials
3. Successfully sign in and be redirected to the dashboard

## Common Issues

### Still Getting 401?

1. **Check the email/password** - they're case-sensitive
2. **Clear browser cache** and cookies
3. **Check server logs** for detailed error messages
4. **Verify the user was created**:
   - Check Neon console
   - Or use the API route to query users

### Can't Access Development Server?

Make sure it's running:
```bash
cd dascms
npm run dev
```

Should see:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
```

## Security Notes

- **Change the default password** immediately after first login
- **Delete any setup/admin creation routes** after use
- **Never commit** setup routes to version control
- **Use strong passwords** in production
- **Consider using environment variables** for initial admin credentials

## Need More Help?

Check the server logs when attempting to sign in. The error messages will give more specific information about what's failing.
