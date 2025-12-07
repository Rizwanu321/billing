# Key Metrics Cards - Gross/Net Breakdown Enhancement

## Date: 2025-11-30

## Objective
Add gross/net value breakdown to the "Total Collected" and "Walk-in Sales" metric cards to make the return impact visible at a glance.

## Changes Made

### 1. Total Collected Card

**Before:**
```
┌─────────────────────────────────┐
│ Total Collected     ₹330.72     │
│ Net Cash In Hand                │
│ Walk-in sales + Credit payments │
└─────────────────────────────────┘
```

**After (with returns):**
```
┌─────────────────────────────────┐
│ Total Collected     ₹330.72     │
│ Net Cash In Hand                │
│ Gross ₹521.52 - Refunds ₹190.80│ ← Breakdown
└─────────────────────────────────┘
```

### 2. Walk-in Sales Card

**Before:**
```
┌─────────────────────────────────┐
│ Walk-in Sales       ₹521.52     │
│ Gross Sales Value               │
│ Total value of instant sales    │
└─────────────────────────────────┘
```

**After (with returns):**
```
┌─────────────────────────────────────┐
│ Walk-in Sales        ₹330.72       │ ← Now Net!
│ Net Sales Value                     │ ← Updated
│ Gross ₹521.52 - Returns ₹190.80    │ ← Breakdown
└─────────────────────────────────────┘
```

## Key Updates

### Walk-in Sales Card
1. **Value**: Changed from gross (₹521.52) to net (₹330.72) when returns exist
2. **Subtitle**: Changes from "Gross Sales Value" to "Net Sales Value" when returns exist
3. **Info**: Shows the calculation formula: "Gross ₹521.52 - Returns ₹190.80"

### Total Collected Card
1. **Value**: Already showed net (₹330.72)
2. **Info**: Now shows breakdown: "Gross ₹521.52 - Refunds ₹190.80"

## Logic

Both cards now use conditional rendering:

```javascript
// Walk-in Sales
value={enhancedMetrics?.totalRefunds > 0 
  ? formatCurrency(enhancedMetrics.instantCollection - enhancedMetrics.totalRefunds)
  : formatCurrency(enhancedMetrics.instantCollection)}

subtitle={enhancedMetrics?.totalRefunds > 0 
  ? "Net Sales Value" 
  : "Gross Sales Value"}

info={enhancedMetrics?.totalRefunds > 0 
  ? `Gross ${formatCurrency(enhancedMetrics.instantCollection)} - Returns ${formatCurrency(enhancedMetrics.totalRefunds)}`
  : "Total value of instant sales (before refunds)"}

// Total Collected
info={enhancedMetrics?.totalRefunds > 0 
  ? `Gross ${formatCurrency(enhancedMetrics.instantCollection)} - Refunds ${formatCurrency(enhancedMetrics.totalRefunds)}` 
  : "Walk-in sales + Credit payments (after cash refunds)"}
```

## Display Scenarios

### Scenario 1: With Returns (Today's Example)
```
┌────────────────────────────────────┐
│ 💰 Total Collected                 │
│    ₹330.72                         │
│    Net Cash In Hand                │
│    Gross ₹521.52 - Refunds ₹190.80│
│    ↑ 0% trend                      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ⚡ Walk-in Sales                   │
│    ₹330.72                         │
│    Net Sales Value                 │
│    Gross ₹521.52 - Returns ₹190.80│
│    ↓ 59.6% trend                   │
└────────────────────────────────────┘
```

### Scenario 2: No Returns
```
┌────────────────────────────────────┐
│ 💰 Total Collected                 │
│    ₹300.00                         │
│    Net Cash In Hand                │
│    Walk-in sales + Credit payments │
│    ↑ 12% trend                     │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ⚡ Walk-in Sales                   │
│    ₹300.00                         │
│    Gross Sales Value               │
│    Total value of instant sales    │
│    ↑ 12% trend                     │
└────────────────────────────────────┘
```

## User Benefits

1. **Immediate Visibility**: Gross → Returns → Net calc visible at a glance
2. **No Confusion**: Clear why "Walk-in Sales" is ₹330.72 not ₹521.52
3. **Consistency**: Matches the breakdown style used in other sections
4. **Professional**: Shows complete financial story in the Key Metrics
5. **Adaptive**: Only shows breakdown when returns exist (clean when no returns)

## Data Sources

- `enhancedMetrics.instantCollection`: Gross instant sales (₹521.52)
- `enhancedMetrics.totalRefunds`: Total cash refunds (₹190.80)
- `enhancedMetrics.totalCollected`: Net collected (₹330.72)

**Calculation:**
```
Net = Gross - Refunds
₹330.72 = ₹521.52 - ₹190.80
```

## File Changes

**File**: `client/src/components/revenue/RevenueDashboard.jsx`
**Lines**: ~946-971

## Related Enhancements

This completes the gross/net breakdown visibility across:
1. ✅ Sales Breakdown header (Gross → Returns → Net)
2. ✅ Sales Breakdown - Instant Sales card
3. ✅ Sales Breakdown - Due Sales card
4. ✅ Due Management section
5. ✅ **Key Metrics - Total Collected** (this enhancement)
6. ✅ **Key Metrics - Walk-in Sales** (this enhancement)

## Status
✅ Complete - Key metric cards now show professional gross/net breakdown when returns exist
