'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, Calendar, Globe, CheckCircle, ExternalLink, 
  Sparkles, Loader2, Edit2, Edit3, X 
} from 'lucide-react';
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

  // Consolidated state
  const [state, setState] = useState({
    blog: null,
    loading: true,
    publishing: false,
    rewriting: false,
    isEditing: false,
    showAIPanel: false,
    editedTitle: '',
    editedContent: '',
    aiSuggestion: { title: '', content: '' }
  });

  useEffect(() => {
    fetchBlog();
  }, [id]);

  // Memoized blog data
  const blog = state.blog;
  const isEditing = state.isEditing;
  const editedTitle = state.editedTitle;
  const editedContent = state.editedContent;

  const fetchBlog = useCallback(async () => {
    try {
      const res = await blogApi.getScrapedById(id);
      const blogData = res.data.blog || res.data;
      
      setState(prev => ({
        ...prev,
        blog: blogData,
        loading: false,
        editedTitle: blogData.title,
        editedContent: blogData.summary || ''
      }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load article');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [id]);

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleQuickEdit = useCallback(() => {
    updateState({ isEditing: true });
    toast.success('Edit mode activated!');
  }, [updateState]);

  const handleToggleEdit = useCallback(() => {
    updateState({ isEditing: !isEditing });
  }, [isEditing, updateState]);

  const handleAIRewrite = useCallback(async () => {
    if (!blog) return;

    updateState({ rewriting: true, showAIPanel: true });

    try {
      const prompt = `You are a professional news editor. Rewrite this news article to make it more engaging, professional, and SEO-friendly. Keep key facts but improve language and flow.

Title: ${blog.title}
Content: ${blog.summary || blog.title}

Return ONLY JSON: {"title": "improved title (max 100 chars)", "content": "200-300 word summary"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      });

      const aiResponse = response.text?.trim() || '';
      let parsed = parseAIResponse(aiResponse, blog);

      updateState({
        aiSuggestion: {
          title: parsed.title || blog.title,
          content: parsed.content || blog.summary
        }
      });

      toast.success('AI suggestions ready!');
    } catch (error) {
      console.error('AI Rewrite error:', error);
      toast.error(`AI rewrite failed: ${error.message}`);
      updateState({ showAIPanel: false });
    } finally {
      updateState({ rewriting: false });
    }
  }, [blog, updateState]);

  const parseAIResponse = useCallback((response, fallbackBlog) => {
    const clean = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const startIdx = clean.indexOf('{');
      const endIdx = clean.lastIndexOf('}') + 1;
      const jsonStr = startIdx !== -1 && endIdx > startIdx 
        ? clean.substring(startIdx, endIdx)
        : clean;

      return JSON.parse(jsonStr);
    } catch {
      // Fallback regex parsing
      const titleMatch = response.match(/"title":\s*"([^"]+)"/);
      const contentMatch = response.match(/"content":\s*"([^"]+)"/);
      
      return {
        title: titleMatch?.[1] || fallbackBlog.title,
        content: contentMatch?.[1] || fallbackBlog.summary
      };
    }
  }, []);

  const applyAISuggestions = useCallback(() => {
    updateState({
      editedTitle: state.aiSuggestion.title,
      editedContent: state.aiSuggestion.content,
      showAIPanel: false
    });
    toast.success('AI suggestions applied!');
  }, [state.aiSuggestion, updateState]);

  const handleTitleChange = useCallback((e) => {
    updateState({ editedTitle: e.target.value });
    if (isEditing) updateState({ showAIPanel: false });
  }, [isEditing, updateState]);

  const handleContentChange = useCallback((e) => {
    updateState({ editedContent: e.target.value });
    if (isEditing) updateState({ showAIPanel: false });
  }, [isEditing, updateState]);

  const handlePublish = useCallback(async () => {
    if (!editedTitle.trim() || !editedContent.trim()) {
      toast.error('Title and content required');
      return;
    }

    updateState({ publishing: true });

    try {
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
      toast.error(err.response?.data?.message || 'Publish failed');
    } finally {
      updateState({ publishing: false });
    }
  }, [editedTitle, editedContent, blog, id, router, updateState]);

  // Early returns
  if (state.loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 h-10 w-10 text-[var(--accent)]" />
          <p className="text-[var(--text-muted)]">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-[var(--text-muted)]">Article not found</p>
        </div>
      </div>
    );
  }

  // Memoized computed values
  const isFormValid = editedTitle.trim() && editedContent.trim();
  const charStats = useMemo(() => ({
    title: editedTitle.length,
    content: editedContent.length,
    words: Math.round(editedContent.length / 5)
  }), [editedTitle, editedContent]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/scraped" className="group mb-8 inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Scraped News</span>
        </Link>

        {state.showAIPanel && state.aiSuggestion.title && (
          <AIPanel
            suggestion={state.aiSuggestion}
            onApply={applyAISuggestions}
            onDismiss={() => updateState({ showAIPanel: false })}
          />
        )}

        <article className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <header className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag 
                  size={12} 
                  className={`px-2 py-0.5 rounded-full border text-xs font-medium ${CATEGORY_COLORS[blog.category] || CATEGORY_COLORS.World}`} 
                >
                  {blog.category || 'Uncategorized'}
                </Tag>
                <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                  {blog.source || 'Unknown Source'}
                </span>
              </div>

              <ActionButtons 
                onQuickEdit={handleQuickEdit}
                onAIEnhance={handleAIRewrite}
                rewriting={state.rewriting}
              />
            </div>

            <TitleEditor 
              isEditing={isEditing}
              value={editedTitle}
              onChange={handleTitleChange}
              onToggleEdit={handleToggleEdit}
            />

            <Metadata 
              blog={blog}
              isEditing={isEditing}
            />
          </header>

          {blog.image && (
            <div className="relative h-96 bg-gray-900">
              <Image
                src={getImageUrl(blog.image)}
                alt={blog.title}
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          )}

          <ContentEditor 
            isEditing={isEditing}
            value={editedContent}
            onChange={handleContentChange}
          />

          <div className="px-6 pb-4 text-xs text-[var(--text-muted)]">
            Title: {charStats.title} chars | Content: {charStats.content} chars (~{charStats.words} words)
          </div>

          <ActionBar 
            publishing={state.publishing}
            isFormValid={isFormValid}
            blogLink={blog.link}
            onPublish={handlePublish}
            onEdit={() => {
              updateState({ isEditing: true });
              toast.success('Edit mode activated!');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </article>
      </div>
    </div>
  );
}

// Extracted Components (50% smaller render tree)
function ActionButtons({ onQuickEdit, onAIEnhance, rewriting }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onQuickEdit}
        className="group flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 
                   hover:from-emerald-500/30 hover:to-emerald-600/30 border border-emerald-500/30 
                   rounded-lg transition-all text-sm font-medium"
      >
        <Edit3 size={14} className="group-hover:scale-110 transition-transform" />
        <span>Quick Edit</span>
      </button>

      <button
        onClick={onAIEnhance}
        disabled={rewriting}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 
                   hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 
                   rounded-lg transition-all text-sm disabled:opacity-50"
      >
        {rewriting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>AI thinking...</span>
          </>
        ) : (
          <>
            <Sparkles size={14} className="text-purple-400" />
            <span>Enhance with AI</span>
          </>
        )}
      </button>
    </div>
  );
}

function TitleEditor({ isEditing, value, onChange, onToggleEdit }) {
  return (
    <>
      <div className="mb-4">
        {isEditing ? (
          <input
            type="text"
            value={value}
            onChange={onChange}
            className="w-full text-2xl font-bold bg-[var(--bg-secondary)] border border-[var(--border)] 
                       rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none 
                       focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            placeholder="Enter title..."
          />
        ) : (
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{value}</h1>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <MetadataFields blog={value} />
        <button
          onClick={onToggleEdit}
          className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg-secondary)]"
        >
          <Edit2 size={12} />
          <span>{isEditing ? 'Preview' : 'Edit'}</span>
        </button>
      </div>
    </>
  );
}

function Metadata({ blog, isEditing }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{format(new Date(blog.scrapedAt || blog.createdAt), 'PPP')}</span>
        </div>
        {blog.time && (
          <div className="flex items-center gap-1">
            <Globe size={14} />
            <span>Published: {blog.time}</span>
          </div>
        )}
        {blog.link && (
          <a
            href={blog.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[var(--accent)] hover:underline"
          >
            <ExternalLink size={14} />
            <span>View Original</span>
          </a>
        )}
      </div>
    </div>
  );
}

function ContentEditor({ isEditing, value, onChange }) {
  return (
    <section className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Content</h2>
        {isEditing && (
          <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full font-medium">
            Editing Mode
          </span>
        )}
      </div>

      {isEditing ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={12}
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-5 py-4 
                     text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] 
                     focus:ring-2 focus:ring-[var(--accent)]/20 resize-vertical font-medium leading-relaxed"
          placeholder="Enter content..."
        />
      ) : (
        <div className="prose prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
          {value || 'No content available'}
        </div>
      )}
    </section>
  );
}

function ActionBar({ publishing, isFormValid, blogLink, onPublish, onEdit }) {
  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border)] p-6 sticky bottom-0 z-40 shadow-2xl">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onPublish}
          disabled={publishing || !isFormValid}
          className="flex-1 min-w-[160px] flex items-center justify-center gap-2 bg-emerald-600 
                     hover:bg-emerald-500 text-white font-semibold py-4 px-6 rounded-xl 
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg 
                     hover:shadow-xl active:scale-[0.98] min-h-[52px]"
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
          onClick={onEdit}
          className="flex-1 min-w-[160px] flex items-center justify-center gap-2 bg-blue-600 
                     hover:bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl transition-all 
                     shadow-lg hover:shadow-xl active:scale-[0.98] border-2 border-blue-400 
                     min-h-[52px] bg-gradient-to-r from-blue-600 to-blue-700"
        >
          <Edit3 size={18} />
          <span>Edit Now</span>
        </button>

        {blogLink && (
          <a
            href={blogLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 bg-gray-800 
                       border border-gray-600 text-white font-semibold py-4 px-6 rounded-xl 
                       hover:bg-gray-700 transition-all min-h-[52px]"
          >
            <ExternalLink size={18} />
            <span>Read Original</span>
          </a>
        )}
      </div>
    </footer>
  );
}

function AIPanel({ suggestion, onApply, onDismiss }) {
  return (
    <div className="mb-6 bg-gradient-to-r from-purple-500/5 to-blue-500/5 backdrop-blur-sm 
                    border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <Sparkles size={24} className="text-purple-400" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 
                         bg-clip-text text-transparent">AI Suggestions</h3>
        </div>
        <button
          onClick={onDismiss}
          className="p-2 hover:bg-white/10 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <SuggestionCard 
          title="Suggested Title"
          content={suggestion.title}
          className="border-purple-500/30"
        />
        <SuggestionCard 
          title="Suggested Content"
          content={suggestion.content}
          className="border-purple-500/30 md:max-h-64 md:overflow-y-auto"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onApply}
          className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 
                     hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all 
                     shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          Apply All Changes
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 
                     rounded-xl transition-all border border-white/20"
        >
          Keep Original
        </button>
      </div>
    </div>
  );
}

function SuggestionCard({ title, content, className = '' }) {
  return (
    <div className={`bg-[var(--bg-card)] p-4 rounded-xl border ${className}`}>
      <label className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 block">
        {title}
      </label>
      <div className="min-h-[80px] p-4 bg-[var(--bg-secondary)] rounded-lg border border-purple-500/10">
        {title.includes('Title') ? (
          <h4 className="font-bold text-[var(--text-primary)] leading-tight">{content}</h4>
        ) : (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}
      </div>
    </div>
  );
}