# 🔐 Admin Login Security - Quick Setup Guide

## ✅ What's Been Implemented

1. ✅ **Rate Limiting** - Prevents brute force attacks (5 attempts/15 min)
2. ✅ **Session Management** - Auto-logout after inactivity (30 min admin, 8 hours staff)
3. ✅ **Account Lockout** - Automatic lockout after failed attempts
4. ✅ **Login Attempt Logging** - Tracks all login attempts
5. ✅ **Password Validation** - Strong password requirements
6. ✅ **Enhanced UI** - Visual feedback for security status

---

## 📝 Next Steps (Important!)

### Step 1: Create `login_attempts` Table in Supabase
Go to Supabase SQL Editor and run:

```sql
CREATE TABLE login_attempts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  user_agent TEXT,
  error_message TEXT,
  attempt_type TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email_timestamp 
ON login_attempts(email, timestamp DESC);
```

### Step 2: Update RLS Policies (Row Level Security)
These policies allow the app to insert login attempts:

```sql
-- Allow anyone to insert login attempts
CREATE POLICY "Anyone can insert login attempts"
ON login_attempts
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to read their own attempts
CREATE POLICY "Users can read their own login attempts"
ON login_attempts
FOR SELECT
USING (email = auth.email());
```

### Step 3: Test the Implementation
1. Try logging in with wrong password 5+ times
2. Should see "Account Locked (15 min)" message
3. Check `login_attempts` table in Supabase

---

## 🚀 Security Features Explained

### **Rate Limiting**
```
Attempt 1: ✅ Allowed
Attempt 2: ✅ Allowed
Attempt 3: ✅ Allowed
Attempt 4: ✅ Allowed
Attempt 5: ✅ Allowed
Attempt 6: ❌ BLOCKED - Account locked for 15 minutes
```

### **Session Timeout**
- **Admin:** Expires after 30 minutes of inactivity
- **Staff:** Expires after 8 hours of inactivity
- **Warning:** User sees warning 5 minutes before expiration

### **Login Logging**
All login attempts are logged with:
- Email address
- Success/Failure
- Timestamp
- Browser user agent
- Error message (if failed)

---

## 🔒 Security Files Created

New security utilities added to `src/lib/`:
- `rateLimiter.ts` - Rate limiting logic
- `sessionManager.ts` - Session management with timeouts
- `passwordValidation.ts` - Password strength validation
- `loginAttemptLogger.ts` - Login attempt logging

Updated files:
- `src/store/authStore.ts` - Integrated security features
- `src/components/AdminLogin.tsx` - Enhanced UI with security feedback

---

## 📊 Monitoring Admin Activity

Staff/admin accounts in `staff_users` table should use:
- Email addresses (unique)
- Strong passwords (12+ chars, mixed case, numbers, symbols)
- Role assignments (admin, chef, waiter, etc.)

**⚠️ Important:** Staff passwords are currently stored as plaintext. Consider hashing them using bcryptjs and storing hashed values.

---

## 🛡️ Password Requirements

For admins (enforce strong passwords):
- ✅ Minimum 12 characters
- ✅ At least 1 UPPERCASE letter
- ✅ At least 1 lowercase letter
- ✅ At least 1 number
- ✅ At least 1 special character (!@#$%^&*)

Example strong password: `MyFood@2025Secure!`

---

## 🚨 What to Do If Locked Out

**For Admin:**
1. Wait 15 minutes
2. Try logging in again

**For Support:**
In Supabase, check `login_attempts` table:
```sql
SELECT * FROM login_attempts 
WHERE email = 'locked@example.com'
ORDER BY timestamp DESC
LIMIT 10;
```

---

## 📱 Deployment Checklist

- [ ] Database table `login_attempts` created
- [ ] RLS policies enabled for `login_attempts`
- [ ] Test login with incorrect password (5+ times)
- [ ] Verify account lockout works
- [ ] Test session timeout feature
- [ ] Check `login_attempts` table for logs
- [ ] Update admin/staff password policies
- [ ] Consider implementing 2FA
- [ ] Set up monitoring/alerts for suspicious activity
- [ ] Document security procedures for staff

---

## 🎯 Future Enhancements (Optional)

1. **Two-Factor Authentication (2FA)**
   - Email OTP verification
   - TOTP app integration

2. **Advanced Monitoring**
   - Dashboard showing login attempts
   - Alerts for suspicious patterns
   - IP address tracking

3. **Password Hashing**
   - Hash staff passwords using bcryptjs
   - Implement password reset flow

4. **Device Recognition**
   - Remember trusted devices
   - New device login notifications

5. **API Key Management**
   - For third-party integrations
   - Rotate keys regularly

---

## ❓ Common Questions

**Q: Why is the session in sessionStorage?**
A: sessionStorage is automatically cleared when the browser closes, making it more secure than localStorage. It's also not accessible by scripts in other tabs.

**Q: Can I change the lockout duration?**
A: Yes! Edit `src/lib/rateLimiter.ts` and change `LOCKOUT_DURATION`.

**Q: How do I prevent password reuse?**
A: Implement password history checking in the database.

**Q: What if someone forgets their password?**
A: For admin: Use Supabase's built-in password reset.
For staff: Admin can reset in staff_users table (after updating to use hashing).

---

## 📞 Support Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Rate Limiting Best Practices](https://owasp.org/www-community/attacks/Brute_force_attack)

---

**Last Updated:** February 25, 2026
**Version:** 1.0
