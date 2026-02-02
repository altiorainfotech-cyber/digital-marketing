# Quick Fix for 401 Authentication Error

## The Problem
You're getting a 401 error because **no admin user exists in the database yet**.

## The Solution (3 Simple Steps)

### Step 1: Start the Development Server
```bash
cd dascms
npm run dev
```

### Step 2: Create the Admin User
Open your browser or use curl:

**Option A - Browser:**
Visit: `http://localhost:3000/api/setup/admin` and click POST

**Option B - Command Line:**
```bash
curl -X POST http://localhost:3000/api/setup/admin
```

You should see:
```json
{
  "success": true,
  "credentials": {
    "email": "admin@example.com",
    "password": "admin123456"
  }
}
```

### Step 3: Sign In
1. Go to: `http://localhost:3000/auth/signin`
2. Enter:
   - Email: `admin@example.com`
   - Password: `admin123456`
3. Click "Sign in"

✅ You should now be logged in!

## After Signing In

1. **Change your password** immediately
2. **Delete the setup route** for security:
   ```bash
   rm -rf dascms/app/api/setup
   ```

## Still Having Issues?

Check the terminal where `npm run dev` is running for error messages.

Common issues:
- Server not running → Run `npm run dev`
- Wrong credentials → Use the credentials provided by the setup API
- User already exists → Check the response from the setup API
