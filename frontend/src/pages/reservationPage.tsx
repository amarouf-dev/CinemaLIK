import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from '../api/client';

// ─── Constants ───────────────────────────────────────────────────────────────

const getNextSixDays = (startDate = new Date()) => {
  return Array.from({ length: 6 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i + 1);
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    return `${dayName} ${date.getDate()}`;
  });
};

const TIMES = ["10:00", "12:30", "15:15", "18:00", "20:45", "23:10"];
const TICKET_PRICE = 12.5;

// ─── Sub-components ──────────────────────────────────────────────────────────

function SeatLegend() {
  return (
    <div className="flex items-center gap-5 text-xs text-cinema-muted card-body">
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-sm bg-cinema-surface-2 border border-cinema-line inline-block" />
        Available
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-sm bg-cinema-orange inline-block" />
        Selected
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-sm bg-cinema-line inline-block" />
        Taken
      </span>
    </div>
  );
}

function Seat({ seat, isSelected, onToggle }) {
  const base = "w-7 h-7 rounded-sm text-[10px] font-semibold flex items-center justify-center transition-colors cursor-pointer border";

  const style =
    seat.status === "taken"
      ? `${base} bg-cinema-line border-cinema-line text-cinema-muted cursor-not-allowed`
      : isSelected
      ? `${base} bg-cinema-orange border-cinema-orange text-cinema-bg`
      : `${base} bg-cinema-surface-2 border-cinema-line text-cinema-muted hover:border-cinema-orange hover:text-cinema-orange`;

  return (
    <button
      className={style}
      disabled={seat.status === "taken"}
      onClick={() => onToggle(seat)}
      title={seat.id}
    >
      {seat.number}
    </button>
  );
}

function SeatMap({ seatMap, selectedSeats, onToggleSeat }) {
  if (!seatMap || seatMap.length === 0) {
    return (
      <p className="text-cinema-muted text-sm text-center py-10">
        {selectedSeats !== null ? "Select a date and time to see available seats." : "Loading seats..."}
      </p>
    );
  }

  const SEATS_PER_ROW = seatMap[0].length;

  return (
    <div className="space-y-2">
      <div className="mb-6 text-center">
        <div className="h-1 rounded-full bg-gradient-to-r from-transparent via-cinema-orange/60 to-transparent mx-8 mb-1" />
        <span className="text-[10px] uppercase tracking-widest text-cinema-muted card-body">Screen</span>
      </div>

      {seatMap.map((row) => (
        <div key={row[0].row} className="flex items-center gap-2">
          <span className="marquee text-sm text-cinema-muted w-4 text-center">{row[0].row}</span>

          <div className="flex gap-1">
            {row.slice(0, SEATS_PER_ROW / 2).map((seat) => (
              <Seat
                key={seat.id}
                seat={seat}
                isSelected={selectedSeats.includes(seat.id)}
                onToggle={onToggleSeat}
              />
            ))}
          </div>

          <div className="w-4" />

          <div className="flex gap-1">
            {row.slice(SEATS_PER_ROW / 2).map((seat) => (
              <Seat
                key={seat.id}
                seat={seat}
                isSelected={selectedSeats.includes(seat.id)}
                onToggle={onToggleSeat}
              />
            ))}
          </div>

          <span className="marquee text-sm text-cinema-muted w-4 text-center">{row[0].row}</span>
        </div>
      ))}
    </div>
  );
}

function OrderSummary({ movie, movieLoading, selectedDate, selectedTime, selectedSeats, onConfirm }) {
  const total = selectedSeats.length * TICKET_PRICE;
  const hours   = movie?.duration ? Math.floor(movie.duration / 60) : null;
  const minutes = movie?.duration ? movie.duration % 60 : null;
  const canConfirm = selectedSeats.length > 0 && selectedDate && selectedTime;

  return (
    <div className="bg-cinema-surface border border-cinema-line rounded-xl p-6 space-y-5 card-body sticky top-6">

      {/* Movie info */}
      <div className="flex gap-4">
        <div className="w-16 shrink-0 aspect-[2/3] rounded-lg bg-cinema-surface-2 border border-cinema-line flex items-center justify-center overflow-hidden">
          {movieLoading ? (
            <div className="w-full h-full animate-pulse bg-cinema-line" />
          ) : movie?.poster ? (
            <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
          ) : (
            <span className="marquee text-xs text-cinema-cream/40 text-center px-1">{movie?.title}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {movieLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-cinema-line rounded w-3/4" />
              <div className="h-3 bg-cinema-line rounded w-1/2" />
              <div className="h-3 bg-cinema-line rounded w-1/4" />
            </div>
          ) : (
            <>
              <p className="marquee text-xl tracking-wide text-cinema-cream truncate">{movie?.title}</p>
              <p className="text-xs text-cinema-muted mt-1">
                {movie?.genres?.join(" | ")}
                {hours !== null ? ` · ${hours}h ${minutes}m` : ""}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-cinema-orange text-xs">★</span>
                <span className="text-xs text-cinema-muted">{movie?.rating}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-cinema-line" />

      {/* Booking details */}
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-cinema-muted">Date</span>
          <span className="text-cinema-cream">{selectedDate ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cinema-muted">Time</span>
          <span className="text-cinema-cream">{selectedTime ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cinema-muted">Seats</span>
          <span className="text-cinema-cream text-right max-w-[60%] truncate">
            {selectedSeats.length > 0 ? selectedSeats.join(", ") : "—"}
          </span>
        </div>
      </div>

      <div className="border-t border-cinema-line" />

      {/* Pricing */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-cinema-muted">
          <span>{selectedSeats.length} × ticket</span>
          <span>${TICKET_PRICE.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span className="text-cinema-cream">Total</span>
          <span className="text-cinema-orange marquee text-xl">${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        disabled={!canConfirm}
        onClick={onConfirm}
        className="w-full marquee text-xl tracking-wide py-3.5 rounded-lg transition-colors bg-cinema-orange text-cinema-bg hover:bg-cinema-orange-bright disabled:opacity-40 disabled:cursor-not-allowed"
      >
        CONFIRM BOOKING
      </button>

      {!canConfirm && (
        <p className="text-center text-xs text-cinema-muted">
          {!selectedDate || !selectedTime
            ? "Select a date and time to continue."
            : "Select at least one seat to continue."}
        </p>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Booking() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  // ── State ──
  const [movie, setMovie]               = useState(null);
  const [movieLoading, setMovieLoading] = useState(true);

  const [selectedDate,  setSelectedDate]  = useState(null);
  const [selectedTime,  setSelectedTime]  = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [seatMap, setSeatMap]           = useState([]);
  const [seatMapLoading, setSeatMapLoading] = useState(false);

  // ── Fetch movie ──
  useEffect(() => {
    client
      .get(`/movies/${id}`)
      .then(({ data }) => setMovie(data))
      .catch((err) => console.error(err))
      .finally(() => setMovieLoading(false));
  }, [id]);

  // ── Fetch seat map when date + time are both selected ──
  // TODO: replace with your real endpoint — e.g. /movies/:id/seats?date=...&time=...
  useEffect(() => {
    if (!selectedDate || !selectedTime) return;

    setSeatMapLoading(true);
    setSelectedSeats([]); // clear seat selection when showtime changes

    client
      .get(`/movies/${id}/seats`, { params: { date: selectedDate, time: selectedTime } })
      .then(({ data }) => setSeatMap(data))
      .catch((err) => console.error(err))
      .finally(() => setSeatMapLoading(false));
  }, [id, selectedDate, selectedTime]);

  // ── Toggle a seat on/off ──
  function handleToggleSeat(seat) {
    setSelectedSeats((prev) =>
      prev.includes(seat.id)
        ? prev.filter((s) => s !== seat.id)
        : [...prev, seat.id]
    );
  }

  // ── Confirm booking ──
  // TODO: navigate to confirmation page after successful POST
  function handleConfirm() {
    client
      .post('/bookings', {
        movieId:  id,
        date:     selectedDate,
        time:     selectedTime,
        seats:    selectedSeats,
      })
      .then(({ data }) => navigate(`/confirmation/${data.id}`))
      .catch((err) => console.error(err));
  }

  return (
    <main className="min-h-screen bg-cinema-bg card-body pb-16">

      {/* Top bar */}
      <div className="border-b border-cinema-line px-4 sm:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-cinema-muted hover:text-cinema-orange transition-colors text-sm"
        >
          ← Back
        </button>
        <span className="text-cinema-line">|</span>
        <p className="marquee text-xl text-cinema-cream tracking-wide">
          BOOK · <span className="text-cinema-orange">{movie?.title ?? "..."}</span>
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 flex flex-col lg:flex-row gap-10">

        {/* Left — date, time, seat map */}
        <div className="flex-1 space-y-8 min-w-0">

          {/* Date picker */}
          <div>
            <p className="text-xs uppercase tracking-widest text-cinema-muted mb-3">Select date</p>
            <div className="flex gap-2 flex-wrap">
              {getNextSixDays().map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    selectedDate === date
                      ? "bg-cinema-orange text-cinema-bg border-cinema-orange marquee tracking-wide"
                      : "border-cinema-line text-cinema-muted hover:border-cinema-orange hover:text-cinema-orange"
                  }`}
                >
                  {date}
                </button>
              ))}
            </div>
          </div>

          {/* Time picker */}
          <div>
            <p className="text-xs uppercase tracking-widest text-cinema-muted mb-3">Select showtime</p>
            <div className="flex gap-2 flex-wrap">
              {TIMES.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    selectedTime === time
                      ? "bg-cinema-orange text-cinema-bg border-cinema-orange marquee tracking-wide"
                      : "border-cinema-line text-cinema-muted hover:border-cinema-orange hover:text-cinema-orange"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Seat map */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest text-cinema-muted">Select seats</p>
              <SeatLegend />
            </div>
            <div className="overflow-x-auto pb-2">
              {seatMapLoading ? (
                <p className="text-cinema-muted text-sm text-center py-10 animate-pulse">
                  Loading seats...
                </p>
              ) : (
                <SeatMap
                  seatMap={seatMap}
                  selectedSeats={selectedSeats}
                  onToggleSeat={handleToggleSeat}
                />
              )}
            </div>
          </div>

        </div>

        {/* Right — order summary */}
        <div className="w-full lg:w-80 shrink-0">
          <OrderSummary
            movie={movie}
            movieLoading={movieLoading}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedSeats={selectedSeats}
            onConfirm={handleConfirm}
          />
        </div>

      </div>
    </main>
  );
}