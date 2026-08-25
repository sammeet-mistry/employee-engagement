import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import ContentSkeleton from '../components/ContentSkeleton';

const categories = ['workload', 'management', 'compensation', 'culture', 'tools_process', 'harassment_safety', 'other'];

const ScenarioManagementPage = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/admin/scenarios');
      setScenarios(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load scenarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadScenarios(); }, []);

  const updateScenario = async (scenario, changes) => {
    try {
      const { data } = await axios.patch(`/api/admin/scenarios/${scenario._id}`, changes);
      setScenarios((current) => current.map((item) => item._id === data._id ? data : item));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update scenario.');
    }
  };

  const deleteScenario = async (scenarioId) => {
    if (!window.confirm('Delete this scenario?')) return;
    try {
      await axios.delete(`/api/admin/scenarios/${scenarioId}`);
      setScenarios((current) => current.filter((scenario) => scenario._id !== scenarioId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete scenario.');
    }
  };

  if (loading) return <ContentSkeleton variant="card" count={4} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-600">AI Knowledge Base</p>
        <h1 className="text-2xl font-bold text-secondary-900">Scenario management</h1>
        <p className="mt-2 text-secondary-600">Maintain the guidance used to ground HR assistant responses.</p>
        <button type="button" onClick={() => navigate('/admin/review-queue')} className="mt-3 text-sm font-medium text-primary-700 hover:text-primary-900">Review pending unmatched messages</button>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {scenarios.length === 0 && <div className="card text-secondary-500">No scenarios have been approved yet. Review unmatched messages to grow the knowledge base.</div>}
      <div className="space-y-4">
        {scenarios.map((scenario, index) => (
          <motion.div key={scenario._id} className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-secondary-900">{scenario.category}</h2>
                  <span className={`rounded-full px-2 py-1 text-xs ${scenario.escalationRequired ? 'bg-amber-100 text-amber-800' : 'bg-secondary-100 text-secondary-600'}`}>
                    {scenario.escalationRequired ? 'HR escalation' : 'Standard response'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-secondary-600">Triggers: {(scenario.triggerPatterns || []).join(', ') || 'No trigger phrases'}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-secondary-700">{scenario.responseTemplate || 'No response template defined.'}</p>
                <p className="mt-3 text-xs text-secondary-500">Used {scenario.usageCount || 0} times{scenario.lastMatchedAt ? `; last matched ${new Date(scenario.lastMatchedAt).toLocaleString()}` : ''}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <select aria-label={`Change category for ${scenario.category}`} value={scenario.category} onChange={(event) => updateScenario(scenario, { category: event.target.value })} className="input-field w-auto text-sm">
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <button type="button" onClick={() => updateScenario(scenario, { escalationRequired: !scenario.escalationRequired })} className="btn-secondary">
                  {scenario.escalationRequired ? 'Remove escalation' : 'Require escalation'}
                </button>
                <button type="button" onClick={() => deleteScenario(scenario._id)} className="rounded-lg bg-red-50 px-4 py-2 font-medium text-red-700 transition hover:bg-red-100">Delete</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ScenarioManagementPage;
