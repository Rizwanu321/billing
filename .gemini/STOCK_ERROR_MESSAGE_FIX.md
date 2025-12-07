# Stock Adjustment Error Message Fix

## Date: 2025-11-30

## Issue
When a stock adjustment failed (e.g., due to return validation), the frontend displayed a generic "Error processing adjustments" message instead of the specific reason (e.g., "Max returnable quantity exceeded").

## Root Cause
The backend (`server/routes/stock.js`) was catching all errors and sending a hardcoded response:
```javascript
res.status(500).json({
  message: "Error processing adjustments", // Generic message
  error: error.message // Specific message hidden here
});
```
The frontend was configured to display the `message` field, so the specific error details were lost to the user.

## Solution
Updated the backend to send the specific error message as the primary `message` in the response, and changed the status code to 400 (Bad Request) which is more appropriate for validation errors.

```javascript
res.status(400).json({
  message: error.message || "Error processing adjustments",
  error: error.message,
});
```

## User Impact
- **Clear Feedback**: Users now see exactly why an adjustment failed.
- **Actionable Errors**: Messages like "Cannot return 5 items. Max returnable: 2" allow users to correct their input immediately.
- **Professional UX**: The toast notifications now provide meaningful context instead of generic failure notices.

## Status
✅ Fixed - Error messages are now specific and helpful.
