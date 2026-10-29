import { useCallback, useEffect, useRef, useState } from 'react';
import { FiArrowUpRight, FiCheck, FiChevronRight, FiPlus, FiRefreshCw, FiSend, FiShield, FiX } from 'react-icons/fi';
import axios from '../utils/axios';
import { formatFullDateTime } from '../utils/date';
import socket from '../utils/socket';

const getSessionLabel = (status) => {
  if (status === 'sent_to_hr') return 'Sent to HR';
  if (status === 'escalated') return 'HR follow-up requested';
  if (status === 'closed') return 'Closed';
  return 'Open';
};

const getMessageLabel = (sender) => {
  if (sender === 'employee') return 'You';
  if (sender === 'rag') return 'HR knowledge assistant';
  if (sender === 'ai') return 'Previous assistant';
  if (sender === 'admin' || sender === 'hr') return 'HR';
  return 'Conversation update';
};

const getSessionTitle = (session) => (
  session.title === 'HR Chat Assistant' ? 'HR Knowledge Assistant' : session.title || 'HR Knowledge Assistant'
);

const HRKnowledgeAssistant = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryAction, setRetryAction] = useState('sessions');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const activeSessionRef = useRef(activeSession);
  const messageEndRef = useRef(null);
  const confirmDialogRef = useRef(null);
  activeSessionRef.current = activeSession;

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    setErrorMessage('');
    try {
      const { data } = await axios.get('/api/chat/sessions/my');
      setSessions(data);
      setRetryAction(null);
      if (!activeSessionRef.current && data.length) {
        setActiveSession(data[0]);
      }
    } catch (error) {
      setRetryAction('sessions');
      setErrorMessage(error.response?.data?.message || 'Unable to load your conversations. Check your connection and try again.');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    socket.connect();
    const refreshSession = async ({ sessionId }) => {
      try {
        if (activeSessionRef.current?._id === sessionId) {
          const { data } = await axios.get(`/api/chat/session/${sessionId}`);
          setActiveSession(data);
          setSessions((previous) => previous.map((session) => session._id === data._id ? data : session));
        } else {
          const { data } = await axios.get('/api/chat/sessions/my');
          setSessions(data);
        }
      } catch (error) {
        setRetryAction('sessions');
        setErrorMessage(error.response?.data?.message || 'Unable to refresh this conversation. Please retry.');
      }
    };
    socket.on('chat:session-updated', refreshSession);
    return () => socket.off('chat:session-updated', refreshSession);
  }, [loadSessions]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeSession?.messages?.length]);

  useEffect(() => {
    if (!confirmAction) return undefined;
    const dialog = confirmDialogRef.current;
    dialog?.querySelector('button:not(:disabled)')?.focus();
    const handleDialogKey = (event) => {
      if (event.key === 'Escape') {
        setConfirmAction(null);
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const buttons = [...dialog.querySelectorAll('button:not(:disabled)')];
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleDialogKey);
    return () => document.removeEventListener('keydown', handleDialogKey);
  }, [confirmAction]);

  const updateSession = (updated) => {
    setActiveSession(updated);
    setSessions((previous) => [updated, ...previous.filter((session) => session._id !== updated._id)]);
  };

  const startSession = async () => {
    setIsSending(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const { data } = await axios.post('/api/chat/session', { title: 'HR Knowledge Assistant' });
      updateSession(data);
      setRetryAction(null);
      setStatusMessage('Conversation created. Your question will only be sent when you choose to send it.');
    } catch (error) {
      setRetryAction('start');
      setErrorMessage(error.response?.data?.message || 'Unable to start a conversation. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async (event) => {
    event?.preventDefault();
    if (!message.trim() || !activeSession || isSending) return;
    setIsSending(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const { data } = await axios.post(`/api/chat/session/${activeSession._id}/message`, { message: message.trim() });
      updateSession(data);
      setMessage('');
      setRetryAction(null);
      setStatusMessage('Your question was sent.');
    } catch (error) {
      setRetryAction('message');
      setErrorMessage(error.response?.data?.message || 'Unable to send your question. Your draft is still here so you can retry.');
    } finally {
      setIsSending(false);
    }
  };

  const runConfirmedAction = async () => {
    if (!activeSession || !confirmAction) return;
    setIsSending(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      if (confirmAction === 'send-to-hr') {
        const { data } = await axios.post(`/api/chat/session/${activeSession._id}/send-to-hr`);
        updateSession(data.session);
        setStatusMessage('Your conversation was added to your feedback history for HR follow-up.');
      } else {
        const { data } = await axios.post(`/api/chat/session/${activeSession._id}/escalate`);
        updateSession(data);
        setStatusMessage('Your conversation was marked for HR follow-up.');
      }
      setRetryAction(null);
      setConfirmAction(null);
    } catch (error) {
      setRetryAction(confirmAction);
      setErrorMessage(error.response?.data?.message || 'Unable to update this conversation. Please try again.');
      setConfirmAction(null);
    } finally {
      setIsSending(false);
    }
  };

  const selectSession = async (session) => {
    setErrorMessage('');
    setStatusMessage('');
    setActiveSession(session);
    try {
      const { data } = await axios.get(`/api/chat/session/${session._id}`);
      updateSession(data);
      setRetryAction(null);
    } catch (error) {
      setRetryAction('open-session');
      setErrorMessage(error.response?.data?.message || 'Unable to open this conversation. Please try again.');
    }
  };

  const retryLastAction = () => {
    if (retryAction === 'message') return sendMessage();
    if (retryAction === 'start') return startSession();
    if (retryAction === 'send-to-hr' || retryAction === 'escalate') return setConfirmAction(retryAction);
    if (retryAction === 'open-session' && activeSession) return selectSession(activeSession);
    return loadSessions();
  };

  const hasEmployeeMessages = activeSession?.messages?.some((entry) => entry.sender === 'employee');

  return (
    <div className="rag-chat">
      <header className="rag-chat-header">
        <div className="rag-chat-brand">
          <span className="rag-chat-brand-icon"><FiMessageIcon /></span>
          <div>
            <h3>HR knowledge assistant</h3>
            <p>Answers from approved HR resources, when connected</p>
          </div>
        </div>
        <span className="rag-privacy"><FiShield aria-hidden="true" /> Your conversations are private to your account</span>
      </header>

      <div className="rag-chat-layout">
        <aside className="rag-session-sidebar" aria-label="Your conversations">
          <div className="rag-sidebar-heading">
            <div><span className="rag-overline">HISTORY</span><h4>Conversations</h4></div>
            <button type="button" className="rag-icon-button" onClick={startSession} disabled={isSending} aria-label="Start a new conversation">
              <FiPlus aria-hidden="true" />
            </button>
          </div>
          {loadingSessions ? (
            <div className="rag-sidebar-state" role="status">Loading conversations…</div>
          ) : sessions.length ? (
            <div className="rag-session-list">
              {sessions.map((session) => (
                <button
                  type="button"
                  key={session._id}
                  className={`rag-session-item ${activeSession?._id === session._id ? 'is-selected' : ''}`}
                  onClick={() => selectSession(session)}
                  aria-current={activeSession?._id === session._id ? 'true' : undefined}
                >
                  <span className="rag-session-item-top">
                    <strong>{getSessionTitle(session)}</strong>
                    <FiChevronRight aria-hidden="true" />
                  </span>
                  <span className="rag-session-preview">{session.messages?.find((entry) => entry.sender === 'employee')?.text || 'New conversation'}</span>
                  <span className="rag-session-meta">
                    <span className={`rag-session-state state-${session.status}`}>{getSessionLabel(session.status)}</span>
                    <time dateTime={session.updatedAt}>{formatFullDateTime(session.updatedAt)}</time>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rag-sidebar-empty">
              <span>No conversations yet.</span>
              <button type="button" onClick={startSession} disabled={isSending}>Start a conversation <FiArrowUpRight aria-hidden="true" /></button>
            </div>
          )}
        </aside>

        <section className="rag-conversation" aria-label="HR assistant conversation">
          {!activeSession ? (
            <div className="rag-welcome">
              <span className="rag-welcome-icon"><FiMessageIcon /></span>
              <span className="rag-overline">A RESOURCE TO HELP YOU</span>
              <h4>What would you like to know?</h4>
              <p>Start a conversation to ask about workplace policies and resources. Answers depend on the approved HR knowledge base.</p>
              <button type="button" className="rag-primary-button" onClick={startSession} disabled={isSending}>
                <FiPlus aria-hidden="true" /> Start a conversation
              </button>
            </div>
          ) : (
            <>
              <div className="rag-conversation-heading">
                <div>
                  <span className="rag-overline">CONVERSATION</span>
                  <h4>{getSessionTitle(activeSession)}</h4>
                </div>
                <span className={`rag-session-state state-${activeSession.status}`}>{getSessionLabel(activeSession.status)}</span>
              </div>

              <div className="rag-message-list" aria-live="polite" aria-relevant="additions text">
                {activeSession.messages?.length ? activeSession.messages.map((entry, index) => (
                  <article className={`rag-message message-${entry.sender}`} key={`${entry._id || entry.sender}-${index}`}>
                    <div className="rag-message-heading">
                      <strong>{getMessageLabel(entry.sender)}</strong>
                      {entry.createdAt && <time dateTime={entry.createdAt}>{formatFullDateTime(entry.createdAt)}</time>}
                    </div>
                    <p className="rag-message-text">{entry.text}</p>
                    {entry.sender === 'rag' && entry.sources?.length > 0 && (
                      <div className="rag-sources">
                        <span className="rag-sources-label">
                          {entry.retrievalStatus === 'grounded'
                            ? 'Sources provided by the HR knowledge base'
                            : 'Retrieved references · not sufficient to answer reliably'}
                        </span>
                        <ul>
                          {entry.sources.map((source, sourceIndex) => (
                            <li key={`${source.title}-${sourceIndex}`}>
                              <span className="rag-source-title">{source.title}</span>
                              {(source.section || source.page !== undefined) && (
                                <span className="rag-source-location">
                                  {[source.section, source.page !== undefined ? `Page ${source.page}` : null].filter(Boolean).join(' · ')}
                                </span>
                              )}
                              {source.url && (
                                <a href={source.url} target="_blank" rel="noreferrer">
                                  Open source <FiArrowUpRight aria-hidden="true" />
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                )) : (
                  <div className="rag-first-message">
                    <span className="rag-first-message-icon"><FiMessageIcon /></span>
                    <strong>Your draft stays here until you send it.</strong>
                    <span>Only your current question is sent to the assistant; its existing API does not accept conversation history. Separate scenario rules may route urgent messages to HR, but do not perform document search.</span>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>

              {activeSession.status === 'active' ? (
                <form className="rag-composer" onSubmit={sendMessage}>
                  <label htmlFor="rag-question">Your question</label>
                  <textarea
                    id="rag-question"
                    rows={3}
                    maxLength={4000}
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setErrorMessage('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) sendMessage(event);
                    }}
                    placeholder="Ask a question about workplace resources…"
                    disabled={isSending}
                  />
                  <div className="rag-composer-footer">
                    <span>{message.length}/4000 · Ctrl+Enter to send</span>
                    <button className="rag-primary-button" type="submit" disabled={isSending || !message.trim()}>
                      {isSending ? 'Sending…' : 'Send question'} <FiSend aria-hidden="true" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rag-closed-note" role="status">
                  This conversation is {getSessionLabel(activeSession.status).toLowerCase()}. Start a new conversation to ask another question.
                </div>
              )}

              <div className="rag-conversation-actions">
                {activeSession.status === 'active' && (
                  <>
                    <button type="button" className="rag-secondary-button" onClick={() => setConfirmAction('send-to-hr')} disabled={!hasEmployeeMessages || isSending}>
                      Send conversation to HR
                    </button>
                    <button type="button" className="rag-text-button" onClick={() => setConfirmAction('escalate')} disabled={isSending}>
                      Request HR follow-up
                    </button>
                  </>
                )}
                <span>Responses are informational and do not replace HR review.</span>
              </div>
            </>
          )}

          {errorMessage && (
            <div className="rag-error" role="alert">
              <span>{errorMessage}</span>
              <button type="button" onClick={retryLastAction} disabled={isSending}>
                <FiRefreshCw aria-hidden="true" /> Retry
              </button>
            </div>
          )}
          {statusMessage && (
            <div className="rag-success" role="status">
              <FiCheck aria-hidden="true" /><span>{statusMessage}</span>
              <button type="button" onClick={() => setStatusMessage('')} aria-label="Dismiss confirmation"><FiX aria-hidden="true" /></button>
            </div>
          )}
        </section>
      </div>

      {confirmAction && (
        <div className="rag-confirm-backdrop">
          <section ref={confirmDialogRef} className="rag-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="rag-confirm-title" aria-describedby="rag-confirm-description">
            <span className="rag-confirm-icon"><FiShield aria-hidden="true" /></span>
            <button type="button" className="rag-confirm-close" onClick={() => setConfirmAction(null)} aria-label="Cancel">
              <FiX aria-hidden="true" />
            </button>
            <h4 id="rag-confirm-title">{confirmAction === 'send-to-hr' ? 'Send this conversation to HR?' : 'Request HR follow-up?'}</h4>
            <p id="rag-confirm-description">
              {confirmAction === 'send-to-hr'
                ? 'Your questions and the assistant’s responses in this conversation will be added to your feedback history and made available to HR for follow-up.'
                : 'This marks the conversation for HR review, but does not share the text in your unsent draft. To share details, submit feedback through My feedback or send a saved conversation to HR.'}
            </p>
            <div className="rag-confirm-actions">
              <button type="button" className="rag-secondary-button" onClick={() => setConfirmAction(null)} disabled={isSending}>Cancel</button>
              <button type="button" className="rag-primary-button" onClick={runConfirmedAction} disabled={isSending}>
                {isSending ? 'Please wait…' : confirmAction === 'send-to-hr' ? 'Send to HR' : 'Request follow-up'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const FiMessageIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 7.8 7.8 0 0 1-3.1-.65L4 20l1.65-4.1A7.5 7.5 0 1 1 20 11.5Z" />
    <path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01" />
  </svg>
);

export default HRKnowledgeAssistant;
