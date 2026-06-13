import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MessageSquare } from 'lucide-react';
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const {
    login
  } = useAuth();
  const handleLogin = async e => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });
      login(response.data.token, {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      });
      if (response.data.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response?.data : 'Invalid credentials');
      setError(errorMsg);
    }
  };

  const acc = [
    {
      id: 1,
      name: 'Rekshin',
      password: 'rekshin',
    },
    {
      id: 2,
      name: 'Hari',
      password: 'hari',
    },
    {
      id: 3,
      name: 'Barani',
      password: 'barani',
    },
    {
      id: 4,
      name: 'Roriri',
      password: 'roriri',
    },
  ]
  return <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-500 p-3 rounded-xl shadow-lg shadow-indigo-500/50">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Sign in to ChatConnect  
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-700">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && <div className="text-red-400 text-sm text-center bg-red-900/30 py-2 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-300">Username</label>
              <div className="mt-1">
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-lg shadow-sm placeholder-slate-400 bg-slate-900 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <div className="mt-1">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-lg shadow-sm placeholder-slate-400 bg-slate-900 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200" />
              </div>
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 transition-colors duration-200">
                Sign in
              </button>
            </div>
          </form>
          <div className="flex gap-2 justify-center">
            {acc.map(acc => (
              <button
              key={acc.id}
              onClick={() => {
                setUsername(acc.name);
                setPassword(acc.password);
              }}
              className="flex-row justify-center mt-10 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-black/40 hover:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 transition-colors duration-200"
              >
                {acc.name}
              </button>
            ))}
            </div>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-400">Don't have an account? </span>
            <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>;
};
export default Login;