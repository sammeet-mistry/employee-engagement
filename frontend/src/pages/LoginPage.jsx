import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import AuthLayout from '../components/AuthLayout';
import { clearError, login } from '../store/slices/authSlice';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(login(formData));
  };

  return (
    <AuthLayout mode="login">
      <header className="auth-form-heading">
        <span className="auth-form-kicker">WELCOME BACK</span>
        <h2>Sign in to your space</h2>
        <p>Pick up where you left off. Your workplace resources are right here.</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error" role="alert">{error}</div>}

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
          <div className="auth-field-label-row">
            <label htmlFor="password">Password</label>
            <span className="auth-field-hint"><FiLock aria-hidden="true" /> Your account password</span>
          </div>
          <div className="auth-password-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
            </button>
          </div>
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          <span>{loading ? 'Signing you in…' : 'Sign in'}</span>
          {!loading && <FiArrowRight aria-hidden="true" />}
        </button>
      </form>

      <div className="auth-switch">
        <span>New to the portal?</span>
        <Link to="/signup">Create an account <FiArrowRight aria-hidden="true" /></Link>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
