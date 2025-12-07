# Due Sales Outstanding Fix

## Date: 2025-11-30

## Issue
In the "Due Sales" section of the Sales Breakdown, the displayed values were inconsistent:

**Before:**
```
Due Sales: ₹178.08
Returned Items (Credit): -₹66.78
Net Due Sales: ₹111.30
Outstanding: ₹178.08  ← WRONG! Should be ₹111.30
```

The "Outstanding" amount showed the **gross** value (₹178.08) instead of the **net** value after returns (₹111.30).

## Root Cause
The "Outstanding" field was displaying:
```javascript
revenueData.comprehensiveBreakdown.sales.components.dueSales.currentOutstanding
```

This value comes from the backend and represents the gross outstanding amount **before** accounting for credit adjustments (returns from due customers).

## Solution
Updated the "Outstanding" calculation to subtract credit adjustments:

```javascript
// Net Outstanding = Gross Outstanding - Credit Adjustments
revenueData.comprehensiveBreakdown.sales.components.dueSales.currentOutstanding -
(enhancedMetrics?.totalDueReductions || 0)
```

## Result

**After Fix:**
```
Due Sales: ₹178.08
Returned Items (Credit): -₹66.78
Net Due Sales: ₹111.30
Outstanding: ₹111.30  ← CORRECT!
```

Now the display is **logically consistent**:
- Net Due Sales = Gross - Returns = ₹111.30
- Outstanding = ₹111.30 (matches Net Due Sales)
- Collected = ₹0.00

**Formula:**
```
Net Due Sales = Outstanding + Collected
₹111.30 = ₹111.30 + ₹0.00 ✓
```

## User Benefits

1. **Logical Consistency**: All numbers now tell the same story
2. **Clear Understanding**: Users can see the actual amount they need to collect
3. **Accurate Planning**: Outstanding reflects reality (net of returns)
4. **No Confusion**: Net Due Sales matches Outstanding when nothing is collected

## Example Scenarios

### Scenario 1: Current State (No Payments Yet)
```
Gross Due Sales: ₹178.08
Returns (Credit): -₹66.78
─────────────────────────
Net Due Sales: ₹111.30
Collected: ₹0.00
Outstanding: ₹111.30 ✓
```

### Scenario 2: After Partial Payment of ₹50
```
Gross Due Sales: ₹178.08
Returns (Credit): -₹66.78
─────────────────────────
Net Due Sales: ₹111.30
Collected: ₹50.00
Outstanding: ₹61.30 ✓
```

## Technical Details

**File**: `client/src/components/revenue/RevenueDashboard.jsx`
**Line**: ~1397

**Change**:
```diff
- revenueData.comprehensiveBreakdown.sales.components.dueSales.currentOutstanding
+ revenueData.comprehensiveBreakdown.sales.components.dueSales.currentOutstanding -
+ (enhancedMetrics?.totalDueReductions || 0)
```

**Variables Used**:
- `dueSales.currentOutstanding`: Gross outstanding from backend
- `enhancedMetrics.totalDueReductions`: Total credit adjustments (returns)

## Status
✅ Fixed - Outstanding now correctly reflects net amount after credit adjustments
