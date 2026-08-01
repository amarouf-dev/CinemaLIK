import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';

type BookingDetails = {
  id: string;
  totalPrice: number;
  createdAt: string;
  movie: { title: string; poster: string | null };
  screening: { startsAt: string; price: number };
  seats: string[];
};

export default function ConfirmationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get(`/bookings/${id}`)
      .then(({ data }) => setBooking(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-cinema-cream">Loading confirmation...</div>;
  }

  return (
    <main className="min-h-screen bg-cinema-bg card-body flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-cinema-line bg-cinema-surface p-8 text-center space-y-5">
        <div className="text-cinema-orange text-4xl">✓</div>
        <h1 className="marquee text-3xl tracking-wide text-cinema-cream">BOOKING CONFIRMED</h1>
        <p className="text-cinema-muted">Your reservation has been saved successfully.</p>
        {booking && (
          <div className="rounded-lg border border-cinema-line bg-cinema-bg/70 p-4 text-sm text-left space-y-2">
            <p><span className="text-cinema-muted">Booking ID:</span> <span className="text-cinema-cream">{booking.id}</span></p>
<<<<<<< HEAD
            <p><span className="text-cinema-muted">Film:</span> <span className="text-cinema-cream">{booking.movie.title}</span></p>
            <p><span className="text-cinema-muted">Showtime:</span> <span className="text-cinema-cream">{new Date(booking.screening.startsAt).toLocaleString()}</span></p>
            <p><span className="text-cinema-muted">Seats:</span> <span className="text-cinema-cream">{booking.seats.join(', ')}</span></p>
            <p><span className="text-cinema-muted">Total:</span> <span className="text-cinema-cream">${booking.totalPrice.toFixed(2)}</span></p>
=======
            <p><span className="text-cinema-muted">Showing ID:</span> <span className="text-cinema-cream">{booking.showingId}</span></p>
            <p><span className="text-cinema-muted">Seats:</span> <span className="text-cinema-cream">{booking.seats?.map((seat: { row: string; number: number }) => `${seat.row}-${seat.number}`).join(', ')}</span></p>
>>>>>>> 4d2164a (GG)
          </div>
        )}
        <button
          onClick={() => navigate('/home')}
          className="w-full rounded-lg bg-cinema-orange px-4 py-3 text-cinema-bg font-semibold"
        >
          BACK TO MOVIES
        </button>
      </div>
    </main>
  );
}
