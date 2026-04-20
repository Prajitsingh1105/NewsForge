'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Eye,
  TrendingUp,
  FileText,
  Search,
  Zap
} from 'lucide-react';

import AdminSidebar from '@/components/admin/AdminSidebar';
import { CATEGORY_COLORS, getImageUrl, blogApi } from '@/lib/api';

export default function ScrapedPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 🔥 FETCH SCRAPED DATA FROM BACKEND
  useEffect(() => {
    fetchScrapedBlogs();
  }, []);

  const fetchScrapedBlogs = async () => {
    try {
      const res = await blogApi.getScraped();
      setBlogs(res.data.blogs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 PUBLISH FUNCTION
  const handlePublish = async (id) => {
    try {
      await blogApi.publishScraped(id);
      setBlogs(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = blogs.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">

        {/* Header */}
        <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-sm border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">
                Scraped News
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Review and publish scraped articles
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">

          {/* Info Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-blue-400" />
                <span className="text-sm text-[var(--text-muted)]">Total Scraped</span>
              </div>
              <div className="text-2xl font-bold">{filtered.length}</div>
            </div>

            <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-green-400" />
                <span className="text-sm text-[var(--text-muted)]">Pending Review</span>
              </div>
              <div className="text-2xl font-bold">{filtered.length}</div>
            </div>

            <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-purple-400" />
                <span className="text-sm text-[var(--text-muted)]">Auto Source</span>
              </div>
              <div className="text-sm">HT + IE</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">

            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <TrendingUp size={17} className="text-[var(--accent)]" />
                <h2 className="font-semibold text-[var(--text-primary)]">Scraped Articles</h2>
                <span className="text-xs bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                  {filtered.length}
                </span>
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm w-52"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-8">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={40} className="mx-auto opacity-40 mb-3" />
                <p>No scraped articles</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filtered.map((blog, i) => (
                  <motion.div
                    key={blog._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 hover:bg-[var(--bg-secondary)] group"
                  >

                    {/* Image */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-800 flex items-center justify-center text-xs">
                      {blog.image ? (
                        <Image src={getImageUrl(blog.image)} fill alt="" />
                      ) : (
                        "IMG"
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[blog.category] || ''}`}>
                          {blog.category}
                        </span>

                        <span className="text-xs text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                          Scraped
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold line-clamp-1">
                        {blog.title}
                      </h3>

                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        {blog.sourceName} • {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">

                      {/* Preview */}
                      <Link href={`/admin/scraped/${blog._id}`}>
                        <button className="p-2 rounded-lg hover:bg-[var(--accent)]/10">
                          <Eye size={16} />
                        </button>
                      </Link>

                      {/* Publish */}
                      <button
                        onClick={() => handlePublish(blog._id)}
                        className="px-3 py-1 text-xs bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20"
                      >
                        Publish
                      </button>

                    </div>

                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}