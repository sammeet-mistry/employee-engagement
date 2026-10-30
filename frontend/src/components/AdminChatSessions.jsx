import { useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import axios from '../utils/axios';
import { formatFullDateTime } from '../utils/date';
import socket from '../utils/socket';

const AdminChatSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchSessions();
    socket.connect();
    const refreshSessions = () => fetchSessions();
    socket.on('chat:session-updated', refreshSessions);
    socket.on('chat:session-deleted', refreshSessions);
    return () => {
      socket.off('chat:session-updated', refreshSessions);
      socket.off('chat:session-deleted', refreshSessions);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await axios.get('/api/chat/sessions/all');
      setSessions(data);
      setActiveSession((current) => current
        ? data.find((session) => session._id === current._id) || data[0] || null
        : data[0] || null);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const { data } = await axios.get(`/api/chat/session/${sessionId}`);
      setActiveSession(data);
    } catch (error) {
      console.error(error);
    }
  };

  const sendAdminMessage = async () => {
    if (!message.trim() || !activeSession) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await axios.post(`/api/chat/session/${activeSession._id}/admin-message`, {
        message
      });
      setActiveSession(data);
      setSessions((prev) => prev.map((session) => (session._id === data._id ? data : session)));
      setMessage('');
      setStatusMessage('Your reply was sent to the employee.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to send your reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteOpenChat = async () => {
    if (!activeSession || activeSession.status !== 'active' || activeSession.feedbackId || loading) return;
    if (!window.confirm('Delete this open employee chat? This cannot be undone.')) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await axios.delete(`/api/chat/session/${activeSession._id}`);
      setSessions((previous) => previous.filter((session) => session._id !== activeSession._id));
      setActiveSession(null);
      setMessage('');
      setStatusMessage('Open chat deleted.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to delete this chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSessionLabel = (session) => {
    return session.title || `${session.user?.name || 'Employee'} chat`;
  };

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full lg:w-80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900">Employee Chats</h2>
            <span className="text-xs text-secondary-500">{sessions.length} sessions</span>
          </div>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {sessions.map((session) => (
              <button
                type="button"
                key={session._id}
                onClick={() => loadSession(session._id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${activeSession?._id === session._id ? 'border-indigo-500 bg-indigo-50' : 'border-secondary-200 bg-secondary-50 hover:border-secondary-300'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-secondary-900">{getSessionLabel(session)}</p>
                    <p className="text-xs text-secondary-500">{session.user?.name || 'Unknown employee'}</p>
                  </div>
                  <span className="text-xs text-secondary-500">{session.status === 'active' ? 'Open' : session.status.replaceAll('_', ' ')}</span>
                </div>
                <p className="mt-3 text-sm text-secondary-500 line-clamp-2">{session.messages?.[session.messages.length - 1]?.text || 'No message yet.'}</p>
                <p className="mt-3 text-xs text-secondary-400">Updated {formatFullDateTime(session.updatedAt)}</p>
              </button>
            ))}
            {sessions.length === 0 && <p className="text-sm text-secondary-500">No employee chats yet.</p>}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-900">Conversation</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-secondary-500">{activeSession ? (activeSession.status === 'active' ? 'Open' : activeSession.status.replaceAll('_', ' ')) : 'Select a session'}</span>
                {activeSession?.status === 'active' && !activeSession.feedbackId && (
                  <button type="button" onClick={deleteOpenChat} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                    <FiTrash2 aria-hidden="true" /> Delete open chat
                  </button>
                )}
              </div>
            </div>

            {!activeSession && (
              <p className="mt-4 text-secondary-600">Select an employee chat to review the conversation and add an admin note.</p>
            )}

            {activeSession && (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-secondary-900">{activeSession.user?.name || 'Unknown employee'}</p>
                    <span className="text-xs text-secondary-500">{activeSession.user?.department || 'No department'}</span>
                  </div>
                  <p className="mt-2 text-xs text-secondary-500">Started {formatFullDateTime(activeSession.createdAt)}</p>
                </div>

                <div className="space-y-3 max-h-[340px] overflow-y-auto rounded-2xl border border-secondary-200 bg-white p-4">
                  {activeSession.messages.map((messageItem, index) => (
                    <div key={`${messageItem.sender}-${index}`} className={`rounded-2xl p-4 ${messageItem.sender === 'employee' ? 'bg-secondary-100' : ['ai', 'rag'].includes(messageItem.sender) ? 'bg-indigo-50' : messageItem.sender === 'admin' ? 'bg-amber-50' : 'bg-slate-100'}`}>
                      <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-secondary-700 capitalize">{messageItem.sender === 'employee' ? 'Employee' : messageItem.sender === 'rag' ? 'HR Knowledge Assistant' : messageItem.sender === 'ai' ? 'Previous assistant' : messageItem.sender === 'admin' ? 'Admin' : messageItem.sender}</span>
                        <span className="text-xs text-secondary-400">{formatFullDateTime(messageItem.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-secondary-700 whitespace-pre-wrap">{messageItem.text}</p>
                    {messageItem.sender === 'rag' && messageItem.sources?.length > 0 && (
                      <ul className="mt-3 space-y-1 text-xs text-secondary-600" aria-label="Assistant source references">
                        {messageItem.sources.map((source, sourceIndex) => (
                          <li key={`${source.title}-${sourceIndex}`}>
                            <span className="font-medium">{source.title}</span>
                            {source.section && <span> · {source.section}</span>}
                            {source.page !== undefined && <span> · Page {source.page}</span>}
                            {source.url && <a className="ml-2 underline" href={source.url} target="_blank" rel="noreferrer">Open source</a>}
                          </li>
                        ))}
                      </ul>
                    )}
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-2xl border border-secondary-300 bg-white p-4 text-sm text-secondary-900 focus:border-indigo-500 focus:outline-none"
                    rows={4}
                    placeholder="Reply to the employee..."
                  />
                  <button
                    onClick={sendAdminMessage}
                    disabled={loading || !message.trim()}
                    className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Sending reply…' : 'Send HR reply'}
                  </button>
                  {errorMessage && <p className="text-sm text-red-700" role="alert">{errorMessage}</p>}
                  {statusMessage && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                      {statusMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatSessions;
