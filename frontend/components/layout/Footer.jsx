'use client';
import Link from 'next/link';
import { Zap, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const categories = ['Technology', 'AI', 'Sports', 'Politics', 'Science', 'Business'];

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] mt-20">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <Zap size={16} className="text-white fill-white" />
              </div>
              <span className="font-display font-black text-xl text-[var(--text-primary)]">
                News<span className="text-[var(--accent)]">Forge</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
              Premium news, analysis, and insights forged for the curious mind.
              Covering technology, AI, business, and global affairs.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all duration-200"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Categories</h4>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link href={`/?category=${cat}`} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Home</Link></li>
              <li><Link href="/admin/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Admin Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--border)] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">© {new Date().getFullYear()} NewsForge. Built with Next.js + MongoDB.</p>
          <p className="text-xs text-[var(--text-muted)]">Forged for the curious mind ⚡</p>
        </div>
      </div>
    </footer>
  );
}
