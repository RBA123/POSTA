/**
 * Ecuador Constants
 *
 * Bank list, document types, and deposit/withdrawal limits for Ecuador.
 * Ecuador uses USD so no currency conversion is needed.
 */

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

export const ECUADOR_DOCUMENT_TYPES = [
  { code: 'CI' as const, label: 'Cédula de Identidad', digits: 10 },
  { code: 'RUC' as const, label: 'RUC', digits: 13 },
  { code: 'PASS' as const, label: 'Pasaporte', digits: null }, // 7-12 alphanumeric
  { code: 'CE' as const, label: 'Cédula de Extranjería', digits: null },
];

export type EcuadorDocumentType = 'CI' | 'RUC' | 'PASS' | 'CE';

// ============================================================================
// BANKS
// ============================================================================

export const ECUADOR_BANKS = [
  { code: 'BP', name: 'Banco Pichincha' },
  { code: 'BG', name: 'Banco de Guayaquil' },
  { code: 'PRO', name: 'Produbanco' },
  { code: 'PAC', name: 'Banco del Pacífico' },
  { code: 'INT', name: 'Banco Internacional' },
  { code: 'BOL', name: 'Banco Bolivariano' },
  { code: 'AUS', name: 'Banco del Austro' },
  { code: 'SOL', name: 'Banco Solidario' },
  { code: 'GEN', name: 'Banco General Rumiñahui' },
  { code: 'MAC', name: 'Banco de Machala' },
  { code: 'LOJ', name: 'Banco de Loja' },
  { code: 'COP', name: 'Cooperativa JEP' },
];

// ============================================================================
// LIMITS (in USD cents)
// ============================================================================

export const DEPOSIT_MIN_CENTS = 500; // $5.00
export const DEPOSIT_MAX_CENTS = 50000; // $500.00
export const WITHDRAWAL_MIN_CENTS = 500; // $5.00

// ============================================================================
// FEES
// ============================================================================

export const FEE_PERCENTAGE = 0; // 0% for MVP — vig is a separate task
export const FEE_DESCRIPTION = 'Sin comisión';

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export const ACCOUNT_TYPES = [
  { code: 'checking' as const, label: 'Corriente' },
  { code: 'savings' as const, label: 'Ahorros' },
];
