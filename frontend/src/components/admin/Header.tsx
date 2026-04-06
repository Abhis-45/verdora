"use client";
import { useState, useEffect, useRef } from "react";
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

type HeaderProps = {
  onLogout: () => void;
  onToggleSidebar: () => void;
};

export default function Header({ onLogout, onToggleSidebar }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-3 bg-white px-4 py-3 shadow sm:flex-row sm:items-center sm:justify-between sm:px-6">
      {/* Left: Hamburger + Search */}
      <div className="flex w-full items-center gap-2 sm:max-w-xl">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          type="button"
          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 md:hidden"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex w-full items-center"
        >
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-0 flex-1 rounded-l-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
          />
          <button
            type="submit"
            className="rounded-r-lg bg-green-600 px-3 py-2 text-white transition hover:bg-green-700"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Right: Profile Dropdown */}
      <div className="relative self-end sm:self-auto" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-2 rounded-lg px-2 py-1 text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <UserCircleIcon className="w-8 h-8" />
          <span className="hidden text-sm font-medium sm:inline">Admin</span>
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 z-50 mt-2 w-40 rounded-lg border bg-white py-2 shadow-lg">
            <button
              onClick={() => alert("Profile clicked")}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              My Profile
            </button>
            <button
              onClick={onLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
