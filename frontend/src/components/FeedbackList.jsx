import LoadingSpinner from './LoadingSpinner';
import { formatFullDateTime } from '../utils/date';

const FeedbackList = ({ feedback, loading, error, showReplies = false }) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-error">{error}</div>;
  if (!feedback || feedback.length === 0) {
    return <div className="text-secondary-500 text-center py-8">Your personalized feedback timeline is empty. Submit feedback or use the AI questionnaire to create a structured entry, and the system will auto-generate an acknowledgement for every submission.</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-secondary-300 text-secondary-900';
      case 'Under Review': return 'bg-primary-500 text-white';
      case 'AI Draft Generated': return 'bg-accent text-white';
      case 'AI Auto Responded': return 'bg-success text-white';
      case 'Responded': return 'bg-success text-white';
      case 'Resolved': return 'bg-secondary-500 text-white';
      default: return 'bg-secondary-300 text-secondary-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'text-secondary-600';
      case 'Medium': return 'text-primary-600';
      case 'High': return 'text-accent-600';
      case 'Urgent': return 'text-error font-bold';
      default: return 'text-secondary-600';
    }
  };

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <div key={item._id} className="card">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-secondary-900">{item.title}</h3>
            <div className="flex space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
              <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                {item.priority}
              </span>
            </div>
          </div>
          
          <p className="text-secondary-600 mb-2">{item.description}</p>
          
          <div className="flex flex-wrap gap-2 text-sm text-secondary-500 mb-2">
            <span>Category: {item.category}</span>
            {item.department && <span>Department: {item.department}</span>}
            <span>Submitted: {formatFullDateTime(item.createdAt)}</span>
          </div>

          {showReplies && item.reply && (
            <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
              <h4 className="font-medium text-secondary-900 mb-2">Response:</h4>
              <p className="text-secondary-700">{item.reply}</p>
              {item.replyDate && (
                <p className="text-xs text-secondary-500 mt-2">
                  Responded on {formatFullDateTime(item.replyDate)}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FeedbackList;