import { Market } from "./index";

export type RootStackParamList = {
  // Onboarding
  Welcome: undefined;
  Signup: undefined;
  Notifications: undefined;
  CountrySelection: undefined;

  // Main App
  Main: undefined;

  // Modal/Detail Screens
  PaymentMethods: undefined;
  NotificationsHistory: undefined;
  CountryBetting: { market: Market };

  // dLocal Payment Screens
  KYC: undefined;
  Deposit: undefined;
  Withdraw: undefined;
  TransactionHistory: undefined;
};

export type TabParamList = {
  HomeTab: { country?: string } | undefined;
  ActivityTab: undefined;
  ProfileTab: undefined;
};
