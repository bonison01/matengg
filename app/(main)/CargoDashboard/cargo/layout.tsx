'use client';

import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/Footer";
import { Provider } from "react-redux";
import { store } from "@/lib/cart/store";
import CartLoader from "@/components/cart-loader";
import UserLoader from "@/components/user-loader";
import StorageWatcher from "@/components/storage-watcher";
import { usePathname } from "next/navigation";
import { DarkModeProvider } from "@/components/DarkModeContext";

export default function CargoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const hideNavbarRoutes = ["/"];
  const shouldShowNavbar = !hideNavbarRoutes.includes(pathname);

  return (
    <Provider store={store}>
      <UserLoader />
      <CartLoader />
      <StorageWatcher />

      <DarkModeProvider>
        {shouldShowNavbar && <Navbar />}
        <main className={`min-h-screen ${shouldShowNavbar ? "pt-20" : ""}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
        <Footer />
      </DarkModeProvider>
    </Provider>
  );
}
