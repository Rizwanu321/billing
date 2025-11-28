# Customer Return - Reference Matching & Professional Tax Handling

## Overview
Enhanced the customer return workflow to intelligently handle invoice references (like `INV00109`) and provide professional tax transparency.

## Key Features Implemented

### 1. **Smart Reference Matching**
The system now connects the "Return Reference #" field from the main screen to the invoice selection process.

**Workflow**:
1. User enters `INV00109` in "Return Reference #" field
2. User selects customer
3. System **automatically searches** for invoice `INV00109` in that customer's history
4. If found:
   - Auto-selects the invoice
   - Shows success toast: "Invoice INV00109 matched from reference!"
   - Saves user time and ensures accuracy

### 2. **Professional Tax Handling**
Explicitly shows whether tax is used or not, handling both scenarios professionally.

**Scenario A: Invoice with Tax**
- **Invoice List**: Shows blue badge `Tax: ₹126.00`
- **Confirmation**: Shows calculated tax AND the effective rate
  ```
  Subtotal: ₹500.00
  Tax (18.0% rate): ₹90.00
  Total: ₹590.00
  ```

**Scenario B: Invoice without Tax**
- **Invoice List**: Shows gray badge `No Tax`
- **Confirmation**: Explicitly shows tax as 0
  ```
  Subtotal: ₹500.00
  Tax: ₹0.00
  Total: ₹500.00
  ```

### 3. **Enhanced Validation (Existing)**
The system continues to enforce:
- Product existence in invoice
- Quantity limits
- Full quantity warnings

## User Experience Example

**User Input**:
- Reference: `INV00109`
- Customer: John Doe

**System Action**:
1. Loads John Doe's invoices
2. Finds `INV00109`
3. Auto-selects it
4. Validates return products against `INV00109`
5. Calculates tax based on `INV00109`'s rate
6. Shows breakdown:
   ```
   Invoice: INV00109 (Matched)
   Tax Status: Applied (18%)
   Validation: Passed ✅
   ```

## Technical Implementation

### Reference Passing
- `StockAdjustment.jsx` passes `referenceNumber` prop to `CustomerReturnDialog`
- `CustomerReturnDialog.jsx` uses `initialReference` to filter invoices

### Tax Logic
- **Rate Calculation**: `(invoice.tax / invoice.subtotal) * 100`
- **Display**: Conditional rendering based on `invoice.tax > 0`
- **Visuals**: Blue/Gray badges for quick status recognition

## Benefits

1. **Speed**: No need to manually search for the invoice again
2. **Accuracy**: Ensures the return is linked to the *correct* invoice referenced
3. **Transparency**: Clear visibility on tax application
4. **Professionalism**: Handles tax/no-tax scenarios explicitly rather than hiding them

The system now professionally handles the specific request to "check tax is used or not" and validates against the provided reference number!
