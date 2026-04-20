'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, Eye, ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CATEGORY_COLORS } from '../../lib/api';

export default function BlogCard({ blog, variant = 'default', index = 0 }) {
  const imageUrl = blog.image || '';
  const timeAgo = formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true });
  const categoryColor = CATEGORY_COLORS[blog.category] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="group relative h-[520px] rounded-2xl overflow-hidden cursor-pointer"
      >
        <Link href={`/blog/${blog._id}`} className="block h-full">
          <div className="absolute inset-0">
            <Image 
              src={imageUrl} 
              alt={blog.title} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105" 
              priority 
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>

          {blog.featured && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-[var(--accent)] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">★ Featured</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-7 z-10">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryColor} mb-3 inline-block`}>{blog.category}</span>
            <h2 className="font-display font-bold text-white text-2xl md:text-3xl leading-tight mb-3 group-hover:text-[var(--accent)] transition-colors duration-300">
              {blog.title}
            </h2>
            <p className="text-white/70 text-sm line-clamp-2 mb-4">{blog.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-white/50 text-xs">
                <span className="flex items-center gap-1"><Clock size={12} />{blog.readTime || 5} min read</span>
                <span className="flex items-center gap-1"><Eye size={12} />{(blog.views || 0).toLocaleString()}</span>
                <span>{timeAgo}</span>
              </div>
              <motion.div
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:border-transparent transition-all duration-300"
                whileHover={{ scale: 1.1 }}
              >
                <ArrowUpRight size={16} className="text-white" />
              </motion.div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className="group flex gap-4 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200"
      >
        <Link href={`/blog/${blog._id}`} className="flex gap-4 w-full">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
            <Image 
              src={imageUrl} 
              alt={blog.title} 
              fill 
              className="object-cover group-hover:scale-110 transition-transform duration-300" 
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${categoryColor} inline-block mb-1.5`}>{blog.category}</span>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--accent)] transition-colors">{blog.title}</h3>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-muted)]">
              <Clock size={11} /><span>{blog.readTime || 5} min</span><span>·</span><span>{timeAgo}</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.06 }}
      >
        <Link href={`/blog/${blog._id}`} className="group block">
          <div className="relative h-44 rounded-xl overflow-hidden mb-3">
            <Image 
              src={imageUrl} 
              alt={blog.title} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-500" 
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full border ${categoryColor} backdrop-blur-sm`}>{blog.category}</span>
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors leading-snug">{blog.title}</h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-muted)]">
            <Clock size={11} /><span>{blog.readTime || 5} min</span><span>·</span><span>{timeAgo}</span>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Default card
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      whileHover={{ y: -4 }}
      className="group bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all duration-300 hover:shadow-editorial"
    >
      <Link href={`/blog/${blog._id}`} className="block">
        <div className="relative h-52 overflow-hidden">
          <Image 
            src={imageUrl} 
            alt={blog.title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-700" 
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {blog.featured && (
            <div className="absolute top-3 right-3">
              <span className="bg-[var(--accent)] text-white text-xs font-bold px-2.5 py-1 rounded-full">★</span>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryColor}`}>{blog.category}</span>
            <span className="text-xs text-[var(--text-muted)]">{timeAgo}</span>
          </div>

          <h3 className="font-display font-bold text-[var(--text-primary)] text-lg leading-snug mb-2 group-hover:text-[var(--accent)] transition-colors duration-200 line-clamp-2">
            {blog.title}
          </h3>

          <p className="text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-4">{blog.excerpt}</p>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1"><Clock size={12} />{blog.readTime || 5} min</span>
              <span className="flex items-center gap-1"><Eye size={12} />{(blog.views || 0).toLocaleString()}</span>
            </div>
            <span className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Read more <ArrowUpRight size={13} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}