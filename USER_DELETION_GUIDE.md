# User Deletion Guide - Important Information

## ⚠️ Critical Information About User Deletion

This guide explains the restrictions and best practices for deleting user accounts in DASCMS.

---

## 🔒 Why Can't I Delete Some Users?

### Database Integrity Protection

DASCMS prevents deletion of users who have related data in the system to maintain:
- **Data Integrity**: Preserve historical records and relationships
- **Audit Trail**: Maintain complete audit logs for compliance
- **Asset Ownership**: Keep track of who created/approved assets
- **Accountability**: Preserve records of user actions

### What Prevents User Deletion?

A user **cannot be deleted** if they have any of the following:

1. **Uploaded Assets** - Assets they created
2. **Approved Assets** - Assets they approved
3. **Rejected Assets** - Assets they rejected
4. **Audit Logs** - Historical activity records
5. **Downloads** - Asset download history
6. **Platform Usages** - Platform usage records
7. **Shared Assets** - Assets they shared with others
8. **Received Shares** - Assets shared with them
9. **Notifications** - System notifications
10. **Approvals** - Approval records

---

## ✅ Recommended Approach: Use Deactivation

### Why Deactivate Instead of Delete?

**Deactivation is the recommended approach** for managing user access because it:

✅ **Preserves Data Integrity**
- All historical records remain intact
- Asset ownership is maintained
- Audit trail is complete

✅ **Reversible**
- Can reactivate users if needed
- No data loss
- Easy to undo

✅ **Compliant**
- Maintains audit trail for compliance
- Preserves accountability
- Meets regulatory requirements

✅ **Safe**
- No risk of breaking relationships
- No foreign key constraint errors
- No data loss

### How to Deactivate Users

**Single User:**
1. Navigate to Admin → Users
2. Find the user
3. Click "Deactivate" button
4. Confirm action
5. User immediately loses access

**Multiple Users:**
1. Navigate to Admin → Users
2. Select users with checkboxes
3. Click "Deactivate" in bulk toolbar
4. Confirm action
5. All selected users lose access

**What Happens:**
- User cannot log in
- Status badge shows "Deactivated"
- All data is preserved
- Can be reactivated anytime

---

## 🗑️ When Can Users Be Deleted?

### Deletable Users

Users can **only be deleted** if they have:
- ❌ No uploaded assets
- ❌ No approved/rejected assets
- ❌ No audit logs
- ❌ No downloads
- ❌ No platform usages
- ❌ No shared assets
- ❌ No received shares
- ❌ No notifications
- ❌ No approvals

**Typical Scenarios:**
- Newly created test accounts
- Users created by mistake
- Accounts that were never used
- Accounts created but never activated

---

## 📋 Step-by-Step Workflows

### Workflow 1: Managing Active Users

**Scenario:** User leaves the company

**Recommended Steps:**
1. **Deactivate** the user account
2. User loses access immediately
3. All historical data preserved
4. Can reactivate if they return

**Don't:**
- ❌ Try to delete (will likely fail)
- ❌ Leave account active
- ❌ Delete related data first

### Workflow 2: Cleaning Up Test Accounts

**Scenario:** Remove test accounts after testing

**Steps:**
1. Identify test accounts (search for "test")
2. Check if they have any related data
3. If no related data: Delete
4. If has related data: Deactivate instead

**Verification:**
```
Test Account Status:
- Has uploaded assets? → Deactivate
- Has audit logs? → Deactivate
- Completely unused? → Can delete
```

### Workflow 3: Bulk User Management

**Scenario:** Department closure, need to remove multiple users

**Recommended Steps:**
1. **Immediate Action:**
   - Select all department users
   - Click "Bulk Deactivate"
   - All users lose access immediately

2. **After Transition Period (Optional):**
   - If users truly won't return
   - Keep them deactivated
   - Preserve all historical data

3. **Don't Attempt Bulk Delete:**
   - Will likely fail for most users
   - Use deactivation instead
   - Maintains data integrity

---

## 🔧 Handling Deletion Errors

### Error: "Cannot delete user with related data"

**What It Means:**
The user has related records in the database that prevent deletion.

**What To Do:**
1. **Read the error message** - It lists what data exists
2. **Use Deactivate instead** - Recommended approach
3. **Don't try to delete related data** - Breaks audit trail

**Example Error:**
```
Cannot delete user with related data: 
- 15 uploaded assets
- 23 audit logs
- 5 downloads
- 8 approvals

Please deactivate the user instead.
```

**Solution:**
Click "Deactivate" button instead of "Delete"

### Error: "Foreign key constraint violated"

**What It Means:**
Database is preventing deletion due to relationships.

**What To Do:**
1. Use "Deactivate" instead
2. This is the system protecting data integrity
3. Don't try to work around it

---

## 💡 Best Practices

### DO ✅

1. **Use Deactivation as Default**
   - For all users who have used the system
   - For any user with historical data
   - When in doubt

2. **Delete Only When Appropriate**
   - Test accounts with no data
   - Accounts created by mistake
   - Never-used accounts

3. **Document Actions**
   - Note why users were deactivated
   - Keep records of bulk operations
   - Review audit logs regularly

4. **Plan Ahead**
   - Deactivate first, delete later (if needed)
   - Give transition period
   - Verify no data loss

### DON'T ❌

1. **Don't Force Deletion**
   - Don't delete related data to enable user deletion
   - Don't try to bypass constraints
   - Don't ignore error messages

2. **Don't Delete Active Users**
   - Always deactivate first
   - Verify they're truly inactive
   - Check with stakeholders

3. **Don't Bulk Delete Without Checking**
   - Most users will have related data
   - Use bulk deactivate instead
   - Review results carefully

---

## 📊 Comparison: Deactivate vs Delete

| Feature | Deactivate | Delete |
|---------|-----------|--------|
| **User Access** | Blocked ✓ | Removed ✓ |
| **Data Preserved** | Yes ✓ | No ✗ |
| **Reversible** | Yes ✓ | No ✗ |
| **Audit Trail** | Maintained ✓ | Lost ✗ |
| **Asset Ownership** | Preserved ✓ | Broken ✗ |
| **Compliance** | Compliant ✓ | Risk ✗ |
| **Works for All Users** | Yes ✓ | No ✗ |
| **Recommended** | **YES** ✓ | Rarely |

---

## 🎯 Decision Tree

```
Need to remove user access?
│
├─ Has user uploaded assets? ────────────────┐
├─ Has user approved/rejected assets? ───────┤
├─ Has user any audit logs? ─────────────────┤
├─ Has user any activity history? ───────────┤
│                                             │
│ YES to any? ──────────────────────────────►│ USE DEACTIVATE
│                                             │ ✓ Safe
│                                             │ ✓ Reversible
│                                             │ ✓ Preserves data
│                                             │
│ NO to all? ────────────────────────────────┐
│                                             │
│ Is this a test account? ───────────────────┤
│ Was account never used? ────────────────────┤
│                                             │
│ YES? ──────────────────────────────────────►│ CAN DELETE
│                                             │ (But deactivate
│                                             │  is still safer)
│                                             │
│ NO? ───────────────────────────────────────►│ USE DEACTIVATE
                                              │ (When in doubt)
```

---

## 🔍 Checking User Data Before Deletion

### Manual Check

Before attempting to delete a user, check:

1. **Assets Page**
   - Filter by uploader
   - Check if user has uploaded assets

2. **Audit Logs Page**
   - Filter by user
   - Check activity history

3. **Approvals**
   - Check if user has approved/rejected assets

### Automated Check

The system automatically checks when you try to delete:
- Counts all related records
- Shows detailed error if data exists
- Suggests deactivation instead

---

## 📞 FAQ

**Q: Can I delete a user who has uploaded assets?**
A: No. Deactivate them instead to preserve asset ownership.

**Q: What if I really need to delete a user with data?**
A: You don't. Deactivation achieves the same goal (blocking access) while preserving data integrity.

**Q: Can I delete audit logs to enable user deletion?**
A: No. Audit logs are immutable and required for compliance.

**Q: How long should I keep deactivated users?**
A: Indefinitely. There's no need to delete them. Deactivation is the permanent solution.

**Q: Will deactivated users count against my user limit?**
A: Check your license terms. Usually, only active users count.

**Q: Can I reactivate a deleted user?**
A: No. Deletion is permanent. This is why deactivation is recommended.

**Q: What happens to assets when a user is deactivated?**
A: Nothing. Assets remain intact with the deactivated user as owner.

**Q: Can deactivated users see their data?**
A: No. Deactivated users cannot log in at all.

---

## 🎓 Training Scenarios

### Scenario 1: Employee Leaves

**Situation:** John Doe leaves the company

**Correct Action:**
1. Navigate to Admin → Users
2. Find John Doe
3. Click "Deactivate"
4. Confirm action
5. ✓ John cannot log in
6. ✓ All his assets remain
7. ✓ Audit trail preserved

**Incorrect Action:**
1. Try to delete John ✗
2. Get error about related data ✗
3. Confusion and frustration ✗

### Scenario 2: Test Account Cleanup

**Situation:** Need to clean up test accounts

**Correct Action:**
1. Search for "test" accounts
2. Check each account's activity
3. If no activity: Can delete
4. If has activity: Deactivate
5. ✓ Clean database
6. ✓ No data loss

### Scenario 3: Bulk Department Closure

**Situation:** Entire department closing

**Correct Action:**
1. Filter by department company
2. Select all users
3. Click "Bulk Deactivate"
4. Confirm action
5. ✓ All users lose access
6. ✓ All data preserved
7. ✓ Can reactivate if needed

**Incorrect Action:**
1. Try bulk delete ✗
2. Most will fail ✗
3. Partial success, confusion ✗
4. Data integrity concerns ✗

---

## 📈 Monitoring & Maintenance

### Regular Tasks

**Weekly:**
- Review deactivated users
- Check for test accounts to clean
- Verify no unauthorized reactivations

**Monthly:**
- Audit deactivated user list
- Confirm deactivations are appropriate
- Update documentation

**Quarterly:**
- Review deletion policy
- Train new admins
- Update procedures

---

## 🚨 Emergency Procedures

### If You Accidentally Try to Delete Important User

**Don't Panic:**
1. System will prevent deletion if data exists
2. Error message will explain why
3. No data will be lost
4. Use deactivate instead

### If Bulk Delete Partially Fails

**What Happens:**
- Successful deletions complete
- Failed deletions show errors
- Failed users remain selected
- Results summary displayed

**What To Do:**
1. Review error messages
2. Note which users failed
3. Deactivate failed users instead
4. Document the action

---

**Last Updated:** January 31, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready

**Remember:** When in doubt, DEACTIVATE, don't delete!
