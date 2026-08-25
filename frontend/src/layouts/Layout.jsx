import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminSectionNav from '../components/AdminSectionNav';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <nav className="bg-white shadow-sm border-b border-secondary-200">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-secondary-900 sm:text-xl">
                Employee Feedback System
              </h1>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-4">
              {user?.role === 'admin' && (
                <AdminSectionNav />
              )}
              <span className="text-secondary-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                Logout
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