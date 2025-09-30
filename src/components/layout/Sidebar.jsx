import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BarChart3,
  Users,
  Car,
  UserPlus,
  Fuel
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      current: false
    },
    { name: 'Condutores', href: '/condutores', icon: Car, current: false },
    ...(isAdmin ? [
      { name: 'Usuários', href: '/usuarios', icon: Users, current: false }
    ] : []),
  ];

  const NavItem = ({ item }) => {
    return (
      <NavLink
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={({ isActive }) =>
          `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
            isActive || (item.href === '/dashboard' && location.pathname === '/')
              ? 'bg-gradient-to-r from-primary-100 to-primary-50 text-primary-900 dark:from-primary-900/30 dark:to-primary-800/20 dark:text-primary-100 shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'
          }`
        }
      >
        <item.icon
          className="mr-3 flex-shrink-0 h-5 w-5"
          aria-hidden="true"
        />
        {item.name}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-lg border-r border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <Fuel className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  Gasolina Manager
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sistema de Gestão
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* User info */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userProfile?.nome || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userProfile?.role === 'admin' ? 'Administrador' : 'Usuário'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;