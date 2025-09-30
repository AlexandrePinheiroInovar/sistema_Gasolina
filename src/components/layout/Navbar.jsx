import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LogOut, Moon, Sun, User, Menu, X, Key, BookOpen } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { toast } from 'react-hot-toast';

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { logout, userProfile } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validações
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    setIsChangingPassword(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      await updatePassword(user, newPassword);

      toast.success('Senha alterada com sucesso!');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error) {
      console.error('Erro ao trocar senha:', error);

      if (error.code === 'auth/requires-recent-login') {
        toast.error('Por segurança, faça login novamente antes de trocar a senha');
      } else {
        toast.error('Erro ao trocar senha. Tente novamente.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const openPasswordModal = () => {
    setProfileMenuOpen(false);
    setShowPasswordModal(true);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  return (
    <>
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center space-x-3 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Gasolina Manager</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm hidden sm:block">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {userProfile?.nome || 'Usuário'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 capitalize">
                    {userProfile?.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-[250px] bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 z-50">
                {/* Header com Avatar, Nome, Email, Badge e Status */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  {/* Avatar Circular */}
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Nome */}
                  <p className="text-sm font-bold text-gray-900 dark:text-white text-center">
                    {userProfile?.nome || 'Usuário'}
                  </p>

                  {/* Email */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                    {userProfile?.email || 'email@exemplo.com'}
                  </p>

                  {/* Badge da Função */}
                  <div className="flex justify-center mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userProfile?.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : userProfile?.role === 'diretoria'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {userProfile?.role === 'admin' ? 'Admin' :
                       userProfile?.role === 'diretoria' ? 'Diretoria' : 'Supervisor'}
                    </span>
                  </div>

                  {/* Status Firebase */}
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Firebase conectado
                    </span>
                  </div>
                </div>

                {/* Opções do Menu */}
                <div className="p-2">
                  {/* Trocar Senha */}
                  <button
                    onClick={openPasswordModal}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Key className="h-4 w-4 mr-3" />
                    🔑 Trocar Senha
                  </button>

                  {/* Alternar Tema */}
                  <button
                    onClick={() => {
                      toggleDarkMode();
                      setProfileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors mt-1"
                  >
                    {darkMode ? (
                      <>
                        <Sun className="h-4 w-4 mr-3" />
                        ☀️ Tema Claro
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 mr-3" />
                        🌙 Tema Escuro
                      </>
                    )}
                  </button>

                  {/* Sair */}
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1 font-medium"
                  >
                    <BookOpen className="h-4 w-4 mr-3" />
                    📕 Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </nav>

      {/* Modal de Trocar Senha - REDESENHADO */}
      {showPasswordModal && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            inset: '0'
          }}
          onClick={closePasswordModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-xl shadow-2xl ${
              darkMode ? 'bg-slate-800' : 'bg-white'
            }`}
            style={{ maxWidth: '28rem' }}
          >
            {/* 🔑 HEADER DESTACADO */}
            <div className={`flex items-center gap-3 p-6 border-b ${
              darkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  🔑 Trocar Senha
                </h2>
                <p className={`text-sm ${
                  darkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Atualize sua senha de acesso
                </p>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 📝 FORMULÁRIO */}
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {/* Campo Nova Senha */}
              <div>
                <label className={`block mb-2 text-sm font-semibold ${
                  darkMode ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Nova Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    darkMode
                      ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-blue-50/50'
                  } focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
                />
              </div>

              {/* Campo Confirmar Senha */}
              <div>
                <label className={`block mb-2 text-sm font-semibold ${
                  darkMode ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente a senha"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    darkMode
                      ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-blue-50/50'
                  } focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
                />
              </div>

              {/* ⚠️ Mensagem de Erro */}
              {passwordError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    ⚠️ {passwordError}
                  </p>
                </div>
              )}

              {/* 🎯 BOTÕES */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={isChangingPassword}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                    darkMode
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? '⏳ Alterando...' : '✅ Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;