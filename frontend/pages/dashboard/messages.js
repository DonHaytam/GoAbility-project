import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { messagesAPI, usersAPI } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function Messages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [partner, setPartner] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const chatEndRef = useRef(null);
  const [loadingConv, setLoadingConv] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadInbox();
    usersAPI.getCoaches().then(r => setAllUsers(r.data.coaches || [])).catch(() => {});
    if (user.role !== 'coach') {
      usersAPI.getAthletes().then(r => setAllUsers(prev => [...prev, ...(r.data.athletes || [])])).catch(() => {});
    }
  }, [user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation]);

  const loadInbox = async () => {
    try {
      const [inboxRes, sentRes] = await Promise.all([messagesAPI.getInbox(), messagesAPI.getSent()]);
      setInbox(inboxRes.data.messages || []);
      const all = [...(inboxRes.data.messages || []), ...(sentRes.data.messages || [])];
      const map = {};
      all.forEach(m => {
        const otherId = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
        const otherName = m.first_name && m.last_name ? `${m.first_name} ${m.last_name}` : (m.sender_id === user?.id ? (m.receiver_first_name ? `${m.receiver_first_name} ${m.receiver_last_name}` : 'Unknown') : `${m.first_name} ${m.last_name}`);
        if (!map[otherId]) {
          map[otherId] = { id: otherId, first_name: m.sender_id === user?.id ? (m.receiver_first_name || m.first_name) : m.first_name, last_name: m.sender_id === user?.id ? (m.receiver_last_name || m.last_name) : m.last_name, lastMsg: m.content, lastTime: m.created_at, unread: (m.sender_id !== user?.id && !m.is_read) ? 1 : 0 };
        } else {
          if (m.sender_id !== user?.id && !m.is_read) map[otherId].unread += 1;
          if (new Date(m.created_at) > new Date(map[otherId].lastTime)) {
            map[otherId].lastMsg = m.content;
            map[otherId].lastTime = m.created_at;
          }
        }
      });
      setContacts(Object.values(map).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime)));
    } catch {}
  };

  const handleSelectContact = async (c) => {
    setSelectedContact(c);
    setShowNewChat(false);
    setLoadingConv(true);
    try {
      const res = await messagesAPI.getConversation(c.id);
      setConversation(res.data.messages || []);
      setPartner(res.data.partner);
      const unread = (res.data.messages || []).filter(m => m.sender_id !== user?.id && !m.is_read);
      await Promise.all(unread.map(m => messagesAPI.markRead(m.id).catch(() => {})));
      await loadInbox();
    } catch {} finally { setLoadingConv(false); }
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedContact) return;
    const tempId = 'temp-' + Date.now();
    const optimistic = { id: tempId, content: newMsg, direction: 'sent', created_at: new Date().toISOString(), sender_id: user?.id };
    setConversation(prev => [...prev, optimistic]);
    setNewMsg('');
    try {
      const res = await messagesAPI.send(selectedContact.id, newMsg.trim());
      setConversation(prev => prev.map(m => m.id === tempId ? { ...res.data.message, direction: 'sent', first_name: user?.first_name, last_name: user?.last_name } : m));
      loadInbox();
    } catch {
      toast.error('Failed to send');
      setConversation(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleStartNewChat = async (u) => {
    setShowNewChat(false);
    setSelectedContact({ id: u.id, first_name: u.first_name, last_name: u.last_name, avatar_url: u.avatar_url });
    setLoadingConv(true);
    try {
      const res = await messagesAPI.getConversation(u.id);
      setConversation(res.data.messages || []);
      setPartner(res.data.partner);
    } catch {} finally { setLoadingConv(false); }
  };

  const filteredUsers = allUsers.filter(u =>
    u.id !== user?.id && `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredContacts = contacts.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role={user?.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex">
          <button className="lg:hidden absolute top-20 left-2 z-10 p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="hidden md:flex md:w-80 lg:w-96 flex-col bg-white border-r border-gray-200">
            <div className="p-3 border-b border-gray-200 flex items-center gap-2">
              <div className="flex-1 relative">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search or start new chat"
                  className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500" />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button onClick={() => setShowNewChat(!showNewChat)}
                className="w-9 h-9 bg-ocean-500 text-white rounded-lg flex items-center justify-center hover:bg-ocean-400 transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            {showNewChat && (
              <div className="p-3 border-b border-gray-200 bg-gray-50 max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-2 font-medium">Select a user to message:</p>
                {filteredUsers.length === 0 ? (
                  <p className="text-xs text-gray-400">No users found</p>
                ) : filteredUsers.map(u => (
                  <button key={u.id} onClick={() => handleStartNewChat(u)}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-200 transition-colors">
                    <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {u.first_name?.[0]}{u.last_name?.[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{u.first_name} {u.last_name}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No conversations yet</div>
              ) : filteredContacts.map(c => (
                <button key={c.id} onClick={() => handleSelectContact(c)}
                  className={`w-full flex items-center gap-3 p-3 transition-colors hover:bg-gray-50 ${selectedContact?.id === c.id ? 'bg-ocean-500/10' : ''}`}>
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-navy-900 truncate">{c.first_name} {c.last_name}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{new Date(c.lastTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 truncate flex-1">{c.lastMsg}</p>
                      {c.unread > 0 && (
                        <span className="w-5 h-5 bg-ocean-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{c.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-gray-100">
            {selectedContact ? (
              <>
                <div className="bg-white p-3 border-b border-gray-200 flex items-center gap-3 shadow-sm">
                  <button className="md:hidden p-1" onClick={() => setSelectedContact(null)}>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {selectedContact.first_name?.[0]}{selectedContact.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900 text-sm">{selectedContact.first_name} {selectedContact.last_name}</h3>
                    <p className="text-[11px] text-gray-400">{partner ? (partner.role === 'coach' ? 'Coach' : partner.role === 'admin' ? 'Admin' : 'Athlete') : ''}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#e5ddd5]" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                  {loadingConv ? (
                    <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
                  ) : conversation.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">No messages yet. Say hello!</div>
                  ) : conversation.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm leading-relaxed ${
                        msg.direction === 'sent'
                          ? 'bg-[#dcf8c6] rounded-br-sm'
                          : 'bg-white rounded-bl-sm'
                      }`}>
                        <p className="text-gray-800">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.direction === 'sent' && (
                            <svg className={`w-4 h-4 ${msg.id?.startsWith('temp-') ? 'text-gray-300' : 'text-blue-500'}`} viewBox="0 0 16 11" fill="currentColor">
                              <path d="M11.071.653a.457.457 0 00-.304-.102.493.493 0 00-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 00-.336-.153.457.457 0 00-.334.137.492.492 0 00-.138.342c0 .124.047.243.133.331l2.394 2.492a.462.462 0 00.339.156.468.468 0 00.357-.163l6.53-8.057a.512.512 0 00.108-.351.488.488 0 00-.153-.325l.026.004z"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="bg-white p-3 border-t border-gray-200 flex items-center gap-3">
                  <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500" />
                  <button onClick={handleSend} disabled={!newMsg.trim()}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${newMsg.trim() ? 'bg-ocean-500 text-white hover:bg-ocean-400' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <h2 className="text-xl font-bold text-navy-900 mb-2">GoAbility Messages</h2>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">Select a conversation from the left or start a new chat</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
