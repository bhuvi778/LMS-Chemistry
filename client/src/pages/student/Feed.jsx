import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { Rss, Heart, MessageCircle, Share2, Loader2, Clock, Image, AlertCircle } from 'lucide-react';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/feed')
      .then(r => setPosts(r.data?.posts || r.data || []))
      .catch(() => setError('Failed to load feed'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <Rss size={22} className="text-brand-600" /> Feed
        </h1>
        <p className="text-sm text-slate-500 mt-1">Stay updated with the latest news, announcements and posts from Ace2Examz.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 size={28} className="animate-spin text-brand-600 mr-2" />
          <span className="font-semibold">Loading feed...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Rss size={28} className="text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-600 text-lg">No Posts Yet</h3>
          <p className="text-slate-400 text-sm mt-1">Check back soon for announcements and updates from your instructors.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {posts.map((post, i) => (
            <div key={post._id || i} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex items-center gap-3 p-5 pb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-brand text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                  A
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">Ace2Examz</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={11} />
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                  </div>
                </div>
                {post.type && (
                  <span className="ml-auto px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {post.type}
                  </span>
                )}
              </div>
              {/* Content */}
              <div className="px-5 pb-4">
                {post.title && (
                  <h3 className="font-display font-extrabold text-slate-800 text-base mb-2">{post.title}</h3>
                )}
                {post.content && (
                  <div
                    className="text-slate-650 text-sm leading-relaxed prose prose-slate max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                )}
              </div>
              {/* Image */}
              {post.image && (
                <div className="w-full aspect-video bg-slate-100 overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                </div>
              )}
              {/* Footer */}
              <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-50">
                <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 font-semibold transition">
                  <Heart size={14} /> Like
                </button>
                <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-600 font-semibold transition">
                  <MessageCircle size={14} /> Comment
                </button>
                <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 font-semibold transition ml-auto">
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
