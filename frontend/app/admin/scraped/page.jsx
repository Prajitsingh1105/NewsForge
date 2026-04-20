'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, FileText } from 'lucide-react';
import { blogApi } from '@/lib/api';

export default function ScrapedNewsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScraped = async () => {
      try {
        const res = await blogApi.getAdminBlogs(); // make sure this exists
        const scraped = res.data.blogs.filter(
          b => b.sourceType === 'scraped' && b.status === 'draft'
        );
        setBlogs(scraped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchScraped();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🤖 Scraped News</h1>

      {loading ? (
        <p>Loading...</p>
      ) : blogs.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={40} className="mx-auto opacity-40 mb-3" />
          <p>No scraped news available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.map((blog, i) => (
            <motion.div
              key={blog._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl border flex justify-between items-center hover:bg-[var(--bg-secondary)]"
            >
              <div>
                <h3 className="font-semibold">{blog.title}</h3>
                <p className="text-sm text-gray-400">{blog.sourceName}</p>
              </div>

              <Link href={`/admin/scraped/${blog._id}`}>
                <button className="flex items-center gap-2 text-[var(--accent)]">
                  <Eye size={16} /> Preview
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}