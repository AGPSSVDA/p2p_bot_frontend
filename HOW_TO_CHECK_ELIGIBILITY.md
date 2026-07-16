# How to Check Buyer Eligibility for Orders

## Option 1: Backend Terminal (Recommended)

### Check All Your Orders
```bash
cd c:\users\dell\my-projects\p2p-bot-backend-client-git
node CHECK_MY_ORDERS.js
```

यह command आपको show करेगा:
- सभी orders जो database में हैं
- हर order की buyer की details
- Buyer की metrics (trades, completion rate, etc)
- AD की requirements
- ✅ या ❌ eligibility status

### Check Real-Time Orders from Database
```bash
node check-orders-db.js
```

यह show करेगा:
- Database में सभी orders
- AD के हिसाब से grouped
- Buyer metrics

## Option 2: Frontend Modal

### 1. Go to Orders Page
```
Frontend → Seller Dashboard → Orders
```

### 2. Click on an Order
Order number पर click करें

### 3. Click "Check Eligibility"
Modal खुलेगा जो show करेगा:

```
┌─────────────────────────────┐
│ Eligibility Check Details   │
├─────────────────────────────┤
│ 👤 Buyer Information        │
│   ID: buyer_id              │
│   Nickname: buyer_name      │
│   KYC Name: (if available)  │
├─────────────────────────────┤
│ 📋 Ad Information           │
│   Ad No: 13900814235866...  │
│   Asset: USDT/INR          │
│   Classify: profession     │
├─────────────────────────────┤
│ 🎯 Eligibility Status       │
│   ✅ PASSED or ❌ FAILED    │
├─────────────────────────────┤
│ 📊 Eligibility Criteria     │
│   ✅ 30-Day Trades          │
│   ✅ Completion Rate        │
│   ❌ Avg Release Time       │
│   (... 10 criteria total)   │
├─────────────────────────────┤
│ 📈 Buyer Metrics Table      │
│   (all 9 metrics)          │
└─────────────────────────────┘
```

## What Each Eligibility Criterion Means

### ✅ PASSED Criteria
- **30-Day Trades**: Buyer ने पिछले 30 दिनों में काफी trades किए हैं
- **Completion Rate**: Buyer के trades ज्यादातर successful हैं
- **Max Release Time**: Buyer आमतौर पर जल्दी crypto release करता है
- **Max Pay Time**: Buyer आमतौर पर जल्दी payment करता है
- **Registered Days**: Buyer का account पुराना है
- **Trading Counterparties**: Buyer ने बहुत सारे लोगों के साथ trade किया है
- **Min All Trades Count**: Buyer के कुल trades की संख्या अच्छी है

### ❌ FAILED Criteria
कोई भी criteria fail हो जाए तो:
- Buyer को additional verification की जरूरत है (जैसे KYC)
- या buyer इस AD पर order नहीं दे सकता

## Real Order Workflow

जब कोई buyer Binance पर आपके AD पर order place करता है:

1. **Order Sync** (Automatic)
   ```
   Polling हर 5-10 सेकंड में Binance को check करता है
   Order मिलने पर database में save होता है
   ```

2. **Buyer Metrics Fetch** (Automatic)
   ```
   Buyer की Binance profile से metrics fetch होते हैं:
   - 30-day trades
   - completion rate
   - registration date
   - average times
   - order counts
   ```

3. **Eligibility Check** (Automatic या Manual)
   ```
   Metrics को AD requirements से compare करते हैं
   Pass/Fail status database में save होती है
   ```

4. **Frontend Display**
   ```
   Modal में detailed results दिखते हैं
   Admin decide कर सकता है next step क्या करना है
   ```

## Database Inspection (Advanced)

### Check Order in Database
```bash
node -e "
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'agpssvda'
});

(async () => {
  const conn = await pool.getConnection();
  const [orders] = await conn.query(
    'SELECT order_number, buyer_id, buyer_nickname, ad_no, current_state FROM seller_orders ORDER BY created_at DESC LIMIT 10'
  );
  console.table(orders);
  conn.release();
  pool.end();
})();
"
```

### Check Buyer Metrics
```bash
node -e "
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'agpssvda'
});

(async () => {
  const conn = await pool.getConnection();
  const buyerId = 'your_buyer_id'; // Replace with actual buyer ID
  const [metrics] = await conn.query(
    'SELECT * FROM seller_buyer_metrics WHERE buyer_id = ?',
    [buyerId]
  );
  console.table(metrics);
  conn.release();
  pool.end();
})();
"
```

## API Call (For Integration)

### Get Eligibility Check Details
```bash
curl -H "Authorization: Bearer your_token" \
  http://localhost:5000/api/seller/orders/ORDER_NUMBER/eligibility-check
```

Response:
```json
{
  "success": true,
  "data": {
    "orderNo": "order_number",
    "buyer": {
      "id": "buyer_id",
      "nickname": "buyer_nickname",
      "kycName": "KYC Name"
    },
    "eligibility": {
      "passed": true,
      "checkedAt": "2026-07-07T18:30:00Z"
    },
    "criteria": [
      {
        "criterion": "30-Day Trades",
        "required": 20,
        "actual": 50,
        "passed": true
      },
      // ... 10 criteria total
    ],
    "buyerMetrics": {
      "trades30Day": 50,
      "completionRate": 99.5,
      "registeredDays": 250,
      // ... all metrics
    }
  }
}
```

## Troubleshooting

### ❌ "Buyer metrics not found"
```
→ Order अभी database में sync नहीं हुआ
→ Polling को कुछ समय दें
→ node CHECK_MY_ORDERS.js फिर से run करें
```

### ❌ "AD rules not found"
```
→ AD के लिए eligibility rules set नहीं किए गए हैं
→ Frontend पर जाएं → AD Details → Eligibility Rules configure करें
```

### ❌ "Eligibility: PENDING"
```
→ Check अभी run नहीं हुआ
→ System को कुछ समय दें (polling हर 5-10 sec में run होता है)
→ या manually refresh करें
```

## Summary

| Task | Command | Output |
|------|---------|--------|
| Check all orders | `node CHECK_MY_ORDERS.js` | Terminal में सभी details |
| Check specific buyer | `node -e "SELECT * FROM seller_buyer_metrics..."` | Buyer की metrics |
| Frontend check | Click order → "Check Eligibility" | Beautiful modal |
| API call | `curl /api/seller/orders/:orderNo/eligibility-check` | JSON response |

Happy checking! 🎉
