# Bulk User Operations Guide

## Overview

The bulk operations feature allows administrators to efficiently manage multiple user accounts simultaneously. You can select multiple users and perform deactivation, reactivation, or deletion operations in a single action.

---

## 🎯 Features

### Bulk Operations Available
1. **Bulk Deactivate** - Suspend access for multiple users at once
2. **Bulk Reactivate** - Restore access for multiple deactivated users
3. **Bulk Delete** - Permanently remove multiple users (with extra confirmation)

### Selection Features
- **Individual Selection** - Click checkbox next to each user
- **Select All** - Select all users in current view with one click
- **Clear Selection** - Deselect all users instantly
- **Visual Feedback** - Selected users highlighted with checkboxes

---

## 📋 How to Use

### Step 1: Select Users

**Method 1: Individual Selection**
1. Navigate to **Admin → Users**
2. Click the checkbox (☑) next to each user you want to select
3. Selected users will show a blue checkmark

**Method 2: Select All**
1. Navigate to **Admin → Users**
2. Click the **"Select All"** button in the search bar
3. All visible users will be selected
4. Click again to deselect all

**Tips:**
- You can combine filters with selection (e.g., select all Content Creators)
- Search for specific users, then select all matching results
- Selection persists while you scroll through the table

### Step 2: Choose Bulk Action

Once you have users selected, a blue toolbar appears with these options:

**Bulk Actions Toolbar:**
```
┌─────────────────────────────────────────────────────────┐
│ ☑ X user(s) selected                                    │
│ Choose an action to apply to selected users            │
│                                                         │
│ [Deactivate] [Reactivate] [Delete] | [Clear]          │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Confirm Action

**For Deactivation:**
- Confirmation dialog: "Are you sure you want to deactivate X user(s)?"
- Click OK to proceed
- Users will immediately lose access

**For Reactivation:**
- Confirmation dialog: "Are you sure you want to reactivate X user(s)?"
- Click OK to proceed
- Users will regain access immediately

**For Deletion (Extra Security):**
1. First confirmation: "⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE X user(s)?"
2. Second confirmation: "This is your final confirmation..."
3. Type "DELETE" in the prompt box
4. Users are permanently removed

### Step 4: Review Results

After the operation completes, you'll see a results summary:

**Success Message:**
```
✓ Successfully processed X user(s)
```

**Partial Success:**
```
✓ Successfully processed X user(s)
✗ Failed to process Y user(s):
  • Error message for user 1
  • Error message for user 2
```

---

## 🔒 Security & Safeguards

### Built-in Protections

1. **Self-Protection**
   - You cannot deactivate or delete your own account
   - System automatically excludes your account from bulk operations

2. **Confirmation Requirements**
   - Deactivate: 1 confirmation dialog
   - Reactivate: 1 confirmation dialog
   - Delete: 3 confirmations + typing "DELETE"

3. **Audit Logging**
   - All bulk operations are logged individually
   - Each user action recorded with timestamp
   - IP address and user agent captured
   - Admin who performed action tracked

4. **Partial Failure Handling**
   - If some operations fail, successful ones still complete
   - Failed operations are reported with specific errors
   - Failed users remain selected for retry

### Permission Requirements

- **Required Role:** Admin
- **API Endpoints:** Admin-only access
- **Frontend:** Hidden from non-admin users

---

## 🎨 User Interface

### Visual Indicators

**Selection State:**
- ☐ Empty checkbox = Not selected
- ☑ Blue checkbox = Selected
- Blue highlight on selected rows

**Bulk Actions Toolbar:**
- Blue background = Active selection
- Shows count of selected users
- Action buttons color-coded:
  - Yellow = Deactivate
  - Green = Reactivate
  - Red = Delete

**Results Display:**
- Green box = Success
- Red box = Errors
- Dismissible after review

### Responsive Design

**Desktop:**
- Full toolbar with all buttons visible
- Side-by-side action buttons
- Detailed error messages

**Mobile:**
- Stacked action buttons
- Scrollable toolbar
- Compact error display

---

## 📊 API Endpoints

### Bulk Deactivate
```
POST /api/users/bulk-deactivate

Request Body:
{
  "userIds": ["user-id-1", "user-id-2", ...]
}

Response:
{
  "message": "Deactivated X of Y users",
  "results": {
    "success": ["user-id-1", ...],
    "failed": [
      { "userId": "user-id-2", "error": "Error message" }
    ]
  }
}
```

### Bulk Reactivate
```
POST /api/users/bulk-reactivate

Request Body:
{
  "userIds": ["user-id-1", "user-id-2", ...]
}

Response:
{
  "message": "Reactivated X of Y users",
  "results": {
    "success": ["user-id-1", ...],
    "failed": [
      { "userId": "user-id-2", "error": "Error message" }
    ]
  }
}
```

### Bulk Delete
```
POST /api/users/bulk-delete

Request Body:
{
  "userIds": ["user-id-1", "user-id-2", ...]
}

Response:
{
  "message": "Deleted X of Y users",
  "results": {
    "success": ["user-id-1", ...],
    "failed": [
      { "userId": "user-id-2", "error": "Error message" }
    ]
  }
}
```

---

## 💡 Best Practices

### When to Use Bulk Operations

**Good Use Cases:**
- Deactivating all users from a closed department
- Reactivating users after a temporary suspension
- Removing test accounts after testing
- Managing seasonal workers (activate/deactivate)
- Cleaning up inactive accounts

**Avoid Using For:**
- Single user operations (use individual buttons)
- Users you're unsure about (review individually)
- Production data without backup

### Workflow Recommendations

1. **Before Bulk Deactivation:**
   - Review the list of selected users
   - Verify they should all be deactivated
   - Consider notifying users first
   - Document the reason

2. **Before Bulk Deletion:**
   - Export user data if needed
   - Verify users are truly no longer needed
   - Check for any dependencies
   - Get approval from stakeholders
   - **Remember: This cannot be undone!**

3. **After Bulk Operations:**
   - Review the results summary
   - Check audit logs for confirmation
   - Handle any failed operations
   - Document the action taken

### Filter + Bulk Operations

Combine filters with bulk operations for powerful workflows:

**Example 1: Deactivate all Content Creators**
1. Filter by Role: "Content Creator"
2. Click "Select All"
3. Click "Deactivate"

**Example 2: Delete all inactive test users**
1. Search for "test" in search box
2. Manually select test accounts
3. Click "Delete"

**Example 3: Reactivate users from specific company**
1. Filter by Company
2. Filter by Status: Deactivated
3. Select All
4. Click "Reactivate"

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "Cannot deactivate your own account"**
- **Cause:** Your account is in the selection
- **Solution:** Clear selection and reselect without your account

**Issue: Some operations failed**
- **Cause:** Various (user not found, already deactivated, etc.)
- **Solution:** Review error messages, fix issues, retry failed users

**Issue: Selection cleared after operation**
- **Cause:** Successful operations auto-clear selection
- **Solution:** This is normal behavior. Failed users remain selected.

**Issue: Can't see bulk actions toolbar**
- **Cause:** No users selected
- **Solution:** Select at least one user to see the toolbar

**Issue: Select All not working**
- **Cause:** Filters may be hiding users
- **Solution:** Clear filters or select visible users only

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "User not found" | User was deleted by another admin | Refresh page |
| "User is already deactivated" | User already inactive | Skip or reactivate |
| "User is already active" | User already active | Skip or deactivate |
| "Cannot deactivate your own account" | Self-protection | Remove yourself from selection |
| "Cannot delete your own account" | Self-protection | Remove yourself from selection |

---

## 📈 Performance

### Optimization

- Operations process sequentially for reliability
- Each operation is independent (one failure doesn't stop others)
- Results are batched and returned together
- UI remains responsive during operations

### Limits

- **Recommended:** Up to 50 users per bulk operation
- **Maximum:** No hard limit, but consider performance
- **Large Operations:** For 100+ users, consider multiple batches

### Processing Time

- **Deactivate:** ~100ms per user
- **Reactivate:** ~100ms per user
- **Delete:** ~150ms per user (includes audit logging)

**Example:** 20 users = ~2-3 seconds total

---

## 🔍 Audit Trail

### What Gets Logged

Each bulk operation creates individual audit log entries:

**For Each User:**
- Action performed (deactivate/reactivate/delete)
- Timestamp
- Admin who performed action
- IP address
- User agent
- Previous state
- New state

**Viewing Audit Logs:**
1. Navigate to **Admin → Audit Logs**
2. Filter by action type
3. Filter by date range
4. Search for specific users

---

## ✅ Testing Checklist

### Before Production Use

- [ ] Test bulk deactivate with 2-3 test users
- [ ] Test bulk reactivate with deactivated users
- [ ] Test bulk delete with test accounts only
- [ ] Verify self-protection works
- [ ] Check audit logs are created
- [ ] Test partial failure scenarios
- [ ] Verify results display correctly
- [ ] Test on mobile devices
- [ ] Confirm email notifications (if enabled)

### Regular Maintenance

- [ ] Review audit logs weekly
- [ ] Check for failed operations
- [ ] Verify user counts are accurate
- [ ] Test bulk operations monthly
- [ ] Update documentation as needed

---

## 🎓 Training Guide

### For New Admins

1. **Practice with Test Accounts**
   - Create 5-10 test users
   - Practice selecting and deselecting
   - Try each bulk operation
   - Review audit logs

2. **Understand Confirmations**
   - Know why multiple confirmations exist
   - Practice typing "DELETE" correctly
   - Understand when to cancel

3. **Learn to Read Results**
   - Identify successful operations
   - Understand error messages
   - Know when to retry

### Common Scenarios

**Scenario 1: Seasonal Workers**
- End of season: Bulk deactivate
- Start of season: Bulk reactivate
- After final season: Bulk delete

**Scenario 2: Department Closure**
- Immediate: Bulk deactivate all users
- After transition: Bulk delete if needed
- Document in audit logs

**Scenario 3: Testing Cleanup**
- Identify test accounts
- Select all test users
- Bulk delete with confirmation

---

## 📞 Support

### Getting Help

**For Issues:**
1. Check this guide first
2. Review error messages
3. Check audit logs
4. Contact system administrator

**For Questions:**
- What's the difference between deactivate and delete?
  - Deactivate: Temporary, reversible
  - Delete: Permanent, irreversible

- Can I undo a bulk operation?
  - Deactivate: Yes, use bulk reactivate
  - Delete: No, permanent

- How many users can I select?
  - No hard limit, but 50 recommended per batch

---

**Last Updated:** January 31, 2026
**Version:** 1.0.0
**Feature Status:** ✅ Production Ready
