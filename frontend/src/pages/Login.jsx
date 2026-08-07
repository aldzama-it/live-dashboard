import { useState } from 'react';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import api from '../axios';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isExiting, setIsExiting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Fetch CSRF cookie
      await api.get('/sanctum/csrf-cookie');

      // Post login
      const response = await api.post('/api/login', {
        email,
        password
      });

      // Trigger exit animation
      setIsExiting(true);
      setTimeout(() => {
        setUser(response.data.user);
      }, 350);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8 transition-all duration-300 ease-out ${isExiting ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}`}>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg flex flex-col md:flex-row overflow-hidden">

        {/* Left side: Branding/Image */}
        <div
          className="flex w-full md:w-1/2 items-center justify-center p-8 md:p-12 text-white flex-col bg-cover bg-center relative min-h-[100px] md:min-h-0"
          style={{ backgroundImage: "url('/Background (1).png')" }}
        >
          {/* Overlay agar text tetap terbaca jika background terang */}
          <div className="absolute inset-0 bg-primary/20"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-0 md:mb-8">
              {/* Mobile Logo */}
              <img src="/Horizontal%20(White).png" alt="Logo" className="w-48 h-auto md:hidden" />
              {/* Desktop Logo */}
              <img src="/logo-white.png" alt="Logo" className="hidden md:block w-24 h-auto" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-center font-poppins hidden md:block">Live Dashboard</h2>
            <p className="text-center text-white opacity-90 text-sm hidden md:block">
              Portal manajemen data operasional, logistik, dan finansial perusahaan.
            </p>
          </div>
        </div>

        {/* Right side: Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16">
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-boxdark mb-2 font-poppins">Sign In</h3>
            <p className="text-body text-sm">Please sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-danger/10 text-danger text-sm border border-danger/20 flex items-center">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-2.5 block font-medium text-boxdark">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-boxdark outline-none focus:border-primary focus-visible:shadow-none"
                  required
                />
                <Mail className="absolute right-4 top-4 text-body" size={20} />
              </div>
            </div>

            <div>
              <label className="mb-2.5 block font-medium text-boxdark">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="6+ Characters, 1 Capital letter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-boxdark outline-none focus:border-primary focus-visible:shadow-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-body hover:text-primary transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="mb-5 mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer rounded-lg border border-[#4056A6] bg-[#4056A6] p-4 text-white transition-all duration-300 hover:bg-[#32458a] hover:shadow-lg hover:-translate-y-1 active:bg-[#253366] active:shadow-inner active:-translate-y-0 active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none disabled:hover:bg-[#4056A6] disabled:active:scale-100"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
                ) : (
                  <>
                    <LogIn size={20} />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
