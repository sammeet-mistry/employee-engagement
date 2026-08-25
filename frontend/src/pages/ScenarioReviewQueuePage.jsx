import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/axios';
import ContentSkeleton from '../components/ContentSkeleton';
import socket from '../utils/socket';

const categories = ['workload', 'management', 'compensation', 'culture', 'tools_process', 'harassment_safety', 'other'];

const ScenarioReviewQueuePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQueue = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/admin/unmatched-scenarios?status=pending_review');
      setItems(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load the review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueue(); }, []);

  useEffect(() => {
    socket.connect();
    const refreshQueue = () => loadQueue();
    socket.on('scenario:unmatched', refreshQueue);
    return () => socket.off('scenario:unmatched', refreshQueue);
  }, []);

  const convert = async (item) => {
    const responseTemplate = window.prompt('Response template for this scenario:', 'Thank you for sharing this concern. HR will review it and follow up with appropriate next steps.');
    if (responseTemplate === null) return;
    try {
      await axios.post(`/api/admin/scenarios/from-unmatched/${item._id}`, {
        category: item.attemptedCategory || 'other',
        triggerPatterns: [item.rawMessage.slice(0, 120)],
        responseTemplate,
        escalationRequired: item.attemptedCategory === 'harassment_safety'
      });
      setItems((current) => current.filter((queueItem) => queueItem._id !== item._id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to convert this item.');
    }
  };

  if (loading) return <ContentSkeleton variant="card" count={3} />;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary-600">AI Knowledge Base</p>
          <h1 className="text-2xl font-bold text-secondary-900">Review queue</h1>
          <p className="mt-2 text-secondary-600">Turn low-confidence employee messages into reusable scenarios.</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">{items.length} pending</span>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {items.length === 0 && <div className="card text-secondary-500">The review queue is clear.</div>}
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div key={item._id} className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <p className="whitespace-pre-wrap text-secondary-800">{item.rawMessage}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-secondary-500">AI guess: <strong className="text-secondary-800">{item.attemptedCategory || 'other'}</strong> | confidence: {Math.round((item.confidenceScore || 0) * 100)}%</span>
              <button type="button" onClick={() => convert(item)} className="btn-primary">Convert to scenario</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ScenarioReviewQueuePage;
