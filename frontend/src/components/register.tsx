import { useState } from "react";
import client from '../api/client'
import { useNavigate } from "react-router-dom";

function Register({setChangeForm}: {setChangeForm: (value: boolean) => void})
{
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confpassword, setconfPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();  
  const [loading, setLoading] = useState(false);


  const HandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await client.post('/auth/register', {
        name,
        email,
        password,
      });
      const accessToken = res.data.accessToken;
      localStorage.setItem('accessToken', accessToken);
      navigate('/home');
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

    return (
         <form className="px-7 sm:px-9 pb-3 pt-6 space-y-4" onSubmit={HandleSubmit}>
            <div>
              <label htmlFor="register-name" className="block text-xs uppercase tracking-widest mb-1.5 text-cinema-muted">
                Full name<span className="text-cinema-orange">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                id="register-name"
                type="text"
                required
                className="card-input w-full rounded-lg px-4 py-2.5 text-sm"
                placeholder="Dmitry Bivol"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-xs uppercase tracking-widest mb-1.5 text-cinema-muted">
                Email<span className="text-cinema-orange">*</span>
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="register-email"
                type="email"
                required
                className="card-input w-full rounded-lg px-4 py-2.5 text-sm"
                placeholder="your@email.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="register-password" className="block text-xs uppercase tracking-widest mb-1.5 text-cinema-muted">
                  Password<span className="text-cinema-orange">*</span>
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="register-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={8}
                  className="card-input w-full rounded-lg px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="register-confirm" className="block text-xs uppercase tracking-widest mb-1.5 text-cinema-muted">
                  Confirm<span className="text-cinema-orange">*</span>
                </label>
                <input
                  value={confpassword}
                  onChange={(e) => setconfPassword(e.target.value)}
                  id="register-confirm"
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={8}
                  className="card-input w-full rounded-lg px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer text-xs text-cinema-muted">
              <input
                type="checkbox"
                required
                className="w-3.5 h-3.5 mt-0.5 accent-cinema-orange"
              />
              I agree to the terms and the no-talking-during-the-film policy.
            </label>

            <button
              type="submit"
              className="w-full marquee text-xl tracking-wide py-3 rounded-lg transition-colors bg-cinema-orange text-white hover:bg-cinema-orange-bright"
            >
              {loading ? "Loading ..." : "REGISTER"}
            </button>

           <div className="p-2">
                <p className="text-center text-xs pt-1 text-cinema-muted">
                    Already have an account?{" "}
                    <a onClick={() => setChangeForm(false)} className="hover:opacity-80 text-cinema-orange">
                        Log in
                    </a>
                </p>
            </div>

          </form>
    );
}

export default Register;