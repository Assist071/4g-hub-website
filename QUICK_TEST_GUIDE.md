## 🚀 QUICK START TESTING - 5 Minutes

### **Test 1: Is Database Ready? (2 min)**

Supabase → SQL Editor → Run this:
```sql
-- Run one query at a time, check results

-- ✅ Should return: login_attempts
SELECT tablename FROM pg_tables WHERE tablename = 'login_attempts';

-- ✅ Should return: 3 rows (failed_attempts, locked_until, last_failed_login)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'staff_users' AND column_name LIKE 'failed%' OR column_name LIKE 'locked%';

-- ✅ Should return: 3 rows
SELECT proname FROM pg_proc WHERE proname IN ('is_staff_account_locked', 'increment_failed_login', 'reset_failed_login');
```

---

### **Test 2: Try Login With Wrong Password (2 min)**

1. Open: **http://localhost:5173/admin-login**
2. Click **Admin** tab
3. Try login 6 times with WRONG password:
   - Email: `admin@example.com`
   - Password: `wrong123`
   - Click "Admin Sign In"

**Watch for:**
- ✅ Error message after each attempt
- ✅ After 6th attempt → button says "**Account Locked (15s)**"
- ✅ Countdown appears: 15s, 14s, 13s...
- ✅ Button becomes disabled

---

### **Test 3: Check Database Logged It (1 min)**

Supabase → SQL Editor → Run:
```sql
SELECT email, success, error_message, timestamp
FROM login_attempts
WHERE email = 'admin@example.com'
ORDER BY timestamp DESC
LIMIT 5;
```

**Expected:** 5+ rows showing your failed login attempts

---

## 📋 Detailed Testing Phases

### **Phase A: Pre-Testing Checklist**

Before you start, verify:
1. ✅ You ran the SQL script in Supabase
2. ✅ Your app is running: `npm run dev`
3. ✅ You're logged into Supabase in your project
4. ✅ You have a staff account in `staff_users` table
5. ✅ You have valid admin credentials in `auth.users`

---

### **Phase B: Database Tests (5 min)**

**Copy each query, paste in Supabase, run:**

```sql
-- 1️⃣ Test helper function - Check if account is locked
SELECT is_staff_account_locked('dummytest@example.com');
-- Result: false ✅

-- 2️⃣ Increment failed login once
SELECT * FROM increment_failed_login('dummytest@example.com');
-- Result: {failed_count: 1, is_now_locked: false} ✅

-- 3️⃣ Check staff_users table
SELECT email, failed_attempts, locked_until 
FROM staff_users 
WHERE email = 'dummytest@example.com';
-- Result: {failed_attempts: 1, locked_until: null} ✅

-- 4️⃣ Run increment 4 more times (copy-paste and run 4 times)
SELECT * FROM increment_failed_login('dummytest@example.com');

-- 5️⃣ After 5 times, check again
SELECT email, failed_attempts, locked_until 
FROM staff_users 
WHERE email = 'dummytest@example.com';
-- Result: {failed_attempts: 5, locked_until: 2026-02-25 10:45:...} ✅

-- 6️⃣ Now check if locked
SELECT is_staff_account_locked('dummytest@example.com');
-- Result: true ✅

-- 7️⃣ Reset the account
SELECT reset_failed_login('dummytest@example.com');

-- 8️⃣ Verify reset
SELECT email, failed_attempts, locked_until 
FROM staff_users 
WHERE email = 'dummytest@example.com';
-- Result: {failed_attempts: 0, locked_until: null} ✅
```

**All 8 tests pass? → Database is ✅ GOOD!**

---

### **Phase C: Frontend Tests (10 min)**

#### **Test C1: Admin Login Rate Limiting**

1. Go to: http://localhost:5173/admin-login
2. Admin tab is selected
3. Enter:
   - Email: `admin@example.com`
   - Password: `WRONG_PASSWORD`
4. Click "Admin Sign In"
5. **Repeat steps 3-4 six times**

**After attempt 5:**
- Error message: "Invalid email or password"
- Password field clears
- Button shows: "Admin Sign In"

**After attempt 6:**
- Button is DISABLED (grayed out)
- Button shows: "Account Locked (15s)"
- Cannot click button
- Timer counts down

**After 15 seconds:**
- Button re-enables
- Shows "Admin Sign In" again
- Can try again

---

#### **Test C2: Successful Login**

1. Enter correct email and password
2. Click "Admin Sign In"
3. Should redirect to `/admin` page
4. ✅ Login successful!

---

#### **Test C3: Staff Login**

1. Go to: http://localhost:5173/admin-login
2. Click **Staff** tab
3. Enter:
   - Email: `staff_email@example.com` (from staff_users table)
   - Password: `staff_password` (from staff_users table)
4. Click "Staff Sign In"
5. Should redirect to `/queue` page
6. ✅ Staff login successful!

---

#### **Test C4: Staff Rate Limiting**

Repeat "Test C1" but for Staff tab:
- Same 6 failed attempts
- Same lockout behavior
- Same 15-second countdown

---

### **Phase D: Database Integrity Tests (5 min)**

After doing "Phase C" logins, verify database:

```sql
-- Check admin login attempt logged
SELECT email, success, attempt_type, error_message
FROM login_attempts
WHERE email = 'admin@example.com'
ORDER BY timestamp DESC
LIMIT 5;
-- Should show: 6 rows, all success=false ✅

-- Check staff login logged
SELECT email, success, attempt_type, error_message
FROM login_attempts
WHERE email = 'staff@example.com'
ORDER BY timestamp DESC
LIMIT 5;
-- Should show attempts ✅

-- View suspicious activity (3+ failed in 1 hour)
SELECT * FROM recent_suspicious_logins;
-- If you did 6+ attempts, should show your email ✅

-- View login statistics
SELECT * FROM login_success_rate
WHERE email LIKE '%admin@example.com%';
-- Should show attempts and success rate ✅
```

---

### **Phase E: Session Timeout Test (optional, 5 min)**

**Manual test (don't want to wait 30 min):**

1. Login successfully
2. Open DevTools (F12)
3. Go to Console, paste:

```javascript
import { adminSessionManager } from '@/lib/sessionManager';

// Expire session manually
const session = adminSessionManager.getSession();
if (session) {
  session.expiresAt = Date.now() - 1000; // Already expired
  sessionStorage.setItem('admin_session', JSON.stringify(session));
}

// Try to navigate - will auto-logout
```

**Expected:** Auto-redirects to login page ✅

---

## ✅ All Tests Pass? You're Done!

Create a checklist:

```
✅ Database tables created
✅ Helper functions working
✅ Admin rate limiting works (6 attempts = blocked)
✅ Staff rate limiting works
✅ Login attempts logged to DB
✅ Suspicious activity detected
✅ Session management working
✅ UI shows lockout countdown
✅ All tests passed!
```

---

## 🐛 If Something Fails

| Symptom | Solution |
|---------|----------|
| **Rate limiter not blocking** | Clear browser cache, hard refresh (Ctrl+Shift+R) |
| **Database functions not found** | Re-run `DATABASE_SECURITY_SETUP_CORRECTED.sql` as service_role user |
| **Staff login not working** | Check if staff exists in `staff_users` table, verify email/password |
| **Admin login not working** | Verify user exists in Supabase `auth.users` |
| **No login attempts in DB** | Check if `login_attempts` table exists, verify insert policy |
| **Button not showing countdown** | Check browser console (F12) for errors |

---

**Total Time: ~30 minutes to complete all tests** ⏱️

**Next: Monitor the `login_attempts` table regularly** 📊
