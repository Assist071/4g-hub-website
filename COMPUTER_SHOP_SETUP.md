# Computer Shop Auto-IP Detection System - Implementation Guide

## 🎯 Overview

This system provides a complete auto-IP detection flow for computer shop management with:
- **Customer Side**: Automatic IP detection, PC selection, and session management
- **Admin Side**: Real-time PC management dashboard with live status monitoring

## 📦 Components Created

### 1. Database Schema
**File**: `COMPUTER_SHOP_SCHEMA.sql`

Tables created:
- `pcs` - Computer information with IP tracking and status
- `sessions` - Session history and state management

### 2. Custom Hook
**File**: `src/hooks/useComputerShopDatabase.ts`

Provides database operations for:
- IP detection and validation
- PC availability checking
- Session management
- Real-time subscriptions

### 3. Customer Component
**File**: `src/components/IPValidation.tsx`

Flow:
1. Auto-detect IP on page load
2. Check if IP exists in database
3. Show PC selection or redirect to landing
4. Wait for admin approval with real-time updates

### 4. Admin Component
**File**: `src/components/PCManagementAdmin.tsx`

Features:
- Real-time table with live status updates
- Filter by status (All, Online, Pending, Offline, Maintenance)
- Grant/Deny/End/Kick/Maintenance actions
- Running timers for online sessions
- IP address tracking with AUTO badge

## 🚀 Quick Start

### Step 1: Setup Database

Run the SQL schema in your Supabase database:

```sql
-- Copy entire contents of COMPUTER_SHOP_SCHEMA.sql
-- Paste into Supabase SQL Editor and execute
```

This creates:
- `pcs` table with 8 sample computers
- `sessions` table for tracking
- Indexes for performance
- Realtime subscriptions enabled

### Step 2: Update Routes

Add to your routing (e.g., `App.tsx` or router config):

```typescript
import { IPValidation } from '@/components/IPValidation';
import { PCManagementAdmin } from '@/components/PCManagementAdmin';

// Customer validation page - show this BEFORE landing page
<Route path="/validate" element={<IPValidation />} />

// Admin dashboard page
<Route path="/admin/pc-management" element={<PCManagementAdmin />} />
```

### Step 3: Import Components

```typescript
// For customer flow
import { IPValidation } from '@/components/IPValidation';

// For admin dashboard
import { PCManagementAdmin } from '@/components/PCManagementAdmin';
```

## 🔄 Customer Flow

### 1. **Detecting IP (Automatic)**
```
User visits /validate
  ↓
Loading screen: "Detecting your station..."
  ↓
Auto-fetch IP via ipify.org API
```

### 2. **Check Existing IP**
```
IP detected: 192.168.1.101
  ↓
Check database for this IP
  ↓
If found AND status === "online"
  → Auto-redirect to landing (100% known customer)
  → Show IP in top-right corner
  
If found AND status === "offline"
  → Show "Resume Session" button (returning customer)
  → Pre-select their previous PC
  
If not found
  → Show PC selection grid
```

### 3. **Select PC**
```
Click on available PC card
  ↓
PC highlights with green border
  ↓
Click "Request Access" button
```

### 4. **Wait for Approval**
```
Show "Waiting for Approval" screen
  ↓
Display selected PC number and IP
  ↓
Listen for admin approval in real-time
  ↓
When admin clicks GRANT
  → Auto-redirect to landing page
  
When admin clicks DENY
  → Show error, return to selection screen
```

## 🖥️ Admin Dashboard

### Status Filters
- **All**: All PCs
- **Online**: Active sessions (green dot, running timer)
- **Pending**: Waiting for approval (yellow pulse dot)
- **Offline**: Available PCs (gray dot)
- **Maintenance**: Under repair (red dot)

### Real-Time Updates
- Subscribe to Supabase realtime changes
- Table auto-updates when:
  - Customer requests access
  - Admin makes a decision
  - Session starts/ends
  - PC status changes

### Action Buttons

#### Pending Status
- **GRANT**: Approve access → status = online, session starts
- **DENY**: Reject access → reset PC, remove IP

#### Online Status
- **END**: Close session but KEEP IP (customer can resume)
  - status → offline
  - ip_address → unchanged
  - session_started_at → cleared
  
- **KICK**: Force logout and remove IP (new customer)
  - status → offline
  - ip_address → NULL
  - session_started_at → cleared

#### Offline Status
- **MAINTENANCE**: Mark PC as broken
  - status → maintenance
  - Only shows if PC has IP assigned
  - Otherwise shows "No IP" text

#### Maintenance Status
- **RESTORE**: Return PC to service
  - status → offline

### Time Column
- **Online PCs**: Running timer (HH:MM:SS) from session start
- **Pending PCs**: Shows "Waiting..."
- **Offline/Maintenance**: Shows "--:--:--"

### IP Address Display
- Shows in monospace font with blue background
- "saved" label beside the IP
- "AUTO" badge next to PC number if IP assigned
- "Not assigned" in gray italic if null

## 📊 Database Schema Details

### `pcs` Table
```sql
id (serial) - Primary key
pc_number (varchar) - Unique identifier (PC-01, PC-02, etc)
ip_address (varchar, nullable) - Assigned IP for auto-detect
status (varchar) - offline/online/pending/maintenance
current_session_id (uuid, nullable) - Active session reference
session_started_at (timestamp, nullable) - For timer calculation
last_seen (timestamp, nullable) - Tracking usage
created_at (timestamp)
updated_at (timestamp)
```

### `sessions` Table
```sql
id (uuid) - Primary key
pc_id (integer) - References pcs.id
ip_address (varchar) - Snapshot of IP when session created
status (varchar) - pending/active/ended/rejected
started_at (timestamp, nullable)
ended_at (timestamp, nullable)
created_at (timestamp)
updated_at (timestamp)
```

## 🎨 Styling

### Customer Component (`IPValidation.css`)
- Gradient backgrounds per state
- Smooth animations and transitions
- Mobile-responsive grid layout
- Card hover effects

### Admin Component (`PCManagementAdmin.css`)
- Professional table styling
- Color-coded status indicators
- Pulsing animation for pending
- Responsive mobile layout (cards)

## 🔌 Hook Functions

### `useComputerShopDatabase()`

#### Detection & Checking
```typescript
const ip = await detectClientIP()
// Returns: "192.168.1.101" or null

const pc = await checkIPExists(ip)
// Returns: PC object or null
```

#### PC Availability
```typescript
const availablePCs = await getAvailablePCs()
// Returns: PC[] (offline/maintenance only)

const allPCs = await getAllPCs()
// Returns: PC[] (all PCs)
```

#### Session Management
```typescript
// Request access
const session = await requestPCAccess(pcId, ipAddress)
// Updates: PC status to pending, creates session

// Grant access
await grantAccess(pcId, sessionId)
// Updates: PC status to online, session to active

// Deny access
await denyAccess(pcId, sessionId)
// Updates: PC resets, session rejected

// End session (keep IP)
await endSession(pcId)
// Updates: PC to offline, keeps IP

// Kick client (remove IP)
await kickClient(pcId)
// Updates: PC to offline, clears IP

// Set maintenance
await setMaintenance(pcId)
// Updates: PC to maintenance status

// Restore maintenance
await restoreFromMaintenance(pcId)
// Updates: PC back to offline
```

#### Real-Time Subscriptions
```typescript
// Subscribe to any PC changes
const unsubscribe = subscribeToPCChanges((updatedPC) => {
  console.log('PC updated:', updatedPC)
})

// Subscribe to session changes for specific PC
const unsubscribe = subscribeToSessionChanges(pcId, (session) => {
  console.log('Session updated:', session)
})
```

## 🔐 Security Considerations

1. **IP Detection**: Uses `ipify.org` public API
   - Client-side detection for immediate feedback
   - Can be combined with server-side verification

2. **Database Rules**: Implement Row Level Security (RLS)
   ```sql
   -- Allow customers to read available PCs
   CREATE POLICY "customers_read_available_pcs" ON pcs
     FOR SELECT USING (status IN ('offline', 'maintenance'));
   
   -- Admins have full access via different role/credential
   ```

3. **IP Validation**: Each request stores IP snapshot
   - Prevents IP manipulation after session starts
   - Tracks IP history for auditing

## 🧪 Testing

### Test Customer Flow

1. Visit `/validate` from different networks/IPs
2. Verify "Detecting..." screen shows
3. Select a PC and request access
4. Check "Waiting for Approval" screen
5. In admin panel, click GRANT
6. Verify auto-redirect happens

### Test Admin Actions

1. **GRANT**: Pending → Online (check desktop appears online)
2. **DENY**: Back to selection (customer can try different PC)
3. **END**: Keep IP → Customer can resume by visiting page again
4. **KICK**: Clear IP → Force new PC selection
5. **MAINTENANCE**: Can't select when offline
6. **RESTORE**: Returns to offline for selection

### Test Real-Time Updates

1. Open admin dashboard in one window
2. Open `/validate` in another window
3. Request access
4. Watch admin dashboard update in real-time
5. Click actions and verify both windows sync

## 📝 Sample Usage

### Minimal Setup
```typescript
// App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { IPValidation } from '@/components/IPValidation';
import { PCManagementAdmin } from '@/components/PCManagementAdmin';
import Landing from '@/pages/Landing';

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer validation - show before landing */}
        <Route path="/validate" element={<IPValidation />} />
        
        {/* Admin dashboard */}
        <Route path="/admin/pc-management" element={<PCManagementAdmin />} />
        
        {/* Landing page */}
        <Route path="/" element={<Landing />} />
      </Routes>
    </Router>
  );
}
```

### Serve on App Startup
```typescript
// Redirect unknown IPs to validation
if (!userHasValidSession) {
  window.location.href = '/validate';
}
```

## 🔍 Debugging

### Enable Console Logs
All hooks have `console.error()` for failures. Check:
- Network tab for IP detection API call
- Database queries in Supabase dashboard
- Realtime updates under Supabase "Database" → "Subscriptions"

### Common Issues

**Issue**: "Failed to detect your IP address"
- Check internet connection
- Verify ipify.org is accessible
- Check CORS settings if behind proxy

**Issue**: Real-time not updating
- Must enable realtime in Supabase (schema does this)
- Check subscription is active
- Verify PC/session row exists

**Issue**: Auto-redirect not working
- Check session status actually changed to "active"
- Verify window.location.href is correct
- Check browser console for errors

## 📚 File Structure

```
src/
├── components/
│   ├── IPValidation.tsx       ← Customer validation component
│   ├── IPValidation.css       ← Customer styling
│   ├── PCManagementAdmin.tsx  ← Admin dashboard component
│   └── PCManagementAdmin.css  ← Admin styling
├── hooks/
│   └── useComputerShopDatabase.ts ← Database hook
├── pages/
│   ├── Validate.tsx (optional)
│   └── AdminPCManagement.tsx (optional)
└── types/
    └── (types already imported from hook)

COMPUTER_SHOP_SCHEMA.sql ← Database setup
```

## 🎯 Next Steps

1. **Run SQL schema** - Setup database
2. **Add routes** - Integrate components in app
3. **Test flow** - Validate customer journey
4. **Deploy admin** - Make PC management accessible to staff
5. **Monitor** - Watch real-time dashboard during operation

## 💡 Pro Tips

- **Whitelist IPs**: Store trusted customer IPs for VIP treatment
- **Time Limits**: Add auto-end after X hours
- **Notifications**: Send alerts when PCs go offline
- **Reports**: Query session history for usage analytics
- **Custom Redirect**: Modify landing page to show PC number to customer

---

**Created**: March 1, 2026
**Status**: Production Ready
**Last Updated**: [Current Date]
