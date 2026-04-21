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
  LogOut,
  Sparkles,
  ChevronRight
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

  const latestPost = blogs?.[0];
  const featuredPosts = blogs.filter((b) => b.featured);
  const mostViewed = [...blogs].sort((a, b) => (b.views || 0) - (a.views || 0))[0];

  const statCards = [
    {
      label: 'Total Posts',
      value: stats?.total || 0,
      icon: FileText,
      color: 'text-blue-400',
      bg: 'from-blue-500/15 to-blue-500/5',
    },
    {
      label: 'Featured',
      value: stats?.featured || 0,
      icon: Star,
      color: 'text-amber-400',
      bg: 'from-amber-500/15 to-amber-500/5',
    },
    {
      label: 'Total Views',
      value: (stats?.totalViews || 0).toLocaleString(),
      icon: Eye,
      color: 'text-emerald-400',
      bg: 'from-emerald-500/15 to-emerald-500/5',
    },
    {
      label: 'Categories',
      value: stats?.byCategory?.length || 0,
      icon: BarChart2,
      color: 'text-violet-400',
      bg: 'from-violet-500/15 to-violet-500/5',
    },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-primary)]/75 backdrop-blur-xl">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                    <Sparkles size={12} />
                    Editorial CMS
                  </span>
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  Dashboard
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  Oversee publishing, track content performance, and manage your newsroom.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/admin/create">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:bg-[var(--accent-hover)]"
                  >
                    <FilePlus size={16} />
                    New Post
                  </motion.button>
                </Link>

                <button
                  onClick={logout}
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-400 transition-colors hover:bg-red-500/15 lg:hidden"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-6">
          <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.10),transparent_28%)]" />
              <div className="relative">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Overview
                    </p>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                      Your content operations at a glance
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
                      Keep an eye on publishing volume, featured stories, total readership, and category spread without leaving this page.
                    </p>
                  </div>

                  <div className="hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/70 px-4 py-3 md:block">
                    <p className="text-xs text-[var(--text-muted)]">Live posts loaded</p>
                    <p className="text-xl font-bold text-[var(--text-primary)]">{blogs.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`rounded-2xl border border-[var(--border)] bg-gradient-to-br ${bg} p-4 backdrop-blur-sm`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="rounded-2xl bg-[var(--bg-card)]/80 p-2.5 shadow-sm">
                          <Icon size={18} className={color} />
                        </div>
                        <TrendingUp size={15} className="text-[var(--text-muted)]" />
                      </div>
                      <div className="text-2xl font-bold text-[var(--text-primary)]">
                        {loading ? '—' : value}
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-muted)]">{label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Quick Insights
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                    Content pulse
                  </h3>
                </div>
                <BarChart2 size={18} className="text-[var(--accent)]" />
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4">
                  <p className="text-xs text-[var(--text-muted)]">Latest post</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                    {latestPost?.title || 'No posts yet'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4">
                  <p className="text-xs text-[var(--text-muted)]">Top performer</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                    {mostViewed?.title || 'No data yet'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {(mostViewed?.views || 0).toLocaleString()} views
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4">
                  <p className="text-xs text-[var(--text-muted)]">Featured stories</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                    {featuredPosts.length}
                  </p>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <TrendingUp size={17} className="text-[var(--accent)]" />
                  <h2 className="font-semibold text-[var(--text-primary)]">All Posts</h2>
                  <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                    {filtered.length}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Search, inspect, edit, and manage all published content.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-24 rounded-2xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <FileText size={42} className="mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
                <p className="text-base font-medium text-[var(--text-primary)]">No posts found</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Try a different keyword or category.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filtered.map((blog, i) => (
                  <motion.div
                    key={blog._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group p-4 transition-colors hover:bg-[var(--bg-secondary)]/70"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="relative h-20 w-full overflow-hidden rounded-2xl lg:h-20 lg:w-28 lg:shrink-0">
                        <Image
                          src={getImageUrl(blog.image)}
                          alt={blog.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${CATEGORY_COLORS[blog.category] || ''}`}>
                            {blog.category}
                          </span>
                          {blog.featured && (
                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                              ★ Featured
                            </span>
                          )}
                        </div>

                        <h3 className="line-clamp-1 text-base font-semibold text-[var(--text-primary)]">
                          {blog.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span className="inline-flex items-center gap-1">
                            <Eye size={11} />
                            {blog.views?.toLocaleString()}
                          </span>
                          <span>{formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:justify-end">
                        <Link href={`/blog/${blog._id}`} target="_blank" rel="noopener noreferrer">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.96 }}
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--accent)]/20 hover:text-[var(--accent)]"
                          >
                            <Eye size={14} />
                            View
                          </motion.button>
                        </Link>

                        <Link href={`/admin/edit/${blog._id}`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.96 }}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-400 transition-colors hover:bg-blue-500/15"
                          >
                            <Pencil size={14} />
                            Edit
                          </motion.button>
                        </Link>

                        <motion.button
                          onClick={() => setDeleteId(blog._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.96 }}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/15"
                        >
                          <Trash2 size={14} />
                          Delete
                        </motion.button>

                        <ChevronRight size={16} className="hidden text-[var(--text-muted)] lg:block" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
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
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-7 shadow-2xl"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
                <AlertTriangle size={22} className="text-red-400" />
              </div>

              <h3 className="mb-2 font-display text-xl font-bold text-[var(--text-primary)]">
                Delete Post?
              </h3>

              <p className="mb-6 text-sm leading-relaxed text-[var(--text-muted)]">
                This action cannot be undone. The post will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="flex-1 rounded-2xl border border-[var(--border)] py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
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