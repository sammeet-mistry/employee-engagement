import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { formatFullDateTime } from '../utils/date';

const ReplyModal = ({ feedback, onClose, onGenerateAI, onApproveReply }) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingReply, setEditingReply] = useState('');
  const [selectedReplyId, setSelectedReplyId] = useState(null);

  useEffect(() => {
    fetchReplies();
  }, [feedback._id]);

  const fetchReplies = async () => {
    try {
      const response = await axios.get(`/api/admin/replies/${feedback._id}`);
      setReplies(response.data);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleGenerateAI = async () => {
    setLoading(true);
    try {
      await onGenerateAI(feedback._id);
      await fetchReplies();
    } catch (error) {
      console.error('Error generating AI reply:', error);
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

          <div className="mb-6">
            <button
              onClick={handleGenerateAI}
              disabled={loading}
              className="btn-primary mr-4"
            >
              {loading ? 'Generating...' : 'Generate AI Reply'}
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-secondary-900">Replies</h3>
            {replies.length === 0 ? (
              <p className="text-secondary-500">No replies yet.</p>
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