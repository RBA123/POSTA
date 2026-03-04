/**
 * dLocal Payment Types (client-side)
 *
 * Input/result types for dLocal Cloud Function calls.
 * Card data flows client → Cloud Function → dLocal API in one request.
 * No card data is ever stored in Firestore.
 */

// ============================================================================
// KYC
// ============================================================================

export interface KycSubmitInput {
  documentType: 'CI' | 'RUC' | 'PASS' | 'CE';
  documentNumber: string;
  fullName: string;
  address: string;
}

export interface KycSubmitResult {
  success: boolean;
  kycStatus: 'verified' | 'rejected';
}

// ============================================================================
// DEPOSITS
// ============================================================================

export interface DepositInput {
  amountCents: number; // USD cents (500–50000)
  cardNumber: string;
  cardExpiry: string; // "MM/YY"
  cardCvv: string;
  cardHolderName: string;
}

export interface DepositResult {
  success: boolean;
  depositId: string;
}

// ============================================================================
// WITHDRAWALS
// ============================================================================

export interface WithdrawalInput {
  amountCents: number; // USD cents (500–realBalance)
  bankCode: string;
  bankAccountNumber: string;
  bankAccountType: 'checking' | 'savings';
  beneficiaryName: string;
}

export interface WithdrawalResult {
  success: boolean;
  withdrawalId: string;
}

// ============================================================================
// FEE ESTIMATES
// ============================================================================

export interface FeeEstimateInput {
  type: 'deposit' | 'withdrawal';
  amountCents: number;
}

export interface FeeEstimate {
  grossAmountCents: number;
  feeCents: number;
  netAmountCents: number;
  feePercentage: number;
  feeDescription: string;
}
