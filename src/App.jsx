import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Drivers from './pages/Drivers';
import ImportData from './pages/ImportData';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/importar-dados"
                element={
                  <ProtectedRoute adminOnly>
                    <Layout>
                      <ImportData />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute adminOnly>
                    <Layout>
                      <Users />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/condutores"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Drivers />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                },
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;