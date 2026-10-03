export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  Products: { categoryId?: string; search?: string; sort?: string; title?: string } | undefined;
  Product: { id: string };
  Cart: undefined;
  Checkout: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  SendCode: { email: string; context?: "forgot" | "register" };
  Orders: undefined;
  OrderDetails: { id: string };
  Account: undefined;
  Wishlist: undefined;
  Reviews: undefined;
  Settings: undefined;
  Terms: undefined;
  Privacy: undefined;
  Contact: undefined;
  FAQ: undefined;
  License: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  CatalogTab: undefined;
  CartTab: undefined;
  AccountTab: undefined;
};
