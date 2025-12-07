# Sales Breakdown - Net Sales Emphasis

## Date: 2025-11-30

## Objective
Visually emphasize the **Net Sales** value in the "Instant Sales" and "Due Sales" cards within the Sales Breakdown section, making it the focal point when returns exist.

## Changes Made

### 1. Instant Sales Card
**Condition**: When `totalRefunds > 0`

**Before:**
- Gross Sales: `text-2xl font-bold` (Prominent)
- Net Sales: `font-bold` (Standard size)

**After:**
- Gross Sales: `text-lg font-semibold text-emerald-600/70` (Smaller, lighter)
- Net Sales: `text-2xl font-bold text-emerald-800` (Prominent, darker)

### 2. Due Sales Card
**Condition**: When `totalDueReductions > 0`

**Before:**
- Gross Sales: `text-2xl font-bold` (Prominent)
- Net Sales: `font-bold` (Standard size)

**After:**
- Gross Sales: `text-lg font-semibold text-orange-600/70` (Smaller, lighter)
- Net Sales: `text-2xl font-bold text-orange-800` (Prominent, darker)

## Visual Hierarchy Shift

This change shifts the user's attention from the Gross amount to the **Net amount**, which represents the actual realized revenue.

**Example (Instant Sales):**
```
┌─────────────────────────────────────┐
│ ⚡ Instant Sales                    │
│    ₹132.30                          │ (Smaller, lighter)
│                                     │
│    Returned Items       -₹44.10     │
│    ─────────────────────────────    │
│    Net Instant Sales    ₹88.20      │ (LARGE, DARK, BOLD)
└─────────────────────────────────────┘
```

## User Benefits

1. **Focus on Reality**: Users immediately see the actual money earned (Net), not just the theoretical sales (Gross).
2. **Clear Hierarchy**: The visual weight correctly reflects the importance of the metrics.
3. **Consistent Logic**: Matches the "Net Revenue" emphasis in other parts of the dashboard.
4. **Adaptive Design**: If there are no returns, the top value remains large (as Gross = Net).

## Status
✅ Complete - Net Sales values are now visually dominant in the Sales Breakdown cards.
