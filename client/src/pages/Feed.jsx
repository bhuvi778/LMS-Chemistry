import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { Calendar, Search, Loader2, ArrowRight, BookOpen, X, Heart, MessageCircle, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Feed() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
      .then(({ data }) => {
        setList(data || []);
      })
      .catch((err) => {
        toast.error('Failed to load feed announcements');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (list.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('post');
      if (postId) {
        const found = list.find((item) => item._id === postId);
        if (found) {
          setSelectedItem(found);
        }
      }
    }
  }, [list]);

  const filtered = list.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (ts) => {
    return new Date(ts).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPlainSummary = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await api.post(`/feed/${postId}/like`, { guestId });
      setList((prev) => prev.map((p) => (p._id === postId ? data : p)));
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
      setList((prev) => prev.map((p) => (p._id === selectedItem._id ? data : p)));
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
      setList((prev) => prev.map((p) => (p._id === postId ? data : p)));
      setSelectedItem(data);
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container-x">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider">
              News & Announcements
            </span>
            <h1 className="font-display text-3xl font-extrabold text-slate-800 mt-2">Latest Updates</h1>
            <p className="text-slate-500 text-sm mt-1">Stay updated with the latest updates, CBSE/NEET tips, and platform news.</p>
          </div>

          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={36} className="animate-spin text-brand-500 mb-3" />
            <div className="text-sm">Loading feed items...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 max-w-lg mx-auto">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-700 text-lg">No updates found</h3>
            <p className="text-sm mt-1">Check back later for announcements and newsletters!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className="card bg-white shadow-soft hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col h-full overflow-hidden border border-slate-100 cursor-pointer"
              >
                {item.image && (
                  <div className="h-48 overflow-hidden bg-slate-100 relative shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-3">
                      <Calendar size={13} />
                      <span>{fmtDate(item.createdAt)}</span>
                    </div>
                    <h3 className="font-display font-extrabold text-slate-800 text-lg leading-snug mb-3">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                      {getPlainSummary(item.content)}
                    </p>
                  </div>

                  {/* Actions & Read More */}
                  <div className="mt-5 pt-4 border-t border-slate-100 shrink-0 flex justify-between items-center text-slate-500 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item._id);
                        }}
                        className={`flex items-center gap-1 hover:text-rose-500 transition-colors ${
                          hasLiked(item) ? 'text-rose-500 font-bold' : ''
                        }`}
                      >
                        <Heart size={14} className={hasLiked(item) ? 'fill-rose-500 text-rose-500' : ''} />
                        <span>{item.likes?.length || 0}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setTimeout(() => {
                            document.getElementById(`comment-input-${item._id}`)?.focus();
                          }, 100);
                        }}
                        className="flex items-center gap-1 hover:text-brand-600 transition-colors"
                      >
                        <MessageCircle size={14} />
                        <span>{item.comments?.length || 0}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(item._id);
                        }}
                        className="p-1 hover:bg-slate-100 rounded-full hover:text-indigo-600 transition-colors"
                        title="Share post"
                      >
                        <Share2 size={14} />
                      </button>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 group">
                        Read Full <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                <span>{fmtDate(selectedItem.createdAt)}</span>
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
                                  {new Date(comment.createdAt).toLocaleDateString('en-AE', {
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
