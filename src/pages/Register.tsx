import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Import the new supabase client
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("No user returned");

      // 2. Save Profile Data to your public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          { 
            id: data.user.id, // Supabase user ID
            full_name: fullName, 
            email: email, 
            role: 'officer' 
          }
        ]);

      if (profileError) throw profileError;

      alert('Registration successful! Welcome, ' + fullName);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen !bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] !bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 !bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-blue-200 shadow-lg">
            <img src="/efa_logo.png" className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        </div>

        {error && (
          <div className="!bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Full Name" className="w-full pl-11 pr-4 py-3 !bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-black" onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input type="email" placeholder="Email Address" className="w-full pl-11 pr-4 py-3 !bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-black" onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input type={showPass ? "text" : "password"} placeholder="Password" className="w-full pl-11 pr-12 py-3 !bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-black" onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-0 top-0 h-full px-4 text-gray-400 flex items-center">{showPass ? <EyeOff size={20} /> : <Eye size={20} />}</button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input type="password" placeholder="Repeat Password" className="w-full pl-11 pr-4 py-3 !bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-black" onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          <button type="submit" disabled={isLoading} className="w-full !bg-blue-600 hover:!bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md mt-2">
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500">Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}

