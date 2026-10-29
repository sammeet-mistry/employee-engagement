import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiArrowUpRight,
  FiCheckCircle,
  FiChevronRight,
  FiClipboard,
  FiFileText,
  FiGrid,
  FiMessageCircle,
  FiPlus,
  FiSearch,
  FiUser
} from 'react-icons/fi';
import { fetchMyFeedbackWithReplies, submitFeedback } from '../store/slices/feedbackSlice';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackList from '../components/FeedbackList';
import AIQuestionnaire from '../components/AIQuestionnaire';
import HRKnowledgeAssistant from '../components/HRKnowledgeAssistant';
import socket from '../utils/socket';

const sections = [
  { id: 'overview', label: 'Overview', icon: FiGrid },
  { id: 'feedback', label: 'My feedback', icon: FiFileText },
  { id: 'questionnaire', label: 'Guided submission', icon: FiClipboard },
  { id: 'assistant', label: 'HR knowledge assistant', icon: FiMessageCircle }
];

const getFeedbackStatus = (item) => {
  if (['Responded', 'Resolved', 'AI Auto Responded'].includes(item.status)) return 'Responded';
  if (item.status === 'Under Review') return 'In review';
  if (['Pending', 'AI Draft Generated'].includes(item.status)) return 'Pending';
  return item.status || 'Pending';
};

const EmployeeDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [sortOrder, setSortOrder] = useState('newest');
  const [actionMessage, setActionMessage] = useState('');
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { myFeedback, loading, fetchError } = useSelector((state) => state.feedback);

  useEffect(() => {
    dispatch(fetchMyFeedbackWithReplies());
  }, [dispatch]);

  useEffect(() => {
    socket.connect();
    const refreshFeedback = () => dispatch(fetchMyFeedbackWithReplies());
    socket.on('feedback:created', refreshFeedback);
    socket.on('feedback:updated', refreshFeedback);
    return () => {
      socket.off('feedback:created', refreshFeedback);
      socket.off('feedback:updated', refreshFeedback);
    };
  }, [dispatch]);

  const feedbackCounts = useMemo(() => ({
    total: myFeedback.length,
    inReview: myFeedback.filter((item) => ['Pending', 'In review'].includes(getFeedbackStatus(item))).length,
    responded: myFeedback.filter((item) => getFeedbackStatus(item) === 'Responded').length
  }), [myFeedback]);

  const filteredFeedback = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...myFeedback]
      .filter((item) => statusFilter === 'All statuses' || getFeedbackStatus(item) === statusFilter)
      .filter((item) => !query || [item.title, item.description, item.category].some((value) => String(value || '').toLowerCase().includes(query)))
      .sort((left, right) => {
        const difference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        return sortOrder === 'newest' ? difference : -difference;
      });
  }, [myFeedback, search, sortOrder, statusFilter]);

  const handleSubmitFeedback = async (feedbackData, showGlobalSuccess = true) => {
    try {
      await dispatch(submitFeedback(feedbackData)).unwrap();
      setShowForm(false);
      if (showGlobalSuccess) setActionMessage('Your feedback has been submitted.');
      await dispatch(fetchMyFeedbackWithReplies());
      return true;
    } catch {
      setActionMessage('');
      return false;
    }
  };

  const openFeedbackForm = () => {
    setActiveSection('feedback');
    setShowForm((visible) => !visible);
  };

  const latestFeedback = myFeedback[0];
  const displayName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const feedbackLoaded = !loading && !fetchError;
  const latestFeedbackLabel = loading ? 'Loading activity…' : fetchError ? 'Activity unavailable' : latestFeedback?.title || 'Your story starts here';
  const latestFeedbackNote = fetchError ? 'See recent activity to retry' : loading ? 'Your submissions' : latestFeedback ? getFeedbackStatus(latestFeedback) : 'Share feedback whenever you’re ready';

  return (
    <div className="employee-workspace">
      <header className="employee-heading">
        <div>
          <div className="employee-eyebrow"><span className="employee-eyebrow-dot" /> EMPLOYEE SPACE</div>
          <h1>Good to see you, {displayName}.</h1>
          <p>Your feedback, conversations, and workplace resources in one place.</p>
        </div>
        <div className="employee-profile" aria-label="Your profile">
          <span className="employee-profile-avatar"><FiUser aria-hidden="true" /></span>
          <span className="employee-profile-copy">
            <strong>{user?.name || 'Team member'}</strong>
            <span>{user?.department || 'Employee'}</span>
          </span>
        </div>
      </header>

      <nav className="employee-nav" aria-label="Employee workspace">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`employee-nav-item ${activeSection === id ? 'is-active' : ''}`}
            onClick={() => setActiveSection(id)}
            aria-current={activeSection === id ? 'page' : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {activeSection === id && <span className="employee-nav-indicator" />}
          </button>
        ))}
      </nav>

      {actionMessage && (
        <div className="employee-success" role="status">
          <FiCheckCircle aria-hidden="true" />
          <span>{actionMessage}</span>
          <button type="button" onClick={() => setActionMessage('')} aria-label="Dismiss confirmation">Dismiss</button>
        </div>
      )}

      {activeSection === 'overview' && (
        <main className="employee-overview">
          <section className="employee-hero">
            <div className="employee-hero-content">
              <span className="employee-hero-kicker">YOUR WORKPLACE, YOUR VOICE</span>
              <h2>Make your experience<br className="hidden sm:block" /> part of the conversation.</h2>
              <p>Share feedback with your organization or explore answers from approved HR resources.</p>
              <div className="employee-hero-actions">
                <button type="button" className="employee-button employee-button-light" onClick={openFeedbackForm}>
                  <FiPlus aria-hidden="true" /> Share feedback
                </button>
                <button type="button" className="employee-hero-link" onClick={() => setActiveSection('assistant')}>
                  Explore HR resources <FiArrowUpRight aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="employee-hero-mark" aria-hidden="true">
              <span className="employee-hero-orbit employee-hero-orbit-one" />
              <span className="employee-hero-orbit employee-hero-orbit-two" />
              <span className="employee-hero-orbit employee-hero-orbit-three" />
              <span className="employee-hero-spark">✳</span>
            </div>
          </section>

          <section className="employee-summary-grid" aria-label="Your feedback summary">
            <article className="employee-summary-card">
              <span className="employee-summary-icon summary-icon-violet"><FiFileText aria-hidden="true" /></span>
              <span className="employee-summary-label">Feedback shared</span>
              <strong>{feedbackLoaded ? feedbackCounts.total : 'N/A'}</strong>
              <span className="employee-summary-note">Your submissions</span>
            </article>
            <article className="employee-summary-card">
              <span className="employee-summary-icon summary-icon-amber"><FiClipboard aria-hidden="true" /></span>
              <span className="employee-summary-label">Open submissions</span>
              <strong>{feedbackLoaded ? feedbackCounts.inReview : 'N/A'}</strong>
              <span className="employee-summary-note">Pending or being reviewed</span>
            </article>
            <article className="employee-summary-card">
              <span className="employee-summary-icon summary-icon-green"><FiCheckCircle aria-hidden="true" /></span>
              <span className="employee-summary-label">Responded</span>
              <strong>{feedbackLoaded ? feedbackCounts.responded : 'N/A'}</strong>
              <span className="employee-summary-note">Replies or resolutions recorded</span>
            </article>
            <article className="employee-summary-card employee-latest-card">
              <span className="employee-summary-icon summary-icon-blue"><FiMessageCircle aria-hidden="true" /></span>
              <span className="employee-summary-label">Latest update</span>
              <strong className="employee-latest-title">{latestFeedbackLabel}</strong>
              <span className="employee-summary-note">{latestFeedbackNote}</span>
            </article>
          </section>

          <section className="employee-lower-grid">
            <article className="employee-panel employee-recent-panel">
              <div className="employee-panel-heading">
                <div>
                  <span className="employee-panel-kicker">YOUR ACTIVITY</span>
                  <h2>Recent feedback</h2>
                </div>
                <button type="button" className="employee-text-link" onClick={() => setActiveSection('feedback')}>
                  View all <FiChevronRight aria-hidden="true" />
                </button>
              </div>
              {loading ? (
                <div className="employee-inline-state" role="status">Loading your feedback…</div>
              ) : fetchError ? (
                <div className="employee-inline-error" role="alert">
                  <span>{fetchError}</span>
                  <button type="button" onClick={() => dispatch(fetchMyFeedbackWithReplies())}>Try again</button>
                </div>
              ) : myFeedback.length ? (
                <div className="employee-recent-list">
                  {myFeedback.slice(0, 3).map((item) => (
                    <button className="employee-recent-item" type="button" key={item._id} onClick={() => setActiveSection('feedback')}>
                      <span className="employee-recent-bullet" />
                      <span className="employee-recent-copy">
                        <strong>{item.title}</strong>
                        <span>{item.category} <span aria-hidden="true">·</span> {new Date(item.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span className={`employee-status-pill status-${getFeedbackStatus(item).toLowerCase().replace(/\s+/g, '-')}`}>{getFeedbackStatus(item)}</span>
                      <FiChevronRight className="employee-recent-chevron" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="employee-empty-state">
                  <span className="employee-empty-icon"><FiFileText aria-hidden="true" /></span>
                  <strong>No feedback yet</strong>
                  <span>Your submissions and any recorded replies will appear here.</span>
                  <button type="button" className="employee-text-link" onClick={openFeedbackForm}>Share your first feedback <FiArrowUpRight aria-hidden="true" /></button>
                </div>
              )}
            </article>

            <aside className="employee-panel employee-help-panel">
              <span className="employee-help-badge"><FiMessageCircle aria-hidden="true" /> HERE TO HELP</span>
              <h2>Looking for an HR answer?</h2>
              <p>Ask a question about workplace resources. Responses should be grounded in approved HR information, with sources shown when available.</p>
              <button type="button" className="employee-button employee-button-dark" onClick={() => setActiveSection('assistant')}>
                Open HR assistant <FiArrowUpRight aria-hidden="true" />
              </button>
              <div className="employee-help-footnote"><span /> Your conversations are private to your account</div>
            </aside>
          </section>
        </main>
      )}

      {activeSection === 'feedback' && (
        <main className="employee-section">
          <div className="employee-section-heading">
            <div>
              <span className="employee-panel-kicker">YOUR VOICE MATTERS</span>
              <h2>My feedback</h2>
              <p>Review your submissions and any replies recorded for them.</p>
            </div>
            <button type="button" className="employee-button employee-button-dark" onClick={() => setShowForm((visible) => !visible)}>
              <FiPlus aria-hidden="true" /> {showForm ? 'Close form' : 'Share feedback'}
            </button>
          </div>

          {showForm && (
            <section className="employee-panel employee-form-panel">
              <div className="employee-panel-heading">
                <div><span className="employee-panel-kicker">NEW SUBMISSION</span><h2>Share feedback</h2></div>
              </div>
              <FeedbackForm onSubmit={handleSubmitFeedback} />
            </section>
          )}

          <section className="employee-panel employee-history-panel" aria-labelledby="feedback-history-title">
            <div className="employee-panel-heading">
              <div><span className="employee-panel-kicker">SUBMISSION HISTORY</span><h2 id="feedback-history-title">Your feedback</h2></div>
              <span className="employee-count">{myFeedback.length} {myFeedback.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            <div className="employee-feedback-controls">
              <label className="employee-search">
                <FiSearch aria-hidden="true" />
                <span className="sr-only">Search feedback</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, category, or details" />
              </label>
              <label className="employee-select-control">
                <span className="sr-only">Filter by status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option>All statuses</option>
                  <option>Pending</option>
                  <option>In review</option>
                  <option>Responded</option>
                </select>
              </label>
              <label className="employee-select-control">
                <span className="sr-only">Sort feedback</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>
            <FeedbackList
              feedback={filteredFeedback}
              loading={loading}
              error={fetchError}
              showReplies
              onRetry={() => dispatch(fetchMyFeedbackWithReplies())}
              isFiltered={Boolean(search || statusFilter !== 'All statuses')}
            />
          </section>
        </main>
      )}

      {activeSection === 'questionnaire' && (
        <main className="employee-section">
          <div className="employee-section-heading">
            <div>
              <span className="employee-panel-kicker">A LITTLE HELP GETTING STARTED</span>
              <h2>Guided feedback</h2>
              <p>Use optional prompts to organize your thoughts before submitting.</p>
            </div>
          </div>
          <section className="employee-panel employee-questionnaire-panel">
            <AIQuestionnaire onSubmitSuggestion={(feedbackData) => handleSubmitFeedback(feedbackData, false)} />
          </section>
        </main>
      )}

      {activeSection === 'assistant' && (
        <main className="employee-section">
          <div className="employee-section-heading employee-assistant-heading">
            <div>
              <span className="employee-panel-kicker">APPROVED WORKPLACE RESOURCES</span>
              <h2>HR knowledge assistant</h2>
              <p>Ask about workplace resources. Sources are shown with answers when provided by the knowledge base.</p>
            </div>
          </div>
          <section className="employee-panel employee-chat-panel">
            <HRKnowledgeAssistant />
          </section>
        </main>
      )}
    </div>
  );
};

export default EmployeeDashboard;
