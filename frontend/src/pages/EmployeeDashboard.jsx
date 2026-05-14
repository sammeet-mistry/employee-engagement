import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyFeedbackWithReplies, submitFeedback } from '../store/slices/feedbackSlice';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackList from '../components/FeedbackList';

const EmployeeDashboard = () => {
  const [showForm, setShowForm] = useState(false);
  const dispatch = useDispatch();
  const { myFeedback, loading, error } = useSelector((state) => state.feedback);

  useEffect(() => {
    dispatch(fetchMyFeedbackWithReplies());
  }, [dispatch]);

  const handleSubmitFeedback = (feedbackData) => {
    dispatch(submitFeedback(feedbackData)).then(() => {
      setShowForm(false);
      dispatch(fetchMyFeedbackWithReplies());
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary-900">Employee Dashboard</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : 'Submit New Feedback'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Submit Feedback</h2>
          <FeedbackForm onSubmit={handleSubmitFeedback} />
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">My Feedback History</h2>
        <FeedbackList feedback={myFeedback} loading={loading} error={error} showReplies />
      </div>
    </div>
  );
};

export default EmployeeDashboard;