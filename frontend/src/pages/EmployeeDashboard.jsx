import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyFeedbackWithReplies, submitFeedback } from '../store/slices/feedbackSlice';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackList from '../components/FeedbackList';
import AIQuestionnaire from '../components/AIQuestionnaire';
import ChatbotAssistant from '../components/AIChatbot';

const EmployeeDashboard = () => {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('myFeedback');
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-secondary-900">Welcome back, {user?.name || 'Team Member'}</h1>
          <p className="text-secondary-600 mt-2 max-w-2xl">This enterprise dashboard is built for a large workforce. It gives you a personalized feedback history, AI-assisted submission workflow, and automatic AI response acknowledgement so your voice is seen and acted on quickly.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : 'Submit New Feedback'}
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-secondary-900">Your personal insights</h2>
          <p className="text-secondary-600 mt-3">Your dashboard only shows feedback you submitted, your department context, and the AI responses tied to your work experience.</p>
          <div className="mt-5 space-y-3 text-sm text-secondary-700">
            <div><span className="font-medium">Total feedback submitted:</span> {myFeedback.length}</div>
            <div><span className="font-medium">Most recent status:</span> {myFeedback[0]?.status || 'No submissions yet'}</div>
            <div><span className="font-medium">Department:</span> {user?.department || myFeedback[0]?.department || 'Your department'}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-secondary-900">Enterprise-ready workflow</h2>
          <p className="text-secondary-600 mt-3">Designed for companies with 1,000+ employees, the AI workflow automatically acknowledges submissions and helps keep admin workload lean while preserving personalized follow-up for each contributor.</p>
          <ul className="mt-5 space-y-3 text-sm text-secondary-700">
            <li>AI auto-response on submit</li>
            <li>Personal feedback history per employee</li>
            <li>Filtered status and reply tracking</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">
        <div className="flex flex-wrap sm:flex-nowrap bg-secondary-50">
          <button
            type="button"
            onClick={() => setActiveTab('myFeedback')}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${activeTab === 'myFeedback' ? 'bg-white text-secondary-900' : 'text-secondary-500 hover:bg-secondary-100'}`}
          >
            My Feedback
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('aiQuestionnaire')}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${activeTab === 'aiQuestionnaire' ? 'bg-white text-secondary-900' : 'text-secondary-500 hover:bg-secondary-100'}`}
          >
            AI Questionnaire
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('aiChat')}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${activeTab === 'aiChat' ? 'bg-white text-secondary-900' : 'text-secondary-500 hover:bg-secondary-100'}`}
          >
            AI Chat
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'myFeedback' ? (
            <>
              {showForm && (
                <div className="card mb-6">
                  <h2 className="text-xl font-semibold text-secondary-900 mb-4">Submit Feedback</h2>
                  <FeedbackForm onSubmit={handleSubmitFeedback} />
                </div>
              )}

              <div className="card">
                <h2 className="text-xl font-semibold text-secondary-900 mb-4">My Feedback History</h2>
                <FeedbackList feedback={myFeedback} loading={loading} error={error} showReplies />
              </div>
            </>
          ) : activeTab === 'aiQuestionnaire' ? (
            <AIQuestionnaire onSubmitSuggestion={handleSubmitFeedback} />
          ) : (
            <ChatbotAssistant />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;