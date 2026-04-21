'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Globe,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Loader2,
  Edit2,
  X,
  Edit3,
  FileText,
  Wand2,
  PenSquare,
  Eye,
  LayoutPanelTop,
} from 'lucide-react';
import { format } from 'date-fns';
import { blogApi, CATEGORY_COLORS, getImageUrl } from '../../../lib/api';
import toast from 'react-hot-toast';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
});

export default function ScrapedDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [rewriting, setRewriting] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState({ title: '', content: '' });

  useEffect(() => {
    if (!id) return;
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await blogApi.getScrapedById(id);
      const blogData = res.data.blog || res.data;

      setBlog(blogData);
      setEditedTitle(blogData.title || '');
      setEditedContent(blogData.summary || '');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEdit = () => {
    setIsEditing(true);
    toast.success('Edit mode activated! Review and publish directly.');
  };

  const handleAIRewrite = async () => {
    if (!blog) return;

    setRewriting(true);
    setShowAIPanel(true);

    try {
      const prompt = `You are a professional news editor. Rewrite the following news article to make it more engaging, professional, and SEO-friendly. Keep the same key facts but improve the language, flow, and readability.

Original Title: ${blog.title}
Original Content: ${blog.summary || blog.title}

Please provide the response in JSON format with two fields:
- "title": An improved, click-worthy title (max 100 characters)
- "content": A well-written, engaging summary/content (200-300 words)

Make sure the content is factual, neutral, and professional.

Return ONLY the JSON object, no other text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });

      let aiResponse = response.text;
      console.log('AI Response:', aiResponse);

      let cleanResponse = aiResponse.trim();
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      let parsed;
      try {
        const startIdx = cleanResponse.indexOf('{');
        const endIdx = cleanResponse.lastIndexOf('}') + 1;

        if (startIdx !== -1 && endIdx > startIdx) {
          cleanResponse = cleanResponse.substring(startIdx, endIdx);
        }

        parsed = JSON.parse(cleanResponse);
      } catch (e) {
        console.error('JSON Parse error, using regex fallback');
        const titleMatch = aiResponse.match(/"title":\s*"([^"]+)"/);
        const contentMatch = aiResponse.match(/"content":\s*"([^"]+)/);

        parsed = {
          title: titleMatch ? titleMatch[1] : blog.title,
          content: contentMatch ? contentMatch[1] : blog.summary,
        };
      }

      setAiSuggestion({
        title: parsed.title || blog.title,
        content: parsed.content || blog.summary,
      });

      toast.success('AI suggestions ready! Review them below.');
    } catch (error) {
      console.error('AI Rewrite error:', error);
      toast.error(`Failed to rewrite content: ${error.message}`);
      setShowAIPanel(false);
    } finally {
      setRewriting(false);
    }
  };

  const applyAISuggestions = () => {
    setEditedTitle(aiSuggestion.title);
    setEditedContent(aiSuggestion.content);
    setShowAIPanel(false);
    setIsEditing(true);
    toast.success('AI suggestions applied! You can further edit before publishing.');
  };

  const handleTitleEdit = (e) => {
    setEditedTitle(e.target.value);
    if (isEditing) {
      setShowAIPanel(false);
    }
  };

  const handleContentEdit = (e) => {
    setEditedContent(e.target.value);
    if (isEditing) {
      setShowAIPanel(false);
    }
  };

  const handlePublish = async () => {
    if (!editedTitle.trim() || !editedContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setPublishing(true);

      const formData = new FormData();
      formData.append('title', editedTitle);
      formData.append('content', editedContent);
      formData.append('excerpt', editedContent.substring(0, 200));
      formData.append('category', blog.category);
      formData.append('sourceName', blog.source);
      formData.append('sourceUrl', blog.link);

      if (blog.image) {
        formData.append('image', blog.image);
      }

      await blogApi.publishScrapedWithData(id, formData);

      toast.success('Article published successfully with AI-enhanced content!');
      router.push('/admin/scraped');
    } catch (err) {
      console.error('Error publishing:', err);
      toast.error(err.response?.data?.message || 'Failed to publish article');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={42} className="animate-spin mx-auto mb-4 text-[var(--accent)]" />
          <p className="text-[var(--text-muted)]">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center text-[var(--text-primary)]">Article not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        <Link
          href="/admin/scraped"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Scraped News</span>
        </Link>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                        CATEGORY_COLORS[blog.category] || CATEGORY_COLORS.World
                      }`}
                    >
                      {blog.category || 'Uncategorized'}
                    </span>

                    <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full font-medium">
                      {blog.source || 'Unknown Source'}
                    </span>

                    <span className="text-xs bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)] px-2.5 py-1 rounded-full font-medium">
                      Scraped Article
                    </span>
                  </div>

                  {!isEditing ? (
                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-[var(--text-primary)] max-w-4xl">
                      {editedTitle}
                    </h1>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Article Title
                      </label>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={handleTitleEdit}
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-lg sm:text-xl font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                        placeholder="Enter title..."
                      />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{format(new Date(blog.scrapedAt || blog.createdAt), 'PPP')}</span>
                    </div>

                    {blog.time && (
                      <div className="flex items-center gap-1.5">
                        <Globe size={14} />
                        <span>Published: {blog.time}</span>
                      </div>
                    )}

                    {blog.link && (
                      <a
                        href={blog.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline"
                      >
                        <ExternalLink size={14} />
                        <span>View Original</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleQuickEdit}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors text-sm font-semibold"
                  >
                    <Edit3 size={16} />
                    <span>Quick Edit</span>
                  </button>

                  <button
                    onClick={handleAIRewrite}
                    disabled={rewriting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/15 transition-colors text-sm font-semibold disabled:opacity-60"
                  >
                    {rewriting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>AI is thinking...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Enhance with AI</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors text-sm font-semibold"
                  >
                    <Edit2 size={16} />
                    <span>{isEditing ? 'Preview Mode' : 'Edit Mode'}</span>
                  </button>
                </div>
              </div>
            </div>

            {showAIPanel && aiSuggestion.title && (
              <div className="border-b border-[var(--border)] bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-cyan-500/10 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/20">
                        <Wand2 size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          AI Suggested Improvements
                        </h3>
                        <p className="text-sm text-[var(--text-muted)]">
                          Review and apply the refined title and summary before publishing.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowAIPanel(false)}
                      className="p-2 rounded-xl hover:bg-[var(--bg-primary)]/70 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-purple-500/20 bg-[var(--bg-card)] p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-purple-400">
                        Suggested Title
                      </label>
                      <p className="text-sm leading-6 text-[var(--text-primary)]">
                        {aiSuggestion.title}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-purple-500/20 bg-[var(--bg-card)] p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-purple-400">
                        Suggested Content
                      </label>
                      <p className="text-sm leading-6 whitespace-pre-wrap text-[var(--text-primary)] max-h-56 overflow-y-auto pr-1">
                        {aiSuggestion.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={applyAISuggestions}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-600 transition-colors"
                    >
                      <Sparkles size={16} />
                      <span>Apply Suggestions</span>
                    </button>

                    <button
                      onClick={() => setShowAIPanel(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <X size={16} />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {blog.image && (
              <div className="relative w-full h-72 sm:h-96 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <Image
                  src={getImageUrl(blog.image)}
                  alt={blog.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
              </div>
            )}

            {!isEditing ? (
              <div className="px-5 py-6 sm:px-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText size={18} className="text-[var(--accent)]" />
                      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Content</h2>
                    </div>

                    <p className="whitespace-pre-wrap text-[var(--text-secondary)] leading-8">
                      {editedContent || 'No content available'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <LayoutPanelTop size={16} className="text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          Article Info
                        </h3>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-[var(--text-muted)]">Title length</p>
                          <p className="font-medium text-[var(--text-primary)]">
                            {editedTitle.length} characters
                          </p>
                        </div>

                        <div>
                          <p className="text-[var(--text-muted)]">Content length</p>
                          <p className="font-medium text-[var(--text-primary)]">
                            {editedContent.length} characters
                          </p>
                        </div>

                        <div>
                          <p className="text-[var(--text-muted)]">Estimated words</p>
                          <p className="font-medium text-[var(--text-primary)]">
                            ~{Math.round(editedContent.length / 5)} words
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Eye size={16} className="text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          Publishing Tips
                        </h3>
                      </div>

                      <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                        <li>Review the generated summary before publishing.</li>
                        <li>Use Edit Now to align tone with your site.</li>
                        <li>Keep the title sharp and readable.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 py-6 sm:px-6">
                <div className="mx-auto max-w-5xl">
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                      <PenSquare size={13} />
                      Editor Open
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                      Refine the article in a blog-form style workspace.
                    </span>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={handleTitleEdit}
                          placeholder="Enter a compelling headline..."
                          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 text-xl font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Summary / Content *
                        </label>
                        <textarea
                          value={editedContent}
                          onChange={handleContentEdit}
                          rows={16}
                          placeholder="Refine the scraped article before publishing..."
                          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 text-sm leading-7 text-[var(--text-primary)] outline-none resize-y focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                        />
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          Keep the summary clean, factual, and readable for your blog listing page.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                        <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                          Article Settings
                        </h3>

                        <div className="space-y-4 text-sm">
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">Category</p>
                            <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 font-medium text-[var(--text-primary)]">
                              {blog.category || 'Uncategorized'}
                            </div>
                          </div>

                          <div>
                            <p className="text-[var(--text-muted)] mb-1">Source</p>
                            <div className="inline-flex rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 font-medium text-purple-400">
                              {blog.source || 'Unknown Source'}
                            </div>
                          </div>

                          <div>
                            <p className="text-[var(--text-muted)] mb-1">Publish excerpt</p>
                            <p className="text-[var(--text-primary)]">
                              First 200 characters will be used automatically.
                            </p>
                          </div>
                        </div>
                      </div>

                      {(blog.image || editedTitle) && (
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                          <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                            Preview
                          </h3>

                          <div className="flex items-start gap-3">
                            {blog.image && (
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-secondary)]">
                                <Image
                                  src={getImageUrl(blog.image)}
                                  alt="preview"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}

                            <div className="min-w-0">
                              <span className="inline-flex rounded-full bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 text-xs font-semibold">
                                {blog.category || 'Uncategorized'}
                              </span>
                              <p className="mt-2 text-sm font-bold text-[var(--text-primary)] line-clamp-2">
                                {editedTitle || 'Untitled article'}
                              </p>
                              {editedContent && (
                                <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-3">
                                  {editedContent}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                          Writing Metrics
                        </h3>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[var(--text-muted)]">Title</span>
                            <span className="font-medium text-[var(--text-primary)]">
                              {editedTitle.length} chars
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[var(--text-muted)]">Content</span>
                            <span className="font-medium text-[var(--text-primary)]">
                              {editedContent.length} chars
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[var(--text-muted)]">Words</span>
                            <span className="font-medium text-[var(--text-primary)]">
                              ~{Math.round(editedContent.length / 5)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row">
                <button
                  onClick={handlePublish}
                  disabled={publishing || !editedTitle.trim() || !editedContent.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 text-white font-semibold transition-colors hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>Publish to Website</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsEditing(true);
                    toast.success('Edit mode activated!');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-white font-semibold transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                >
                  <Edit3 size={18} />
                  <span>Edit Now</span>
                </button>

                <a
                  href={blog.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3.5 text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <ExternalLink size={18} />
                  <span>Read Original</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}