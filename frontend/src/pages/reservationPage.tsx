import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import client from '../api/client';

const TICKET_PRICE = 12.5;

export type SeatStatus = "AVAILABLE" | "LOCKED" | "CONFIRMED";

export type SeatModel = {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
};

export type MovieModel = {
  id: number;
  title: string;
  poster: string | null;
  rating: number;
  duration: number;
};

// `label` is what the user sees; `iso` is what the API resolves to a screening.
export type DayOption = { label: string; iso: string };

const pad = (n: number) => String(n).padStart(2, "0");

const getNextSixDays = (): DayOption[] =>
  Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return {
      label: `${new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)} ${date.getDate()}`,
      iso: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    };
  });

const TIMES = ["10:00", "12:30", "15:15", "18:00", "20:45", "23:10"];

// ─── Seat ────────────────────────────────────────────────────────────────────

function Seat({
  seat,
  isSelected,
  onToggle,
}: {
  seat: SeatModel;
  isSelected: boolean;
  onToggle: (seat: SeatModel) => void;
}) {
  const base = "w-7 h-7 rounded-sm text-[10px] font-semibold flex items-center justify-center transition-colors border";

  const style =
    seat.status === "CONFIRMED"
      ? `${base} bg-cinema-line border-cinema-line text-cinema-muted cursor-not-allowed`
      : seat.status === "LOCKED" && !isSelected
      ? `${base} bg-yellow-900/60 border-yellow-700 text-yellow-600 cursor-not-allowed`
      : isSelected
      ? `${base} bg-cinema-orange border-cinema-orange text-cinema-bg cursor-pointer`
      : `${base} bg-cinema-surface-2 border-cinema-line text-cinema-muted hover:border-cinema-orange hover:text-cinema-orange cursor-pointer`;

  return (
    <button
      className={style}
      disabled={seat.status === "CONFIRMED" || (seat.status === "LOCKED" && !isSelected)}
      onClick={() => onToggle(seat)}
      title={`${seat.row}${seat.number} — ${seat.status}`}
    >
      {seat.number}
    </button>
  );
}

// ─── Seat Map ─────────────────────────────────────────────────────────────────

function SeatMap({
  seatMap,
  selectedSeats,
  onToggle,
}: {
  seatMap: SeatModel[][];
  selectedSeats: string[];
  onToggle: (seat: SeatModel) => void;
}) {
  if (!seatMap || seatMap.length === 0)
    return <p className="text-cinema-muted text-sm text-center py-10">Select a date and time to see available seats.</p>;

  const half = seatMap[0].length / 2;

  return (
    <div className="space-y-2">
      <div className="mb-5 text-center">
        <div className="h-1 rounded-full bg-gradient-to-r from-transparent via-cinema-orange/60 to-transparent mx-8 mb-1" />
        <span className="text-[10px] uppercase tracking-widest text-cinema-muted">Screen</span>
      </div>

      {seatMap.map((row) => (
        <div key={row[0].row} className="flex items-center gap-2">
          <span className="marquee text-sm text-cinema-muted w-4 text-center">{row[0].row}</span>
          <div className="flex gap-1">
            {row.slice(0, half).map((seat) => (
              <Seat key={seat.id} seat={seat} isSelected={selectedSeats.includes(seat.id)} onToggle={onToggle} />
            ))}
          </div>
          <div className="w-4" />
          <div className="flex gap-1">
            {row.slice(half).map((seat) => (
              <Seat key={seat.id} seat={seat} isSelected={selectedSeats.includes(seat.id)} onToggle={onToggle} />
            ))}
          </div>
          <span className="marquee text-sm text-cinema-muted w-4 text-center">{row[0].row}</span>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-cinema-muted pt-4">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cinema-surface-2 border border-cinema-line inline-block" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cinema-orange inline-block" /> Selected</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-900/60 border border-yellow-700 inline-block" /> Locked</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cinema-line inline-block" /> Taken</span>
      </div>
    </div>
  );
}

// ─── Order Summary ────────────────────────────────────────────────────────────

function OrderSummary({
  movie,
  movieLoading,
  selectedDate,
  selectedTime,
  selectedSeats,
  onConfirm,
}: {
  movie: MovieModel | null;
  movieLoading: boolean;
  selectedDate: DayOption | null;
  selectedTime: string | null;
  selectedSeats: string[];
  onConfirm: () => void;
}) {
  const total      = selectedSeats.length * TICKET_PRICE;
  const hours      = movie?.duration ? Math.floor(movie.duration / 60) : null;
  const minutes    = movie?.duration ? movie.duration % 60 : null;
  const canConfirm = selectedSeats.length > 0 && selectedDate && selectedTime;

  return (
    <div className="bg-cinema-surface border border-cinema-line rounded-xl p-6 space-y-5 card-body sticky top-6">

      {/* Movie */}
      <div className="flex gap-4">
        <div className="w-16 shrink-0 aspect-[2/3] rounded-lg bg-cinema-surface-2 border border-cinema-line overflow-hidden flex items-center justify-center">
          {movieLoading
            ? <div className="w-full h-full animate-pulse bg-cinema-line" />
            : movie?.poster
            ? <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
            : <span className="marquee text-xs text-cinema-cream/40 text-center px-1">{movie?.title}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          {movieLoading
            ? <div className="space-y-2 animate-pulse"><div className="h-4 bg-cinema-line rounded w-3/4" /><div className="h-3 bg-cinema-line rounded w-1/2" /></div>
            : <>
                <p className="marquee text-xl tracking-wide text-cinema-cream truncate">{movie?.title}</p>
                {hours !== null && <p className="text-xs text-cinema-muted mt-1">{hours}h {minutes}m</p>}
                <p className="text-xs text-cinema-orange mt-1">★ {movie?.rating}</p>
              </>
          }
        </div>
      </div>

      <div className="border-t border-cinema-line" />

      {/* Details */}
      <div className="space-y-2 text-sm">
        {([
          ["Date", selectedDate?.label ?? null],
          ["Time", selectedTime],
          ["Seats", selectedSeats.length > 0 ? selectedSeats.join(", ") : null],
        ] as const).map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-cinema-muted">{label}</span>
            <span className="text-cinema-cream text-right max-w-[60%] truncate">{value ?? "—"}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-cinema-line" />

      {/* Price */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-cinema-muted">
          <span>{selectedSeats.length} × ticket</span>
          <span>${TICKET_PRICE.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cinema-cream font-semibold">Total</span>
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

      <p className="text-center text-xs text-cinema-muted">
        {!selectedDate || !selectedTime
          ? "Select a date and time to continue."
          : !canConfirm
          ? "Select at least one seat to continue."
          : "Seats are held for 5 minutes after selection."}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Booking() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [movie,          setMovie]          = useState<MovieModel | null>(null);
  const [movieLoading,   setMovieLoading]   = useState(true);
  const [selectedDate,   setSelectedDate]   = useState<DayOption | null>(null);
  const [selectedTime,   setSelectedTime]   = useState<string | null>(null);
  const [selectedSeats,  setSelectedSeats]  = useState<string[]>([]);
  const [seatMap,        setSeatMap]        = useState<SeatModel[][]>([]);
  const [socket,         setSocket]         = useState<Socket | null>(null);
  const [screeningId,    setScreeningId]    = useState<string | null>(null); (GG)

  // ── Fetch movie ──
  useEffect(() => {
    client.get(`/movies/${id}`)
      .then(({ data }) => setMovie(data))
      .catch(console.error)
      .finally(() => setMovieLoading(false));
  }, [id]);

  // ── Resolve the chosen date + time to a screening ──
  // The socket room is keyed by screening id, not by movie id.
  useEffect(() => {
    if (!selectedDate || !selectedTime) return;

    setSelectedSeats([]);
    setSeatMap([]);
    setScreeningId(null);

    let cancelled = false;
    const startsAt = new Date(`${selectedDate.iso}T${selectedTime}:00`).toISOString();

    client
      .get('/bookings/screening', { params: { movieId: id, startsAt } })
      .then(({ data }) => { if (!cancelled) setScreeningId(data.id); })
      .catch(console.error);

    return () => { cancelled = true; };
  }, [id, selectedDate, selectedTime]);

  // ── WebSocket — connect once the screening is known ──
  useEffect(() => {
    if (!screeningId) return;

    const ws = io(import.meta.env.VITE_BACKEND_URL);

    // Join the screening room — gateway responds with seats:init.
    // Re-emitted on every connect so a reconnect rejoins the room.
    ws.on("connect", () => ws.emit("join-room", screeningId));

    // Server sends the full seat map after joining the room
    ws.on("seats:init", (seats: SeatModel[][]) => setSeatMap(seats));

    // Server broadcasts any seat status change to everyone in the room
    ws.on("seat:updated", ({ seatId, status }: { seatId: string; status: SeatStatus }) => {
      setSeatMap((prev) =>
        prev.map((row) =>
          row.map((seat) => seat.id === seatId ? { ...seat, status } : seat)
        )
      );
    });

    // Server rejects a lock (seat was taken by someone else between click and emit)
    ws.on("seat:lock-failed", ({ seatId }: { seatId: string }) => {
      setSelectedSeats((prev) => prev.filter((s) => s !== seatId));
    });

    setSocket(ws);

    return () => {
      ws.disconnect();
      setSocket(null);
    };
  }, [screeningId]);

  // ── Toggle seat — emit lock/unlock via WebSocket ──
  function handleToggleSeat(seat: SeatModel) {
    if (!socket || !screeningId) return;

    const isSelected = selectedSeats.includes(seat.id);

    if (isSelected) {
      socket.emit("seat:unlock", { seatId: seat.id, screeningId });
      setSelectedSeats((prev) => prev.filter((s) => s !== seat.id));
    } else {
      socket.emit("seat:lock", { seatId: seat.id, screeningId });
      setSelectedSeats((prev) => [...prev, seat.id]);
    }
  }

  // Seat ids are uuids — show "A1" style labels in the summary instead.
  const selectedSeatLabels = seatMap
    .flat()
    .filter((seat) => selectedSeats.includes(seat.id))
    .map((seat) => `${seat.row}${seat.number}`);

  // ── Confirm booking ──
  function handleConfirm() {
    if (!screeningId) return;

    client.post('/bookings', {
      screeningId,
      seats: selectedSeats,
      socketId: socket?.id,
    })
      .then(({ data }) => navigate(`/confirmation/${data.id}`))
      .catch(console.error);
  }

  return (
    <main className="min-h-screen bg-cinema-bg card-body pb-16">

      {/* Top bar */}
      <div className="border-b border-cinema-line px-4 sm:px-8 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-cinema-muted hover:text-cinema-orange transition-colors text-sm">
          ← Back
        </button>
        <span className="text-cinema-line">|</span>
        <p className="marquee text-xl text-cinema-cream tracking-wide">
          BOOK · <span className="text-cinema-orange">{movie?.title ?? "..."}</span>
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 flex flex-col lg:flex-row gap-10">

        {/* Left */}
        <div className="flex-1 space-y-8 min-w-0">

          {/* Date */}
          <div>
            <p className="text-xs uppercase tracking-widest text-cinema-muted mb-3">Select date</p>
            <div className="flex gap-2 flex-wrap">
              {getNextSixDays().map((date) => (
                <button key={date.iso} onClick={() => setSelectedDate(date)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    selectedDate?.iso === date.iso
                      ? "bg-cinema-orange text-cinema-bg border-cinema-orange marquee tracking-wide"
                      : "border-cinema-line text-cinema-muted hover:border-cinema-orange hover:text-cinema-orange"
                  }`}
                >
                  {date.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div>
            <p className="text-xs uppercase tracking-widest text-cinema-muted mb-3">Select showtime</p>
            <div className="flex gap-2 flex-wrap">
              {TIMES.map((time) => (
                <button key={time} onClick={() => setSelectedTime(time)}
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

          {/* Seats */}
          <div>
            <p className="text-xs uppercase tracking-widest text-cinema-muted mb-4">Select seats</p>
            <div className="overflow-x-auto pb-2">
              <SeatMap seatMap={seatMap} selectedSeats={selectedSeats} onToggle={handleToggleSeat} />
            </div>
          </div>

        </div>

        {/* Right */}
        <div className="w-full lg:w-80 shrink-0">
          <OrderSummary
            movie={movie}
            movieLoading={movieLoading}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedSeats={selectedSeatLabels}
            onConfirm={handleConfirm}
          />
        </div>

      </div>
    </main>
  );
}