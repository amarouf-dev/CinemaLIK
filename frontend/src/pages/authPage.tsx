
import { useState } from 'react';
import  Login from '../components/login'
import Register  from '../components/register'

function Auth() {
    const [changeForm, setChangeForm] = useState(true);

     return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-cinema-bg">
      <div className="w-full max-w-md card-body">
        {/* Marquee header */}

        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="card-bulb w-2.5 h-2.5 rounded-full" />
          <h1 className="marquee text-4xl sm:text-5xl tracking-wide text-cinema-cream">
            CINEMA<span className="text-cinema-orange">LIK</span>
          </h1>
          <span className="card-bulb w-2.5 h-2.5 rounded-full" />
        </div>
 
        {/* Ticket card */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60 bg-cinema-surface border border-cinema-line">
          {/* header strip */}

          <div className="px-7 sm:px-9 pt-7 pb-6 text-center border-b border-dashed border-cinema-line">
            <p className="marquee text-2xl tracking-wide text-cinema-orange">LOG IN</p>
            <p className="text-sm mt-1 text-cinema-muted">
              Admit one. Enter your details to claim your seat.
            </p>
          </div>
 
          {/* notch to sell the ticket-stub look */}
          { 
            changeForm ? <Register setChangeForm={setChangeForm} /> : <Login setChangeForm={setChangeForm}/>
          }

          <div className="relative h-0">
            <div className="card-ticket-edge absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4" />
          </div>
        </div>
      </div>
    </main>
  );
}
export default Auth;
