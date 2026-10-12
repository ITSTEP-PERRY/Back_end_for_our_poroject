import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header } from "../components/Header";
import { MenuDrawer } from "../components/MenuDrawer";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import { colors } from "../theme/colors";
import { HomeScreen } from "../screens/HomeScreen";
import { ProductsScreen } from "../screens/ProductsScreen";
import { ProductScreen } from "../screens/ProductScreen";
import { CartScreen } from "../screens/CartScreen";
import { CheckoutScreen } from "../screens/CheckoutScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { SendCodeScreen } from "../screens/SendCodeScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { OrderDetailsScreen } from "../screens/OrderDetailsScreen";
import { AccountScreen } from "../screens/AccountScreen";
import {
  LegalScreen,
  ReviewsScreen,
  SettingsScreen,
  WishlistScreen,
} from "../screens/AccountExtras";
import { navigateShop, navigationRef } from "./navigationRef";
import type { MainTabParamList, RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.darkText,
  headerTitleStyle: { fontWeight: "700" as const, fontSize: 17 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.white },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ ...stackScreenOptions, headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Products"
        component={ProductsScreen}
        options={{ headerShown: true, title: "Catalog" }}
      />
      <Stack.Screen
        name="Product"
        component={ProductScreen}
        options={{ headerShown: true, title: "Product" }}
      />
    </Stack.Navigator>
  );
}

function CatalogStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Products" component={ProductsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Product" component={ProductScreen} options={{ title: "Product" }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AccountStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Account" component={AccountScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: "Order" }} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ title: "My reviews" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function MainTabs({ onMenu }: { onMenu: () => void }) {
  const { count } = useCart();
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();
  const tabPadBottom = Math.max(insets.bottom, 6);

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        header: () => (
          <Header
            search={search}
            onSearchChange={setSearch}
            onSearchSubmit={() => {
              const q = search.trim();
              navigateShop("Products", q ? { search: q, title: "Search" } : {});
            }}
            onMenu={onMenu}
            onCart={() => navigateShop("Cart")}
            cartCount={count}
          />
        ),
        tabBarActiveTintColor: colors.darkText,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: "rgba(14, 32, 66, 0.1)",
          height: 52 + tabPadBottom,
          paddingTop: 4,
          paddingBottom: tabPadBottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.primary,
          color: colors.darkText,
          fontSize: 10,
          fontWeight: "800",
        },
        tabBarIcon: ({ color, focused, size }) => {
          const map: Record<
            string,
            { outline: keyof typeof Ionicons.glyphMap; solid: keyof typeof Ionicons.glyphMap }
          > = {
            HomeTab: { outline: "home-outline", solid: "home" },
            CatalogTab: { outline: "grid-outline", solid: "grid" },
            CartTab: { outline: "cart-outline", solid: "cart" },
            AccountTab: { outline: "person-outline", solid: "person" },
          };
          const icons = map[route.name] || { outline: "ellipse", solid: "ellipse" };
          return <Ionicons name={focused ? icons.solid : icons.outline} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
      <Tabs.Screen name="CatalogTab" component={CatalogStack} options={{ title: "Catalog" }} />
      <Tabs.Screen
        name="CartTab"
        component={CartStack}
        options={{ title: "Cart", tabBarBadge: count > 0 ? count : undefined }}
      />
      <Tabs.Screen name="AccountTab" component={AccountStack} options={{ title: "Account" }} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.darkText} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs">
          {() => <MainTabs onMenu={() => setMenuOpen(true)} />}
        </Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SendCode" component={SendCodeScreen} />
        <Stack.Screen name="Terms" component={LegalScreen} options={{ headerShown: true, title: "Terms" }} />
        <Stack.Screen name="Privacy" component={LegalScreen} options={{ headerShown: true, title: "Privacy" }} />
        <Stack.Screen name="Contact" component={LegalScreen} options={{ headerShown: true, title: "Contact us" }} />
        <Stack.Screen name="FAQ" component={LegalScreen} options={{ headerShown: true, title: "FAQ" }} />
        <Stack.Screen name="License" component={LegalScreen} options={{ headerShown: true, title: "License" }} />
        <Stack.Screen name="Orders" component={OrdersScreen} options={{ headerShown: true }} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ headerShown: true }} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ headerShown: true, title: "My reviews" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true }} />
        <Stack.Screen name="Products" component={ProductsScreen} options={{ headerShown: true, title: "Catalog" }} />
        <Stack.Screen name="Product" component={ProductScreen} options={{ headerShown: true, title: "Product" }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: true }} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ headerShown: true, title: "Order" }} />
      </Stack.Navigator>

      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </NavigationContainer>
  );
}
