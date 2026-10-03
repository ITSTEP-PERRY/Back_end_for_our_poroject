import { createNavigationContainerRef, CommonActions, StackActions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export type ShopRoute =
  | "Home"
  | "Products"
  | "Cart"
  | "Account"
  | "Login"
  | "Register"
  | "ForgotPassword"
  | "Orders"
  | "Wishlist"
  | "Reviews"
  | "Settings"
  | "Terms"
  | "Privacy"
  | "Contact"
  | "FAQ"
  | "License"
  | "Checkout"
  | "Product"
  | "OrderDetails"
  | "SendCode";

type NavParams = RootStackParamList[keyof RootStackParamList];

/** Единая навигация из футера / меню / шапки / экранов — через root. */
export function navigateShop(route: ShopRoute, params?: NavParams) {
  if (!navigationRef.isReady()) return;

  switch (route) {
    case "Home":
      navigationRef.dispatch(
        CommonActions.navigate({
          name: "MainTabs",
          params: { screen: "HomeTab", params: { screen: "Home" } },
        }),
      );
      return;
    case "Products":
      navigationRef.dispatch(
        CommonActions.navigate({
          name: "MainTabs",
          params: {
            screen: "CatalogTab",
            params: { screen: "Products", params: (params as RootStackParamList["Products"]) ?? {} },
          },
        }),
      );
      return;
    case "Cart":
      navigationRef.dispatch(
        CommonActions.navigate({
          name: "MainTabs",
          params: { screen: "CartTab", params: { screen: "Cart" } },
        }),
      );
      return;
    case "Account":
      navigationRef.dispatch(
        CommonActions.navigate({
          name: "MainTabs",
          params: { screen: "AccountTab", params: { screen: "Account" } },
        }),
      );
      return;
    case "Orders":
    case "Wishlist":
    case "Reviews":
    case "Settings":
      navigationRef.dispatch(
        CommonActions.navigate({
          name: "MainTabs",
          params: {
            screen: "AccountTab",
            params: { screen: route },
          },
        }),
      );
      return;
    case "Checkout":
      navigationRef.dispatch(
        CommonActions.navigate({
          name: "MainTabs",
          params: { screen: "CartTab", params: { screen: "Checkout" } },
        }),
      );
      return;
    case "Product":
      navigationRef.dispatch(
        CommonActions.navigate({
          name: "MainTabs",
          params: {
            screen: "CatalogTab",
            params: { screen: "Product", params },
          },
        }),
      );
      return;
    default:
      navigationRef.navigate(route as keyof RootStackParamList, params as never);
  }
}

export function goBackShop() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.dispatch(StackActions.pop());
  } else {
    navigateShop("Home");
  }
}
