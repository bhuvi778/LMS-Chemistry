import { useEffect, useState } from 'react';
import { Rss, Heart, MessageCircle, Share2, Loader2, Clock, AlertCircle, X, ArrowRight, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [guestId, setGuestId] = useState('');
  const [guestName, setGuestName] = useState('Guest');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    let gid = localStorage.getItem('feed_guest_id');
    if (!gid) {
      gid = 'guest_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('feed_guest_id', gid);
    }
    setGuestId(gid);

    let gname = localStorage.getItem('feed_guest_name');
    if (!gname) {
      gname = 'Guest';
    }
    setGuestName(gname);
  }, []);

  useEffect(() => {
    api.get('/feed')
      .then(r => setPosts(r.data?.posts || r.data || []))
      .catch(() => setError('Failed to load feed'))
      .finally(() => setLoading(false));
  }, []);

  const handleLike = async (postId) => {
    try {
      const { data } = await api.post(`/feed/${postId}/like`, { guestId });
      setPosts((prev) => prev.map((p) => (p._id === postId ? data : p)));
      if (selectedItem && selectedItem._id === postId) {
        setSelectedItem(data);
      }
      const liked = data.likes?.some(
        (l) => (l.user === user?._id || l.user?._id === user?._id) || l.guestId === guestId
      );
      toast.success(liked ? 'Liked!' : 'Unliked');
    } catch (err) {
      toast.error('Failed to update like');
    }
  };

  const handleShare = (postId) => {
    const shareUrl = `${window.location.origin}/feed?post=${postId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success('Link copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy link');
      });
  };

  const hasLiked = (item) => {
    if (!item?.likes) return false;
    if (user) {
      return item.likes.some(
        (like) => (like.user?._id === user._id || like.user === user._id)
      );
    }
    return item.likes.some((like) => like.guestId === guestId);
  };

  const handleGuestNameChange = (e) => {
    const val = e.target.value;
    setGuestName(val);
    localStorage.setItem('feed_guest_name', val);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const payload = {
        content: commentText,
        guestId: user ? undefined : guestId,
        userName: user ? undefined : guestName,
      };
      const { data } = await api.post(`/feed/${selectedItem._id}/comment`, payload);
      setPosts((prev) => prev.map((p) => (p._id === selectedItem._id ? data : p)));
      setSelectedItem(data);
      setCommentText('');
      toast.success('Comment posted!');
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const { data } = await api.delete(`/feed/${postId}/comment/${commentId}`, {
        data: { guestId },
      });
      setPosts((prev) => prev.map((p) => (p._id === postId ? data : p)));
      setSelectedItem(data);
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

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
            <div
              key={post._id || i}
              onClick={() => setSelectedItem(post)}
              className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
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
                    className="text-slate-650 text-sm leading-relaxed prose prose-slate max-w-none break-words line-clamp-4"
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
              <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-50 text-slate-500 text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post._id);
                  }}
                  className={`flex items-center gap-1.5 font-semibold hover:text-rose-500 transition-colors ${
                    hasLiked(post) ? 'text-rose-500 font-bold' : ''
                  }`}
                >
                  <Heart size={14} className={hasLiked(post) ? 'fill-rose-500 text-rose-500' : ''} />
                  <span>{post.likes?.length || 0} Like</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(post);
                    setTimeout(() => {
                      document.getElementById(`comment-input-${post._id}`)?.focus();
                    }, 100);
                  }}
                  className="flex items-center gap-1.5 font-semibold hover:text-brand-600 transition-colors"
                >
                  <MessageCircle size={14} />
                  <span>{post.comments?.length || 0} Comment</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(post._id);
                  }}
                  className="flex items-center gap-1.5 font-semibold hover:text-indigo-600 transition-colors ml-auto"
                >
                  <Share2 size={14} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feed Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" onClick={() => setSelectedItem(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            {selectedItem.image && (
              <div className="h-64 overflow-hidden bg-slate-100 relative">
                <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {!selectedItem.image && (
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full p-2 transition z-10"
              >
                <X size={18} />
              </button>
            )}

            <div className="p-6 sm:p-8 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <Calendar size={14} />
                <span>
                  {selectedItem.createdAt
                    ? new Date(selectedItem.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recently'}
                </span>
              </div>
              <h2 className="font-display font-extrabold text-2xl text-slate-800 leading-snug">
                {selectedItem.title}
              </h2>
              <div
                className="text-slate-600 text-sm leading-relaxed prose prose-slate max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: selectedItem.content }}
              />

              {selectedItem.link && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={selectedItem.link}
                    target={selectedItem.link.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Visit Link <ArrowRight size={14} />
                  </a>
                </div>
              )}

              {/* Likes and Actions */}
              <div className="flex items-center justify-between border-y border-slate-100 py-3 mt-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(selectedItem._id)}
                    className={`flex items-center gap-2 text-sm hover:text-rose-500 transition-colors ${
                      hasLiked(selectedItem) ? 'text-rose-500 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <Heart size={18} className={hasLiked(selectedItem) ? 'fill-rose-500 text-rose-500' : ''} />
                    <span>{selectedItem.likes?.length || 0} Likes</span>
                  </button>
                </div>
                <button
                  onClick={() => handleShare(selectedItem._id)}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <Share2 size={18} />
                  <span>Share Link</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <MessageCircle size={16} />
                  Comments ({selectedItem.comments?.length || 0})
                </h3>

                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  {!user && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold shrink-0">Comment as:</span>
                      <input
                        type="text"
                        value={guestName}
                        onChange={handleGuestNameChange}
                        placeholder="Guest Name"
                        className="input text-xs py-1 px-2.5 max-w-[150px] h-8 bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      id={`comment-input-${selectedItem._id}`}
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={user ? "Write a comment..." : "Write a comment as guest..."}
                      className="input flex-1 text-sm py-2 px-3 border-slate-200"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="btn-primary py-2 px-4 text-xs font-bold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3 divide-y divide-slate-100 max-h-[30vh] overflow-y-auto pr-1">
                  {selectedItem.comments && selectedItem.comments.length > 0 ? (
                    selectedItem.comments.map((comment) => {
                      const isCommentOwner = user
                        ? (comment.user?._id === user._id || comment.user === user._id)
                        : (comment.guestId === guestId);
                      const isAdmin = user?.role === 'admin';

                      return (
                        <div key={comment._id} className="pt-3 first:pt-0 flex items-start gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0 border border-slate-200">
                            {comment.userName?.charAt(0).toUpperCase() || 'G'}
                          </div>
                          <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2 text-xs relative">
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <span className="font-bold text-slate-700">{comment.userName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">
                                  {new Date(comment.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                  })}
                                </span>
                                {(isCommentOwner || isAdmin) && (
                                  <button
                                    type="button"
                                    onClick={() => handleCommentDelete(selectedItem._id, comment._id)}
                                    className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity font-semibold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-605 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
