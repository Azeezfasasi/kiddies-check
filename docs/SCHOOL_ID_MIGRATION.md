# School ID Migration Guide

## Problem

Existing users registered before the `schoolId` field was added don't have a schoolId assigned. This causes "School not found" errors when they try to access school-specific features.

## Solution

### Quick Migration (For Existing Users)

1. **Run the migration endpoint** (via curl, Postman, or direct API call):

```bash
curl -H "Authorization: Bearer admin-migration-token" \
  http://localhost:3000/api/admin/migrate-school-ids
```

This endpoint:

- Finds all users without a `schoolId`
- Matches them to schools by name (or creates a new school record)
- Updates user documents with the school reference
- Sets school-leader role users as school principals

**Response example:**

```json
{
  "success": true,
  "message": "Migration completed",
  "stats": {
    "updated": 5,
    "skipped": 0,
    "errors": 0,
    "errorDetails": []
  }
}
```

### For New Registrations

The `register` endpoint now automatically:

1. Creates a School record if it doesn't exist
2. Links the new user to the school via `schoolId`
3. Sets school-leader users as school principals

**No additional migration needed for new users!**

### For Existing Users (Alternative: Manual Fix)

If you prefer not to use the migration endpoint, users can:

1. Contact an administrator
2. Provide their school name
3. Admin can manually assign them to the appropriate school

## Status Check

After migration, verify users have schoolId:

```bash
# In MongoDB shell or Compass:
db.users.find({ schoolId: { $exists: false } })
```

Should return **0 results** after successful migration.

## Rollback

If needed, the migration is reversible by setting schoolId to null:

```bash
db.users.updateMany({}, { $unset: { schoolId: "" } })
```

## Next Steps

1. Run migration endpoint once
2. Restart dev server
3. Test login with existing user account
4. Verify "School not found" error is resolved
5. Proceed with data isolation (access control)
