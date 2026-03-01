# Device Token Approval System - Implementation Guide

## 🎯 Overview

The system now supports **token-based device approval** alongside IP-based validation, allowing multiple devices on the same internet connection to access the system with individual approval.

**Key Benefit:** Multiple Staff members on the same network can now get approved independently using tokens instead of sharing a single IP address.

---

## 🔄 How It Works

### User Journey (Client/Staff)
1. **Device accesses website** → IP is detected
2. **System checks IP:**
   - ✅ If IP is registered (known PC) → Request access normally
   - ❌ If IP is NOT registered → Generate device token
3. **Device shows token screen:**
   - Displays unique token for this device
   - Shows "Waiting for admin approval"
   - Can copy token if needed
4. **Admin approves token:**
   - Token appears in admin dashboard
   - Admin reviews and approves
   - Device is automatically redirected
5. **Access granted!** ✅

---

## 📊 Database Tables

### `device_tokens`
Stores unique tokens for each device requesting access

```
id                 - Unique token ID
token              - 64-character unique token
device_name        - Name/description of device
ip_address         - IP that requested this token
status             - 'pending', 'approved', or 'rejected'
pc_id              - (Optional) PC assigned to this token
approved_by        - Admin ID who approved (if approved)
approved_at        - Timestamp of approval
last_used          - Last time token was used
created_at         - When token was created
expires_at         - Expiration (30 days default)
```

### `admin_notifications`
Notifies admins when new device tokens are created

```
id                 - Notification ID
admin_id           - Which admin to notify
type               - 'device_token', 'new_ip', 'security_alert'
title              - Notification title
message            - Notification details
reference_type     - Type being referenced (e.g., 'device_token')
reference_id       - ID of referenced object
is_read            - Whether admin has seen it
created_at         - When created
updated_at         - Last update
```

---

## 🎨 UI Components

### 1. Client-Side: IPValidation Component
**File:** `src/components/IPValidation.tsx`

**States:**
- `detecting` - Checking IP
- `waiting` - Waiting for IP-based approval (registered PC)
- `token_pending` - Waiting for token approval (new device)
- `error` - Error occurred

**Features:**
- Auto-generates token if IP not registered
- Shows token with copy button
- Real-time monitoring of token status
- Auto-redirects when approved

### 2. Admin-Side: PCManagementAdmin Component
**File:** `src/components/PCManagementAdmin.tsx`

**New Features:**
- Pending device tokens list
- PC assignment selector
- Approve/Reject buttons
- Real-time token updates

---

## 🔧 Hooks & Functions

### `useComputerShopDatabase` Hook
**File:** `src/hooks/useComputerShopDatabase.ts`

#### New Functions:

```typescript
// Create new device token
createDeviceToken(ipAddress: string, deviceName?: string): Promise<string | null>

// Verify if token is approved and valid
verifyDeviceToken(token: string): Promise<boolean>

// Get all device tokens
getDeviceTokens(): Promise<DeviceToken[]>

// Approve token (admin action)
approveDeviceToken(tokenId: number, pcId?: number): Promise<boolean>

// Reject token (admin action)
rejectDeviceToken(tokenId: number): Promise<boolean>

// Subscribe to token changes
subscribeToDeviceTokenChanges(callback: (tokens: any[]) => void): () => void

// Get admin notifications
getAdminNotifications(adminId: number): Promise<any[]>

// Mark notification as read
markNotificationAsRead(notificationId: number): Promise<boolean>

// Subscribe to admin notifications
subscribeToAdminNotifications(adminId: number, callback: (notifications: any[]) => void): () => void
```

---

## 📋 Implementation Checklist

- ✅ SQL tables created (`device_tokens`, `admin_notifications`)
- ✅ Device token utility functions (`src/lib/deviceTokens.ts`)
- ✅ Hook methods implemented
- ✅ IPValidation component updated with token flow
- ✅ PCManagementAdmin updated with token UI
- ✅ Real-time subscriptions configured
- ✅ Admin notifications system
- ✅ CSS styling added

---

## 🚀 Usage

### For End Users:
1. First time visiting on new device
2. See "Device Approval Token" screen
3. Wait for admin to approve
4. Automatically redirected when approved

### For Admins:
1. Open PC Management Dashboard
2. Look for "Device Token Approvals" section
3. See pending tokens with device info
4. Click to select token
5. Optionally assign a PC
6. Click "Approve Token" or "Reject"
7. System notifies device of approval

---

## 🔐 Security Features

### Token Security:
- 64-character random tokens
- Unique per device per session
- Automatic expiration (30 days)
- Can be rejected by admin
- Stored securely in database

### Request Flow:
1. IP detection → Check registered PC
2. If not registered → Generate token
3. Admin approval required
4. Token validated on use
5. Device must have valid token or registered IP

### Advantages:
- ✅ Multiple devices on same IP
- ✅ Individual device approval (not IP-based)
- ✅ Higher security than just IP checking
- ✅ Admin gets notifications
- ✅ Automatic expiration prevents stale access

---

## 📝 Setup Instructions

### 1. Run SQL Migration
1. Open your Supabase SQL editor
2. Copy contents from: `DEVICE_TOKEN_SETUP.sql`
3. Execute the SQL
4. Verify tables are created

### 2. Verify Environment
- Tables: `device_tokens`, `admin_notifications`
- RLS policies should allow admin read/write
- Realtime enabled for both tables

### 3. Test the Flow
1. Open the app in a new/private browser
2. Accept IP validation screen
3. Should see token approval screen
4. Admin dashboard shows pending token
5. Approve from admin panel
6. Device should redirect to home

---

## 🐛 Troubleshooting

### Issue: Token not appearing in admin dashboard
**Solution:** 
- Check browser console for errors
- Verify `admin_notifications` table exists
- Check admin user permissions in database

### Issue: Device not redirecting after approval
**Solution:**
- Check browser console for subscription errors
- Verify real-time is enabled for `device_tokens`
- Check PC assignment (optional but helps)

### Issue: Cannot reject token
**Solution:**
- Verify user has admin role
- Check `staff_users` table permissions
- Look for database constraint errors in console

---

## 📞 Flow Diagrams

### New Device Registration Flow
```
[New Device Visit]
    ↓
[Detect IP] 
    ↓
[Check if IP Registered] 
    ├─ YES → [Request Access] → [Wait for Approval]
    └─ NO → [Generate Token] → [Show Token Screen] → [Wait for Token Approval]
         ↓
         [Create Notification for Admin]
         ↓
         [Admin Reviews Token]
         ├─ APPROVE → [Mark as Approved] → [Notify Device] → [Redirect]
         └─ REJECT → [Mark as Rejected] → [Show Error]
```

### Admin Approval Flow
```
[Admin Dashboard]
    ↓
[See Pending Tokens]
    ↓
[Select Token]
    ↓
[Choose PC (Optional)]
    ↓
[Approve or Reject]
    ├─ APPROVE → [Update Status in DB] → [Device Notified (Real-time)]
    └─ REJECT → [Update Status] → [Device Shows Error]
```

---

## 🎓 Key Concepts

### Dual Authentication:
- **Layer 1 (IP):** Quick access for known PCs
- **Layer 2 (Token):** New devices need individual approval

### Real-Time Updates:
- Devices monitor token status
- Admins see new tokens instantly
- No page refresh needed

### Token Lifecycle:
- **Created:** When new device first visits
- **Pending:** Waiting for admin review
- **Approved:** Device can access system
- **Rejected:** Device denied access
- **Expired:** Auto-deleted after 30 days

---

## 📊 Statistics Available

From admin dashboard you can monitor:
- Total pending tokens
- Approved tokens per admin
- Token approval rate
- Device registration success rate

---

## 🔄 Next Steps

1. ✅ Deploy the changes
2. ✅ Test with new devices
3. ✅ Monitor admin notifications
4. ✅ Adjust token expiration if needed (default 30 days)
5. ✅ Train admins on approval process

---

## 🧠 Design Decisions

### Why Tokens Over Just IP?
- IP can share among multiple users
- Token is unique per device session
- Higher security
- Individual device control

### Why Keep IP Checking?
- Faster for known devices
- Provides backup authentication
- Reduces token creation for every visit

### Why 30-day Expiration?
- Balances security and usability
- Unused devices auto-expire
- Can be changed in SQL if needed
- Admin can manually reject anytime

---

## 📖 Related Files

- `DEVICE_TOKEN_SETUP.sql` - Database migration
- `src/lib/deviceTokens.ts` - Token utilities
- `src/hooks/useComputerShopDatabase.ts` - Main hook with new methods
- `src/components/IPValidation.tsx` - Client token flow
- `src/components/IPValidation.css` - Token screen styling
- `src/components/PCManagementAdmin.tsx` - Admin token UI
- `src/components/PCManagementAdmin.css` - Admin token styling

---

## ✨ Benefits Summary

| Feature | Benefit |
|---------|---------|
| Individual Tokens | Multiple staff on same IP can get approved separately |
| Notifications | Admins are instantly notified of new requests |
| Auto-Expiration | Prevents stale access, improved security |
| Real-Time | No polling needed, instant updates |
| Optional PC Assignment | Flexible - can approve token without assigning PC |
| Fallback to IP | If token system has issues, IP-based works |

---

## 🎉 You're All Set!

The token-based approval system is now fully integrated. Your staff can now register devices with individual tokens while maintaining IP-based quick access for known computers.

