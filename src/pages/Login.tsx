import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Updated import
import { Eye, EyeOff, FileText, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react';

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
    <div className="flex min-h-screen w-screen items-center justify-center !bg-slate-100 p-4 sm:p-6">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl !bg-blue-950 p-2 shadow-2xl sm:p-3 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-2">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border-[28px] border-blue-800/50" />
        <div className="absolute -bottom-28 -left-20 h-56 w-56 rounded-full border-[24px] border-cyan-500/20" />

        <section className="relative flex min-h-[430px] flex-col justify-between px-6 py-8 text-white sm:px-10 sm:py-12 lg:min-h-[620px] lg:px-12">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl !bg-white shadow-lg">
                <img src="/efa_logo.png" alt="EFA logo" className="h-11 w-11" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">EFA Safety & Security Portal</span>
            </div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Match Reporting</p>
            <h1 className="max-w-md text-3xl font-bold leading-tight sm:text-4xl">One secure place for every match report.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-blue-100">
              Coordinate match-day operations, record incidents, and keep your team aligned with clear, timely reporting.
            </p>
          </div>
          <div className="relative mt-12 grid gap-4 text-sm text-blue-100 sm:grid-cols-2 lg:mt-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-cyan-300" size={20} />
              <span>Secure access for authorized officers</span>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 shrink-0 text-cyan-300" size={20} />
              <span>Simple reports from pre-match to full-time</span>
            </div>
          </div>
        </section>

        <section className="relative z-10 flex items-center rounded-2xl !bg-white px-6 py-10 sm:px-12 sm:py-14 lg:min-h-[600px]">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Welcome</h2>
              <p className="text-sm text-gray-500">Sign in to access your Reports</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 !bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  className="w-full rounded-xl border border-gray-200 !bg-gray-50 py-3 pl-11 pr-4 text-black outline-none transition focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 !bg-gray-50 py-3 pl-11 pr-12 text-black outline-none transition focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-0 top-0 flex h-full items-center justify-center px-4 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl !bg-blue-600 py-3 font-semibold text-white shadow-md transition duration-200 hover:!bg-blue-700"
              >
                {isLoading ? 'Signing in...' : <><LogIn size={20} /><span>Log In</span></>}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-500">
                Don&apos;t have an account? <Link to="/register" className="font-semibold text-blue-600 hover:underline">Sign up</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
