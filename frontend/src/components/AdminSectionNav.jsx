import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import socket from '../utils/socket';

const AdminSectionNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingReviews, setPendingReviews] = useState(0);
  const [scenarioCount, setScenarioCount] = useState(0);
  const [assignedFeedback, setAssignedFeedback] = useState(0);
  const [assignmentNotice, setAssignmentNotice] = useState('');
  const [countError, setCountError] = useState('');

  const loadCounts = async () => {
    try {
      const [{ data: scenarios }, { data: unmatched }, { data: assigned }] = await Promise.all([
        axios.get('/api/admin/scenarios'),
        axios.get('/api/admin/unmatched-scenarios?status=pending_review'),
        axios.get('/api/admin/assigned-feedback-count')
      ]);
      setScenarioCount(scenarios.length);
      setPendingReviews(unmatched.length);
      setAssignedFeedback(assigned.count);
      setCountError('');
    } catch (error) {
      console.error('Unable to load admin navigation counts:', error.message);
      setCountError(error.response?.data?.message || 'Admin navigation counts are unavailable.');
    }
  };

  useEffect(() => {
    let noticeTimeout;
    loadCounts();
    socket.connect();
    socket.on('scenario:unmatched', loadCounts);
    const handleAssignment = () => {
      setAssignmentNotice('A feedback item was assigned to you.');
      window.clearTimeout(noticeTimeout);
      noticeTimeout = window.setTimeout(() => setAssignmentNotice(''), 5000);
      loadCounts();
    };
    socket.on('feedback:assignment', handleAssignment);
    socket.on('feedback:updated', loadCounts);
    return () => {
      socket.off('scenario:unmatched', loadCounts);
      socket.off('feedback:assignment', handleAssignment);
      socket.off('feedback:updated', loadCounts);
      window.clearTimeout(noticeTimeout);
    };
  }, []);

  const sections = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Knowledge Base', path: '/admin/scenarios', count: scenarioCount },
    { label: 'Review Queue', path: '/admin/review-queue', count: pendingReviews }
  ];

  return (
    <nav aria-label="Admin sections" className="flex w-full flex-wrap items-center gap-1 sm:w-auto sm:gap-2">
      {assignedFeedback > 0 && (
        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800" role="status">
          {assignedFeedback} assigned
        </span>
      )}
      {assignmentNotice && (
        <span className="sr-only" role="status">{assignmentNotice}</span>
      )}
      {countError && <span className="sr-only" role="alert">{countError}</span>}
      {sections.map((section) => {
        const active = location.pathname === section.path;
        return (
          <button
            key={section.path}
            type="button"
            onClick={() => navigate(section.path)}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition sm:gap-2 sm:px-3 sm:text-sm ${active ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'}`}
          >
            {section.label}
            {section.count > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${section.path === '/admin/review-queue' ? 'bg-amber-100 text-amber-800' : 'bg-secondary-100 text-secondary-600'}`}>
                {section.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default AdminSectionNav;