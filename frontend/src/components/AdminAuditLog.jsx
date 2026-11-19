import { useCallback, useEffect, useState } from 'react';
import axios from '../utils/axios';
import { formatFullDateTime } from '../utils/date';
import Pagination from './Pagination';
import socket from '../utils/socket';

const AdminAuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async (requestedPage = page) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/admin/audit', {
        params: { page: requestedPage, limit: 20 }
      });
      setLogs(data.items);
      setPagination(data.pagination);
      const lastPage = Math.max(1, data.pagination.totalPages);
      if (requestedPage > lastPage) setPage(lastPage);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load audit history.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadLogs(page);
  }, [loadLogs, page]);

  useEffect(() => {
    const refreshLogs = () => loadLogs(page);
    socket.on('audit:created', refreshLogs);
    return () => socket.off('audit:created', refreshLogs);
  }, [loadLogs, page]);

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900">Admin audit history</h2>
          <p className="mt-1 text-sm text-secondary-600">Recent exports and feedback-management actions.</p>
        </div>
        <span className="text-sm text-secondary-500">{pagination.total} events</span>
      </div>
      {error && <p className="mb-3 text-sm text-red-600" role="alert">{error}</p>}
      {loading ? (
        <p className="py-6 text-center text-sm text-secondary-500" role="status">Loading audit history…</p>
      ) : logs.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary-500">When</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary-500">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary-500">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary-500">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 bg-white">
              {logs.map((entry) => (
                <tr key={entry._id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-secondary-600">
                    {formatFullDateTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-900">{entry.actor?.name || 'Former user'}</td>
                  <td className="px-4 py-3 text-sm text-secondary-700">{entry.action.replaceAll('.', ' ')}</td>
                  <td className="px-4 py-3 text-sm text-secondary-600">
                    {entry.resourceType}{entry.resourceId ? ` · ${entry.resourceId}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-secondary-500">No admin activity recorded yet.</p>
      )}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={setPage}
        label="audit events"
      />
    </section>
  );
};

export default AdminAuditLog;
