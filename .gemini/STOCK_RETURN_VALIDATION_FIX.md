# Stock Return Validation Fix (Update)

## Date: 2025-11-30

## Issue
Users were able to return products multiple times for the same invoice, potentially exceeding the original purchased quantity. There was no validation to check if the returned item was actually part of the invoice or if the quantity was valid.

## Solution

### 1. Schema Update
Updated `server/models/Invoice.js` to include a `returnedQuantity` field in the items array.
```javascript
items: [{
  // ...
  returnedQuantity: {
    type: Number,
    default: 0,
    min: [0, "Returned quantity cannot be negative"],
  }
}]
```

### 2. Backend Validation
Modified `server/routes/stock.js` (batch-adjust route) to implement strict validation:

**Pre-Validation Logic:**
- When `adjustmentType` is `return_from_customer` and an invoice reference is provided:
  1.  Fetches the target invoice.
  2.  Verifies that each returned item exists in the invoice.
  3.  Checks if `Current Return Qty + Previously Returned Qty <= Original Purchased Qty`.
  4.  Throws a descriptive error if validation fails (e.g., "Max returnable: 2").

**Update Logic:**
- Upon successful processing, updates the `returnedQuantity` for each item in the invoice document.

### 3. Error Handling Fix
- Fixed a `ReferenceError: type is not defined` by ensuring the variable `adjustmentType` is used consistently throughout the route handler.
- Updated the backend to send specific error messages (status 400) instead of generic 500 errors, ensuring the frontend displays the exact validation failure reason.

## User Impact
- **Prevents Fraud/Errors**: Users cannot return more items than they bought.
- **Accurate Tracking**: The system now knows exactly how many items from a specific invoice have been returned.
- **Better UX**: Clear error messages explain why a return is rejected (e.g., "Purchased: 5, Already Returned: 3. Max returnable: 2").

## Status
✅ Fixed - Robust validation prevents excessive returns.
