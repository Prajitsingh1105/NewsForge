'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Sparkles,
  Loader2,
  Edit2,
  CheckCircle,
  Edit3,
  X
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
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEdit = () => {
    setIsEditing(true);
    toast.success('Edit mode activated!');
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
      toast.error('Failed to publish article');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Article not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* BACK */}
        <Link href="/admin/scraped">
          <button className="flex items-center gap-2 mb-6">
            <ArrowLeft size={18} />
            Back
          </button>
        </Link>

        {/* HEADER */}
        <div className="bg-[var(--bg-card)] border rounded-2xl overflow-hidden">

          <div className="p-6 border-b">

            <div className="flex flex-wrap justify-between gap-3 mb-4">

              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded bg-gray-800">
                  {blog.category || 'Uncategorized'}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-purple-800">
                  {blog.source || 'Unknown'}
                </span>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap gap-3">

                <button
                  onClick={handleQuickEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  <Edit3 size={14} />
                  Quick Edit
                </button>

              </div>

            </div>

            {/* TITLE */}
            {isEditing ? (
              <input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-2xl font-bold p-2 border rounded"
              />
            ) : (
              <h1 className="text-2xl font-bold">{editedTitle}</h1>
            )}

            {/* META */}
            <div className="flex gap-4 text-sm mt-3">

              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {format(new Date(blog.createdAt), 'PPP')}
              </div>

              {blog.link && (
                <a
                  href={blog.link}
                  target="_blank"
                  className="flex items-center gap-1 text-blue-400"
                >
                  <ExternalLink size={14} />
                  Read Original
                </a>
              )}

            </div>

          </div>

          {/* IMAGE */}
          {blog.image && (
            <div className="relative w-full h-96">
              <Image
                src={getImageUrl(blog.image)}
                alt={blog.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* CONTENT */}
          <div className="p-6">

            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={12}
                className="w-full border p-3 rounded"
              />
            ) : (
              <p className="whitespace-pre-wrap">{editedContent}</p>
            )}

          </div>

          {/* STICKY ACTION BAR */}
          <div className="sticky bottom-0 bg-gray-900 border-t p-4">

            <div className="flex flex-col sm:flex-row gap-3">

              {/* PUBLISH */}
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg"
              >
                {publishing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Publish
              </button>

              {/* EDIT */}
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg"
              >
                <Edit3 size={18} />
                Edit Now
              </button>

              {/* VIEW ORIGINAL */}
              {blog.link && (
                <a
                  href={blog.link}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-lg"
                >
                  <ExternalLink size={18} />
                  Original
                </a>
              )}

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}