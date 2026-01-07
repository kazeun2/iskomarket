# Priority Buyer System - Visual Guide

## Quick Reference for Sellers

This guide shows what Priority Buyer indicators look like across IskoMarket.

---

## 1. User Dashboard - Messages Tab

### Priority Buyer Message (Unread)
```
╔═══════════════════════════════════════════════════════════╗
║  🟠                                                        ║
║  MB  Maria Bendo  [👑 Priority]           2 hours ago     ║
║                                                            ║
║  Hi! Is the textbook still available?                     ║
║  I'm very interested!                                      ║
║                                                            ║
║  [New] ⚡ Priority buyer - faster response recommended    ║
║                                              [Reply 💬]   ║
╚═══════════════════════════════════════════════════════════╝
```
**Visual Indicators:**
- 🟠 **Orange gradient background** (from-orange-50/50 to-orange-100/50)
- 🔶 **Orange ring border** (2px ring-orange-400)
- 👑 **Priority badge** with crown icon
- ⚡ **Priority status text** in orange
- 🆕 **Orange "New" badge**
- 💬 **Orange-styled Reply button**

---

### Priority Buyer Message (Read)
```
╔═══════════════════════════════════════════════════════════╗
║  🟠                                                        ║
║  HP  Hazel Perez  [👑 Priority]           5 hours ago     ║
║                                                            ║
║  Can we meet at the library today?                        ║
║                                                            ║
║  ⚡ Priority buyer - faster response recommended          ║
║                                              [Reply 💬]   ║
╚═══════════════════════════════════════════════════════════╝
```
**Visual Indicators:**
- 🟠 **Light orange tint** (from-orange-50/30 to-orange-100/30)
- 🔸 **Orange border** (border-orange-200)
- 👑 **Priority badge** visible
- ⚡ **Priority status text**
- 💬 **Orange-styled Reply button**

---

### Regular Message (For Comparison)
```
╔═══════════════════════════════════════════════════════════╗
║                                                            ║
║  CM  Carlos Martinez                      1 day ago       ║
║                                                            ║
║  Still available?                                          ║
║                                                            ║
║                                              [Reply 💬]   ║
╚═══════════════════════════════════════════════════════════╝
```
**Visual Indicators:**
- ⚪ **Default background** (white/dark)
- ⚫ **Default border**
- ❌ **No Priority badge**
- ❌ **No priority status text**
- 💬 **Standard Reply button**

---

## 2. ChatModal (Active Conversation)

### Priority Buyer Chat
```
╔═══════════════════════════════════════════════════════════╗
║ 🟧🟧🟧🟧🟧🟧 ORANGE HEADER 🟧🟧🟧🟧🟧🟧                    ║
║  🟠 MB  Maria Bendo  [👑 Priority]               [✕]     ║
║         ⚡ Priority buyer - faster response expected       ║
╠═══════════════════════════════════════════════════════════╣
║  📦 Advanced Calculus Textbook - ₱1,200                   ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  Messages appear here...                                   ║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
```
**Visual Indicators:**
- 🟧 **Orange gradient header** (from-orange-600 via-orange-500 to-orange-600)
- 👑 **Priority badge** in header
- ⚡ **Priority status** as subtitle
- 🟠 **Orange avatar border**

---

### Regular Chat (For Comparison)
```
╔═══════════════════════════════════════════════════════════╗
║ 🟩🟩🟩🟩🟩🟩 GREEN HEADER 🟩🟩🟩🟩🟩🟩                     ║
║  ⚪ CM  Carlos Martinez                          [✕]     ║
║         Active now                                         ║
╠═══════════════════════════════════════════════════════════╣
║  📦 Scientific Calculator - ₱800                          ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  Messages appear here...                                   ║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
```
**Visual Indicators:**
- 🟩 **Green header** (standard IskoMarket green #007A33)
- ❌ **No Priority badge**
- ⚪ **Standard avatar**
- ℹ️ **"Active now" status**

---

## 3. Notifications

### Priority Buyer Message Notification
```
┌─────────────────────────────────────────────────────┐
│ 💬  New Message from Maria Bendo [Priority]        │
│     Hi! Is the textbook still available?            │
│     3 minutes ago                                   │
└─────────────────────────────────────────────────────┘
```
**Visual Indicators:**
- 🏷️ **Orange "Priority" badge** (small, no icon)
- 📧 **Appears in notifications list**

---

### Regular Message Notification (For Comparison)
```
┌─────────────────────────────────────────────────────┐
│ 💬  New Message from Carlos Martinez                │
│     Is this still available?                        │
│     10 minutes ago                                  │
└─────────────────────────────────────────────────────┘
```
**Visual Indicators:**
- ❌ **No Priority badge**
- 📧 **Standard notification styling**

---

## Color Palette

### Orange Gradient Shades

**Light Mode:**
- Primary Orange: `#f97316` (orange-500)
- Secondary Orange: `#ea580c` (orange-600)
- Light Background: `#fff7ed` (orange-50)
- Lighter Background: `#ffedd5` (orange-100)
- Border: `#fed7aa` (orange-200)
- Ring: `#fb923c` (orange-400)

**Dark Mode:**
- Background: `#431407` (orange-950/30)
- Secondary Background: `#7c2d12` (orange-900/30)
- Border: `#9a3412` (orange-800)
- Text: `#fdba74` (orange-300)
- Lighter Text: `#fb923c` (orange-400)

---

## Symbols Legend

- 🟠 = Orange avatar with ring
- 👑 = Priority crown icon
- ⚡ = Lightning bolt (fast response)
- 🆕 = New/Unread indicator
- 💬 = Message/Reply icon
- 🟧 = Orange gradient area
- 🟩 = Green standard area
- ⚪ = Standard/default avatar
- 🔶 = Orange ring border (strong)
- 🔸 = Orange border (subtle)
- ✕ = Close button
- 📦 = Product context
- 💬 = Message notification icon
- 🏷️ = Priority badge
- ❌ = Not present/absent

---

## Quick Identification Guide

### "Is this a Priority Buyer?" Checklist:

**Look for ANY of these:**
1. ✅ Orange-colored header, background, or card
2. ✅ Crown icon 👑 next to name
3. ✅ "Priority" or "Priority Buyer" badge
4. ✅ Orange ring around avatar
5. ✅ "⚡ Priority buyer - faster response expected/recommended" text

**If you see NONE of these:**
- ❌ This is a regular user (not Priority)

---

## Best Practices for Sellers

### When You See a Priority Buyer:

1. **Respond Quickly** ⏱️
   - Aim for response within 1-2 hours
   - Priority buyers are high-volume, active members
   - Faster response = better service reputation

2. **Be Professional** 💼
   - These are experienced buyers
   - Clear communication appreciated
   - Professional tone builds trust

3. **Be Prepared** 📋
   - Have product details ready
   - Know your availability for meetups
   - Have photos/condition info accessible

4. **Follow Through** ✅
   - If you commit, honor it
   - Priority buyers value reliability
   - Good transactions = repeat customers

### Benefits of Serving Priority Buyers:

✨ **High Transaction Success Rate**
- Top 5 Buyers complete most transactions
- Less likely to ghost or cancel
- Experienced marketplace users

💰 **Potential Repeat Business**
- Active buyers purchase frequently
- Building rapport = future sales
- Word-of-mouth recommendations

⭐ **Better Ratings**
- Tend to leave detailed, fair reviews
- Recognize good service
- Positive feedback helps your profile

---

## Mobile View Differences

### Compact Display on Mobile:

**Priority Message (Mobile):**
```
┌────────────────────────────┐
│ 🟠 MB  Maria [👑]          │
│        2h ago              │
│ Hi! Is the textbook...     │
│ [New] ⚡ Priority          │
│               [Reply 💬]   │
└────────────────────────────┘
```

**Changes from Desktop:**
- Shorter name display
- Stacked layout elements
- Truncated text with ellipsis
- Smaller badge size
- Same orange color scheme

---

## Accessibility Notes

### For Screen Reader Users:

Priority buyers are announced as:
> "Message from Maria Bendo, Priority Buyer. Message: Hi! Is the textbook still available? Received 2 hours ago. New message. Priority buyer - faster response recommended. Reply button."

### Color-Independent Indicators:

Even without seeing colors, Priority status is clear through:
- 👑 Crown icon
- "Priority" text label
- "Faster response expected/recommended" text
- Special status announcements

---

## Summary

Priority Buyers are **Top 5 Buyers of the Month** who get:
- 🟧 **Orange visual theme** across all messages
- 👑 **Crown icon and "Priority" badge**
- ⚡ **Special status text** encouraging faster responses
- 🎯 **Prominent visibility** to sellers

**Goal:** Reward active buyers and encourage excellent seller service!

---

**Last Updated:** October 25, 2025  
**System Version:** 1.0  
**Visual Theme:** Orange gradient with crown icons
