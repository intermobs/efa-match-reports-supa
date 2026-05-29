import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Updated import
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Supabase Authentication
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      
      if (data.user) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Supabase error messages are usually clear strings
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gray-50! flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white! p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600! rounded-xl flex items-center justify-center mx-auto mb-4 shadow-blue-200 shadow-lg">
            <img src="/safety_logo.png" className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome</h2>
          <p className="text-gray-500 text-sm">Sign in to access your security portal</p>
        </div>

        {error && (
          <div className="bg-red-50! text-red-600 text-sm p-3 rounded-lg border border-red-200 mb-4 text-center font-medium">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input 
              type="email" 
              placeholder="Email Address"
              required
              className="w-full pl-11 pr-4 py-3 bg-gray-50! border border-gray-200! rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-black transition"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input 
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3 bg-gray-50! border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-black transition"
            />
            <button 
              type="button" 
              onClick={() => setShowPass(!showPass)} 
              className="absolute right-0 top-0 h-full px-4 text-gray-400 hover:text-gray-600 flex items-center justify-center"
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700! text-white font-semibold py-3 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? "Signing in..." : <><LogIn size={20} /><span>Log In</span></>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500">
            Don't have an account? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
