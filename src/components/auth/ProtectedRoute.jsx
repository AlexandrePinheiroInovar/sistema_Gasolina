import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (adminOnly && userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;