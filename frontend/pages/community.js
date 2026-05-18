import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { communityAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid, faComments, faEye, faCalendarAlt, faMapMarkerAlt, faEnvelope, faPhone, faHandshake, faUsers } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

const TABS = ['forum', 'events', 'stories', 'associations', 'mentors'];

export default function Community() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('forum');
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [stories, setStories] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General' });
  const [expandedPost, setExpandedPost] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [likedStories, setLikedStories] = useState({});

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      communityAPI.getPosts(),
      communityAPI.getEvents(),
      communityAPI.getStories(),
      communityAPI.getAssociations(),
      user ? communityAPI.getMentors() : Promise.resolve({ data: { mentors: [] } })
    ]).then(([p, e, s, a, m]) => {
      setPosts(p.data.posts || []);
      setEvents(e.data.events || []);
      setStories(s.data.stories || []);
      setAssociations(a.data.associations || []);
      setMentors(m.data.mentors || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTogglePostLike = async (postId) => {
    if (!user) return toast.error(t('community.loginToConnect'));
    try {
      const res = await communityAPI.togglePostLike(postId);
      setLikedPosts(prev => ({ ...prev, [postId]: res.data.liked }));
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + (res.data.liked ? 1 : -1) } : p
      ));
    } catch { toast.error('Failed to toggle like'); }
  };

  const handleToggleStoryLike = async (storyId) => {
    if (!user) return toast.error(t('community.loginToConnect'));
    try {
      const res = await communityAPI.toggleStoryLike(storyId);
      setLikedStories(prev => ({ ...prev, [storyId]: res.data.liked }));
      setStories(prev => prev.map(s =>
        s.id === storyId ? { ...s, likes_count: (s.likes_count || 0) + (res.data.liked ? 1 : -1) } : s
      ));
    } catch { toast.error('Failed to toggle like'); }
  };

  const handleExpandPost = async (postId) => {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    setCommentLoading(true);
    try {
      const res = await communityAPI.getPost(postId);
      setPostComments(prev => ({ ...prev, [postId]: res.data.comments || [] }));
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, view_count: (p.view_count || 0) + 1 } : p
      ));
    } catch {} finally { setCommentLoading(false); }
  };

  const handleAddComment = async (postId) => {
    if (!user) return toast.error(t('community.loginToConnect'));
    if (!newComment.trim()) return;
    try {
      const res = await communityAPI.addComment(postId, newComment);
      setPostComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), res.data.comment] }));
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
      ));
      setNewComment('');
      toast.success('Comment added!');
    } catch { toast.error('Failed to add comment'); }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to create a post');
    if (!newPost.title || !newPost.content) return toast.error('Title and content required');
    try {
      await communityAPI.createPost(newPost);
      toast.success('Post created!');
      setNewPost({ title: '', content: '', category: 'General' });
      const res = await communityAPI.getPosts();
      setPosts(res.data.posts || []);
    } catch { toast.error('Failed to create post'); }
  };

  const handleRegisterEvent = async (eventId) => {
    if (!user) return toast.error('Please login to register');
    try {
      await communityAPI.registerForEvent(eventId);
      toast.success('Registered for event!');
    } catch { toast.error('Registration failed'); }
  };

  const handleRequestMentor = async (mentorId) => {
    if (!user) return toast.error('Please login first');
    try {
      await communityAPI.requestMentorship(mentorId, 'Looking for guidance in adaptive sports');
      toast.success('Mentorship request sent!');
    } catch { toast.error('Request failed'); }
  };

  return (
    <Layout>
      <section className="pt-32 pb-16 gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('community.title')}</h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">{t('community.subtitle')}</p>
          </motion.div>
          <motion.div {...fadeUp} className="flex flex-wrap justify-center gap-3 mt-8">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-navy-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {t(`community.${tab}`)}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-light min-h-[400px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {activeTab === 'forum' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-navy-900">{t('community.forum')}</h2>
                </div>

                {user && (
                  <form onSubmit={handleCreatePost} className="card">
                    <input type="text" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
                      placeholder={t('community.postTitle')} className="input-field mb-3" />
                    <textarea rows="3" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})}
                      placeholder={t('community.shareThoughts')} className="input-field mb-3 resize-none" />
                    <div className="flex gap-3">
                      <select value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})}
                        className="input-field w-auto">
                        <option>{t('community.catGeneral')}</option>
                        <option>{t('community.catEquipment')}</option>
                        <option>{t('community.catTraining')}</option>
                        <option>{t('community.catEvents')}</option>
                        <option>{t('community.catSupport')}</option>
                      </select>
                      <button type="submit" className="btn-primary text-sm px-6 py-2">{t('community.post')}</button>
                    </div>
                  </form>
                )}

                {posts.map(post => (
                  <div key={post.id} className="card">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {post.first_name?.[0]}{post.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-navy-900 text-sm">{post.first_name} {post.last_name}</span>
                          {post.is_pinned && <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">{t('community.pinned')}</span>}
                        </div>
                        <button onClick={() => handleExpandPost(post.id)} className="w-full text-left">
                          <h3 className="font-bold text-navy-900 mb-1 hover:text-ocean-500 transition-colors">{post.title}</h3>
                        </button>
                        <p className="text-gray-600 text-sm mb-3">{post.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <button onClick={() => handleTogglePostLike(post.id)}
                            className={`flex items-center gap-1 transition-colors ${likedPosts[post.id] ? 'text-red-500' : 'hover:text-red-500'}`}>
                            <FontAwesomeIcon icon={likedPosts[post.id] ? faHeartSolid : faHeartRegular} /> {post.likes_count || 0}
                          </button>
                          <button onClick={() => handleExpandPost(post.id)}
                            className="flex items-center gap-1 hover:text-ocean-500 transition-colors">
                            <FontAwesomeIcon icon={faComments} /> {post.comment_count || 0}
                          </button>
                          <span><FontAwesomeIcon icon={faEye} className="mr-1" />{post.view_count || 0}</span>
                          <span className="text-ocean-500">{post.category}</span>
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedPost === post.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden">
                          <div className="border-t border-gray-100 mt-4 pt-4 space-y-3">
                            {commentLoading ? (
                              <div className="text-sm text-gray-400 animate-pulse">Loading comments...</div>
                            ) : (postComments[post.id] || []).length === 0 ? (
                              <div className="text-sm text-gray-400">No comments yet.</div>
                            ) : (
                              (postComments[post.id] || []).map(c => (
                                <div key={c.id} className="flex items-start gap-3">
                                  <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {c.first_name?.[0]}{c.last_name?.[0]}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="font-semibold text-navy-900 text-xs">{c.first_name} {c.last_name}</span>
                                      <span className="text-gray-400 text-[10px]">{new Date(c.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm">{c.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                            {user && (
                              <div className="flex gap-2 pt-2">
                                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                                  placeholder="Write a comment..." className="input-field flex-1 text-sm"
                                  onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)} />
                                <button onClick={() => handleAddComment(post.id)}
                                  className="px-3 py-2 bg-ocean-500 text-white rounded-lg text-sm hover:bg-ocean-400 transition-colors">Post</button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                  {!loading && posts.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FontAwesomeIcon icon={faComments} className="text-4xl mb-3" />
                    <p>{t('community.noPosts')}</p>
                  </div>
                )}
              </div>

              <div className="card">
                <h3 className="font-bold text-navy-900 mb-4">{t('community.categories')}</h3>
                <div className="space-y-2">
                  {['catGeneral', 'catEquipment', 'catTraining', 'catEvents', 'catSupport', 'catSuccess'].map(cat => (
                    <button key={cat} className="block w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-ocean-500 transition-colors">
                      {t(`community.${cat}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(ev => (
                <div key={ev.id} className="card">
                  <div className="bg-gradient-to-br from-ocean-500/10 to-green-mint/10 rounded-xl p-4 mb-4">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-3xl mb-2" />
                    <span className="text-xs font-medium text-ocean-500 bg-ocean-500/10 px-2 py-0.5 rounded-full">{ev.event_type}</span>
                  </div>
                  <h3 className="font-bold text-navy-900 mb-2">{ev.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ev.description}</p>
                  <div className="space-y-1 text-sm text-gray-500 mb-4">
                    <p><FontAwesomeIcon icon={faCalendarAlt} className="mr-1" /> {new Date(ev.event_date).toLocaleDateString()}</p>
                    <p><FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> {ev.location || 'Online'}</p>
                    {ev.max_participants && <p><FontAwesomeIcon icon={faUsers} className="mr-1" /> Max: {ev.max_participants}</p>}
                  </div>
                  <button onClick={() => handleRegisterEvent(ev.id)}
                    className="btn-primary text-sm w-full py-2.5">{t('community.register')}</button>
                </div>
              ))}
              {!loading && events.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">{t('community.noEvents')}</div>}
            </div>
          )}

          {activeTab === 'stories' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map(story => (
                <div key={story.id} className="card relative overflow-hidden group">
                  {story.is_featured && <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">{t('community.featured')}</div>}
                  <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                    {story.first_name?.[0]}{story.last_name?.[0]}
                  </div>
                  <h3 className="font-bold text-navy-900 mb-2">{story.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{story.content}</p>
                  <div className="mt-4 text-sm text-gray-400 flex items-center gap-3">
                    <button onClick={() => handleToggleStoryLike(story.id)}
                      className={`flex items-center gap-1 transition-colors ${likedStories[story.id] ? 'text-red-500' : 'hover:text-red-500'}`}>
                      <FontAwesomeIcon icon={likedStories[story.id] ? faHeartSolid : faHeartRegular} /> {story.likes_count || 0}
                    </button>
                    <span>By {story.first_name} {story.last_name}</span>
                  </div>
                </div>
              ))}
              {!loading && stories.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">{t('community.noStories')}</div>}
            </div>
          )}

          {activeTab === 'associations' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {associations.map(assoc => (
                <div key={assoc.id} className="card">
                  <div className="w-16 h-16 bg-gradient-to-br from-ocean-500/10 to-green-mint/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                    <FontAwesomeIcon icon={faHandshake} />
                  </div>
                  <h3 className="font-bold text-navy-900 mb-1">{assoc.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{assoc.description}</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    {assoc.city && <p><FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> {assoc.city}</p>}
                    {assoc.email && <p><FontAwesomeIcon icon={faEnvelope} className="mr-1" /> {assoc.email}</p>}
                    {assoc.phone && <p><FontAwesomeIcon icon={faPhone} className="mr-1" /> {assoc.phone}</p>}
                  </div>
                  {assoc.website && (
                    <a href={assoc.website} target="_blank" rel="noopener noreferrer"
                      className="mt-4 inline-block text-ocean-500 text-sm font-medium hover:underline">{t('community.visitWebsite')}</a>
                  )}
                </div>
              ))}
              {!loading && associations.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">{t('community.noAssociations')}</div>}
            </div>
          )}

          {activeTab === 'mentors' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map(mentor => (
                <div key={mentor.id} className="card text-center">
                  <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {mentor.first_name?.[0]}{mentor.last_name?.[0]}
                  </div>
                  <h3 className="font-bold text-navy-900">{mentor.first_name} {mentor.last_name}</h3>
                  <p className="text-gray-500 text-sm mb-3">{mentor.bio || 'Experienced coach ready to help'}</p>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
                  </div>
                  {user ? (
                    <button onClick={() => handleRequestMentor(mentor.id)}
                      className="btn-primary text-sm px-6 py-2">{t('community.requestMentorship')}</button>
                  ) : (
                    <Link href="/auth/login" className="btn-primary text-sm px-6 py-2 inline-block">{t('community.loginToConnect')}</Link>
                  )}
                </div>
              ))}
              {!loading && mentors.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">{t('community.noMentors')}</div>}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
