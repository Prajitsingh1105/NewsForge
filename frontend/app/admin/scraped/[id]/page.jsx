'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Globe, Tag, CheckCircle, ExternalLink, Sparkles, Loader2, Edit2, X, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { blogApi, CATEGORY_COLORS, getImageUrl } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI with the new SDK (Gemini 3)
const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY
});

export default function ScrapedDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // AI Enhancement States
  const [rewriting, setRewriting] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchBlog();
  }, [id]);

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

  // Quick Edit Mode - Opens everything in edit mode instantly
  const handleQuickEdit = () => {
    setIsEditing(true);
    toast.success('Edit mode activated! Review and publish directly.');
  };

  // AI Rewrite Function using Gemini 3 API
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

      // Using the new Gemini 3 SDK structure
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          parts: [{ text: prompt }]
        }],
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        }
      });

      // New SDK returns response.text directly
      let aiResponse = response.text;
      console.log('AI Response:', aiResponse);

      // Clean the response
      let cleanResponse = aiResponse.trim();
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Parse the JSON response with better error handling
      let parsed;
      try {
        // Find the complete JSON object
        const startIdx = cleanResponse.indexOf('{');
        const endIdx = cleanResponse.lastIndexOf('}') + 1;

        if (startIdx !== -1 && endIdx > startIdx) {
          cleanResponse = cleanResponse.substring(startIdx, endIdx);
        }

        parsed = JSON.parse(cleanResponse);
      } catch (e) {
        console.error('JSON Parse error, using regex fallback');
        // Fallback: extract title and content using regex
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

      toast.success('AI suggestions ready! Review them below.');
    } catch (error) {
      console.error('AI Rewrite error:', error);
      toast.error(`Failed to rewrite content: ${error.message}`);
      setShowAIPanel(false);
    } finally {
      setRewriting(false);
    }
  };

  // Apply AI suggestions
  const applyAISuggestions = () => {
    setEditedTitle(aiSuggestion.title);
    setEditedContent(aiSuggestion.content);
    setShowAIPanel(false);
    toast.success('AI suggestions applied! You can further edit before publishing.');
  };

  // Manual edit handlers
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
          <Loader2 size={40} className="animate-spin mx-auto mb-4 text-[var(--accent)]" />
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">Article not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/admin/scraped">
          <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
            <ArrowLeft size={20} />
            Back to Scraped News
          </button>
        </Link>

        {/* AI Enhancement Panel */}
        {showAIPanel && aiSuggestion.title && (
          <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-purple-400" />
                <h3 className="font-semibold text-[var(--text-primary)]">AI Suggested Improvements</h3>
              </div>
              <button
                onClick={() => setShowAIPanel(false)}
                className="p-1 hover:bg-[var(--bg-primary)] rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 block">
                  Suggested Title
                </label>
                <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-purple-500/20">
                  <p className="text-sm">{aiSuggestion.title}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 block">
                  Suggested Content
                </label>
                <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-purple-500/20 max-h-48 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{aiSuggestion.content}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={applyAISuggestions}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Apply Suggestions
                </button>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors text-sm font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
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

              {/* Action Buttons - Updated with Quick Edit button */}
              <div className="flex items-center gap-2">
                {/* Quick Edit Button - NEW */}
                <button
                  onClick={handleQuickEdit}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 border border-emerald-500/30 rounded-lg transition-all text-sm font-medium group"
                >
                  <Edit3 size={14} className="group-hover:scale-110 transition-transform" />
                  <span>Quick Edit</span>
                </button>

                {/* AI Enhance Button */}
                <button
                  onClick={handleAIRewrite}
                  disabled={rewriting}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 rounded-lg transition-all text-sm"
                >
                  {rewriting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>AI is thinking...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-purple-400" />
                      <span>Enhance with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={handleTitleEdit}
                  className="w-full text-2xl font-bold bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  placeholder="Enter title..."
                />
              ) : (
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {editedTitle}
                </h1>
              )}
            </div>

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

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 text-xs hover:text-[var(--accent)] transition-colors"
              >
                <Edit2 size={12} />
                <span>{isEditing ? 'Preview Mode' : 'Edit Mode'}</span>
              </button>
            </div>
          </div>

          {blog.image && (
            <div className="relative w-full h-96 bg-gray-800">
              <Image
                src={getImageUrl(blog.image)}
                alt={blog.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Content</h2>
              {isEditing && (
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                  Editing Mode
                </span>
              )}
            </div>

            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={handleContentEdit}
                rows={12}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
                placeholder="Enter content..."
              />
            ) : (
              <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {editedContent || 'No content available'}
              </p>
            )}
          </div>

          <div className="px-6 pb-3 text-xs text-[var(--text-muted)]">
            Title: {editedTitle.length} chars | Content: {editedContent.length} chars (~{Math.round(editedContent.length / 5)} words)
          </div>

          <div className="p-6 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex gap-3">
            {/* Publish */}
            <button
              onClick={handlePublish}
              disabled={publishing || !editedTitle.trim() || !editedContent.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* ✅ FIXED: Edit Now button - Always visible */}
            <button
              onClick={() => {
                setIsEditing(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
              disabled={isEditing} // Disable when already editing
            >
              <Edit3 size={18} />
              <span>{isEditing ? 'In Edit Mode' : 'Edit Now'}</span>
            </button>

            {/* View Source */}
            <Link href={blog.link || '#'} target="_blank" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] font-semibold py-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                <ExternalLink size={18} />
                Read Original
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}