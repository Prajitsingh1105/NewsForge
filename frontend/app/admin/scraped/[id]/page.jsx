'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Globe, CheckCircle, ExternalLink, Sparkles, Loader2, Edit2, X, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { blogApi, CATEGORY_COLORS, getImageUrl } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY
});

export default function ScrapedDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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
    fetchBlog();
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [id, searchParams]);

  const fetchBlog = async () => {
    try {
      const res = await blogApi.getScrapedById(id);
      const blogData = res.data.blog || res.data;
      setBlog(blogData);
      setEditedTitle(blogData.title);
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
    toast.success('Edit mode activated!');
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

Return ONLY the JSON object, no other text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        }
      });

      let aiResponse = response.text;
      let cleanResponse = aiResponse.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      let parsed;
      try {
        const startIdx = cleanResponse.indexOf('{');
        const endIdx = cleanResponse.lastIndexOf('}') + 1;
        if (startIdx !== -1 && endIdx > startIdx) {
          cleanResponse = cleanResponse.substring(startIdx, endIdx);
        }
        parsed = JSON.parse(cleanResponse);
      } catch (e) {
        const titleMatch = aiResponse.match(/"title":\s*"([^"]+)"/);
        const contentMatch = aiResponse.match(/"content":\s*"([^"]+)/);
        parsed = {
          title: titleMatch ? titleMatch[1] : blog.title,
          content: contentMatch ? contentMatch[1] : blog.summary
        };
      }
      setAiSuggestion({
        title: parsed.title || blog.title,
        content: parsed.content || blog.summary
      });
      toast.success('AI suggestions ready!');
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
    toast.success('AI suggestions applied!');
  };

  const handleTitleEdit = (e) => {
    setEditedTitle(e.target.value);
    if (isEditing) setShowAIPanel(false);
  };

  const handleContentEdit = (e) => {
    setEditedContent(e.target.value);
    if (isEditing) setShowAIPanel(false);
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
      if (blog.image) formData.append('image', blog.image);
      await blogApi.publishScrapedWithData(id, formData);
      toast.success('Article published successfully!');
      router.push('/admin/scraped');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish article');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <Loader2 size={40} className="animate-spin text-[var(--accent)]" />
    </div>
  );

  if (!blog) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-center">Article not found</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/scraped">
          <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
            <ArrowLeft size={20} />
            Back to Scraped News
          </button>
        </Link>

        {showAIPanel && aiSuggestion.title && (
          <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-purple-400" />
                <h3 className="font-semibold text-[var(--text-primary)]">AI Suggested Improvements</h3>
              </div>
              <button onClick={() => setShowAIPanel(false)} className="p-1 hover:bg-[var(--bg-primary)] rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 block">Suggested Title</label>
                <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-purple-500/20 text-sm">{aiSuggestion.title}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 block">Suggested Content</label>
                <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-purple-500/20 max-h-48 overflow-y-auto text-sm whitespace-pre-wrap">{aiSuggestion.content}</div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={applyAISuggestions} className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium">Apply Suggestions</button>
                <button onClick={() => setShowAIPanel(false)} className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg text-sm font-medium">Dismiss</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[blog.category] || CATEGORY_COLORS.World}`}>
                  {blog.category || 'Uncategorized'}
                </span>
                <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                  {blog.source || 'Unknown Source'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleQuickEdit} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium">
                  <Edit3 size={14} />
                  <span>Quick Edit</span>
                </button>
                <button onClick={handleAIRewrite} disabled={rewriting} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm">
                  {rewriting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>{rewriting ? 'Thinking...' : 'AI Enhance'}</span>
                </button>
              </div>
            </div>
            <div className="mb-4">
              {isEditing ? (
                <input type="text" value={editedTitle} onChange={handleTitleEdit} className="w-full text-2xl font-bold bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]" />
              ) : (
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{editedTitle}</h1>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1"><Calendar size={14} /><span>{format(new Date(blog.scrapedAt || blog.createdAt), 'PPP')}</span></div>
                {blog.link && (
                  <a href={blog.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[var(--accent)] hover:underline">
                    <ExternalLink size={14} /><span>View Original</span>
                  </a>
                )}
              </div>
              <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-1 text-xs hover:text-[var(--accent)]">
                <Edit2 size={12} /><span>{isEditing ? 'Preview' : 'Edit Mode'}</span>
              </button>
            </div>
          </div>

          {blog.image && (
            <div className="relative w-full h-96 bg-gray-800">
              <Image src={getImageUrl(blog.image)} alt={blog.title} fill className="object-cover" />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Content</h2>
              {isEditing && <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Editing Mode</span>}
            </div>
            {isEditing ? (
              <textarea value={editedContent} onChange={handleContentEdit} rows={12} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-vertical" />
            ) : (
              <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{editedContent || 'No content available'}</p>
            )}
          </div>

          <div className="sticky bottom-0 z-50 p-6 bg-slate-900 border-t border-gray-700 flex flex-wrap md:flex-nowrap gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
            <button onClick={handlePublish} disabled={publishing || !editedTitle.trim() || !editedContent.trim()} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
              {publishing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              <span>{publishing ? 'Publishing...' : 'Publish to Website'}</span>
            </button>
            <button onClick={() => { setIsEditing(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all border-2 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Edit3 size={18} />
              <span>Edit Now</span>
            </button>
            {blog.link && (
              <a href={blog.link} target="_blank" className="flex-1 flex items-center justify-center gap-2 bg-gray-800 border border-gray-600 text-white font-semibold py-3 rounded-xl hover:bg-gray-700 transition-colors">
                <ExternalLink size={18} />
                <span>Read Original</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}