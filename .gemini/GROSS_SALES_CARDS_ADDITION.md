# Key Metrics - Gross Sales Cards Addition

## Date: 2025-11-30

## Objective
Add explicit "Gross Sales" cards for Walk-in and Credit sales when returns exist, to provide a clear side-by-side comparison of Gross vs Net values in the Key Metrics section.

## Changes Made

### 1. Walk-in Sales
**Condition**: Only when `totalRefunds > 0`

**New Card Added:**
```
┌─────────────────────────────────────┐
│ ⚡ Gross Walk-in Sales              │
│    ₹521.52                          │
│    Before Refunds                   │
│    Total value before deducting...  │
└─────────────────────────────────────┘
```

**Existing Card Updated:**
```
┌─────────────────────────────────────┐
│ ⚡ Net Walk-in Sales                │ ← Title Updated
│    ₹330.72                          │
│    After Refunds                    │ ← Subtitle Updated
│    Gross ₹521.52 - Returns ₹190.80 │
└─────────────────────────────────────┘
```

### 2. Credit Sales
**Condition**: Only when `totalDueReductions > 0`

**New Card Added:**
```
┌─────────────────────────────────────┐
│ 🕒 Gross Credit Sales               │
│    ₹178.08                          │
│    Before Returns                   │
│    Total credit sales before...     │
└─────────────────────────────────────┘
```

**Existing Card Updated:**
```
┌─────────────────────────────────────┐
│ 🕒 Net Credit Sales                 │ ← Title Updated
│    ₹111.30                          │
│    After Returns                    │ ← Subtitle Updated
│    Gross ₹178.08 - Returns ₹66.78  │
└─────────────────────────────────────┘
```

## Logic Flow

1. **Check for Returns**: The dashboard checks if there are any cash refunds or credit adjustments.
2. **Conditional Rendering**:
   - If **Yes**: It renders the "Gross" card first (lighter shade), then the "Net" card (standard shade).
   - If **No**: It renders only the standard card (Gross = Net).
3. **Visual Cues**:
   - Gross cards use lighter shades (`bg-indigo-400`, `bg-orange-400`)
   - Net cards use standard shades (`bg-indigo-500`, `bg-orange-500`)
   - Titles explicitly say "Gross" and "Net" to avoid confusion.

## User Benefits

1. **Side-by-Side Comparison**: Users can see Gross and Net values next to each other.
2. **Explicit Clarity**: No mental math needed; both numbers are presented as primary metrics.
3. **Adaptive Layout**: The dashboard adapts to the data—if there are no returns, it stays simple. If there are returns, it provides the necessary detail.
4. **Professional Presentation**: Clear labeling ("Before Refunds", "After Refunds") guides the user.

## Status
✅ Complete - Gross Sales cards added and Net Sales cards updated for maximum clarity.
