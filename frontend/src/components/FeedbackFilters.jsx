import { useState } from 'react';

const FeedbackFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    status: '',
    department: '',
    anonymous: '',
    search: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      priority: '',
      status: '',
      department: '',
      anonymous: '',
      search: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="bg-secondary-50 p-4 rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Search
          </label>
          <input
            type="text"
            name="search"
            className="input-field"
            placeholder="Search feedback..."
            value={filters.search}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Category
          </label>
          <select
            name="category"
            className="input-field"
            value={filters.category}
            onChange={handleChange}
          >
            <option value="">All Categories</option>
            <option value="General">General</option>
            <option value="Work Environment">Work Environment</option>
            <option value="Management">Management</option>
            <option value="Compensation">Compensation</option>
            <option value="Benefits">Benefits</option>
            <option value="Career Development">Career Development</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Priority
          </label>
          <select
            name="priority"
            className="input-field"
            value={filters.priority}
            onChange={handleChange}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Status
          </label>
          <select
            name="status"
            className="input-field"
            value={filters.status}
            onChange={handleChange}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="AI Draft Generated">AI Draft Generated</option>
            <option value="Responded">Responded</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Department
          </label>
          <input
            type="text"
            name="department"
            className="input-field"
            placeholder="Filter by department"
            value={filters.department}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Anonymous
          </label>
          <select
            name="anonymous"
            className="input-field"
            value={filters.anonymous}
            onChange={handleChange}
          >
            <option value="">All</option>
            <option value="true">Anonymous only</option>
            <option value="false">Identified only</option>
          </select>
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="btn-secondary text-sm"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default FeedbackFilters;