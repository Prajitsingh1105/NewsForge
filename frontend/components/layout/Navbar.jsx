'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Moon, Sun, Menu, X, Zap, ChevronRight } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.js';
import { blogApi } from '../../lib/api.js';

export default function Navbar() {
  const { isDark, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await blogApi.getAll({ search: searchQuery, limit: 5 });
        setSearchResults(res.data.blogs || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/?category=Technology', label: 'Tech' },
    { href: '/?category=AI', label: 'AI' },
    { href: '/?category=Business', label: 'Business' },
    { href: '/?category=World', label: 'World' },
  ];

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <div className="bg-[var(--accent)] text-white text-[11px] sm:text-xs py-2 overflow-hidden border-b border-white/10">
        <div className="ticker-wrap">
          <motion.span
            animate={{ x: [0, -2000] }}
            transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
            className="inline-block whitespace-nowrap font-medium tracking-wide"
          >
            BREAKING: Latest updates in AI, Technology, and World Affairs — Stay informed with NewsForge&nbsp;&nbsp;&nbsp;&nbsp;
            •&nbsp;&nbsp;&nbsp;&nbsp;Top stories curated for you every hour — Never miss a beat&nbsp;&nbsp;&nbsp;&nbsp;
            •&nbsp;&nbsp;&nbsp;&nbsp;Global coverage, local insights — NewsForge Premium Now Available
          </motion.span>
        </div>
      </div>

      <motion.header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
          scrolled
            ? 'bg-[var(--bg-primary)]/85 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border-[var(--border)]'
            : 'bg-[var(--bg-primary)] border-[var(--border)]'
        }`}
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-18 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <motion.div
                className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/15"
                whileHover={{ rotate: 8, scale: 1.06 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              >
                <Zap size={16} className="text-white fill-white" />
              </motion.div>

              <div className="leading-none">
                <span className="font-display font-black text-lg sm:text-xl tracking-tight text-[var(--text-primary)]">
                  News<span className="text-[var(--accent)]">Forge</span>
                </span>
                <div className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] mt-1">
                  News that moves fast
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-1.5 py-1">
              {navLinks.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== '/' && pathname === '/' && new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('category') === link.href.split('=')[1]);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div ref={searchRef} className="relative">
                <motion.button
                  onClick={() => setSearchOpen(!searchOpen)}
                  aria-label="Search stories"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/25 hover:bg-[var(--bg-card)] transition-all"
                  whileTap={{ scale: 0.95 }}
                >
                  <Search size={18} />
                </motion.button>

                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 top-full mt-3 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl shadow-black/10"
                    >
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]/60">
                        <Search size={16} className="text-[var(--text-muted)] shrink-0" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search stories..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchQuery.trim()) {
                              router.push(`/?search=${encodeURIComponent(searchQuery)}`);
                              setSearchOpen(false);
                            }
                          }}
                          className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                        />
                        {searching && (
                          <div className="h-4 w-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                        )}
                      </div>

                      {searchResults.length > 0 && (
                        <div className="max-h-72 overflow-y-auto py-2">
                          {searchResults.map((blog) => (
                            <Link
                              key={blog._id}
                              href={`/blog/${blog._id}`}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors group"
                            >
                              <span className="mt-0.5 inline-flex shrink-0 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                                {blog.category}
                              </span>
                              <span className="min-w-0 flex-1 text-sm text-[var(--text-primary)] line-clamp-2">
                                {blog.title}
                              </span>
                              <ChevronRight size={14} className="shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchQuery && !searching && searchResults.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                          No results found
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                onClick={toggle}
                aria-label="Toggle theme"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/25 hover:bg-[var(--bg-card)] transition-all"
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0, scale: 0.9 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Sun size={18} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0, scale: 0.9 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Moon size={18} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Open menu"
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/25 hover:bg-[var(--bg-card)] transition-all"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-[var(--border)] bg-[var(--bg-primary)]"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== '/' && pathname === '/' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('category') === link.href.split('=')[1]);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronRight size={14} className={active ? 'text-white/80' : 'text-[var(--text-muted)]'} />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}