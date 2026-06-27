// Booking.jsx — pure UI, no logic
// TODO: replace all placeholder values with real data from your API / router

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from '../api/client';

// ─── Placeholder data (replace with props or router state) ───────────────────

const MOVIE = {
  title: "Static Horizon",
  genre: "Sci-Fi",
  rating: 8.7,
  duration: "2h 18m",
  poster: null,
};

const DATES = ["Mon 23", "Tue 24", "Wed 25", "Thu 26", "Fri 27", "Sat 28"];

const TIMES = ["10:00", "12:30", "15:15", "18:00", "20:45", "23:10"];

// Seat map: "available" | "taken" — "selected" is managed by your state
const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const SEATS_PER_ROW = 12;

// Generate a static placeholder seat map
// Replace this with real seat data from your API
const SEAT_MAP = ROWS.map((row) =>
  Array.from({ length: SEATS_PER_ROW }, (_, i) => ({
    id: `${row}${i + 1}`,
    row,
    number: i + 1,
    status: Math.random() < 0.3 ? "taken" : "available", // placeholder
  }))
);

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
      onClick={() => onToggle(seat)} // TODO: wire to your selected seats state
      title={seat.id}
    >
      {seat.number}
    </button>
  );
}

function SeatMap({ selectedSeats, onToggleSeat }) {
  return (
    <div className="space-y-2">
      {/* Screen indicator */}
      <div className="mb-6 text-center">
        <div className="h-1 rounded-full bg-gradient-to-r from-transparent via-cinema-orange/60 to-transparent mx-8 mb-1" />
        <span className="text-[10px] uppercase tracking-widest text-cinema-muted card-body">Screen</span>
      </div>

      {SEAT_MAP.map((row) => (
        <div key={row[0].row} className="flex items-center gap-2">
          {/* Row label */}
          <span className="marquee text-sm text-cinema-muted w-4 text-center">{row[0].row}</span>

          {/* Gap in the middle (cinema aisle) */}
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

          <div className="w-4" /> {/* aisle gap */}

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

function OrderSummary({Movie, selectedDate, selectedTime, selectedSeats }) {
  const total = selectedSeats.length * TICKET_PRICE;
  const hours = Math.floor(Movie.duration / 60);
  const minutes = Movie.duration % 60;

  return (
    <div className="bg-cinema-surface border border-cinema-line rounded-xl p-6 space-y-5 card-body sticky top-6">
      {/* Movie info */}
      <div className="flex gap-4">
        <div className="w-16 shrink-0 aspect-[2/3] rounded-lg bg-cinema-surface-2 border border-cinema-line flex items-center justify-center overflow-hidden">
          {Movie.poster ? (
            <img src={Movie.poster} alt={Movie.title} className="w-full h-full object-cover" />
          ) : (
            <span className="marquee text-xs text-cinema-cream/40 text-center px-1">{Movie.title}</span>
          )}
        </div>
        <div>
          <p className="marquee text-xl tracking-wide text-cinema-cream">{Movie.title}</p>
          <p className="text-xs text-cinema-muted mt-1">{Movie.genres?.join(" | ")} · {hours}h {minutes}m</p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-cinema-orange text-xs">★</span>
            <span className="text-xs text-cinema-muted">{Movie.rating}</span>
          </div>
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
          <span className="text-cinema-cream">
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

      {/* Confirm button — TODO: wire onClick to your booking submit handler */}
      <button
        disabled={selectedSeats.length === 0 || !selectedDate || !selectedTime}
        className="w-full marquee text-xl tracking-wide py-3.5 rounded-lg transition-colors bg-cinema-orange text-cinema-bg hover:bg-cinema-orange-bright disabled:opacity-40 disabled:cursor-not-allowed"
      >
        CONFIRM BOOKING
      </button>

      {selectedSeats.length === 0 && (
        <p className="text-center text-xs text-cinema-muted">Select at least one seat to continue.</p>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Booking() {
  const { id } = useParams();
  const [Movie, setMovie] = useState({});
  // TODO: move these to useState and wire the pickers + seat map
  const selectedDate  = "Wed 25";   // replace with state
  const selectedTime  = "20:45";    // replace with state
  const selectedSeats = ["C5", "C6"]; // replace with state

  useEffect(() => {
    async function fetchMovie() {
      try
      {
        const res = await client.get(`/movies/${id}`);
        setMovie(res.data);
      } catch (error)
      {
        console.log(error);
      }
    }
    fetchMovie();
  }, [id])

  // TODO: implement this — add/remove seat.id from selectedSeats state
  function handleToggleSeat(seat) {}

  return (
    <main className="min-h-screen bg-cinema-bg card-body pb-16">

      {/* Top bar */}
      <div className="border-b border-cinema-line px-4 sm:px-8 py-4 flex items-center gap-4">
        {/* TODO: wire to router navigate(-1) or Link to home */}
        <button className="text-cinema-muted hover:text-cinema-orange transition-colors text-sm">
          ← Back
        </button>
        <span className="text-cinema-line">|</span>
        <p className="marquee text-xl text-cinema-cream tracking-wide">
          BOOK · <span className="text-cinema-orange">{MOVIE.title}</span>
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 flex flex-col lg:flex-row gap-10">

        {/* Left — date, time, seat map */}
        <div className="flex-1 space-y-8 min-w-0">

          {/* Date picker */}
          <div>
            <p className="text-xs uppercase tracking-widest text-cinema-muted mb-3">Select date</p>
            <div className="flex gap-2 flex-wrap">
              {DATES.map((date) => (
                <button
                  key={date}
                  // TODO: onClick={() => setSelectedDate(date)}
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
                  // TODO: onClick={() => setSelectedTime(time)}
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
              <SeatMap selectedSeats={selectedSeats} onToggleSeat={handleToggleSeat} />
            </div>
          </div>

        </div>

        {/* Right — order summary */}
        <div className="w-full lg:w-80 shrink-0">
          <OrderSummary
            Movie={Movie}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedSeats={selectedSeats}
          />
        </div>

      </div>
    </main>
  );
}