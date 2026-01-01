"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  ShieldCheck,
  Copy,
  User as UserIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { truncateAddress } from "@/lib/utils/format";
import { SearchCommand } from "./SearchCommand";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Cormorant_SC } from "next/font/google";

const cormorant = Cormorant_SC({
  subsets: ["latin"],
  weight: ["700"],
});

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();
  const [logoSrc, setLogoSrc] = useState("/logo-dark.png");

  useEffect(() => {
    // Set the logo based on the theme.
    setLogoSrc(theme === "dark" ? "/logo-light.png" : "/logo-dark.png");
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navLinks = isAuthenticated
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/certificates", label: "Certificates" },
        ...(user?.is_admin ? [{ href: "/users", label: "Users" }] : []),
        { href: "/verify", label: "Verify" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/verify", label: "Verify" },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-9 w-9">
            <Image src={logoSrc} alt="NXCertify Logo" fill sizes="36px" />
          </div>
          <span
            className={`text-2xl font-bold text-foreground ${cormorant.className}`}
          >
            NXCertify
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-2 text-sm font-semibold transition-all ${
                pathname === link.href
                  ? "text-secondary-foreground bg-secondary"
                  : "text-muted-foreground font-medium hover:text-foreground hover:bg-accent"
              }`}
            >
              {link.label}
              {pathname === link.href && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right Section: Search | Theme Toggle | User Menu */}
        <div className="flex items-center gap-3">
          {/* Search Bar - moved to right side */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center">
              <SearchCommand />
            </div>
          )}

          <ThemeToggle />
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 h-auto py-2 px-3"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">{user.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {truncateAddress(user.wallet_address)}
                    </span>
                  </div>
                  <UserAvatar
                    walletAddress={user.wallet_address}
                    username={user.username}
                    isAdmin={user.is_admin}
                    size="sm"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Profile Card Header */}
                <div className="p-4 pb-3 bg-muted/50">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      walletAddress={user.wallet_address}
                      username={user.username}
                      isAdmin={user.is_admin}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base mb-0.5">
                        {user.username}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {user.email}
                      </div>
                      {user.is_admin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wallet Address Section */}
                <div className="px-4 py-3 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-1.5">
                    Wallet Address
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono overflow-hidden text-ellipsis">
                      {truncateAddress(user.wallet_address)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(user.wallet_address);
                        toast.success("Wallet address copied!");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-0" />

                {/* My Profile */}
                <div className="p-2">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={`/users/${user.wallet_address}`}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-0" />

                {/* Logout Button */}
                <div className="p-2">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <div className="px-4 pt-2">
                <SearchCommand />
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
