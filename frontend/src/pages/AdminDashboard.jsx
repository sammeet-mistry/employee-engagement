import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllFeedback,
  fetchFeedbackStats,
  updateFeedbackStatus,
  deleteFeedback,
  updateFeedbackAssignment,
  generateAIReply,
  approveAndSendReply
} from '../store/slices/feedbackSlice';
import { FiDownload } from 'react-icons/fi';
import axios from '../utils/axios';
import Pagination from '../components/Pagination';
import AdminAuditLog from '../components/AdminAuditLog';
import StatsCards from '../components/StatsCards';
import FeedbackTable from '../components/FeedbackTable';
import FeedbackFilters from '../components/FeedbackFilters';
import AdminChatSessions from '../components/AdminChatSessions';
import socket from '../utils/socket';

const AdminDashboard = () => {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [assignmentError, setAssignmentError] = useState('');
  const dispatch = useDispatch();
  const { allFeedback, allFeedbackPagination, stats, loading, error } = useSelector((state) => state.feedback);

  useEffect(() => {
    dispatch(fetchFeedbackStats());
  }, [dispatch]);

  useEffect(() => {
    axios.get('/api/admin/assignees')
      .then(({ data }) => setAdmins(data))
      .catch((requestError) => {
        setAssignmentError(requestError.response?.data?.message || 'Unable to load HR assignment options.');
      });
  }, []);

  useEffect(() => {
    dispatch(fetchAllFeedback({ ...filters, page, limit: 25 }));
  }, [dispatch, filters, page]);

  useEffect(() => {
    if (page > Math.max(1, allFeedbackPagination.totalPages)) {
      setPage(Math.max(1, allFeedbackPagination.totalPages));
    }
  }, [allFeedbackPagination.totalPages, page]);

  useEffect(() => {
    socket.connect();
    const refreshFeedback = () => {
      dispatch(fetchAllFeedback({ ...filters, page, limit: 25 }));
      dispatch(fetchFeedbackStats());
    };
    socket.on('feedback:created', refreshFeedback);
    socket.on('feedback:updated', refreshFeedback);
    return () => {
      socket.off('feedback:created', refreshFeedback);
      socket.off('feedback:updated', refreshFeedback);
    };
  }, [dispatch, filters, page]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const { data } = await axios.get('/api/feedback/export.csv', {
        params: filters,
        responseType: 'blob'
      });
      const downloadUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `feedback-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setExportError('Unable to download feedback right now. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleStatusUpdate = (id, status) => {
    dispatch(updateFeedbackStatus({ id, status })).then(() => {
      dispatch(fetchAllFeedback({ ...filters, page, limit: 25 }));
      dispatch(fetchFeedbackStats());
    });
  };

  const handleAssignmentChange = (id, assignedTo) => {
    setAssignmentError('');
    dispatch(updateFeedbackAssignment({ id, assignedTo }))
      .unwrap()
      .then(() => dispatch(fetchAllFeedback({ ...filters, page, limit: 25 })))
      .catch((message) => setAssignmentError(message));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      dispatch(deleteFeedback(id)).then(() => {
        dispatch(fetchAllFeedback({ ...filters, page, limit: 25 }));
        dispatch(fetchFeedbackStats());
      });
    }
  };

  const handleGenerateAI = (feedbackId) => {
    return dispatch(generateAIReply(feedbackId)).unwrap().then(() => {
      dispatch(fetchAllFeedback({ ...filters, page, limit: 25 }));
    });
  };

  const handleApproveReply = (replyId, finalReply) => {
    dispatch(approveAndSendReply({ replyId, finalReply })).then(() => {
      dispatch(fetchAllFeedback({ ...filters, page, limit: 25 }));
      dispatch(fetchFeedbackStats());
    });
  };

  const handleConversationUpdate = () => {
    dispatch(fetchAllFeedback({ ...filters, page, limit: 25 }));
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-secondary-900">Feedback Management</h2>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={handleExport}
            disabled={exporting}
          >
            <FiDownload aria-hidden="true" />
            {exporting ? 'Preparing CSV…' : 'Download all feedback'}
          </button>
        </div>
        {exportError && <p className="mb-3 text-sm text-red-600" role="alert">{exportError}</p>}
        {assignmentError && <p className="mb-3 text-sm text-red-600" role="alert">{assignmentError}</p>}
        <FeedbackFilters onFilterChange={handleFilterChange} admins={admins} />
        <FeedbackTable
          feedback={allFeedback}
          loading={loading}
          error={error}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
          onGenerateAI={handleGenerateAI}
          onApproveReply={handleApproveReply}
          onConversationUpdate={handleConversationUpdate}
          admins={admins}
          onAssignmentChange={handleAssignmentChange}
        />
        <Pagination
          page={allFeedbackPagination.page}
          totalPages={allFeedbackPagination.totalPages}
          total={allFeedbackPagination.total}
          limit={allFeedbackPagination.limit}
          onPageChange={setPage}
          label="feedback"
        />
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Employee Chats</h2>
        <p className="text-secondary-600 mb-5">View employee chats, reply in the same conversation, and delete open chats.</p>
        <AdminChatSessions />
      </div>

      <AdminAuditLog />
    </div>
  );
};

export default AdminDashboard;
