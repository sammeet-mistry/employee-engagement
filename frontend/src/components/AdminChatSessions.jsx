import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { formatFullDateTime } from '../utils/date';
import socket from '../utils/socket';

const AdminChatSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchSessions();
    socket.connect();
    const refreshSessions = () => fetchSessions();
    socket.on('chat:session-updated', refreshSessions);
    return () => socket.off('chat:session-updated', refreshSessions);
  }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await axios.get('/api/chat/sessions/all');
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        setActiveSession(data[0]);
      }
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
    try {
      const { data } = await axios.post(`/api/chat/session/${activeSession._id}/admin-message`, {
        message
      });
      setActiveSession(data);
      setSessions((prev) => prev.map((session) => (session._id === data._id ? data : session)));
      setMessage('');
      setStatusMessage('Admin note added to the chat session.');
    } catch (error) {
      console.error(error);
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
            <h2 className="text-xl font-semibold text-secondary-900">Employee Chat Sessions</h2>
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
                  <span className="text-xs text-secondary-500">{session.status}</span>
                </div>
                <p className="mt-3 text-sm text-secondary-500 line-clamp-2">{session.messages[0]?.text || 'No initial message yet.'}</p>
                <p className="mt-3 text-xs text-secondary-400">Updated {formatFullDateTime(session.updatedAt)}</p>
              </button>
            ))}
            {sessions.length === 0 && <p className="text-sm text-secondary-500">No active chat sessions yet.</p>}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-900">Chat preview</h3>
              <span className="text-xs text-secondary-500">{activeSession ? activeSession.status : 'Select a session'}</span>
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
                    placeholder="Add an admin note or follow-up instruction..."
                  />
                  <button
                    onClick={sendAdminMessage}
                    disabled={loading || !message.trim()}
                    className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Sending note…' : 'Add Admin Note'}
                  </button>
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
