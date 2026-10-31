'use client';

import Navbar from "@/components/navbar/navbar";
import { Provider } from "react-redux";
import { store } from "@/lib/cart/store";
import CartLoader from "@/components/cart-loader";
import UserLoader from "@/components/user-loader";
import StorageWatcher from "@/components/storage-watcher";
import { usePathname } from "next/navigation";
import { DarkModeProvider } from "@/components/DarkModeContext"; // ✅ Import

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // "/" now renders the homepage itself (it used to be a JS redirect stub),
  // so the navbar belongs there like on every other page.
  const hideNavbarRoutes: string[] = [];
  const shouldShowNavbar = !hideNavbarRoutes.includes(pathname);

  return (
    <Provider store={store}>
      <UserLoader />
      <CartLoader />
      <StorageWatcher />

      {/* ✅ Wrap inside DarkModeProvider */}
      <DarkModeProvider>
        {shouldShowNavbar && <Navbar />}
        <main className={shouldShowNavbar ? "pt-16" : ""}>
          {children}
        </main>
      </DarkModeProvider>
    </Provider>
  );
}
