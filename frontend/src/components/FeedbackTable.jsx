import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ReplyModal from './ReplyModal';
import { formatFullDateTime } from '../utils/date';

const FeedbackTable = ({
  feedback,
  loading,
  error,
  onStatusUpdate,
  onDelete,
  onGenerateAI,
  onApproveReply,
  onConversationUpdate
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-error">{error}</div>;
  if (!feedback || feedback.length === 0) {
    return <div className="text-secondary-500 text-center py-8">No feedback found.</div>;
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

  const handleViewDetails = (fb) => {
    setSelectedFeedback(fb);
    setShowReplyModal(true);
  };

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="min-w-[980px] divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Summary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Submitted By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {feedback.map((fb) => (
              <tr key={fb._id} className="hover:bg-secondary-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-secondary-900">{fb.title}</div>
                  <div className="text-sm text-secondary-500 truncate max-w-xs">
                    {fb.description.substring(0, 50)}...
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {fb.aiSummaryCategory || fb.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 max-w-xs truncate">
                  {fb.aiSummary ? fb.aiSummary : fb.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    fb.priority === 'Urgent' ? 'bg-error text-white' :
                    fb.priority === 'High' ? 'bg-accent-500 text-white' :
                    fb.priority === 'Medium' ? 'bg-primary-100 text-primary-800' :
                    'bg-secondary-100 text-secondary-800'
                  }`}>
                    {fb.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(fb.status)}`}>
                    {fb.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {fb.anonymous ? 'Anonymous' : fb.submittedBy?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {formatFullDateTime(fb.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(fb)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      {fb.messages?.length ? 'Open conversation' : 'Respond to feedback'}
                    </button>
                    <select
                      value={fb.status}
                      onChange={(e) => onStatusUpdate(fb._id, e.target.value)}
                      className="text-xs border border-secondary-300 rounded px-2 py-1"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="AI Draft Generated">AI Draft Generated</option>
                      <option value="AI Auto Responded">AI Auto Responded</option>
                      <option value="Responded">Responded</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    <button
                      onClick={() => onDelete(fb._id)}
                      className="text-error hover:text-error/80"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showReplyModal && selectedFeedback && (
        <ReplyModal
          feedback={selectedFeedback}
          onClose={() => setShowReplyModal(false)}
          onGenerateAI={onGenerateAI}
          onApproveReply={onApproveReply}
          onConversationUpdate={onConversationUpdate}
        />
      )}
    </>
  );
};

export default FeedbackTable;