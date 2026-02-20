# Posta — PayPal Payment Integration Spec

> Status: Design / Pre-implementation
> Testing environment: PayPal Sandbox
> Target market: Latin America (Argentina primary)

---

## 1. Overview

This document defines the architecture and requirements for integrating real-money payment rails into Posta via PayPal. The scope includes:

- **KYC** — identity and age verification before a user can deposit or withdraw real money
- **Deposits** — funding a Posta wallet from a PayPal account or linked card/bank
- **Withdrawals** — returning net winnings to a user's PayPal account
- **Fee disclosure** — transparent 7% platform fee on all winnings
- **Market resolution & settlement** — the end-to-end lifecycle of a real-money prediction market
- **Support channel** — how users get help with payment issues

---

## 2. KYC — Know Your Customer

### 2.1 Why KYC is Required

Operating a real-money prediction/betting platform requires compliance with:
- **AML** (Anti-Money Laundering) regulations
- **Age verification** (18+ only)
- **Identity verification** to prevent fraud and duplicate accounts
- PayPal's own requirements for merchant accounts handling payouts

### 2.2 KYC Provider (Recommended: Persona)

Use **[Persona](https://withpersona.com)** (persona.com) as the KYC vendor. It supports LATAM ID documents, has a React Native SDK, and provides a webhook API compatible with our existing Firebase Cloud Functions pattern.

Alternatives: Jumio, Onfido, Stripe Identity.

### 2.3 KYC Flow

```
User taps "Add Real Money" or "Withdraw"
        │
        ▼
KYC status check (Firestore: user.kycStatus)
        │
   ┌────┴──────────────┐
   │                   │
"not_started"      "approved"
   │                   │
   ▼               Proceed to deposit/withdraw
Open Persona SDK
(government ID + selfie liveness check)
        │
        ▼
Persona webhook → Cloud Function: onKycEvent
        │
   ┌────┴───────────────────┐
   │                        │
"approved"             "declined" / "needs_review"
   │                        │
Update Firestore        Notify user, block real money
user.kycStatus = "approved"
user.kycCompletedAt = Timestamp
user.kycInquiryId = <persona inquiry id>
```

### 2.4 Firestore Schema Changes — User Document

Add to the `User` interface in `firebase/types/firestore.types.ts`:

```typescript
// KYC
kycStatus: 'not_started' | 'pending' | 'approved' | 'declined' | 'needs_review';
kycCompletedAt?: Timestamp;
kycInquiryId?: string;           // Persona inquiry ID for audit trail

// Real money wallet (separate from virtualBalance)
realBalance: number;             // Real money in cents (USD)
realBalanceCurrency: 'USD';      // Always USD for PayPal

// PayPal
paypalEmail?: string;            // Verified PayPal email for payouts
paypalPayerId?: string;          // PayPal Payer ID from first successful deposit
```

### 2.5 KYC Rules

- KYC required before first deposit or first withdrawal
- KYC approval is permanent (no re-verification unless flagged)
- Declined users are blocked from real money features; a human review flag is set
- Age must be ≥ 18 at `dateOfBirth`; enforce server-side in the deposit Cloud Function

---

## 3. Deposits — Funding the Wallet

### 3.1 Technology: PayPal Orders API v2

Use the **PayPal REST Orders API (v2)** with the PayPal Sandbox for all testing. This allows users to pay via their PayPal balance, linked bank account, or credit/debit card.

**PayPal Sandbox credentials:**
- Create a sandbox app at developer.paypal.com
- Store `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in Firebase environment config (not in source)
- Sandbox base URL: `https://api-m.sandbox.paypal.com`

### 3.2 Deposit Flow

```
User selects deposit amount (e.g. $10, $25, $50, $100)
        │
        ▼
App calls Cloud Function: createPayPalOrder(amount)
        │
        ▼
Cloud Function → PayPal Orders API: POST /v2/checkout/orders
  { intent: "CAPTURE", amount: { currency_code: "USD", value: "10.00" } }
        │
        ▼
Returns { orderId, approvalUrl }
        │
        ▼
App opens PayPal approval URL in WebBrowser (Expo WebBrowser)
        │
        ▼
User approves in PayPal UI (sandbox: test buyer account)
        │
        ▼
PayPal redirects to app deep link: posta://payment/success?token=ORDER_ID
        │
        ▼
App calls Cloud Function: capturePayPalOrder(orderId)
        │
        ▼
Cloud Function → PayPal: POST /v2/checkout/orders/{orderId}/capture
        │
        ▼
On success: Firestore transaction
  - user.realBalance += amount (in cents)
  - transactions/{id}: { type: "paypal_deposit", amount, orderId, status: "completed" }
        │
        ▼
App shows success state, balance updates in real-time via Firestore subscription
```

### 3.3 Deposit Amounts (Initial)

| Label | USD Amount |
|-------|-----------|
| Starter | $5.00 |
| Standard | $10.00 |
| Popular | $25.00 |
| High Roller | $50.00 |
| Custom | $5 – $500 (text input) |

Minimum deposit: **$5.00**. Maximum: **$500.00** per transaction (configurable via Firestore remote config).

### 3.4 Idempotency

Each `capturePayPalOrder` call checks if the `orderId` already exists in Firestore before processing. This prevents double-crediting if the user taps the capture button twice or the network retries.

### 3.5 Error Handling

| Scenario | Behavior |
|----------|----------|
| User closes PayPal without approving | App shows "Deposit cancelled" — no funds moved |
| PayPal capture fails | Show error, do NOT credit balance, log to Firestore errors collection |
| Network timeout on capture | Retry once; if still failing, queue for manual review |
| Duplicate orderId | Return success (idempotent), do not double-credit |

---

## 4. Withdrawals — Real Funds Back to Users

### 4.1 Technology: PayPal Payouts API

Use **PayPal Payouts API** to send funds from the Posta merchant account to a user's PayPal email. This is a server-to-server call — the user never needs to re-authenticate for payouts.

**Requirement:** The PayPal Business account must have Payouts enabled (Sandbox: automatically enabled for sandbox merchant accounts).

### 4.2 Withdrawal Flow

```
User taps "Withdraw" → enters amount + confirms PayPal email
        │
        ▼
Client-side validation:
  - amount ≤ user.realBalance
  - amount ≥ $5.00 minimum
  - KYC status === "approved"
  - user.paypalEmail set and verified
        │
        ▼
App calls Cloud Function: requestWithdrawal(amount, paypalEmail)
        │
        ▼
Cloud Function (atomic Firestore transaction):
  1. Re-validate balance server-side
  2. Deduct amount from user.realBalance (hold it)
  3. Create withdrawalRequests/{id}: { status: "processing", amount, paypalEmail, createdAt }
        │
        ▼
Cloud Function → PayPal Payouts API:
  POST /v1/payments/payouts
  {
    sender_batch_header: { batch_id, email_subject: "Your Posta withdrawal" },
    items: [{ receiver: paypalEmail, amount: { value, currency: "USD" }, note: "Posta winnings" }]
  }
        │
        ▼
PayPal returns payout_batch_id
Update withdrawalRequests/{id}: { status: "sent", payoutBatchId }
        │
        ▼
PayPal Webhook → Cloud Function: onPayPalWebhook
  Event: PAYMENT.PAYOUTSBATCH.SUCCESS or PAYMENT.PAYOUTSBATCH.DENIED
        │
   ┌────┴──────────────────────────┐
   │                               │
SUCCESS                          DENIED / FAILED
   │                               │
Update: status: "completed"     Refund user.realBalance
Notify user: "Withdrawal sent"  Update: status: "failed"
                                Notify user: "Withdrawal failed, funds returned"
```

### 4.3 Withdrawal Constraints

| Rule | Value |
|------|-------|
| Minimum withdrawal | $5.00 |
| Maximum per day | $500.00 (anti-fraud) |
| Processing time | 1–3 business days (sandbox: instant) |
| KYC required | Yes — must be approved |
| Identity match | PayPal email must match KYC name (manual spot-check initially) |

### 4.4 Withdrawal Request Schema (New Collection)

```typescript
// Firestore: withdrawalRequests/{requestId}
interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;               // In cents
  paypalEmail: string;
  status: 'processing' | 'sent' | 'completed' | 'failed' | 'refunded';
  payoutBatchId?: string;       // From PayPal
  createdAt: Timestamp;
  completedAt?: Timestamp;
  failureReason?: string;
}
```

---

## 5. Fee Disclosure — 7% Platform Fee

### 5.1 Fee Structure

Posta charges a **7% platform fee on winnings profit**. The fee is deducted at settlement time, not at bet placement.

**Formula: fee on profit only (industry standard)**
- Fee = (grossWinnings − stake) × 0.07
- Net payout = grossWinnings − fee

**Example:**
- User bets $10.00, wins $20.00 gross
- Profit = $20.00 − $10.00 = $10.00
- Fee = $10.00 × 7% = $0.70
- Net payout credited to wallet = **$19.30**

The original stake is never subject to the fee — only the profit portion.

### 5.2 Where Fee Is Disclosed

1. **Bet confirmation modal** (`BetModal.tsx`) — show fee estimate and net payout before confirming
2. **Terms of Service** — explicit section on fee structure with worked example
3. **Activity screen** — show gross winnings, fee taken, and net credited for each settled bet
4. **Help & FAQ** — dedicated FAQ entry explaining the 7% fee

### 5.3 Fee Fields in Transaction Records

Extend the existing transaction schema:

```typescript
interface Transaction {
  // ... existing fields ...
  grossAmount?: number;     // Gross payout before fee (win transactions only)
  feeAmount?: number;       // Fee deducted (7% of profit)
  netAmount: number;        // Amount actually credited to balance
}
```

### 5.4 Fee Destination

The 7% fee is retained in the Posta merchant PayPal account as platform revenue. Log fee amounts in a `platformRevenue` Firestore collection for accounting and auditing.

```typescript
// Firestore: platformRevenue/{revenueId}
interface PlatformRevenue {
  marketId: string;
  userId: string;
  betId: string;
  feeAmount: number;        // In cents
  settledAt: Timestamp;
}
```

---

## 6. Market Resolution & Settlement

### 6.1 What is Market Resolution?

A **market** in Posta is a binary prediction question tied to a real-world sports event (e.g., "Will Argentina win vs. Brazil?"). Users wager real money on one of two outcomes: **Sí** (Yes) or **No**.

**Market resolution** is the act of an admin determining the correct outcome after the real-world event concludes. **Settlement** is the automated process that follows: every open bet is evaluated against the resolved outcome, winners are credited their net payout, losers forfeit their stake, and the platform retains its 7% fee.

Until a market is resolved, all user funds staked on it are held (the balance is debited at bet time). Settlement is the event that converts those held funds into either a payout or a confirmed loss.

### 6.2 Full Settlement Lifecycle

```
[Real-world event concludes]
        │
        ▼
Admin opens Admin Dashboard → Settlement page
Admin selects market → selects winning outcome (Sí / No)
        │
        ▼
Admin calls Cloud Function: settleMarket(marketId, winningOutcome)
        │
        ▼
Cloud Function iterates all pending bets for this market:

  ┌─ Bet side === winningOutcome ──────────────────→ WINNER
  │     grossPayout = bet.potentialWin
  │     fee = (grossPayout − bet.amount) × 0.07
  │     netPayout = grossPayout − fee
  │     user.realBalance += netPayout          ← atomic Firestore transaction
  │     Create transaction: {
  │       type: "bet_won_real",
  │       grossAmount: grossPayout,
  │       feeAmount: fee,
  │       netAmount: netPayout
  │     }
  │     Create platformRevenue/{id}: { feeAmount, marketId, userId, settledAt }
  │
  ├─ Bet side !== winningOutcome ─────────────────→ LOSER
  │     user.realBalance unchanged (already debited at bet placement)
  │     Create transaction: { type: "bet_lost_real", amount: bet.amount }
  │
  └─ Market voided/cancelled by admin ───────────→ REFUND
        user.realBalance += bet.amount           ← full stake returned, no fee
        Create transaction: { type: "bet_refunded_real", amount: bet.amount }

        │
        ▼
market.status = "settled"
market.winningOutcome = winningOutcome
market.settledAt = Timestamp
        │
        ▼
Push notifications dispatched to all bettors:
  Winners:  "Ganaste $X.XX en [market name] (comisión 7% aplicada)"
  Losers:   "Mercado cerrado — ¡mejor suerte la próxima!"
  Refunded: "Tu apuesta de $X.XX fue reembolsada"
```

### 6.3 Odds & Payout Calculation

Posta uses a **parimutuel pool model** — odds emerge dynamically from the volume of money on each side:

```
totalPool   = totalSiVolume + totalNoVolume
oddsSi      = totalPool / totalSiVolume
oddsNo      = totalPool / totalNoVolume

potentialWin = bet.amount × oddsForChosenSide
```

Odds update in real-time as bets come in. The `potentialWin` displayed in the UI is an estimate at the time of viewing; the **final locked value** is recorded in the `userBets` document at the moment the bet is confirmed. Settlement uses the locked value, not a recalculated one.

### 6.4 Settlement Edge Cases

| Scenario | Handling |
|----------|----------|
| No bets on winning side | Refund all bets — market voided |
| Admin resolves to wrong outcome | Admin triggers `unsettleMarket` (new admin function) + creates reversal transactions; requires manual review |
| User account deleted before settlement | Funds held; support contacts user or holds in escrow |
| Market expires without admin settling | Cloud Scheduler auto-voids after 48h; all bets refunded |

### 6.5 Real Money Escrow During Active Markets

When a real money bet is placed:
- `user.realBalance` is **immediately debited**
- Those funds are logically escrowed in the Posta merchant PayPal account until settlement
- No separate third-party escrow account is required at MVP stage
- This prevents double-spending: users cannot withdraw funds staked on live markets

---

## 7. Support Channel

### 7.1 In-App Support Entry Point

Add a **Help & Support** section to `SettingsScreen.tsx`:

```
Settings
  └── Help & Support
        ├── Payment Issues       → Pre-filled email form (mailto)
        ├── Withdrawal Status    → Screen showing withdrawalRequests for this user
        ├── Dispute a Bet        → Email form pre-filled with bet details
        └── FAQ                  → Static FAQ screen (common payment questions)
```

### 7.2 Support Tiers

| Issue Type | Channel | SLA Target |
|-----------|---------|------------|
| Deposit not credited | In-app form → `checkDepositStatus` Cloud Function auto-check | 24h |
| Withdrawal delayed | Email → admin reviews PayPal payout batch | 48h |
| KYC declined | Email → human review | 72h |
| Disputed settlement | Email + admin reviews Firestore bet records | 72h |
| General / other | Email | 5 business days |

### 7.3 Support Email

Dedicated address: **support@posta.app**

Wire the in-app contact form to send structured emails to this address via the Firebase **Trigger Email** extension or SendGrid. Include userId, issue type, and relevant transaction IDs in the email body automatically.

### 7.4 Admin Support View (Admin Dashboard additions)

Add to `admin/src/pages/`:

- **UsersPage** — search by email; view KYC status, `realBalance`, and recent transactions
- **WithdrawalRequests** — list all requests by status; manual retry button for failed payouts
- **TransactionAuditLog** — searchable, filterable log of all real-money transactions per user

### 7.5 Automated Support Cloud Functions

| Function | Access | Action |
|---------|--------|--------|
| `checkDepositStatus` | User-callable | Re-queries PayPal order; re-credits balance if capture succeeded but webhook missed |
| `retryWithdrawal` | Admin-only | Re-attempts a failed payout with the same `withdrawalRequestId` |
| `refundDeposit` | Admin-only | Issues a PayPal refund for a captured order (e.g., deposit made by mistake) |

---

## 8. Firestore Schema Summary

### User Document — additions

```typescript
// KYC
kycStatus: 'not_started' | 'pending' | 'approved' | 'declined' | 'needs_review';
kycCompletedAt?: Timestamp;
kycInquiryId?: string;

// Real money wallet
realBalance: number;             // In cents (USD), separate from virtualBalance
realBalanceCurrency: 'USD';

// PayPal identity
paypalEmail?: string;
paypalPayerId?: string;
```

### New Collections

```
withdrawalRequests/{requestId}   — one doc per withdrawal attempt
platformRevenue/{revenueId}      — one doc per fee collected at settlement
kycEvents/{eventId}              — raw Persona webhook payloads (audit trail)
```

### Transaction Type Additions

```
paypal_deposit        — real money deposited via PayPal
paypal_withdrawal     — withdrawal initiated
withdrawal_refund     — failed withdrawal funds returned to balance
bet_won_real          — real money win (has grossAmount, feeAmount, netAmount)
bet_lost_real         — real money loss
bet_refunded_real     — stake returned on market void
```

---

## 9. Cloud Functions Summary

### New Functions

| Function | Export Type | Description |
|---------|-------------|-------------|
| `createPayPalOrder` | `onCall` | Creates a PayPal order; returns `{ orderId, approvalUrl }` |
| `capturePayPalOrder` | `onCall` | Captures an approved order; credits `realBalance` |
| `onPayPalWebhook` | `onRequest` | Receives PayPal webhook events; handles payout success/failure |
| `requestWithdrawal` | `onCall` | Validates, debits balance, initiates PayPal payout |
| `onKycEvent` | `onRequest` | Receives Persona webhook; updates `kycStatus` |
| `checkDepositStatus` | `onCall` | Support helper — re-queries PayPal order and re-credits if needed |
| `retryWithdrawal` | `onCall` (admin) | Retries a failed withdrawal payout |
| `refundDeposit` | `onCall` (admin) | Refunds a captured PayPal order |

### Modified Functions

| Function | File | Change |
|---------|------|--------|
| `settleMarket` | `firebase/functions/src/bets/settleBets.ts` | Apply 7% fee on profit; credit `realBalance` for real-money bets; write to `platformRevenue` |

---

## 10. Environment Variables

Add to Firebase Functions config (never commit these):

```
PAYPAL_CLIENT_ID=<sandbox app client id>
PAYPAL_CLIENT_SECRET=<sandbox app client secret>
PAYPAL_WEBHOOK_ID=<webhook id from developer.paypal.com dashboard>
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

PERSONA_API_KEY=<persona sandbox api key>
PERSONA_WEBHOOK_SECRET=<persona webhook signing secret>
```

Switch `PAYPAL_BASE_URL` to `https://api-m.paypal.com` when going to production.

---

## 11. Testing Plan (PayPal Sandbox)

1. **Sandbox setup** — Create PayPal Developer app at developer.paypal.com; create two sandbox accounts (merchant + buyer)
2. **Deposit test** — Buyer deposits $10 → verify `realBalance` = 1000 cents in Firestore
3. **Bet placement test** — Place $5 real money bet → verify balance debits to 500 cents immediately
4. **Settlement test** — Admin settles market as winner → verify net payout with 7% fee on profit applied correctly
5. **Withdrawal test** — Request $5 withdrawal to sandbox buyer PayPal → verify `PAYMENT.PAYOUTSBATCH.SUCCESS` webhook → status = "completed"
6. **Failure test (deposit)** — Cancel PayPal approval mid-flow → verify no balance change
7. **Failure test (withdrawal)** — Force payout failure in sandbox → verify `realBalance` refunded, status = "failed"
8. **KYC test** — Use Persona sandbox with test document set → verify `kycStatus` transitions: `pending` → `approved`
9. **Support flow** — Trigger missed deposit webhook → use `checkDepositStatus` → verify balance credited on retry

---

## 12. Key Files to Modify / Create

| File | Action | Notes |
|------|--------|-------|
| `firebase/types/firestore.types.ts` | Modify | Add KYC + realBalance fields to `User`; add `WithdrawalRequest`, `PlatformRevenue` interfaces |
| `firebase/functions/src/bets/settleBets.ts` | Modify | Apply 7% fee logic; credit `realBalance` for real-money bets; write `platformRevenue` records |
| `firebase/functions/src/payments/paypalWebhook.ts` | Create | PayPal webhook handler (captures + payouts) |
| `firebase/functions/src/payments/createPayPalOrder.ts` | Create | Order creation callable |
| `firebase/functions/src/payments/capturePayPalOrder.ts` | Create | Order capture callable |
| `firebase/functions/src/payments/requestWithdrawal.ts` | Create | Withdrawal initiation callable |
| `firebase/functions/src/kyc/onKycEvent.ts` | Create | Persona KYC webhook handler |
| `firebase/functions/src/payments/supportHelpers.ts` | Create | `checkDepositStatus`, `retryWithdrawal`, `refundDeposit` |
| `services/payment.service.ts` | Create | Client-side PayPal order flow + deep link handling |
| `screens/PaymentMethodsScreen.tsx` | Modify | Add real money deposit tab alongside virtual credits |
| `screens/WithdrawScreen.tsx` | Create | Withdrawal request form + status view |
| `screens/KycScreen.tsx` | Create | Persona SDK wrapper for identity verification |
| `components/BetModal.tsx` | Modify | Add fee disclosure line item to bet confirmation |
| `screens/ActivityScreen.tsx` | Modify | Show gross / fee / net breakdown for settled real-money bets |
| `screens/SettingsScreen.tsx` | Modify | Add Help & Support section |
| `admin/src/pages/WithdrawalRequests.tsx` | Create | Admin view for pending/failed withdrawal management |
| `admin/src/pages/UsersPage.tsx` | Modify | Surface KYC status + real balance + transaction audit log |
