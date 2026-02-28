# Computer Shop Auto-IP Detection System - Testing Guide

## 📋 Pre-Testing Checklist

- [ ] Database schema imported into Supabase
- [ ] Components added to project (`src/components/`)
- [ ] Hook added to project (`src/hooks/`)
- [ ] Routes configured in app
- [ ] Environment variables set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Supabase realtime enabled (SQL schema auto-enables)

## 🧪 Test Cases

### TEST 1: IP Detection on Page Load

**Steps:**
1. Open browser DevTools (F12)
2. Navigate to `/validate`
3. Observe network tab

**Expected Results:**
- [ ] "Detecting your station..." screen appears
- [ ] Loading spinner animates
- [ ] Network call to `https://api.ipify.org?format=json` completes
- [ ] Response shows valid IP (e.g., `{ "ip": "192.168.1.101" }`)
- [ ] Page advances after 1-2 seconds

**Failure Scenarios:**
- If IP detection fails:
  - Check browser console for errors
  - Verify internet connection
  - Confirm ipify.org is accessible
  - Check CORS settings

---

### TEST 2: New IP - PC Selection

**Setup:** Use an IP not in database (or clear current_session_id)

**Steps:**
1. Navigate to `/validate` with new IP
2. After IP detection, verify PC grid appears
3. Count PC cards in grid
4. Verify each PC shows: PC number, Server icon, status

**Expected Results:**
- [ ] PC grid displays all available PCs (status = "offline" or "maintenance")
- [ ] Grid is responsive (4-6 columns on desktop, 2-3 on mobile)
- [ ] Each PC card shows:
  - [ ] PC number (e.g., "PC-01")
  - [ ] Server icon
  - [ ] Status badge (OFFLINE/MAINTENANCE)
- [ ] Detected IP shown in top-right corner in monospace font
- [ ] No "Resume Session" button appears

**Database Check:**
```sql
-- In Supabase, verify:
SELECT * FROM pcs WHERE status IN ('offline', 'maintenance');
-- Should return 6-7 PCs available for selection
```

---

### TEST 3: PC Selection Interaction

**Steps:**
1. Continue from TEST 2
2. Click on one PC card
3. Verify card highlights
4. Click different PC
5. Verify previous PC deselects

**Expected Results:**
- [ ] Clicked PC card gets green border and brighter background
- [ ] Previously selected card returns to normal state
- [ ] Only one PC selected at a time
- [ ] "Request Access" button appears below grid when PC selected

---

### TEST 4: Request Access

**Steps:**
1. Select a PC (e.g., PC-07)
2. Click "Request Access" button
3. Watch console for updates

**Expected Results:**
- [ ] Button shows loading spinner
- [ ] Page transitions to "Waiting for Approval" screen
- [ ] Shows PC number ("PC-07")
- [ ] Shows detected IP address
- [ ] Pulsing animation plays continuously
- [ ] Message: "You will be redirected automatically when approved"

**Database Check:**
```sql
-- In Supabase:
SELECT * FROM pcs WHERE pc_number = 'PC-07';
-- Should show: status = 'pending', ip_address = '[your_ip]'

SELECT * FROM sessions WHERE pc_id = (SELECT id FROM pcs WHERE pc_number = 'PC-07') ORDER BY created_at DESC LIMIT 1;
-- Should show: status = 'pending', ip_address = '[your_ip]'
```

---

### TEST 5: Existing IP - Online Status

**Setup:** 
1. Manually set PC-01 to online with IP 192.168.1.101
2. Ensure session is marked as 'active'

**Steps:**
1. Open `/validate` from device/network with IP 192.168.1.101
2. Observe page behavior

**Expected Results:**
- [ ] "Detecting your station..." appears briefly
- [ ] Brief "Waiting for Approval" screen shown
- [ ] Auto-redirects to landing page (`/`)
- [ ] No PC selection shown (user is recognized)

**Database Commands:**
```sql
-- Set PC-01 to online for testing:
UPDATE pcs SET status = 'online', ip_address = '192.168.1.101' WHERE pc_number = 'PC-01';
INSERT INTO sessions (pc_id, ip_address, status, started_at) 
SELECT id, '192.168.1.101', 'active', NOW() FROM pcs WHERE pc_number = 'PC-01';
```

---

### TEST 6: Existing IP - Offline Status (Resume)

**Setup:**
1. Set PC-03 to offline with IP 192.168.1.103
2. Do NOT mark session as active

**Steps:**
1. Open `/validate` from device with IP 192.168.1.103
2. Observe page behavior

**Expected Results:**
- [ ] "Detecting your station..." appears
- [ ] PC selection screen appears with PC-03 pre-selected
- [ ] "Resume Session" button shown (instead of "Request Access")
- [ ] Only PC-03 shown (not full grid of available PCs)
- [ ] IP shown in top-right corner

---

### TEST 7: Admin Dashboard - Table Display

**Steps:**
1. Navigate to `/admin/pc-management`
2. Observe table and filter tabs

**Expected Results:**
- [ ] Table displays with columns: PC | IP ADDRESS | STATUS | TIME | ACTION
- [ ] All 8 sample PCs visible on "All" tab
- [ ] Filter tabs show:
  - [ ] All (8)
  - [ ] Online (1-2)
  - [ ] Pending (0-2)
  - [ ] Offline (4-5)
  - [ ] Maintenance (1)
- [ ] Status dots are correct colors:
  - [ ] Green for online
  - [ ] Yellow (pulsing) for pending
  - [ ] Gray for offline
  - [ ] Red for maintenance

---

### TEST 8: Admin Dashboard - Status Filtering

**Steps:**
1. In PCManagementAdmin, click "Pending" tab
2. Verify only pending PCs shown
3. Click "Online" tab
4. Verify only online PCs shown
5. Repeat for Offline and Maintenance tabs

**Expected Results:**
- [ ] Table re-filters instantly
- [ ] Row count matches tab badge
- [ ] Only relevant action buttons for that status shown

---

### TEST 9: Admin - Grant Access (Pending → Online)

**Setup:** Have at least one PC in pending status

**Steps:**
1. In Admin dashboard, find pending PC (e.g., PC-08)
2. Click GRANT button
3. Watch for status change
4. Check time column

**Expected Results:**
- [ ] PC-08 status changes from Pending → Online (badge color + dot)
- [ ] Time column shows running timer (00:00:00, incrementing)
- [ ] GREEN dot appears (from yellow)
- [ ] Action buttons change from [GRANT][DENY] to [END][KICK]
- [ ] Any browser windows with `/validate` waiting auto-redirect to `/`

**Verify:**
```sql
SELECT * FROM pcs WHERE pc_number = 'PC-08';
-- status should be 'online'
-- session_started_at should be recent timestamp
```

---

### TEST 10: Admin - Deny Access (Pending → Offline)

**Setup:** Have pending PC(s)

**Steps:**
1. In Admin dashboard, find pending PC
2. Click DENY button
3. Verify status resets

**Expected Results:**
- [ ] PC status changes from Pending → Offline
- [ ] ip_address cleared (if was assigned)
- [ ] Session marked as 'rejected'
- [ ] If customer was waiting:
  - [ ] Their screen shows error: "Your access request was denied"
  - [ ] PC selection reappears for retry

---

### TEST 11: Admin - END Session (Keep IP)

**Setup:** Have online PC with active session

**Steps:**
1. In Admin dashboard, find online PC
2. Click END button
3. Verify status and IP

**Expected Results:**
- [ ] PC status: Online → Offline
- [ ] IP address: KEPT (still visible in table)
- [ ] Time value: resets to "--:--:--"
- [ ] Timer stops
- [ ] Customer's session ends gracefully

**Use Case:** Returning customer
- When they visit `/validate` again with same IP
- They see "Resume Session" button
- They can request access again without re-selecting PC

---

### TEST 12: Admin - KICK Client (Remove IP)

**Setup:** Have online PC

**Steps:**
1. Click KICK button on online PC
2. Watch confirmation dialog
3. Accept
4. Verify IP cleared

**Expected Results:**
- [ ] Confirmation dialog: "Are you sure you want to kick this client?"
- [ ] PC status: Online → Offline
- [ ] IP address: CLEARED (shows "Not assigned")
- [ ] "AUTO" badge disappears
- [ ] Next time user visits, they must select PC again

**Use Case:** New customer or security violation
- Completely removes IP mapping
- Forces new PC selection workflow

---

### TEST 13: Admin - MAINTENANCE Action (IP Required)

**Setup:** Have offline PC WITH IP address

**Steps:**
1. Find offline PC that has IP (e.g., PC-03)
2. Click MAINTENANCE button
3. Verify status change

**Expected Results:**
- [ ] PC status: Offline → Maintenance
- [ ] RED dot appears
- [ ] Action buttons change to [RESTORE]
- [ ] PC no longer available for new selections
- [ ] IP preserved (for future reference)

**Edge Case:** Offline PC without IP
- [ ] Button shows "No IP" text (disabled, clickable to show tooltip)
- [ ] MAINTENANCE action not available

---

### TEST 14: Admin - RESTORE PC

**Setup:** Have maintenance PC

**Steps:**
1. Find maintenance PC
2. Click RESTORE button
3. Verify status returns

**Expected Results:**
- [ ] PC status: Maintenance → Offline
- [ ] RED dot changes to GRAY
- [ ] Action buttons return to show MAINTENANCE (if has IP)
- [ ] PC becomes available for selection

---

### TEST 15: Real-Time Updates (Admin View)

**Setup:**
1. Open `/admin/pc-management` in one window
2. Open `/validate` in another window

**Steps:**
1. In validation window, request access for a PC
2. Watch admin dashboard instantly update
3. In admin window, click GRANT
4. Watch validation window auto-redirect

**Expected Results:**
- [ ] Pending PC appears in admin table within 1 second
- [ ] Status badge updates in real-time (no page refresh needed)
- [ ] Time column updates every second for online PCs
- [ ] Elapsed time calculation accurate (HH:MM:SS format)
- [ ] Admin action triggers instant updates in customer's browser

---

### TEST 16: Running Timer Accuracy

**Setup:** Have online PC with active session

**Steps:**
1. Note the TIME value in admin table
2. Wait 5 seconds
3. Observe timer incrementing
4. Wait another 25 seconds
5. Verify timer shows ~30 seconds total

**Expected Results:**
- [ ] Timer increments by 1 second every second
- [ ] Format: HH:MM:SS (e.g., 00:00:30)
- [ ] Accurate to within 1 second
- [ ] Resets on page reload
- [ ] Continues across table filter changes

---

### TEST 17: IP Display Formatting

**Steps:**
1. In admin dashboard, locate PC with IP
2. Examine IP address cell

**Expected Results:**
- [ ] IP shown in monospace font (e.g., `192.168.1.101`)
- [ ] Blue background (light blue: #e0f2fe area)
- [ ] Blue border (#06b6d4)
- [ ] "saved" label next to it in gray italic
- [ ] HIGH contrast for easy reading
- [ ] Copyable text (can select and copy)

**For PC without IP:**
- [ ] Shows "Not assigned"
- [ ] Gray text
- [ ] Italic style
- [ ] No background color

---

### TEST 18: AUTO Badge Display

**Steps:**
1. Find PC with ip_address NOT NULL
2. Check PC name cell

**Expected Results:**
- [ ] "AUTO" badge appears next to PC number
- [ ] Blue background
- [ ] White text
- [ ] Uppercase, letter-spaced
- [ ] Appears for all PCs with assigned IP

**For PC without IP:**
- [ ] No AUTO badge

---

### TEST 19: Tab Selection & Count Badges

**Steps:**
1. Count PCs per status manually
2. Click each filter tab
3. Verify count badges match actual count

**Expected Results:**
- [ ] Tab counts accurate:
  - All: total of all PCs
  - Online: count of status='online' only
  - Pending: count of status='pending' only
  - Offline: count of status='offline' only
  - Maintenance: count of status='maintenance' only
- [ ] Counts update in real-time
- [ ] Tab badge highlights when active

---

### TEST 20: Mobile Responsiveness

**Device:** Tablet or run with DevTools mobile view (375px - 768px)

**Steps:**
1. Open `/validate` on mobile
2. Test IP detection
3. Verify PC grid layout
4. Click PC card
5. Verify "Request Access" button
6. Test waiting screen

**Expected Results:**
- [ ] PC grid: 2-3 columns instead of 4-6
- [ ] Cards still clickable and responsive
- [ ] "Detecting..." screen uses full width
- [ ] IP info can be hidden/visible appropriately
- [ ] Buttons sized for touch (min 44px)

**Admin Dashboard on Mobile:**
1. Open `/admin/pc-management` on mobile
2. Scroll table horizontally if needed
3. Click action buttons

**Expected Results:**
- [ ] Table switches to card layout
- [ ] Each PC shows as a card instead of row
- [ ] Buttons stack vertically on card
- [ ] Filter tabs remain horizontal and scrollable
- [ ] Status indicators still visible

---

## 🔧 Database Verification Queries

Use these in Supabase SQL Editor to verify state:

**View All PCs:**
```sql
SELECT pc_number, ip_address, status, current_session_id, session_started_at FROM pcs ORDER BY pc_number;
```

**View All Sessions:**
```sql
SELECT 
  s.id,
  p.pc_number,
  s.ip_address,
  s.status,
  s.started_at,
  s.created_at
FROM sessions s
JOIN pcs p ON s.pc_id = p.id
ORDER BY s.created_at DESC;
```

**Check Pending Requests:**
```sql
SELECT p.pc_number, p.ip_address, p.status, s.id as session_id
FROM pcs p
JOIN sessions s ON p.current_session_id = s.id
WHERE p.status = 'pending';
```

**Verify Realtime Enabled:**
```sql
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
```

---

## 📊 Performance Testing

### Load Testing
- [ ] Open admin dashboard
- [ ] Have 100+ PCs (if possible)
- [ ] Verify table renders and scrolls smoothly
- [ ] Check for lag in filter tabs

### Realtime Stress Test
- [ ] Open multiple `/validate` windows
- [ ] Have multiple admins on admin dashboard
- [ ] All request access simultaneously
- [ ] Verify all updates arrive within 1 second

### Subscription Cleanup
- [ ] Monitor Supabase dashboard
- [ ] Check "Database" → "Subscriptions" tab
- [ ] Verify subscriptions clean up when components unmount
- [ ] No memory leaks from active subscriptions

---

## ❌ Error Handling Tests

### Test 1: Network Failure During IP Detection
**Steps:** Block network in DevTools, refresh page
**Expected:** Error message shown, retry button functional

### Test 2: Invalid Response from IP API
**Steps:** Mock API to return invalid JSON
**Expected:** Graceful error handling, user informed

### Test 3: Database Connection Lost
**Steps:** Turn off internet, make request
**Expected:** "Connection lost" or "Try again" option

### Test 4: Supabase Down
**Steps:** Use wrong URL/key, trigger error
**Expected:** Error logged to console, user sees message

### Test 5: Invalid PC ID
**Steps:** Manually pass invalid PC ID
**Expected:** Error handling, no crash

---

## ✅ Acceptance Criteria

### Customer Flow
- [ ] IP auto-detects on page load
- [ ] New IP → Shows PC selection
- [ ] Existing online IP → Auto-redirects
- [ ] Existing offline IP → Resume option
- [ ] Can request access
- [ ] Waiting screen shows correctly
- [ ] Auto-redirects on approval
- [ ] Handles denial gracefully

### Admin Flow
- [ ] All PCs displayed in real-time table
- [ ] Filters work correctly with counts
- [ ] Status indicators color-coded and animated
- [ ] Time column shows running timer for online
- [ ] All action buttons work:
  - [ ] GRANT (pending → online)
  - [ ] DENY (pending → offline)
  - [ ] END (online → offline, keep IP)
  - [ ] KICK (online → offline, clear IP)
  - [ ] MAINTENANCE (offline → maintenance)
  - [ ] RESTORE (maintenance → offline)
- [ ] Real-time updates arrive within 1 second
- [ ] Mobile responsive
- [ ] IP display formatted correctly
- [ ] AUTO badge appears

---

## 🐛 Known Limitations & Notes

1. **IP Detection**: Uses public API (ipify.org)
   - May fail behind corporate proxy
   - Consider server-side validation for production

2. **Timer Accuracy**: Based on client system clock
   - Not perfectly precise across timezone changes
   - Acceptable for ~±2 second margin

3. **Realtime Latency**: Depends on Supabase infrastructure
   - Typically 100-500ms for updates
   - Not suitable for <100ms requirements

4. **Mobile Safari**: May have issues with animated elements
   - Test on actual devices

---

## 🚀 Launch Checklist

Before going to production:

- [ ] All 20 test cases passed
- [ ] Database backup created
- [ ] RLS policies configured
- [ ] Rate limiting considered
- [ ] Error logging in place
- [ ] User documentation complete
- [ ] Admin trained on dashboard
- [ ] PC hardware verified and labeled
- [ ] Network routing configured
- [ ] Monitoring dashboard set up
- [ ] Rollback plan prepared

---

Created: March 1, 2026
Last Updated: [Current Date]
