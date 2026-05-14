import { useState } from 'react';
import { useSelector } from 'react-redux';

const FeedbackForm = ({ onSubmit }) => {
  const { loading } = useSelector((state) => state.feedback);
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    description: '',
    anonymous: false,
    priority: 'Medium',
    department: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      title: '',
      category: 'General',
      description: '',
      anonymous: false,
      priority: 'Medium',
      department: '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Title
        </label>
        <input
          type="text"
          name="title"
          required
          className="input-field"
          value={formData.title}
          onChange={handleChange}
          placeholder="Brief title for your feedback"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Category
        </label>
        <select
          name="category"
          className="input-field"
          value={formData.category}
          onChange={handleChange}
        >
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
          Description
        </label>
        <textarea
          name="description"
          required
          rows={4}
          className="input-field"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed description of your feedback"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Priority
        </label>
        <select
          name="priority"
          className="input-field"
          value={formData.priority}
          onChange={handleChange}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          Department/Team (Optional)
        </label>
        <input
          type="text"
          name="department"
          className="input-field"
          value={formData.department}
          onChange={handleChange}
          placeholder="Your department or team"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="anonymous"
          id="anonymous"
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          checked={formData.anonymous}
          onChange={handleChange}
        />
        <label htmlFor="anonymous" className="ml-2 block text-sm text-secondary-700">
          Submit anonymously
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
};

export default FeedbackForm;