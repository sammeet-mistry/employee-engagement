import { FiArrowUpRight, FiMessageSquare } from 'react-icons/fi';
import ContentSkeleton from './ContentSkeleton';
import FeedbackConversation from './FeedbackConversation';
import { formatFullDateTime } from '../utils/date';

const getStatusStyle = (status) => {
  if (['Responded', 'Resolved', 'AI Auto Responded'].includes(status)) return 'feedback-status-done';
  if (status === 'Under Review') return 'feedback-status-review';
  return 'feedback-status-pending';
};

const FeedbackList = ({ feedback, loading, error, showReplies = false, onRetry, isFiltered = false }) => {
  if (loading) {
    return <div aria-label="Loading feedback"><ContentSkeleton variant="card" count={3} /></div>;
  }

  if (error) {
    return (
      <div className="employee-feedback-error" role="alert">
        <strong>We couldn’t load your feedback.</strong>
        <span>{error}</span>
        {onRetry && <button type="button" onClick={onRetry}>Try again <FiArrowUpRight aria-hidden="true" /></button>}
      </div>
    );
  }

  if (!feedback || feedback.length === 0) {
    return (
      <div className="employee-empty-state employee-feedback-empty">
        <span className="employee-empty-icon"><FiMessageSquare aria-hidden="true" /></span>
        <strong>{isFiltered ? 'No matching feedback' : 'Your feedback history is empty'}</strong>
        <span>{isFiltered ? 'Try another search or choose a different status.' : 'When you share feedback, your submission and any recorded reply will appear here.'}</span>
      </div>
    );
  }

  return (
    <div className="employee-feedback-list" aria-live="polite">
      {feedback.map((item) => (
        <article className="employee-feedback-item" key={item._id}>
          <div className="employee-feedback-topline">
            <div className="employee-feedback-title-wrap">
              <span className="employee-feedback-category">{item.category || 'General'}</span>
              <h3>{item.title}</h3>
            </div>
            <span className={`feedback-status ${getStatusStyle(item.status)}`}>{item.status || 'Pending'}</span>
          </div>
          <p className="employee-feedback-description">{item.description}</p>
          <div className="employee-feedback-meta">
            {item.department && <span>{item.department}</span>}
            <span>Priority: {item.priority || 'Medium'}</span>
            <span>Submitted <time dateTime={item.createdAt}>{formatFullDateTime(item.createdAt)}</time></span>
          </div>
          {showReplies && item.reply && (
            <div className="employee-feedback-reply">
              <div className="employee-feedback-reply-heading">
                <FiMessageSquare aria-hidden="true" />
                <strong>Recorded response</strong>
              </div>
              <p>{item.reply}</p>
              {item.replyDate && <time dateTime={item.replyDate}>Added {formatFullDateTime(item.replyDate)}</time>}
            </div>
          )}
          {showReplies && (
            <FeedbackConversation
              feedbackId={item._id}
              initialMessages={item.messages}
              collapsible
            />
          )}
        </article>
      ))}
    </div>
  );
};

export default FeedbackList;
