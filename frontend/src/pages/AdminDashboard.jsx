import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllFeedback,
  fetchFeedbackStats,
  updateFeedbackStatus,
  deleteFeedback,
  generateAIReply,
  approveAndSendReply
} from '../store/slices/feedbackSlice';
import StatsCards from '../components/StatsCards';
import FeedbackTable from '../components/FeedbackTable';
import FeedbackFilters from '../components/FeedbackFilters';
import AdminChatSessions from '../components/AdminChatSessions';
import socket from '../utils/socket';

const AdminDashboard = () => {
  const [filters, setFilters] = useState({});
  const dispatch = useDispatch();
  const { allFeedback, stats, loading, error } = useSelector((state) => state.feedback);

  useEffect(() => {
    dispatch(fetchFeedbackStats());
    dispatch(fetchAllFeedback());
  }, [dispatch]);

  useEffect(() => {
    socket.connect();
    const refreshFeedback = () => {
      dispatch(fetchAllFeedback(filters));
      dispatch(fetchFeedbackStats());
    };
    socket.on('feedback:created', refreshFeedback);
    socket.on('feedback:updated', refreshFeedback);
    return () => {
      socket.off('feedback:created', refreshFeedback);
      socket.off('feedback:updated', refreshFeedback);
    };
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    dispatch(fetchAllFeedback(newFilters));
  };

  const handleStatusUpdate = (id, status) => {
    dispatch(updateFeedbackStatus({ id, status })).then(() => {
      dispatch(fetchAllFeedback(filters));
      dispatch(fetchFeedbackStats());
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      dispatch(deleteFeedback(id)).then(() => {
        dispatch(fetchAllFeedback(filters));
        dispatch(fetchFeedbackStats());
      });
    }
  };

  const handleGenerateAI = (feedbackId) => {
    return dispatch(generateAIReply(feedbackId)).unwrap().then(() => {
      dispatch(fetchAllFeedback(filters));
    });
  };

  const handleApproveReply = (replyId, finalReply) => {
    dispatch(approveAndSendReply({ replyId, finalReply })).then(() => {
      dispatch(fetchAllFeedback(filters));
      dispatch(fetchFeedbackStats());
    });
  };

  const handleConversationUpdate = () => {
    dispatch(fetchAllFeedback(filters));
    dispatch(fetchFeedbackStats());
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-900">Admin Dashboard</h1>

      <div className="rounded-lg border border-secondary-200 bg-white p-4 text-sm text-secondary-600">
        <span className="font-medium text-secondary-900">Review lineage:</span> incoming employee feedback appears here first; low-confidence items move to the Review Queue, and approved items become Knowledge Base scenarios.
      </div>

      <StatsCards stats={stats} />

      <div className="card">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Feedback Management</h2>
        <FeedbackFilters onFilterChange={handleFilterChange} />
        <FeedbackTable
          feedback={allFeedback}
          loading={loading}
          error={error}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
          onGenerateAI={handleGenerateAI}
          onApproveReply={handleApproveReply}
          onConversationUpdate={handleConversationUpdate}
        />
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Employee Chat Sessions</h2>
        <p className="text-secondary-600 mb-5">Access and manage employee HR chatbot conversations directly from the admin dashboard.</p>
        <AdminChatSessions />
      </div>
    </div>
  );
};

export default AdminDashboard;