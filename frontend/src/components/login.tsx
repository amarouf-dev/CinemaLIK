import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import  client  from '../api/client';
import type { AxiosError } from 'axios';

function Login({setChangeForm}: {setChangeForm: (value: boolean) => void})
{
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const HandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await client.post('/auth/login', {
        email,
        password,
      });
      const accessToken = res.data.accessToken;
      localStorage.setItem('accessToken', accessToken);
      navigate('/home');
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

    return (
         <form className="px-7 sm:px-9 pb-3 pt-8 space-y-5" onSubmit={HandleSubmit}>
            {error && (
              <div className="rounded-lg px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/30">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="block text-xs uppercase tracking-widest mb-2 text-cinema-muted">
                Email<span className="text-cinema-orange">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                required
                className="card-input w-full rounded-lg px-4 py-3 text-sm"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
 
            <div>
              <label htmlFor="login-password" className="block text-xs uppercase tracking-widest mb-2 text-cinema-muted">
                Password<span className="text-cinema-orange">*</span>
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                minLength={8}
                className="card-input w-full rounded-lg px-4 py-3 text-sm"
              />
            </div>
 
            <div className="flex items-center justify-between text-xs">
              
              {/* keep me signed in logic */}

              {/* <label className="flex items-center gap-2 cursor-pointer text-cinema-muted">
                <input
                  type="checkbox"
                  defaultChecked
                  checked={isChecked}
                  className="w-3.5 h-3.5 accent-cinema-orange"
                />
                Keep me signed in
              </label> */}
              <a href="#" className="hover:opacity-80 text-cinema-orange">
                Forgot password?
              </a>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full marquee text-xl tracking-wide py-3.5 rounded-lg transition-colors bg-cinema-orange text-white hover:bg-cinema-orange-bright disabled:opacity-60"
            >
              {loading ? "Loading ..." : "LOGIN"}
            </button>

            <div className="p-4">
                <p className="text-center text-xs pt-1 text-cinema-muted">
                    You don't have an account?{" "}
                    <a onClick={() => setChangeForm(true)} className="hover:opacity-80 text-cinema-orange cursor-pointer">
                        register
                    </a>
                </p>
            </div>

          </form>
    );
}

export default Login;