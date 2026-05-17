# Prospective Students - Debugging Guide

## 🔍 Diagnostic Checklist

### Step 1: Check Browser Console During Registration

When you register, **BEFORE clicking submit**, open DevTools:
```
F12 or Right-click → Inspect → Console tab
```

**During registration form submission, you should see:**

```
Step 1: Check if children are in formData
  → In register page, add this to console:
    const formData = /* from the form state */
    console.log('Children:', formData.children);
```

**Expected output:**
```javascript
Children: [
  { name: "Child Name", className: "KG-A", grade: "5-6 years" },
  // ... more children
]
```

---

### Step 2: Check localStorage After Registration Form Submit

**In DevTools Console:**
```javascript
// Run this AFTER you click Submit on registration form
localStorage.getItem('pendingChildren')
```

**Expected output:**
```javascript
'[{"name":"Child Name","className":"KG-A","grade":"5-6 years"}]'
```

**If you get `null` → Children data is NOT being saved to localStorage**

---

### Step 3: Check Parent's schoolId During OTP Verification

**When on OTP verification page, run in console:**
```javascript
// Check what's being sent with OTP
// Add this to DevTools before you enter OTP

// First, let's see what localStorage has:
console.log('pendingChildren:', localStorage.getItem('pendingChildren'));
console.log('schoolId:', localStorage.getItem('schoolId'));
console.log('userId:', localStorage.getItem('userId'));
```

---

### Step 4: Check Server Logs

**After OTP verification, check your server terminal for logs:**

```
Look for these logs:
✅ [OTP Verification] User role: parent
✅ [OTP Verification] Children received: [{"name":"..."}]
✅ [OTP Verification] User schoolId: ObjectId("xxx")
✅ [OTP Verification] Created 1 prospective student records
```

**If you see:**
```
⚠️ [OTP Verification] Parent has no schoolId set. Cannot create prospective students.
```

→ **The parent's schoolId was NOT set during registration**

---

### Step 5: Check Database - Parent User Record

**In MongoDB Compass, check the `users` collection:**

```javascript
// Query to find your parent user:
{
  email: "your-email@example.com",
  role: "parent"
}
```

**Check if these fields are set:**
- ✅ `role` should be `"parent"`
- ✅ `schoolId` should be an ObjectId (NOT null/undefined)
- ✅ `schoolType` should be set (`"my-childs-school"` or `"home-school"`)

**If `schoolId` is null/missing → That's the problem!**

---

### Step 6: Verify Registration Form Data

**During registration, make sure:**

1. ✅ You selected a **School Type**: "My Child's School" or "Home School"
2. ✅ You selected a **School** from the dropdown
3. ✅ The school dropdown shows available schools (not empty)
4. ✅ You added at least one **Child** with name, class, and grade

---

## 🐛 Common Issues & Solutions

### Issue 1: No children data in localStorage

**Problem:** `localStorage.getItem('pendingChildren')` returns `null`

**Solution:** 
1. Check if you're actually adding children in the form
2. Click "+ Add Child" button
3. Fill in all required fields
4. Click the "+ Add Child" button again (this should add to the list)

**File to check:** `src/app/register/page.js` line 291-310 (addChild function)

---

### Issue 2: Parent has no schoolId

**Problem:** Parent user exists but `schoolId` is null/undefined

**Solution:**
During registration as a parent:
1. Make sure you select a **School Type** (step 2)
2. Make sure you select a **School** from the dropdown (step 2)
3. The form MUST pass `schoolId` to the backend

**File to check:** `src/app/register/page.js` - Step 2 validation

---

### Issue 3: Children data sent but ProspectiveStudent not created

**Problem:** Log shows `Children received: [...]` but no ProspectiveStudent created

**Causes:**
1. ProspectiveStudent model has validation error
2. Database connection error during save()
3. Some other exception

**Solution:**
Check server log for:
```
[OTP Verification] Error creating prospective students: [ERROR MESSAGE]
```

---

## 🧪 Complete Testing Flow

### Manual Test (Step-by-Step)

**1. Open Browser DevTools Console**
```
F12 → Console tab
```

**2. Go to /register**

**3. Fill Registration Form**
- Email: `testparent@example.com`
- First Name: `Test`
- Last Name: `Parent`
- Phone: `08012345678`
- Role: Select **Parent**
- Click Next

**4. On Step 2 (School Selection)**
- School Type: Select **"My Child's School"** ✅
- School: Select **any school from dropdown** ✅
- Click Next

**5. On Step 3 (Children)**
- Child's Full Name: `Ahmed Ali`
- Class: Select a class
- Grade/Age Range: `5-6 years`
- Click "+ Add Child"
- Repeat for more children if needed
- Click Next

**6. Set Password**
- Password: set a password
- Click Submit

**7. Check localStorage**
```javascript
// In DevTools Console, run:
localStorage.getItem('pendingChildren')

// Expected: '[{"name":"Ahmed Ali",...}]'
```

**8. Verify Email Page**
- Check console for pendingChildren
```javascript
localStorage.getItem('pendingChildren')
```

**9. Enter OTP**
- You should receive OTP in email
- Enter 6-digit code

**10. Check Server Logs**
```
Look for: "[OTP Verification] Created 1 prospective student records"
```

**11. Check Database**
```javascript
// In MongoDB, query:
db.prospectivestudents.find({ parentId: ObjectId("...") })

// Should return 1 document
```

---

## 📋 Complete Debugging Command List

### Browser Console Commands
```javascript
// Check children in form (during registration)
console.log('pendingChildren in localStorage:', localStorage.getItem('pendingChildren'));

// Check parent user info (after login)
console.log('userId:', localStorage.getItem('userId'));
console.log('schoolId:', localStorage.getItem('schoolId'));
console.log('userRole:', localStorage.getItem('userRole'));

// Check what data is in localStorage
Object.keys(localStorage).forEach(key => {
  console.log(`${key}:`, localStorage.getItem(key));
});
```

### MongoDB Commands (Compass or mongosh)
```javascript
// Find parent user
db.users.findOne({ email: "your-email@example.com", role: "parent" })

// Find prospective students for your school
db.prospectivestudents.find({ parentId: ObjectId("parent_user_id") })

// Count all prospective students
db.prospectivestudents.countDocuments()

// Check if ProspectiveStudent model has issues
db.prospectivestudents.findOne()  // Should return a sample document
```

---

## 🚀 Most Likely Fix

Based on your screenshot showing 0 documents, the most likely issue is:

**Parent's `schoolId` is not being set during registration**

### Quick Fix Steps:

1. **Re-register** as parent
2. **Make absolutely sure** you select:
   - ✅ School Type (Step 2)
   - ✅ School from dropdown (Step 2)
3. **Add children** (Step 3)
4. **Verify OTP**
5. **Check if schoolId is set** in database:
   ```javascript
   db.users.findOne({ email: "your-email@example.com" })
   // Check if schoolId field exists and has a value
   ```

---

## 📞 If Still Not Working

After checking all above:

1. **Share server logs** - Look for `[OTP Verification]` lines
2. **Share parent user data** from MongoDB - Does it have `schoolId`?
3. **Check network tab** in DevTools:
   - Does OTP verification request include `children` data?
   - What's the response?

---

## ✅ Verification Checklist

After testing, verify:
- [ ] Parent user exists with `role: "parent"`
- [ ] Parent user has `schoolId` set (not null)
- [ ] Parent user has `schoolType` set
- [ ] localStorage has `pendingChildren` after registration
- [ ] Server logs show OTP verification happened
- [ ] Server logs show ProspectiveStudent created
- [ ] ProspectiveStudent document exists in MongoDB
- [ ] ProspectiveStudent has correct `school` and `parentId`

---

Please run through these steps and let me know:
1. What you see in localStorage
2. What the server logs show
3. Whether parent user has schoolId in database

This will help me identify the exact issue! 🔍
