import { useEffect, useRef, useState } from 'react';
import axios from '../utils/axios';
import { formatFullDateTime } from '../utils/date';
import socket from '../utils/socket';

const ChatbotAssistant = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;

  useEffect(() => {
    fetchSessions();
    socket.connect();
    const refreshSession = ({ sessionId }) => {
      if (activeSessionRef.current?._id === sessionId) {
        axios.get(`/api/chat/session/${sessionId}`).then(({ data }) => setActiveSession(data)).catch(() => {});
      } else {
        fetchSessions();
      }
    };
    socket.on('chat:session-updated', refreshSession);
    return () => socket.off('chat:session-updated', refreshSession);
  }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await axios.get('/api/chat/sessions/my');
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        setActiveSession(data[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startSession = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    setErrorMessage('');
    try {
      const { data } = await axios.post('/api/chat/session', {
        initialMessage: message,
        title: 'HR Chat Assistant'
      });
      setSessions(prev => [data, ...prev]);
      setActiveSession(data);
      setMessage('');
      setStatusMessage('Chat started. Preview your AI response before submitting to HR.');
    } catch (error) {
      console.error('Chat start error:', error.response || error.message || error);
      const status = error.response?.status ? ` (${error.response.status})` : '';
      const fallback = `Unable to start chat${status}. Please make sure the backend is running and you are logged in.`;
      setErrorMessage(error.response?.data?.message || error.message || fallback);
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeSession) return;
    setIsSending(true);
    try {
      const { data } = await axios.post(`/api/chat/session/${activeSession._id}/message`, {
        message
      });
      setActiveSession(data);
      setSessions(prev => prev.map(session => session._id === data._id ? data : session));
      setMessage('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const submitToHR = async () => {
    if (!activeSession) return;
    setIsSending(true);
    try {
      const { data } = await axios.post(`/api/chat/session/${activeSession._id}/send-to-hr`);
      setActiveSession(data.session);
      setSessions(prev => prev.map(session => session._id === data.session._id ? data.session : session));
      setStatusMessage('Your chat has been forwarded to HR as a draft summary.');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const requestAgentHelp = async () => {
    if (!activeSession) return;
    setIsSending(true);
    try {
      const { data } = await axios.post(`/api/chat/session/${activeSession._id}/escalate`);
      setActiveSession(data);
      setSessions(prev => prev.map(session => session._id === data._id ? data : session));
      setStatusMessage('An HR agent has been requested for this issue.');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const pickSession = (session) => {
    setActiveSession(session);
    setStatusMessage('');
  };

  const getChatStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Active chat';
      case 'sent_to_hr': return 'Sent to HR';
      case 'escalated': return 'Escalated to HR agent';
      case 'closed': return 'Closed';
      default: return 'Active';
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">HR AI Chat Assistant</h2>
        <p className="mt-2 text-sm text-slate-600">
          Start a secure HR chat, preview the AI-generated draft, and optionally send it to HR or request an agent.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your chat sessions</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{sessions.length}</span>
          </div>
          {sessions.length === 0 && (
            <p className="text-sm text-slate-500">Start the first chat to generate a draft message for HR.</p>
          )}
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session._id}
                type="button"
                onClick={() => pickSession(session)}
                className={`w-full rounded-xl border p-3 text-left transition ${activeSession && activeSession._id === session._id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{session.title || 'HR Chat Assistant'}</span>
                  <span className="text-xs text-slate-600">{getChatStatusLabel(session.status)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                  {session.messages.length > 0 ? session.messages[0].text : 'No messages yet.'}
                </p>
                <p className="mt-3 text-xs text-slate-500">Updated {formatFullDateTime(session.updatedAt)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          {!activeSession && (
            <div className="space-y-4">
              <p className="text-slate-600">Write your first message to the HR chatbot and receive a preview before sending it to HR.</p>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                rows={5}
                placeholder="Tell the HR assistant what you need help with..."
              />
              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
              <button
                onClick={startSession}
                disabled={isSending || !message.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start Chat
              </button>
            </div>
          )}

          {activeSession && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-slate-300 bg-slate-50 p-4">
                <div>
                  <h3 className="text-lg font-semibold">{activeSession.title || 'HR Chat Assistant'}</h3>
                  <p className="text-sm text-slate-600">{getChatStatusLabel(activeSession.status)}</p>
                </div>
                <p className="text-sm text-slate-500">Updated {formatFullDateTime(activeSession.updatedAt)}</p>
              </div>

              <div className="space-y-3 overflow-hidden rounded-2xl border border-slate-300 bg-slate-50 p-4">
                {activeSession.messages.map((chat, index) => (
                  <div key={`${chat.sender}-${index}`} className={`rounded-2xl p-4 ${chat.sender === 'ai' ? 'bg-indigo-50 text-slate-900' : chat.sender === 'employee' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-sm capitalize">{chat.sender === 'employee' ? 'You' : chat.sender === 'ai' ? 'HR AI' : chat.sender === 'admin' ? 'HR Admin' : 'System'}</span>
                      <span className="text-xs text-slate-500">{formatFullDateTime(chat.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{chat.text}</p>
                    {chat.sender === 'employee' && chat.originalCategory && (
                      <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        Category: {chat.originalCategory.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {activeSession.status === 'active' && (
                <div className="space-y-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    rows={4}
                    placeholder="Ask the HR assistant another question or clarify your issue..."
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={sendMessage}
                      disabled={isSending || !message.trim()}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Send Message
                    </button>
                    <button
                      onClick={submitToHR}
                      disabled={isSending}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
                    >
                      Send Preview to HR
                    </button>
                    <button
                      onClick={requestAgentHelp}
                      disabled={isSending}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      Request Agent Help
                    </button>
                  </div>
                </div>
              )}

              {activeSession.status !== 'active' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700">
                  This chat is currently <strong>{getChatStatusLabel(activeSession.status)}</strong>.
                </div>
              )}

              {statusMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  {statusMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatbotAssistant;
