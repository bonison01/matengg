// components/navbar/navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, LogOut, BadgeCheck, Search, Ticket } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/cart/store";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { clearCart } from "@/lib/cart/cartSlice";
import { clearUser } from "@/lib/cart/userSlice";
import { CardDescription } from "../ui/card";
import styles from "./navbar.module.css";
import { useCustomer } from "@/lib/api/useCustomer";
import { authService } from "@/lib/api/service";
import PageSearchBar from "./PageSearchBar";

type NavLink =
    | { name: string; href: string; external?: boolean; children?: undefined }
    | { name: string; href?: undefined; external?: undefined; children: { name: string; href: string }[] };

function Navbar() {
    const [isNavOpen, setNavOpen] = useState<boolean>(false);
    const [isSearchOpen, setSearchOpen] = useState<boolean>(false);
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.user.user);
    // Customer account on the centralized events API (the navbar Login).
    const { session: customer } = useCustomer();

    const toggleNav = () => setNavOpen((prev) => !prev);
    const closedNav = () => setNavOpen(false);

    const openSearch = () => {
        setSearchOpen(true);
        setNavOpen(false);
    };
    // Closing the bar also clears the on-page highlights (PageSearchBar cleans
    // up when it unmounts).
    const closeSearch = () => setSearchOpen(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeSearch(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        dispatch(clearCart());
        dispatch(clearUser());
        setNavOpen(false);
        router.push("/login");
    };

    const links: NavLink[] = [
        // Both point to Mateng's own off-site properties and open in a new
        // tab, so the visitor keeps this page open behind them. The on-site
        // equivalents (/discover, /delivery) stay linked from the footer, so
        // those pages are still reachable and crawlable.
        { name: "Discover Businesses", href: "https://www.instagram.com/mateng.discovery/", external: true },
        { name: "Delivery Service", href: "https://matengdelivery.com/", external: true },
        { name: "Events", href: "/events" },
        { name: "Journal", href: "/blog" },
    ];

    const SearchButton = ({ className = "" }: { className?: string }) => (
        <button
            onClick={openSearch}
            aria-label="Find on this page"
            className={`w-9 h-9 flex items-center justify-center rounded-full text-white/80 border border-gray-400/50 bg-white/5 hover:bg-white/10 hover:text-white transition ${className}`}
        >
            <Search size={16} />
        </button>
    );

    const UserGreeting = () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative min-w-30 h-9 p-0 pr-4 border border-gray-400/50 rounded-full text-white/70 shadow-inner bg-[radial-gradient(ellipse_at_bottom,_rgba(71,81,92,1)_0%,_rgba(11,21,30,1)_45%)] hover:scale-105 hover:text-white flex items-center gap-1">
                    <Image
                        src={user?.profile_pic || "/user.png"}
                        alt="user"
                        width={100}
                        height={100}
                        className="w-9 h-9 rounded-full object-cover"
                    />
                    Hi, {user?.name?.split(" ")[0] || "User"}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="bg-[#1a1a1a] text-white border border-gray-500/30 shadow-lg rounded-lg p-2 min-w-[150px] z-[99999]"
            >
                <DropdownMenuItem
                    className="hover:text-white cursor-pointer px-3 py-2"
                    onClick={() => { router.push("/profile"); closedNav(); }}
                >
                    <BadgeCheck /> Account Details
                </DropdownMenuItem>
                <Separator className="bg-gray-500/40" />
                <DropdownMenuItem
                    className="hover:text-white cursor-pointer px-3 py-2"
                    onClick={handleLogout}
                >
                    <LogOut /> Log Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    // The older User / Business / Admin logins now live in the footer. The
    // navbar Login goes to the customer account on the events API.
    const LoginButton = () => (
        <Link
            href={pathname.startsWith("/account") ? "/account/login" : `/account/login?redirect=${encodeURIComponent(pathname)}`}
            onClick={closedNav}
            className="group h-9 pl-5 pr-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 text-sm font-medium text-white/90 hover:bg-white/20 hover:text-white hover:border-white/25 active:scale-[0.97] transition-all duration-200"
        >
            Login
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
    );

    const logoutCustomer = async () => { closedNav(); await authService.logout(); router.push("/"); };

    const CustomerGreeting = () => {
        const name = customer?.full_name?.split(" ")[0] || customer?.username || "there";
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="h-9 pl-1 pr-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 text-sm font-medium text-white/90 hover:bg-white/20 hover:text-white transition-all duration-200">
                        <span className="w-7 h-7 rounded-full bg-[#3FA637] text-[#0B1410] flex items-center justify-center text-xs font-bold uppercase">
                            {name.charAt(0)}
                        </span>
                        Hi, {name}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="bg-[#101B15] text-white border border-white/10 shadow-lg rounded-xl p-2 min-w-[180px] z-[99999]"
                >
                    <DropdownMenuItem
                        className="hover:text-white cursor-pointer px-3 py-2"
                        onClick={() => { router.push("/account/bookings"); closedNav(); }}
                    >
                        <Ticket /> My bookings
                    </DropdownMenuItem>
                    <Separator className="bg-white/10" />
                    <DropdownMenuItem
                        className="hover:text-white cursor-pointer px-3 py-2"
                        onClick={logoutCustomer}
                    >
                        <LogOut /> Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const AccountSlot = () =>
        customer ? <CustomerGreeting /> : user ? <UserGreeting /> : <LoginButton />;

    // Mobile menu: the customer's options sit in the menu itself — a dropdown
    // inside the slide-down menu covers the links below it.
    const MobileCustomerAccount = () => {
        const name = customer?.full_name?.split(" ")[0] || customer?.username || "there";
        return (
            <>
                <Link href="/account/bookings" className={`${styles.navlink} inline-flex items-center gap-2`} onClick={closedNav}>
                    <Ticket size={18} /> My bookings
                </Link>
                <div className="mt-6 flex items-center gap-3">
                    <span className="h-9 pl-1 pr-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 text-sm font-medium text-white/90">
                        <span className="w-7 h-7 rounded-full bg-[#3FA637] text-[#0B1410] flex items-center justify-center text-xs font-bold uppercase">
                            {name.charAt(0)}
                        </span>
                        Hi, {name}
                    </span>
                    <button
                        onClick={logoutCustomer}
                        className="h-9 px-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
                    >
                        <LogOut size={15} /> Log out
                    </button>
                </div>
            </>
        );
    };

    return (
        <div className="w-full fixed top-0 z-[10000] sm:px-4 bg-gradient-to-r from-[#131316d9] via-[#222226a6] to-[#131316d9] backdrop-blur-sm">

            {/* FIND-IN-PAGE BAR — replaces the nav row while open, same spot on desktop & mobile */}
            {isSearchOpen && <PageSearchBar onClose={closeSearch} />}

            {/* DESKTOP NAV */}
            <div className={`hidden lg:flex justify-between items-center h-16 px-4 ${isSearchOpen ? "!hidden" : ""}`}>
                <Link href="/">
                    <div className="h-16 flex items-center p-2 pl-0">
                        <img src="/logo.png" alt="logo" className="h-full object-contain" />
                    </div>
                </Link>

                <div className="flex gap-4 items-center text-white/80 text-sm font-medium">
                    {links.map((link) =>
                        link.children ? (
                            <DropdownMenu key={link.name}>
                                <DropdownMenuTrigger asChild>
                                    <button className="px-3 py-1.5 rounded-full hover:bg-white/10 text-white/80">
                                        {link.name}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#1a1a1a] text-white rounded-md shadow-md min-w-[160px] border border-gray-600/30 z-[99999]">
                                    {link.children.map((child) => (
                                        <DropdownMenuItem
                                            key={child.href}
                                            className="hover:bg-white/10 cursor-pointer"
                                            onClick={() => router.push(child.href)}
                                        >
                                            {child.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : link.external ? (
                            // rel="noopener noreferrer" is required with
                            // target="_blank": without it the opened page gets
                            // a handle on this one via window.opener.
                            <a
                                key={link.href}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-full hover:bg-white/10 transition"
                            >
                                {link.name}
                            </a>
                        ) : (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-3 py-1.5 rounded-full hover:bg-white/10 transition ${
                                    pathname === link.href ? "bg-white/10 text-white" : ""
                                }`}
                            >
                                {link.name}
                            </Link>
                        )
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <SearchButton />
                    <AccountSlot />
                </div>
            </div>

            {/* MOBILE TOP BAR */}
            <div className={`lg:hidden h-16 flex justify-between items-center px-4 ${isSearchOpen ? "!hidden" : ""}`}>
                <Link href="/">
                    <img src="/logo.png" alt="logo" className="w-32" />
                </Link>

                <div className="flex items-center gap-2">
                    <SearchButton />

                    {/* Hamburger */}
                    <button
                        onClick={toggleNav}
                        className="flex flex-col justify-center gap-[5px] w-8 h-8 p-1"
                        aria-label="Toggle menu"
                    >
                        <span className={`block h-0.5 bg-white rounded transition-all duration-300 ${isNavOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                        <span className={`block h-0.5 bg-white rounded transition-all duration-300 ${isNavOpen ? "opacity-0" : ""}`} />
                        <span className={`block h-0.5 bg-white rounded transition-all duration-300 ${isNavOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
                    </button>
                </div>
            </div>

            {/* MOBILE NAV MENU */}
            <nav className={`${styles.navMenu} ${isNavOpen ? styles.open : ""}`}>
                <div className="flex flex-col items-center mt-2">
                    {links.map((link) =>
                        link.children ? null : link.external ? (
                            <a
                                key={link.href}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.navlink}
                                onClick={closedNav}
                            >
                                {link.name}
                            </a>
                        ) : (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={styles.navlink}
                                onClick={closedNav}
                            >
                                {link.name}
                            </Link>
                        )
                    )}
                    {customer ? <MobileCustomerAccount /> : <div className="mt-6"><AccountSlot /></div>}
                </div>

                {/* Mobile CTA */}
                <div className="mt-8 p-4 text-center">
                    <CardDescription className="text-sm mb-3 text-gray-400">
                        Cargo service inquiries
                    </CardDescription>
                    <a href="tel:+919774795905">
                        <button className="px-6 py-3 text-white bg-green-900/60 rounded-full shadow-md">
                            📦 Cargo Service
                        </button>
                    </a>
                </div>
            </nav>
        </div>
    );
}

export default Navbar;