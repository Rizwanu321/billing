# Walk-in Return Validation Fix

## Date: 2025-11-30

## Issue
Return quantity validation was working for due customer returns but not for walk-in customer returns. Walk-in customers could return the same items multiple times, exceeding the original purchased quantity.

## Root Cause
The validation logic correctly checked `returnedQuantity` for all return types, but the update logic only ran for due customer returns:
```javascript
if (adjustmentType === "return_from_customer" && customer) {
  // Update invoice returnedQuantity
  // This only runs if customer exists (due customers)
}
```

For walk-in returns (no customer), the `returnedQuantity` field was never updated. This meant:
1. First return: `returnedQuantity = 0`, validation passes ✓
2. Second return of same items: `returnedQuantity` still `0`, validation passes ✓ (WRONG!)
3. Infinite returns possible...

## Solution
Added a separate block to update `returnedQuantity` for walk-in customer returns:

```javascript
// Handle walk-in customer returns (no customer link)
if (adjustmentType === "return_from_customer" && !customer && reference) {
  const walkInInvoice = await Invoice.findOne({
    invoiceNumber: reference,
    createdBy: req.user.userId,
  }).session(session);

  if (walkInInvoice) {
    // Update returnedQuantity for each returned item
    for (const adjustment of adjustments) {
      const itemIndex = walkInInvoice.items.findIndex(
        item => item.product.toString() === adjustment.productId
      );
      if (itemIndex !== -1) {
        walkInInvoice.items[itemIndex].returnedQuantity =
          (walkInInvoice.items[itemIndex].returnedQuantity || 0) + 
          Number(adjustment.quantity);
      }
    }
    await walkInInvoice.save({ session });
  }
}
```

## Flow
**Walk-in Return Process:**
1. **Validation**: Check if `returnQty + returnedQuantity <= originalQty` ✓
2. **Stock Update**: Increase product stock ✓
3. **Stock History**: Record the return ✓
4. **Invoice Update**: Update `returnedQuantity` for each item ✓ (NEW!)
5. **Commit**: Save all changes ✓

**Due Customer Return Process:**
1. **Validation**: Check quantities ✓
2. **Stock Update**: Increase product stock ✓
3. **Customer Balance**: Reduce customer's due amount ✓
4. **Transaction**: Create return transaction ✓
5. **Invoice Update**: Update `returnedQuantity` for each item ✓
6. **Commit**: Save all changes ✓

## Status
✅ Fixed - Both walk-in and due customer returns now properly track returned quantities and prevent over-returning.
