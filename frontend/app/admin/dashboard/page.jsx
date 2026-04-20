'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { FilePlus, Pencil, Trash2, Eye, TrendingUp, FileText, Star, BarChart2, Search, AlertTriangle, LogOut } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { blogApi, CATEGORY_COLORS, getImageUrl } from '../../lib/api.js';
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

  useEffect(() => { fetchData(); }, []);

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

  const logout = () => { Cookies.remove('admin_token'); router.push('/admin/login'); };

  const filtered = blogs.filter(b =>
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
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-sm border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Dashboard</h1>
              <p className="text-sm text-[var(--text-muted)]">Manage your news platform</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/create">
                <motion.button
                  className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  <FilePlus size={16} /> New Post
                </motion.button>
              </Link>
              <button onClick={logout} className="lg:hidden p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{loading ? '—' : value}</div>
                <div className="text-sm text-[var(--text-muted)] mt-0.5">{label}</div>
              </motion.div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <TrendingUp size={17} className="text-[var(--accent)]" />
                <h2 className="font-semibold text-[var(--text-primary)]">All Posts</h2>
                <span className="text-xs bg-[var(--bg-secondary)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">{filtered.length}</span>
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input type="text" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors w-52" />
              </div>
            </div>

            {loading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
                <p className="text-[var(--text-muted)]">No posts found</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filtered.map((blog, i) => (
                  <motion.div key={blog._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 hover:bg-[var(--bg-secondary)] transition-colors group">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                      <Image src={getImageUrl(blog.image)} alt={blog.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[blog.category] || ''}`}>{blog.category}</span>
                        {blog.featured && <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">★ Featured</span>}
                      </div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">{blog.title}</h3>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><Eye size={11} />{blog.views?.toLocaleString()}</span>
                        <span>{formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/blog/${blog._id}`} target="_blank">
                        <motion.button className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Eye size={15} />
                        </motion.button>
                      </Link>
                      <Link href={`/admin/edit/${blog._id}`}>
                        <motion.button className="p-2 rounded-lg text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Pencil size={15} />
                        </motion.button>
                      </Link>
                      <motion.button onClick={() => setDeleteId(blog._id)} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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

      {/* Delete modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !deleting && setDeleteId(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-7 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle size={22} className="text-red-400" />
              </div>
              <h3 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Delete Post?</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">This action cannot be undone. The post will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
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
