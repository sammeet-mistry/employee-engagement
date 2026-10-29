import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import AuthLayout from '../components/AuthLayout';
import { clearError, register } from '../store/slices/authSlice';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/employee');
  }, [user, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (event) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    if (error) dispatch(clearError());
    if (passwordError) setPasswordError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Your passwords don’t match yet. Check them and try again.');
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    registerData.role = 'employee';
    dispatch(register(registerData));
  };

  return (
    <AuthLayout mode="signup">
      <header className="auth-form-heading">
        <span className="auth-form-kicker">GET STARTED</span>
        <h2>Create your account</h2>
        <p>Join your employee portal to share feedback and explore workplace resources.</p>
      </header>

      <form className="auth-form auth-form-signup" onSubmit={handleSubmit}>
        {error && <div className="auth-error" role="alert">{error}</div>}

        <div className="auth-field">
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            minLength={2}
            maxLength={50}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="email">Work email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="department">Department <span className="auth-optional">(optional)</span></label>
          <input
            id="department"
            name="department"
            type="text"
            autoComplete="organization-title"
            placeholder="e.g. People & Culture"
            value={formData.department}
            onChange={handleChange}
            maxLength={50}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Create a password</label>
          <div className="auth-password-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />
            <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
            </button>
          </div>
          <span className="auth-field-footnote">Use at least 6 characters.</span>
        </div>

        <div className="auth-field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Enter your password again"
            value={formData.confirmPassword}
            onChange={handleChange}
            minLength={6}
            required
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? 'confirm-password-error' : undefined}
          />
          {passwordError && <span id="confirm-password-error" className="auth-inline-error" role="alert">{passwordError}</span>}
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          <span>{loading ? 'Creating your account…' : 'Create account'}</span>
          {!loading && <FiArrowRight aria-hidden="true" />}
        </button>
      </form>

      <div className="auth-switch">
        <span>Already have an account?</span>
        <Link to="/login">Sign in <FiArrowRight aria-hidden="true" /></Link>
      </div>
    </AuthLayout>
  );
};

export default SignUpPage;
