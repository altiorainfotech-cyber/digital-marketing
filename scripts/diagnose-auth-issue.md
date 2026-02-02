# Authentication 401 Error Diagnosis

## Issue
Getting `POST /api/auth/callback/credentials 401` error when trying to sign in.

## Possible Causes

### 1. No User in Database
**Most Likely Cause**: The admin user hasn't been created yet or the database is empty.

**Solution**: Run the admin user creation script:
```bash
cd dascms
npx tsx scripts/create-admin-user.ts
```

### 2. Password Mismatch
The password being entered doesn't match the hashed password in the database.

**Check**: 
- Ensure you're using the exact password you set when creating the admin user
- Passwords are case-sensitive

### 3. Email Mismatch
The email being entered doesn't exist in the database.

**Check**:
- Verify the email address is correct
- Check for typos or extra spaces

### 4. Database Connection Issue
The application can't connect to the database to verify credentials.

**Check**:
- Verify DATABASE_URL is set correctly in `.env`
- Ensure the database is accessible
- Check network connectivity to Neon database

### 5. NEXTAUTH_SECRET Issue
While less likely to cause a 401, an invalid secret could cause session issues.

**Current Status**: Using default secret (should be changed for production)

## Recommended Steps

1. **Create an admin user** (if not already done):
   ```bash
   npx tsx scripts/create-admin-user.ts
   ```

2. **Verify the user was created** by checking the database directly or using a database client

3. **Try signing in** with the exact credentials you just created

4. **Check the server logs** for more detailed error messages

5. **If still failing**, check the browser console and network tab for additional error details

## Testing Authentication

You can test the authentication flow by:

1. Starting the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/auth/signin`

3. Enter your credentials

4. Check the terminal for any error messages

## Common Mistakes

- Using a different email than what was registered
- Typos in the password
- Not running the create-admin-user script first
- Database connection issues
- Trying to sign in before the user is created
