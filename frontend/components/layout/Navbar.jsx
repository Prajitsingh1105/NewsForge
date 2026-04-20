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
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await blogApi.getAll({ search: searchQuery, limit: 5 });
        setSearchResults(res.data.blogs);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
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
      {/* Breaking news ticker */}
      <div className="bg-[var(--accent)] text-white text-xs py-1.5 overflow-hidden">
        <div className="ticker-wrap">
          <motion.span
            animate={{ x: [0, -2000] }}
            transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
            className="inline-block whitespace-nowrap"
          >
            🔥 BREAKING: Latest updates in AI, Technology, and World Affairs — Stay informed with NewsForge&nbsp;&nbsp;&nbsp;&nbsp;
            ⚡ Top stories curated for you every hour — Never miss a beat&nbsp;&nbsp;&nbsp;&nbsp;
            🌍 Global coverage, local insights — NewsForge Premium Now Available
          </motion.span>
        </div>
      </div>

      <motion.header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass shadow-[0_4px_30px_rgba(0,0,0,0.15)] border-b border-[var(--border)]'
            : 'bg-[var(--bg-primary)] border-b border-[var(--border)]'
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Zap size={16} className="text-white fill-white" />
              </motion.div>
              <span className="font-display font-black text-xl tracking-tight text-[var(--text-primary)]">
                News<span className="text-[var(--accent)]">Forge</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                    pathname === link.href
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {link.label}
                  {pathname === link.href && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-[var(--accent)]/10 rounded-lg -z-10"
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div ref={searchRef} className="relative">
                <motion.button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  whileTap={{ scale: 0.92 }}
                >
                  <Search size={18} />
                </motion.button>

                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl border border-[var(--border)] overflow-hidden shadow-xl"
                    >
                      <div className="flex items-center gap-2 p-3 border-b border-[var(--border)]">
                        <Search size={16} className="text-[var(--text-muted)]" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search stories..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && searchQuery.trim()) {
                              router.push(`/?search=${encodeURIComponent(searchQuery)}`);
                              setSearchOpen(false);
                            }
                          }}
                          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                        />
                        {searching && (
                          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>

                      {searchResults.length > 0 && (
                        <div className="py-2 max-h-64 overflow-y-auto">
                          {searchResults.map((blog) => (
                            <Link
                              key={blog._id}
                              href={`/blog/${blog._id}`}
                              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-secondary)] transition-colors group"
                            >
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
                                {blog.category}
                              </span>
                              <span className="text-sm text-[var(--text-primary)] line-clamp-1 flex-1">{blog.title}</span>
                              <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform shrink-0" />
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchQuery && !searching && searchResults.length === 0 && (
                        <div className="py-6 text-center text-sm text-[var(--text-muted)]">No results found</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dark mode */}
              <motion.button
                onClick={toggle}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                whileTap={{ scale: 0.92 }}
              >
                <AnimatePresence mode="wait">
                  {isDark ? (
                    <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Sun size={18} />
                    </motion.div>
                  ) : (
                    <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Moon size={18} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-[var(--border)]"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
