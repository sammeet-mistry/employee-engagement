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

const AdminDashboard = () => {
  const [filters, setFilters] = useState({});
  const dispatch = useDispatch();
  const { allFeedback, stats, loading, error } = useSelector((state) => state.feedback);

  useEffect(() => {
    dispatch(fetchFeedbackStats());
    dispatch(fetchAllFeedback());
  }, [dispatch]);

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
    dispatch(generateAIReply(feedbackId)).then(() => {
      dispatch(fetchAllFeedback(filters));
    });
  };

  const handleApproveReply = (replyId, finalReply) => {
    dispatch(approveAndSendReply({ replyId, finalReply })).then(() => {
      dispatch(fetchAllFeedback(filters));
      dispatch(fetchFeedbackStats());
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-900">Admin Dashboard</h1>

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
        />
      </div>
    </div>
  );
};

export default AdminDashboard;