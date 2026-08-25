import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import socket from '../utils/socket';

const AdminSectionNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingReviews, setPendingReviews] = useState(0);
  const [scenarioCount, setScenarioCount] = useState(0);

  const loadCounts = async () => {
    try {
      const [{ data: scenarios }, { data: unmatched }] = await Promise.all([
        axios.get('/api/admin/scenarios'),
        axios.get('/api/admin/unmatched-scenarios?status=pending_review')
      ]);
      setScenarioCount(scenarios.length);
      setPendingReviews(unmatched.length);
    } catch (error) {
      // The destination pages provide the detailed error state.
    }
  };

  useEffect(() => {
    loadCounts();
    socket.connect();
    socket.on('scenario:unmatched', loadCounts);
    return () => socket.off('scenario:unmatched', loadCounts);
  }, []);

  const sections = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Knowledge Base', path: '/admin/scenarios', count: scenarioCount },
    { label: 'Review Queue', path: '/admin/review-queue', count: pendingReviews }
  ];

  return (
    <nav aria-label="Admin sections" className="flex w-full flex-wrap items-center gap-1 sm:w-auto sm:gap-2">
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