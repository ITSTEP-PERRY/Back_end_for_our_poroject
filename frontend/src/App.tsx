import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./app/AuthContext";
import { CartProvider } from "./app/CartContext";
import { WishlistProvider } from "./app/WishlistContext";
import { router } from "./app/router";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <RouterProvider router={router} />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
