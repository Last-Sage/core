"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Bell, User } from "lucide-react";

interface NavbarProps {
  title?: string;
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export function Navbar({ title = "NIXITO", onMenuClick, isMenuOpen }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container flex items-center justify-between h-16">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="btn-icon lg:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <span className="font-bold text-[var(--color-dark)]">N</span>
            </div>
            <span className="font-bold text-lg hidden sm:block">{title}</span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <button className="btn-icon" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </button>
          <button className="btn-icon" aria-label="User menu">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
