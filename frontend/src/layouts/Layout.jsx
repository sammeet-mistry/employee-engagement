import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import AdminSectionNav from '../components/AdminSectionNav';
import { FiLogOut, FiUsers } from 'react-icons/fi';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <nav className="employee-shell-nav" aria-label="Main navigation">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div className="employee-shell-brand">
              <span className="employee-shell-mark"><FiUsers aria-hidden="true" /></span>
              <span><strong>Employee Engagement</strong><small>PEOPLE &amp; CULTURE PORTAL</small></span>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-4">
              {user?.role === 'admin' && (
                <AdminSectionNav />
              )}
              <span className="employee-shell-welcome">Welcome, <strong>{user?.name}</strong></span>
              <button
                type="button"
                onClick={handleLogout}
                className="employee-shell-logout"
              >
                <FiLogOut aria-hidden="true" /> Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;