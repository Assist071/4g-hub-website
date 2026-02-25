## 🧪 Complete Testing Guide - How to Test Admin Login Security

### **Phase 1: Database Setup Testing**

#### **Step 1: Verify Tables & Functions Created**
Go to Supabase SQL Editor and run:

```sql
-- Check if login_attempts table exists
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'login_attempts';
-- Expected: Should return 'login_attempts'

-- Check if staff_users has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'staff_users' 
AND column_name IN ('failed_attempts', 'locked_until', 'last_failed_login');
-- Expected: Should return 3 rows

-- Check if helper functions exist
SELECT proname FROM pg_proc 
WHERE pronamespace::regnamespace::text = 'public'
AND proname IN ('is_staff_account_locked', 'increment_failed_login', 'reset_failed_login');
-- Expected: Should return 3 rows

-- Check if views exist
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('recent_suspicious_logins', 'login_success_rate');
-- Expected: Should return 2 rows
```

**✅ Expected Result:** All queries should return results
**❌ If not:** Run `DATABASE_SECURITY_SETUP_CORRECTED.sql` first

---

#### **Step 2: Test Database Functions**

```sql
-- ========================================
-- A) Test is_staff_account_locked()
-- ========================================
SELECT is_staff_account_locked('test@example.com');
-- Expected: false (not locked)

-- ========================================
-- B) Test increment_failed_login()
-- ========================================
SELECT * FROM increment_failed_login('test@example.com');
-- Expected: { failed_count: 1, is_now_locked: false }

-- Run it 4 more times
SELECT * FROM increment_failed_login('test@example.com');
SELECT * FROM increment_failed_login('test@example.com');
SELECT * FROM increment_failed_login('test@example.com');
SELECT * FROM increment_failed_login('test@example.com');
-- Expected: { failed_count: 5, is_now_locked: true }

-- Check the staff_users table
SELECT email, failed_attempts, locked_until FROM staff_users 
WHERE email = 'test@example.com';
-- Expected: failed_attempts = 5, locked_until = NOW() + 15 minutes

-- ========================================
-- C) Test is_staff_account_locked() again
-- ========================================
SELECT is_staff_account_locked('test@example.com');
-- Expected: true (now locked!)

-- ========================================
-- D) Test reset_failed_login()
-- ========================================
SELECT reset_failed_login('test@example.com');

-- Verify reset
SELECT email, failed_attempts, locked_until FROM staff_users 
WHERE email = 'test@example.com';
-- Expected: failed_attempts = 0, locked_until = NULL
```

**✅ All passing? Database is good!**

---

### **Phase 2: Frontend Rate Limiter Testing**

#### **Step 3: Test Client-Side Rate Limiter**
Open browser DevTools (F12) and test in Console:

```javascript
// ========================================
// Test 1: Import the rate limiter
// ========================================
import { adminRateLimiter } from '@/lib/rateLimiter';

// ========================================
// Test 2: Can attempt? (should be true initially)
// ========================================
adminRateLimiter.canAttemptLogin('test@example.com');
// Expected: true

// ========================================
// Test 3: Record failed attempts
// ========================================
for (let i = 1; i <= 5; i++) {
  adminRateLimiter.recordAttempt('test@example.com', false);
  console.log(`Attempt ${i}:`, adminRateLimiter.canAttemptLogin('test@example.com'));
}
// Expected:
// Attempt 1: true
// Attempt 2: true
// Attempt 3: true
// Attempt 4: true
// Attempt 5: false (BLOCKED!)

// ========================================
// Test 4: Get lockout time remaining
// ========================================
adminRateLimiter.getLockoutTimeRemaining('test@example.com');
// Expected: ~900 (seconds, roughly 15 minutes)

// ========================================
// Test 5: Record successful login (clears counter)
// ========================================
adminRateLimiter.recordAttempt('test@example.com', true);
adminRateLimiter.canAttemptLogin('test@example.com');
// Expected: still false (stays locked for 15 min)
// Note: Rate limiter is time-based, success doesn't unlock early

// ========================================
// Test 6: Wait for lockout to expire (or clear)
// ========================================
adminRateLimiter.clear(); // Manual reset for testing
adminRateLimiter.canAttemptLogin('test@example.com');
// Expected: true (unlocked)
```

**✅ Rate limiter working!**

---

### **Phase 3: Login Component Testing**

#### **Step 4: Test Login Attempts in UI**

1. **Open the login page:** http://localhost:5173/admin-login

2. **Try logging in with wrong password 6 times:**
   - Email: `admin@example.com` (or any real admin)
   - Password: `wrongpassword`
   - Click "Admin Sign In"
   - Repeat 6 times

**Expected behaviors:**
```
Attempt 1-5: 
  ✅ Error message appears
  ✅ Password field clears
  ✅ Button says "Admin Sign In"

Attempt 6:
  ❌ Button becomes disabled
  ❌ Button shows "Account Locked (15s)" countdown
  ❌ Cannot click button
  ❌ Countdown decreases: 15s, 14s, 13s...
```

---

#### **Step 5: Test Lockout Visual Feedback**

Watch the login page for:
```
✅ Alert appears with message like:
   "Access Denied"
   "Account temporarily locked. Try again in XX seconds."

✅ Button shows countdown:
   "Account Locked (15s)"
   "Account Locked (14s)"
   "Account Locked (13s)"

✅ After 15 seconds:
   Button re-enables and shows "Admin Sign In" again
```

---

#### **Step 6: Test Session Timeout**

1. **Login successfully** with correct admin credentials
2. **Stay idle for 30 minutes**
3. **Expected:** Auto-logout, redirect to login page

**Or test manually:**
```javascript
// In DevTools Console
import { adminSessionManager } from '@/lib/sessionManager';

// Check session
adminSessionManager.getSession();
// Should show session object with expireAt time

// Manual test: force expiration
const session = adminSessionManager.getSession();
session.expiresAt = Date.now() - 1000; // Already expired
adminSessionManager.storeSession(session);

// Try navigating - should redirect to login
```

---

### **Phase 4: Database Logging Testing**

#### **Step 7: Check login_attempts Table**

After testing login attempts, check the database:

```sql
-- View all login attempts
SELECT email, success, attempt_type, error_message, timestamp
FROM login_attempts
ORDER BY timestamp DESC
LIMIT 10;

-- Expected output:
-- Email      | Success | Type  | Error Message        | Timestamp
-- admin@...  | false   | admin | Invalid credentials  | 2026-02-25 10:30:45
-- admin@...  | false   | admin | Invalid credentials  | 2026-02-25 10:30:42
-- admin@...  | false   | admin | Invalid credentials  | 2026-02-25 10:30:38
-- ...
```

---

#### **Step 8: Test Suspicious Activity Detection**

```sql
-- View recent suspicious logins (3+ failed attempts in 1 hour)
SELECT * FROM recent_suspicious_logins;

-- Expected (if you tried 6 failed logins):
-- Email      | Type  | Failed | Last Attempt         | Error
-- admin@...  | admin | 6      | 2026-02-25 10:30:45  | Invalid credentials
```

---

#### **Step 9: Test Success Rate Tracking**

```sql
-- After a successful login, run:
SELECT * FROM login_success_rate
WHERE email = 'admin@example.com';

-- Expected:
-- Email         | Type  | Successful | Failed | Success Rate | Last Login
-- admin@...     | admin | 1          | 5      | 16.67%       | 2026-02-25 10:35:12
```

---

### **Phase 5: Complete End-to-End Testing**

#### **Step 10: Full Workflow Test**

```
Scenario: Staff member tries to login with wrong password
```

**Test Steps:**

1. **Open staff login tab**
   - URL: http://localhost:5173/admin-login
   - Select "Staff" tab

2. **Enter wrong password 5 times**
   ```
   Email: staff@example.com
   Password: wrongpassword
   Click Staff Sign In
   ```

3. **Check database after each attempt**
   ```sql
   SELECT email, failed_attempts, locked_until 
   FROM staff_users 
   WHERE email = 'staff@example.com';
   ```

4. **Verify UI lockout on attempt 6**
   - Button disabled
   - Shows countdown timer
   - Cannot submit

5. **Check login_attempts table**
   ```sql
   SELECT * FROM login_attempts 
   WHERE email = 'staff@example.com'
   ORDER BY timestamp DESC
   LIMIT 6;
   ```
   Expected: 6 rows with success=false

6. **Wait 15 seconds** - see button re-enable

7. **Login successfully**
   ```
   Email: staff@example.com
   Password: correctpassword (from staff_users table)
   Click Staff Sign In
   ```

8. **Check database after success**
   ```sql
   SELECT email, failed_attempts, locked_until 
   FROM staff_users 
   WHERE email = 'staff@example.com';
   ```
   Expected: failed_attempts = 0, locked_until = NULL

9. **Check login_attempts contains success**
   ```sql
   SELECT * FROM login_attempts 
   WHERE email = 'staff@example.com'
   AND success = true
   ORDER BY timestamp DESC
   LIMIT 1;
   ```
   Expected: 1 row with success=true

---

### **Phase 6: Performance Testing**

#### **Step 11: Query Performance**

```sql
-- Check query execution time
EXPLAIN ANALYZE
SELECT email, success, timestamp
FROM login_attempts
WHERE email = 'test@example.com'
AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Expected: Should use index (look for "Index Scan")
```

---

### **Phase 7: Cross-Browser Testing**

#### **Step 12: Test in Different Browsers**

Test in Chrome, Firefox, Safari:
1. Login and verify session works
2. Check sessionStorage (not localStorage)
3. Verify logout on browser close

```javascript
// Check sessionStorage
sessionStorage.getItem('admin_session');
// Should exist after login

// Check localStorage (should be empty for auth)
localStorage.getItem('admin_session');
// Should be null or undefined
```

---

### **🎯 Quick Testing Checklist**

Copy this checklist and check off as you test:

```
DATABASE SETUP
☐ login_attempts table created
☐ Indexes created successfully
☐ RLS policies enabled
☐ staff_users columns added (failed_attempts, locked_until)
☐ Helper functions created (3 functions)
☐ Views created (2 views)

RATE LIMITER (CLIENT-SIDE)
☐ Can attempt login initially
☐ Blocks after 5 failed attempts
☐ Shows lockout countdown
☐ Lockout expires after time (or manually)

LOGIN FUNCTIONALITY
☐ admin login works with correct credentials
☐ admin login fails with wrong password
☐ admin gets rate limited after 5 tries
☐ staff login works with correct credentials
☐ staff login fails with wrong password
☐ staff gets rate limited after 5 tries

DATABASE ENFORCEMENT
☐ failed_attempts increments on failed login
☐ locked_until set after 5 attempts
☐ failed_attempts resets on success
☐ locked_until clears on success

LOGGING
☐ login_attempts table has records
☐ success column correct
☐ attempt_type populated (admin/staff)
☐ error_message shows for failures
☐ user_agent recorded

MONITORING
☐ recent_suspicious_logins view shows locked accounts
☐ login_success_rate shows statistics
☐ Can query last N attempts for user

SESSION MANAGEMENT
☐ Session stored in sessionStorage (not localStorage)
☐ Session expires after timeout
☐ Session warning shows before expiry
☐ Logout clears session

SECURITY
☐ Cannot bypass rate limit with dev tools
☐ Cannot access other users' attempts
☐ Database enforces lockout for staff
☐ RLS policies working correctly
```

---

### **🔍 Troubleshooting**

#### **Problem: Database functions not found**
```sql
-- Solution: Verify they exist
SELECT proname FROM pg_proc WHERE proname LIKE 'is_staff%';
```

#### **Problem: Rate limiter not blocking**
```javascript
// Check storage
adminRateLimiter.getFailedAttemptsCount('test@example.com');
// Should show count
```

#### **Problem: Session not persisting**
```javascript
// Check sessionStorage
sessionStorage.getItem('admin_session');
// Should exist after login
```

#### **Problem: RLS policy blocking inserts**
```sql
-- Check policy exists
SELECT policyname FROM pg_policies 
WHERE tablename = 'login_attempts';
```

---

### **📊 Expected Test Results Summary**

| Test | Expected Result | Status |
|------|-----------------|--------|
| DB tables exist | All 3 created | ☐ |
| Functions work | All 3 callable | ☐ |
| Rate limiter blocks | After 5 attempts | ☐ |
| Lockout countdown | Visible on UI | ☐ |
| Login logging | Rows in DB | ☐ |
| Session timeout | Auto-logout | ☐ |
| Suspicious view | Shows locked accounts | ☐ |
| Success rate view | Shows statistics | ☐ |

---

### **⏱️ Estimated Testing Time**

```
Database setup:     5 minutes
Frontend testing:  10 minutes
End-to-end flow:   10 minutes
Monitoring check:   5 minutes
Documentation:      5 minutes
─────────────────────────────
TOTAL:              35 minutes
```

**Status: ✅ Ready to test!**
