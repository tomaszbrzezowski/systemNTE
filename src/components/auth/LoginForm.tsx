import React from 'react';
import { User, Lock, AlertCircle } from 'lucide-react';
import FormInput from '../common/FormInput';
import AppSelector from './AppSelector';
import { useLogin } from '../../hooks/useLogin';

const LoginForm: React.FC = () => {
  const {
    email,
    password,
    showPassword,
    error,
    loading,
    selectedApp,
    setEmail,
    setPassword,
    setShowPassword,
    setSelectedApp,
    handleSubmit,
  } = useLogin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-white to-red-100 flex flex-col items-center sm:justify-center p-2 sm:p-4 pt-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-red-900/20 transition-all duration-300 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.3)] mt-0 sm:mt-0">
          <div className="bg-gradient-to-r from-red-900 to-red-800 p-4 sm:p-8 text-center relative">
            <div className="absolute inset-0 bg-black/20 top-[-100px] sm:top-0"></div>
            <div className="relative">
              <img
                src="https://vpbhdyylesqgyxclhvan.supabase.co/storage/v1/object/public/pictures//imageNTELOGO.png"
                alt="NTE Logo"
                className="mx-auto mb-2 sm:mb-4 max-w-[200px] sm:max-w-[240px] w-full h-auto rounded-lg p-3 animate-logo opacity-0"
              />
              <div className="w-36 sm:w-48 h-0.5 mx-auto mb-3 sm:mb-6 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">
                NARODOWY TEATR EDUKACJI
              </h1>
              <AppSelector selectedApp={selectedApp} onAppSelect={setSelectedApp} />
              {selectedApp && (
                <p className="text-xs sm:text-sm text-white/80">
                  {selectedApp === 'calendar' ? 'Logowanie do kalendarza' : 'Logowanie do systemu wydarzeń'}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 text-red-800 rounded-lg p-3 sm:p-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <FormInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="Wprowadź email"
              icon={User}
              required
            />

            <FormInput
              id="password"
              label="Hasło"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="Wprowadź hasło"
              icon={Lock}
              required
              showPasswordToggle
              onPasswordToggle={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-900 to-red-800 text-white rounded-lg px-4 py-2.5 sm:py-2 hover:from-red-800 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;