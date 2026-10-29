import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { formatFullDateTime } from '../utils/date';
import FeedbackConversation from './FeedbackConversation';

const ReplyModal = ({ feedback, onClose, onGenerateAI, onApproveReply, onConversationUpdate }) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [editingReply, setEditingReply] = useState('');
  const [selectedReplyId, setSelectedReplyId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchReplies();
  }, [feedback._id]);

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const response = await axios.get(`/api/admin/replies/${feedback._id}`);
      setReplies(response.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to load previous replies.');
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleGenerateAI = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await onGenerateAI(feedback._id);
      await fetchReplies();
    } catch (error) {
      setErrorMessage(error.message || 'Unable to generate a reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReply = (reply) => {
    setEditingReply(reply.finalReply);
    setSelectedReplyId(reply._id);
  };

  const handleSaveReply = async () => {
    if (selectedReplyId) {
      await onApproveReply(selectedReplyId, editingReply);
      setSelectedReplyId(null);
      setEditingReply('');
      await fetchReplies();
    }
  };

  const handleApprove = async (replyId, finalReply) => {
    await onApproveReply(replyId, finalReply);
    await fetchReplies();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-secondary-900">{feedback.title}</h2>
              <p className="text-secondary-600 mt-1">{feedback.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-1 bg-secondary-100 text-secondary-800 text-xs rounded">
                  {feedback.category}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${
                  feedback.priority === 'Urgent' ? 'bg-error text-white' :
                  feedback.priority === 'High' ? 'bg-warning text-white' :
                  'bg-primary-100 text-primary-800'
                }`}>
                  {feedback.priority}
                </span>
                <span className="px-2 py-1 bg-secondary-100 text-secondary-800 text-xs rounded">
                  {feedback.status}
                </span>
              </div>
              {(feedback.aiSummary || feedback.mood) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">AI summary</p>
                    <p className="mt-1 text-sm text-secondary-700">{feedback.aiSummary || 'Summary not available.'}</p>
                  </div>
                  <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-3 sm:min-w-48">
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Employee mood</p>
                    <p className="mt-1 text-sm font-medium text-secondary-800">{feedback.mood || 'Not assessed'}</p>
                    {typeof feedback.moodScore === 'number' && <p className="mt-1 text-xs text-secondary-500">Signal: {feedback.moodScore.toFixed(2)}</p>}
                  </div>
                </div>
              )}
              {feedback.questionAnswers && Object.keys(feedback.questionAnswers).length > 0 && (
                <div className="mt-4 rounded-lg border border-secondary-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Questionnaire responses ({feedback.questionCount || Object.keys(feedback.questionAnswers).length})</p>
                  <div className="mt-3 space-y-3">
                    {Object.entries(feedback.questionAnswers).map(([question, answer]) => (
                      <div key={question}>
                        <p className="text-sm font-medium text-secondary-800">{question}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-secondary-600">{answer || 'No answer provided.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <section className="mb-6 rounded-lg border border-secondary-200 p-4" aria-labelledby="feedback-conversation-title">
            <h3 id="feedback-conversation-title" className="mb-3 text-lg font-semibold text-secondary-900">Conversation with employee</h3>
            <FeedbackConversation
              feedbackId={feedback._id}
              initialMessages={feedback.messages}
              isAdmin
              onMessageSent={onConversationUpdate}
            />
          </section>

          <div className="mb-6">
            <button
              onClick={handleGenerateAI}
              disabled={loading}
              className="btn-primary mr-4"
            >
              {loading ? 'Generating...' : 'Draft AI reply'}
            </button>
            {errorMessage && (
              <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-secondary-900">AI reply drafts and sent replies</h3>
            {loadingReplies ? (
              <p role="status" className="text-secondary-500">Loading replies...</p>
            ) : replies.length === 0 ? (
              <p className="text-secondary-500">No AI reply drafts or recorded replies.</p>
            ) : (
              replies.map((reply) => (
                <div key={reply._id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-secondary-500">
                      {reply.generatedByAI && <span className="bg-accent text-white px-2 py-1 rounded text-xs mr-2">AI Generated</span>}
                      {reply.approvedByAdmin && <span className="bg-success text-white px-2 py-1 rounded text-xs mr-2">Approved</span>}
                      {reply.sentToEmployee && <span className="bg-primary-500 text-white px-2 py-1 rounded text-xs">Sent</span>}
                    </div>
                    <div className="text-xs text-secondary-400">
                      {formatFullDateTime(reply.createdAt)}
                    </div>
                  </div>

                  {selectedReplyId === reply._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingReply}
                        onChange={(e) => setEditingReply(e.target.value)}
                        className="input-field w-full"
                        rows={6}
                      />
                      <div className="flex space-x-2">
                        <button onClick={handleSaveReply} className="btn-primary text-sm">
                          Save & Send
                        </button>
                        <button
                          onClick={() => setSelectedReplyId(null)}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-secondary-700 mb-2">{reply.finalReply}</p>
                      {!reply.sentToEmployee && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditReply(reply)}
                            className="btn-secondary text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleApprove(reply._id, reply.finalReply)}
                            className="btn-primary text-sm"
                          >
                            Approve & Send
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyModal;