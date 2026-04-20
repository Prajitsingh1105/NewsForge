'use client';
import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Clock, ArrowRight, Flame, Zap } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BlogCard from '../components/blog/BlogCard';
import CategoryTabs from '../components/blog/CategoryTabs';
import { CardSkeleton } from '../components/ui/Skeletons';
import { blogApi, getImageUrl } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';

const LOCAL_FALLBACK_IMAGE = '/images/fallback-blog.jpg';

function SafeHeroImage({ blog }) {
  const primarySrc = useMemo(() => getImageUrl(blog?.image), [blog?.image]);
  const [imgSrc, setImgSrc] = useState(primarySrc);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImgSrc(primarySrc);
    setFailed(false);
  }, [primarySrc]);

  return (
    <>
      {!failed ? (
        <Image
          src={imgSrc}
          alt={blog?.title || 'Featured story'}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          onError={() => {
            setImgSrc(LOCAL_FALLBACK_IMAGE);
            setFailed(true);
          }}
        />
      ) : (
        <Image
          src={LOCAL_FALLBACK_IMAGE}
          alt={blog?.title || 'Featured story'}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      )}
    </>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [blogs, setBlogs] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBlogs = useCallback(async (cat, pg, reset = false) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = { page: pg, limit: 9 };
      if (cat !== 'All') params.category = cat;
      if (search) params.search = search;

      const res = await blogApi.getAll(params);
      const newBlogs = res.data.blogs || [];
      const totalPages = res.data?.pagination?.pages || 1;

      if (reset || pg === 1) {
        setBlogs(newBlogs);

        if (pg === 1 && cat === 'All' && !search) {
          const featuredBlog = newBlogs.find((b) => b.featured) || newBlogs[0] || null;
          setFeatured(featuredBlog);
        } else {
          setFeatured(null);
        }
      } else {
        setBlogs((prev) => [...prev, ...newBlogs]);
      }

      setHasMore(pg < totalPages);
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      if (pg === 1) {
        setBlogs([]);
        setFeatured(null);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search]);

  const fetchTrending = useCallback(async () => {
    try {
      const res = await blogApi.getAll({ limit: 4 });
      setTrending((res.data.blogs || []).slice(0, 4));
    } catch (err) {
      console.error('Failed to fetch trending blogs:', err);
      setTrending([]);
    }
  }, []);

  useEffect(() => {
    fetchBlogs(category, 1, true);
    setPage(1);
  }, [category, search, fetchBlogs]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    router.push(cat === 'All' ? '/' : `/?category=${encodeURIComponent(cat)}`, { scroll: false });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBlogs(category, nextPage);
  };

  const displayBlogs =
    featured && category === 'All' && !search
      ? blogs.filter((b) => b._id !== featured._id)
      : blogs;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[var(--bg-primary)]">
        <AnimatePresence mode="wait">
          {!loading && featured ? (
            <motion.section
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-[82vh] min-h-[540px] overflow-hidden"
            >
              <SafeHeroImage blog={featured} />

              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <motion.div
                className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[var(--accent)]/20 blur-[120px]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ repeat: Infinity, duration: 6 }}
              />

              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-3xl">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-2 mb-6 flex-wrap"
                    >
                      <span className="flex items-center gap-1.5 bg-[var(--accent)] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                        <Flame size={12} />
                        Featured Story
                      </span>

                      <span className="bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
                        {featured.category}
                      </span>
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.7 }}
                      className="font-display font-black text-4xl md:text-6xl text-white leading-tight mb-6"
                    >
                      {featured.title}
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="text-white/80 text-lg md:text-xl mb-8 line-clamp-3 max-w-2xl"
                    >
                      {featured.excerpt}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                      className="flex flex-wrap items-center gap-4"
                    >
                      <Link href={`/blog/${featured._id}`}>
                        <motion.button
                          className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-3 rounded-full transition-colors duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          Read Full Story <ArrowRight size={16} />
                        </motion.button>
                      </Link>

                      <div className="flex items-center gap-3 text-white/60 text-sm">
                        <Clock size={14} />
                        <span>{featured.readTime || 5} min read</span>
                        <span>·</span>
                        <span>
                          {formatDistanceToNow(new Date(featured.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
            </motion.section>
          ) : loading ? (
            <motion.div
              key="hero-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="skeleton h-[82vh] min-h-[540px]"
            />
          ) : (
            <div key="hero-empty" className="h-16" />
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {trending.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="py-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full px-3 py-1.5">
                  <TrendingUp size={14} className="text-[var(--accent)]" />
                  <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                    Trending
                  </span>
                </div>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trending.map((blog, i) => (
                  <BlogCard key={blog._id} blog={blog} variant="compact" index={i} />
                ))}
              </div>
            </motion.section>
          )}

          <section className="pb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full px-3 py-1.5">
                <Zap size={14} className="text-[var(--accent)] fill-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                  Latest
                </span>
              </div>

              <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
                News
              </h2>
            </div>

            <div className="mb-8">
              <CategoryTabs active={category} onChange={handleCategoryChange} />
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="grid-skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </motion.div>
              ) : displayBlogs.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24"
                >
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="font-display text-2xl text-[var(--text-primary)] mb-2">
                    No stories found
                  </h3>
                  <p className="text-[var(--text-muted)]">
                    Try a different category or search term
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={`grid-${category}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {displayBlogs.map((blog, i) => (
                    <BlogCard key={blog._id} blog={blog} variant="default" index={i} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {hasMore && !loading && displayBlogs.length > 0 && (
              <div className="text-center mt-12">
                <motion.button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-[var(--accent)] text-[var(--accent)] font-semibold hover:bg-[var(--accent)] hover:text-white transition-all duration-200 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Stories <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="skeleton h-screen" />}>
      <HomeContent />
    </Suspense>
  );
}