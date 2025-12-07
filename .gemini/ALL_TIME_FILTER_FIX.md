# All Time Filter Fix

## Date: 2025-11-30

## Issue
Clicking the "All Time" filter button resulted in no data being displayed.

## Root Cause
The `fetchAllData` function in `RevenueDashboard.jsx` had a validation check that returned early if `dateRange.startDate` was empty.
```javascript
if (!dateRange.startDate || !dateRange.endDate) {
  setLoading(false);
  return;
}
```
When "All Time" is selected, `startDate` is intentionally set to an empty string (to indicate no start limit), causing this check to fail and preventing the API call.

## Solution
Updated the validation logic to allow an empty `startDate` if the `selectedPeriod` is "all".

```javascript
if ((!dateRange.startDate || !dateRange.endDate) && selectedPeriod !== "all") {
  setLoading(false);
  return;
}
```

## Backend Handling
The backend (`server/routes/revenue.js`) correctly handles `period="all"` by ignoring the `startDate` query parameter and using the user's creation date (or epoch 0) as the start date. The frontend API utility (`client/src/api/revenue.js`) automatically omits empty parameters from the query string, so the request is formed correctly.

## Status
✅ Fixed - "All Time" filter now correctly triggers data fetching.
