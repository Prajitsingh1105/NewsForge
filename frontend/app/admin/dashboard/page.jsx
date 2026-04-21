'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  FilePlus,
  Pencil,
  Trash2,
  Eye,
  TrendingUp,
  FileText,
  Star,
  BarChart2,
  Search,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import AdminSidebar from '../../../components/admin/AdminSidebar';
import { blogApi, CATEGORY_COLORS, getImageUrl } from '../../../lib/api';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [blogsRes, statsRes] = await Promise.all([
        blogApi.getAll({ limit: 50 }),
        blogApi.getStats(),
      ]);
      setBlogs(blogsRes.data.blogs);
      setStats(statsRes.data.stats);
    } catch (err) {
      if (err.response?.status === 401) router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await blogApi.delete(id);
      toast.success('Post deleted');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const logout = () => {
    Cookies.remove('admin_token');
    router.push('/admin/login');
  };

  const filtered = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: 'Total Posts', value: stats?.total || 0, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Featured', value: stats?.featured || 0, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Total Views', value: (stats?.totalViews || 0).toLocaleString(), icon: Eye, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Categories', value: stats?.byCategory?.length || 0, icon: BarChart2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                Dashboard
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Manage your news platform
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/create">
                <motion.button
                  className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FilePlus size={16} />
                  New Post
                </motion.button>
              </Link>

              <button
                onClick={logout}
                className="rounded-xl p-2.5 text-red-400 transition-colors hover:bg-red-500/10 lg:hidden"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {loading ? '—' : value}
                </div>
                <div className="mt-0.5 text-sm text-[var(--text-muted)]">{label}</div>
              </motion.div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={17} className="text-[var(--accent)]" />
                <h2 className="font-semibold text-[var(--text-primary)]">All Posts</h2>
                <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                  {filtered.length}
                </span>
              </div>

              <div className="relative w-full md:w-64">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <FileText size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
                <p className="text-[var(--text-muted)]">No posts found</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filtered.map((blog, i) => (
                  <motion.div
                    key={blog._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group flex items-center gap-4 p-4 transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={getImageUrl(blog.image)}
                        alt={blog.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[blog.category] || ''}`}>
                          {blog.category}
                        </span>
                        {blog.featured && (
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      <h3 className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">
                        {blog.title}
                      </h3>

                      <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Eye size={11} />
                          {blog.views?.toLocaleString()}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link href={`/blog/${blog._id}`} target="_blank" rel="noopener noreferrer">
                        <motion.button
                          className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Eye size={15} />
                        </motion.button>
                      </Link>

                      <Link href={`/admin/edit/${blog._id}`}>
                        <motion.button
                          className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-blue-500/10 hover:text-blue-400"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Pencil size={15} />
                        </motion.button>
                      </Link>

                      <motion.button
                        onClick={() => setDeleteId(blog._id)}
                        className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={15} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 shadow-2xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                <AlertTriangle size={22} className="text-red-400" />
              </div>

              <h3 className="mb-2 font-display text-xl font-bold text-[var(--text-primary)]">
                Delete Post?
              </h3>

              <p className="mb-6 text-sm text-[var(--text-muted)]">
                This action cannot be undone. The post will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}