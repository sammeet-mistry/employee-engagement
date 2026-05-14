import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
            Employee Feedback
            <span className="text-primary-600"> Management</span>
          </h1>
          <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
            Streamline employee feedback with AI-powered responses. Create a culture of continuous improvement
            with our enterprise-grade feedback management system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-primary text-lg px-8 py-3">
              Login
            </Link>
            <Link to="/signup" className="btn-secondary text-lg px-8 py-3">
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">
            Powerful Features for Modern HR
          </h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            Our platform combines intuitive design with cutting-edge AI to transform how organizations handle employee feedback.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">AI-Powered Responses</h3>
            <p className="text-secondary-600">
              Generate professional, context-aware responses to employee feedback using advanced AI technology.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">Role-Based Access</h3>
            <p className="text-secondary-600">
              Secure authentication with role-based permissions ensuring employees and admins have appropriate access.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">Real-Time Analytics</h3>
            <p className="text-secondary-600">
              Comprehensive dashboards with real-time feedback analytics and status tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-secondary-300">
            © 2024 Employee Feedback Management System. Built for modern organizations.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;