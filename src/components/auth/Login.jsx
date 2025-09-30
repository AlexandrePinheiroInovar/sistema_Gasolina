import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Fuel } from 'lucide-react';
import toast from 'react-hot-toast';
import cardFuelImage from '../../assets/card-fuel.gif';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col md:flex-row bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="flex-1 p-8 sm:p-10 lg:p-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
                <Fuel className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gasolina Manager</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe consumo e desempenho da sua frota</p>
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Bem-vindo de volta</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Informe suas credenciais para acessar o painel.
            </p>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    E-mail corporativo
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                    placeholder="nome.sobrenome@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-500/30"
              >
                {loading ? 'Entrando...' : 'Entrar no painel'}
              </button>
            </form>

            <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
              Ao acessar você concorda com os termos de uso e política de privacidade do sistema.
            </p>
          </div>

          <div className="relative hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 dark:from-blue-700 dark:via-blue-600 dark:to-sky-500">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent)]" />
            <img
              src={cardFuelImage}
              alt="Cartão de combustível"
              className="relative z-10 w-full max-w-sm lg:max-w-md object-contain drop-shadow-2xl"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
