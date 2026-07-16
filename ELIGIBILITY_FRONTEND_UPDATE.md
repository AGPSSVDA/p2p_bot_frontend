# Frontend Eligibility Criteria Update

## Changes Made

### 1. **Updated Service Types** (`seller.service.ts`)
- Added `CriterionValue` interface to support `{ enabled: boolean, value: number | string }`
- Updated `EligibilityRules` interface to support both old (number) and new (CriterionValue) formats
- Backward compatible with existing data structures

### 2. **Updated AdDetailsModal Component** (`AdDetailsModal.tsx`)
Added toggle controls for each of the 11 eligibility criteria:

#### For each criterion:
- **Input field** - Set the threshold value
- **Checkbox** - Toggle on/off to enable/disable this criterion
- **Active label** - Visual indicator showing if criterion is active

#### Criteria with toggles:
1. Min 30-Day Trades
2. Min Completion Rate (%)
3. Max Avg Release Time (min)
4. Max Avg Pay Time (min)
5. Min Registered Days
6. Min First Trade Days
7. Min Trading Counterparty
8. Min All Trades Count
9. Min Buy Orders Count
10. Min Sell Orders Count
11. Required Trade Type

### 3. **Helper Functions** (AdDetailsModal.tsx)
```typescript
getCriterionValue(criterion) 
  // Returns the value from CriterionValue object or number

getCriterionEnabled(criterion)
  // Returns the enabled flag from CriterionValue object or true by default
```

### 4. **Data Flow**
```
Admin UI (Toggle + Value)
    ↓
updateEligibility() 
    ↓
{ enabled: boolean, value: number | string }
    ↓
API POST /api/seller/ads/:adNo
    ↓
Backend stores to database
    ↓
Binance API sync (only enabled criteria sent)
    ↓
Binance checks eligibility BEFORE order placement
```

## UI Layout

Each criterion is displayed as:
```
[Input Field]                   [✓ Active]
Min 30-Day Trades          (checkbox toggle)
─────────────────────────────────────────
```

## How Admin Uses It

1. **Open Ad Configuration** → Click Edit on any ad
2. **Scroll to Eligibility Criteria section**
3. **For each criterion:**
   - Enter the minimum/maximum threshold value
   - Check the "Active" checkbox to enable that criterion
   - Uncheck to disable (Binance won't enforce)
4. **Click Save**
5. Criteria are synced to Binance immediately

## Example Configuration

```
Admin wants to accept buyers with:
- At least 20 trades in last 30 days ✓ Active
- At least 90% completion rate ✓ Active
- Registered for at least 100 days ☐ Inactive (not checked)
- Any trade type ✓ Active
```

Result: Only 3 criteria are checked by Binance. Registered days requirement is skipped.

## API Request Example

```json
{
  "min_30day_trades_enabled": true,
  "min_30day_trades": 20,
  "min_30day_completion_rate_enabled": true,
  "min_30day_completion_rate": 90,
  "min_registered_days_enabled": false,
  "min_registered_days": 100,
  "min_first_trade_days_enabled": true,
  "min_first_trade_days": 100,
  "min_trading_counterparty_enabled": true,
  "min_trading_counterparty": 0,
  "min_all_trades_count_enabled": true,
  "min_all_trades_count": 0,
  "min_buy_orders_count_enabled": true,
  "min_buy_orders_count": 0,
  "min_sell_orders_count_enabled": true,
  "min_sell_orders_count": 0,
  "required_trade_type_enabled": true,
  "required_trade_type": "ANY"
}
```

## Testing

1. **Enable a criterion** - Set value and check Active
2. **Disable a criterion** - Uncheck Active (value doesn't matter)
3. **Save** - Should see no errors
4. **Refresh** - Toggles should persist

## Key Points

✅ Each criterion can be toggled on/off independently  
✅ Values are only used if criterion is enabled  
✅ Only enabled criteria are sent to Binance  
✅ Buyers see rejection only for enabled criteria  
✅ Admin has full control over which checks run  

## Files Updated

- `src/services/seller.service.ts` - Interface updates
- `src/components/seller/AdDetailsModal.tsx` - UI implementation

## Backward Compatibility

- Works with existing data (auto-converts number to {enabled: true, value: number})
- No breaking changes to API
- Existing configs will have all criteria enabled by default
