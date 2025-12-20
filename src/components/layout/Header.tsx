"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { signOut } from "@/lib/auth-client";
import { Menu, Search, X } from "lucide-react";
import { useSidebar } from "./SidebarProvider";
import Link from "next/link";

interface HeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface SearchResult {
  id: string;
  title: string;
  type: "issue" | "project" | "team";
  projectId?: string;
  teamId?: string;
  status?: string;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const { toggle } = useSidebar();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleResultClick = () => {
    clearSearch();
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/signin";
            router.refresh();
          },
        },
      });
    } catch (error) {
      console.error("Sign out error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-neutral-900 border-b border-neutral-700/50 px-6 flex items-center justify-between gap-4">
      <button
        onClick={toggle}
        className="lg:hidden p-2 -ml-2 text-neutral-400 hover:text-white transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl hidden md:block" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search issues, projects, teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            className="w-full pl-10 pr-10 py-2 rounded-xl border border-neutral-700/50 bg-neutral-800/50 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full mt-2 w-full bg-neutral-900 border border-neutral-700/50 rounded-xl shadow-2xl shadow-black/40 max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={
                        result.type === "issue"
                          ? `/projects/${result.projectId}/issues/${result.id}`
                          : result.type === "project"
                          ? `/projects/${result.id}`
                          : `/teams/${result.id}`
                      }
                      onClick={handleResultClick}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        result.type === "issue"
                          ? result.status === "DONE"
                            ? "bg-emerald-500"
                            : result.status === "IN_PROGRESS"
                            ? "bg-violet-500"
                            : "bg-neutral-500"
                          : result.type === "project"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-neutral-500 capitalize">
                          {result.type}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <Avatar src={user.image} name={user.name} size="md" />
            <svg
              className="w-4 h-4 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-700/50 rounded-xl shadow-2xl shadow-black/40 py-1 z-20">
                <div className="px-4 py-3 border-b border-neutral-700/50">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-sm text-neutral-500 truncate">
                    {user.email}
                  </p>
                </div>
                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  Profile Settings
                </a>
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                >
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
