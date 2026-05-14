import { useState } from 'react';
import axios from '../utils/axios';

const categoryOptions = [
  'General',
  'Work Environment',
  'Management',
  'Compensation',
  'Benefits',
  'Career Development',
  'Other'
];

const defaultQuestions = [
  'What happened, and what would you like to improve?',
  'How did this situation affect your daily work or team?',
  'What outcome would make this feedback most helpful?',
  'What is one constructive idea or positive improvement to suggest?',
  'Are there any details that would help leadership understand this better?'
];

const AIQuestionnaire = ({ onSubmitSuggestion }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    description: '',
    priority: 'Medium',
    department: ''
  });
  const [questions, setQuestions] = useState(defaultQuestions);
  const [answers, setAnswers] = useState({});
  const [intro, setIntro] = useState('Use the AI guide below to turn your feedback into a clear, confident submission.');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => ({ ...prev, [questions[index]]: value }));
  };

  const handleGenerateQuestions = async () => {
    setError(null);
    setLoadingQuestions(true);
    setAiSuggestion(null);

    try {
      const response = await axios.post('/api/feedback/ai-questions', {
        category: formData.category,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        department: formData.department
      });

      if (response.data?.questions?.length) {
        setQuestions(response.data.questions);
        setIntro(response.data.intro || 'Answer the questions below to improve your feedback.');
        setAnswers({});
      } else {
        setError('Unable to generate questions. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI questionnaire.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleRefineFeedback = async () => {
    setError(null);
    setLoadingSuggestion(true);

    try {
      const response = await axios.post('/api/feedback/ai-refine', {
        category: formData.category,
        title: formData.title,
        priority: formData.priority,
        department: formData.department,
        answers
      });

      setAiSuggestion(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI feedback suggestion.');
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleSubmitSuggested = () => {
    if (!aiSuggestion) return;
    const safeCategory = categoryOptions.includes(aiSuggestion.improvedCategory)
      ? aiSuggestion.improvedCategory
      : formData.category;

    onSubmitSuggestion({
      title: aiSuggestion.improvedTitle,
      category: safeCategory,
      description: aiSuggestion.improvedDescription,
      priority: formData.priority,
      department: formData.department,
      anonymous: false,
      questionAnswers: answers
    });
  };

  return (
    <div className="card space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-secondary-900">AI Questionnaire Assistant</h2>
        <p className="text-secondary-600">Create polished feedback through guided AI questions. This workflow is optimized for large teams so your input is structured, professional, and instantly acknowledged.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Feedback category</label>
            <select
              name="category"
              className="input-field"
              value={formData.category}
              onChange={handleChange}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Draft title (optional)</label>
            <input
              type="text"
              name="title"
              className="input-field"
              value={formData.title}
              onChange={handleChange}
              placeholder="A quick summary for your feedback"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Draft description</label>
            <textarea
              name="description"
              rows={4}
              className="input-field"
              value={formData.description}
              onChange={handleChange}
              placeholder="Write the situation or issue you want to share"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Priority</label>
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
              <label className="block text-sm font-medium text-secondary-700 mb-1">Department / Team</label>
              <input
                type="text"
                name="department"
                className="input-field"
                value={formData.department}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateQuestions}
            disabled={loadingQuestions}
            className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingQuestions ? 'Generating questions...' : 'Generate AI Questions'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-secondary-900">What this does</h3>
            <p className="text-secondary-600 mt-2">Answer the guided questions below and the AI will turn your responses into a stronger, more actionable feedback message.</p>
            <p className="text-secondary-600 mt-2">For enterprise users, every submission also receives an immediate AI acknowledgement so your feedback is tracked and recognized without delay.</p>
            <p className="text-secondary-700 mb-3">{intro}</p>
            <ul className="space-y-2">
              {questions.map((question, index) => (
                <li key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-secondary-700">{question}</label>
                  <textarea
                    rows={3}
                    className="input-field"
                    value={answers[question] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Provide your answer here"
                  />
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={handleRefineFeedback}
            disabled={loadingSuggestion}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingSuggestion ? 'Refining feedback...' : 'Generate AI Feedback Draft'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
          {error}
        </div>
      )}

      {aiSuggestion && (
        <div className="space-y-4 border border-secondary-200 rounded-lg p-5 bg-secondary-50">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">AI Suggested Feedback</h3>
              <p className="text-secondary-600">Review the polished title, category, and description below.</p>
            </div>
            <button
              type="button"
              onClick={handleSubmitSuggested}
              className="btn-primary"
            >
              Submit AI Feedback
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-4 border border-secondary-200">
              <p className="text-xs uppercase tracking-wide text-secondary-500">Title</p>
              <p className="mt-2 text-secondary-700">{aiSuggestion.improvedTitle}</p>
            </div>
            <div className="rounded-lg bg-white p-4 border border-secondary-200">
              <p className="text-xs uppercase tracking-wide text-secondary-500">Category</p>
              <p className="mt-2 text-secondary-700">{aiSuggestion.improvedCategory}</p>
            </div>
            <div className="rounded-lg bg-white p-4 border border-secondary-200">
              <p className="text-xs uppercase tracking-wide text-secondary-500">Quick Tips</p>
              <p className="mt-2 text-secondary-700 whitespace-pre-line">{aiSuggestion.feedbackTips}</p>
            </div>
          </div>

          <div className="rounded-lg bg-white border border-secondary-200 p-4">
            <h4 className="font-medium text-secondary-900 mb-3">Polished description</h4>
            <p className="text-secondary-700 whitespace-pre-line">{aiSuggestion.improvedDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuestionnaire;
