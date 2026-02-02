# Login Credentials

## Admin User Setup

To create an admin user, use one of the admin creation scripts with your own credentials:

```bash
# Using environment variables (recommended)
ADMIN_EMAIL=your-email@example.com ADMIN_PASSWORD=YourSecurePassword123! npx tsx scripts/create-activated-admin.ts

# Or using command line arguments
npx tsx scripts/create-activated-admin.ts your-email@example.com YourSecurePassword123! "Your Name"
```

## Login URL

Development: `http://localhost:3000/auth/signin`

## Creating Additional Activated Users

To create more activated admin users, run:

```bash
# Set your credentials as environment variables
ADMIN_EMAIL=your-email@example.com ADMIN_PASSWORD=YourSecurePassword npx tsx scripts/create-activated-admin.ts
```

This script will:
- Create a new admin user with your specified email if it doesn't exist
- Or update the existing user to be activated with your specified password
- Set `isActivated` to `true` so the user can log in immediately

## Troubleshooting

If you get "Account not activated" errors:
1. Make sure the user has `isActivated: true` in the database
2. Run the `create-activated-admin.ts` script to fix the user
3. Check that `activatedAt` is set to a valid date

## User Activation Flow

For new users created through the UI:
1. Admin creates user → User gets an activation code
2. User receives activation code (email/manual)
3. User visits activation page and sets password
4. User's `isActivated` is set to `true`
5. User can now log in normally
