import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell, AdminShell } from "../widgets/layout/AppShell";
import { AuthShell } from "../widgets/layout/AuthShell";
import { AccountShell } from "../widgets/layout/AccountShell";
import { RequireAuth } from "./RequireAuth";
import { HomePage } from "../pages/HomePage";
import { ProductsPage } from "../pages/ProductsPage";
import { ProductPage } from "../pages/ProductPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { ContactPage, FaqPage } from "../pages/SupportPages";
import { AccountOrdersPage } from "../pages/account/AccountOrdersPage";
import { AccountWishlistPage } from "../pages/account/AccountWishlistPage";
import { AccountSettingsPage } from "../pages/account/AccountSettingsPage";
import { AccountReviewsPage } from "../pages/account/AccountReviewsPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import {
  AuthSuccessPage,
  FinishingTouchesPage,
  ResetPasswordPage,
  VerifyCodePage,
} from "../pages/auth/AuthFlowPages";
import { LegalPage } from "../pages/LegalPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminProductsPage } from "../pages/admin/AdminProductsPage";
import { AdminProductEditPage } from "../pages/admin/AdminProductEditPage";
import { AdminCategoriesPage } from "../pages/admin/AdminCategoriesPage";
import { AdminReviewsPage } from "../pages/admin/AdminReviewsPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminCustomerPage } from "../pages/admin/AdminCustomerPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "products/:id", element: <ProductPage /> },
      { path: "cart", element: <CartPage /> },
      {
        element: <RequireAuth />,
        children: [{ path: "checkout", element: <CheckoutPage /> }],
      },
      { path: "contact", element: <ContactPage /> },
      { path: "faq", element: <FaqPage /> },
      { path: "terms", element: <LegalPage kind="terms" /> },
      { path: "privacy", element: <LegalPage kind="privacy" /> },
      { path: "license", element: <LegalPage kind="license" /> },
      {
        element: <RequireAuth />,
        children: [
          {
            path: "account",
            element: <AccountShell />,
            children: [
              { index: true, element: <Navigate to="orders" replace /> },
              { path: "orders", element: <AccountOrdersPage /> },
              { path: "wishlist", element: <AccountWishlistPage /> },
              { path: "reviews", element: <AccountReviewsPage /> },
              { path: "settings", element: <AccountSettingsPage /> },
            ],
          },
          { path: "orders", element: <Navigate to="/account/orders" replace /> },
          { path: "orders/:id", element: <Navigate to="/account/orders" replace /> },
          { path: "profile", element: <Navigate to="/account/settings" replace /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    element: <AuthShell />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "auth/success", element: <AuthSuccessPage /> },
    ],
  },
  {
    element: <AuthShell backTo="/login" backLabel="← Back" />,
    children: [{ path: "forgot-password", element: <ForgotPasswordPage /> }],
  },
  {
    element: <AuthShell backTo="/register" backLabel="← Back" />,
    children: [
      { path: "verify-code", element: <VerifyCodePage /> },
      { path: "finishing-touches", element: <FinishingTouchesPage /> },
    ],
  },
  {
    element: <AuthShell backTo="/forgot-password" backLabel="← Back" />,
    children: [{ path: "reset-password", element: <ResetPasswordPage /> }],
  },
  /** Прежняя админка (скрины sprint-2026-09-19) — полный функционал */
  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    path: "/admin",
    element: <AdminShell />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "products", element: <AdminProductsPage /> },
      { path: "products/new", element: <AdminProductEditPage /> },
      { path: "products/:id", element: <AdminProductEditPage /> },
      { path: "categories", element: <AdminCategoriesPage /> },
      { path: "reviews", element: <AdminReviewsPage /> },
      { path: "orders", element: <AdminOrdersPage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "users/:userId", element: <AdminCustomerPage /> },
    ],
  },
  {
    path: "*",
    element: <AppShell />,
    children: [{ index: true, element: <NotFoundPage /> }],
  },
]);
