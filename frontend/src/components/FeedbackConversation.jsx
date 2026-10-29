import { useEffect, useState } from 'react';
import { FiMessageCircle, FiSend } from 'react-icons/fi';
import axios from '../utils/axios';
import { formatFullDateTime } from '../utils/date';

const EMPTY_MESSAGES = [];

const FeedbackConversation = ({
  feedbackId,
  initialMessages = EMPTY_MESSAGES,
  isAdmin = false,
  collapsible = false,
  onMessageSent
}) => {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMessages(initialMessages);
  }, [feedbackId, initialMessages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setErrorMessage('');
    try {
      const { data } = await axios.post(`/api/feedback/${feedbackId}/messages`, { message: text });
      setMessages(data.messages);
      setDraft('');
      onMessageSent?.();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const thread = (
    <>
      {messages.length ? (
        <ol className="feedback-thread-list" aria-live="polite">
          {messages.map((message, index) => {
            const fromHr = message.sender === 'hr';
            return (
              <li className={`feedback-thread-message ${fromHr ? 'from-hr' : 'from-employee'}`} key={message._id || `${message.sender}-${index}`}>
                <div className="feedback-thread-message-meta">
                  <strong>{fromHr ? 'HR' : 'You'}</strong>
                  {message.createdAt && <time dateTime={message.createdAt}>{formatFullDateTime(message.createdAt)}</time>}
                </div>
                <p>{message.text}</p>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="feedback-thread-empty">
          {isAdmin
            ? 'No conversation messages yet. Send a response to start the conversation.'
            : 'No HR messages yet. Add a note or question to continue your feedback conversation.'}
        </p>
      )}

      <form className="feedback-thread-compose" onSubmit={handleSubmit}>
        <label htmlFor={`feedback-message-${feedbackId}`}>
          {isAdmin ? 'Your response to the employee' : 'Message HR about this feedback'}
        </label>
        <textarea
          id={`feedback-message-${feedbackId}`}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setErrorMessage('');
          }}
          placeholder={isAdmin ? 'Write a response for the employee...' : 'Add a question or follow-up...'}
          maxLength={4000}
          rows={3}
          disabled={sending}
          required
        />
        <div className="feedback-thread-compose-footer">
          <span>{draft.length}/4000</span>
          <button type="submit" disabled={sending || !draft.trim()}>
            <FiSend aria-hidden="true" />
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </div>
        {errorMessage && <p className="feedback-thread-error" role="alert">{errorMessage}</p>}
      </form>
    </>
  );

  if (!collapsible) return <div className="feedback-thread">{thread}</div>;

  return (
    <details className="feedback-thread feedback-thread-collapsible">
      <summary>
        <FiMessageCircle aria-hidden="true" />
        Conversation with HR
        {messages.length > 0 && <span>{messages.length} {messages.length === 1 ? 'message' : 'messages'}</span>}
      </summary>
      {thread}
    </details>
  );
};

export default FeedbackConversation;
