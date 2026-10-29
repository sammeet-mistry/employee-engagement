import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiCheck, FiFileText, FiMessageCircle, FiUsers } from 'react-icons/fi';

const AuthLayout = ({ children, mode }) => (
  <main className="auth-page">
    <div className={`auth-layout auth-layout-${mode}`}>
      <section className="auth-story" aria-label="Employee Engagement portal">
        <Link to="/" className="auth-brand" aria-label="Employee Engagement home">
          <span className="auth-brand-mark"><FiUsers aria-hidden="true" /></span>
          <span>
            <strong>People &amp; Culture</strong>
            <small>EMPLOYEE ENGAGEMENT</small>
          </span>
        </Link>

        <div className="auth-story-copy">
          <span className="auth-eyebrow"><span /> A BETTER WORKPLACE STARTS HERE</span>
          <h1>Your voice<br />moves us <em>forward.</em></h1>
          <p>A considered space to share feedback, follow its progress, and find answers from your workplace resources.</p>

          <ul className="auth-benefits">
            <li><span><FiFileText aria-hidden="true" /></span><span><strong>Feedback that stays in view</strong><small>Track your submissions and HR responses.</small></span><FiCheck className="auth-benefit-check" aria-hidden="true" /></li>
            <li><span><FiMessageCircle aria-hidden="true" /></span><span><strong>Workplace answers, with sources</strong><small>Explore guidance from your HR knowledge base.</small></span><FiCheck className="auth-benefit-check" aria-hidden="true" /></li>
          </ul>
        </div>

        <div className="auth-story-footer">
          <span>EMPLOYEE ENGAGEMENT</span>
          <span>PEOPLE FIRST, ALWAYS</span>
        </div>
        <span className="auth-orbit auth-orbit-one" aria-hidden="true" />
        <span className="auth-orbit auth-orbit-two" aria-hidden="true" />
        <span className="auth-orbit auth-orbit-three" aria-hidden="true" />
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark"><FiUsers aria-hidden="true" /></span>
            <strong>People &amp; Culture</strong>
          </div>
          {children}
          <p className="auth-legal-note">By continuing, you agree to use this portal in line with your organization’s workplace policies.</p>
        </div>
        <Link to="/" className="auth-home-link">Back to home <FiArrowUpRight aria-hidden="true" /></Link>
      </section>
    </div>
  </main>
);

export default AuthLayout;
