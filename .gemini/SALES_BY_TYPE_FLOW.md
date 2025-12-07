# Sales by Type - Net Sales Flow Enhancement

## Date: 2025-11-30

## Objective
Restructure the "Sales by Type" cards (Cash, Due/Credit, etc.) to follow a logical accounting flow: Gross → Deductions → Net. This ensures consistency with the rest of the dashboard and emphasizes the actual realized revenue.

## Changes Made

### 1. Restructured Layout
**Before:**
1. Total Sales (Gross)
2. Payments Received
3. Total Collected
4. Less Refunds/Adjustments (at bottom)

**After:**
1. **Gross Sales** (Lighter text)
2. **Less: Refunds/Adjustments** (if any)
3. **Net Sales** (Bold, if deductions exist)
4. Payments Received (if any)
5. Total Collected
6. Total Outstanding

### 2. Visual Hierarchy
- **Gross Sales**: `text-slate-500` (Subtle)
- **Deductions**: `text-rose-600` / `text-amber-600` (Clear negative indicators)
- **Net Sales**: `font-bold text-slate-800` (Prominent intermediate total)
- **Collected/Outstanding**: `font-bold` (Final status)

### 3. Example: Due/Credit Card

**Scenario:**
- Gross Credit Sales: ₹63.00
- Returns: ₹29.40
- Payments: ₹100.00

**New Display:**
```
┌─────────────────────────────────────┐
│ 💳 Due/Credit                       │
│                                     │
│    Gross Sales           ₹63.00     │
│    Less Credit Adj.     -₹29.40     │
│    ─────────────────────────────    │
│    Net Sales             ₹33.60     │ (Bold)
│                                     │
│    Payments Received     ₹100.00    │
│    Total Collected       ₹100.00    │
│    Total Outstanding     -₹66.40    │
└─────────────────────────────────────┘
```

## User Benefits

1. **Logical Flow**: Users can follow the math from top to bottom.
2. **Net Visibility**: "Net Sales" is explicitly calculated and shown.
3. **Consistency**: Matches the "Gross → Returns → Net" pattern used in Sales Breakdown and Key Metrics.
4. **Clarity**: No more hunting for refund amounts at the bottom of the card.

## Status
✅ Complete - Sales by Type section now features a professional, accounting-standard layout with clear Net Sales visibility.
