import { useState } from "react";

const NOW_SHOWING = [
  { id: 1, title: "Midnight Reel", genre: "Thriller", rating: "8.2", duration: "2h 04m", color: "#7C2D12" },
  { id: 2, title: "Last Frame", genre: "Drama", rating: "7.6", duration: "1h 52m", color: "#1E3A5F" },
  { id: 3, title: "Static Horizon", genre: "Sci-Fi", rating: "8.7", duration: "2h 18m", color: "#3B2F5E" },
  { id: 4, title: "Velvet Hour", genre: "Romance", rating: "7.1", duration: "1h 45m", color: "#5C1A2E" },
  { id: 5, title: "Concrete Sky", genre: "Action", rating: "8.0", duration: "2h 10m", color: "#2C2C2C" },
  { id: 6, title: "Paper Moonlight", genre: "Comedy", rating: "7.4", duration: "1h 38m", color: "#1F3A2E" },
  { id: 7, title: "Glass Echo", genre: "Mystery", rating: "8.4", duration: "2h 02m", color: "#3A2A1A" },
  { id: 8, title: "Slow Static", genre: "Drama", rating: "7.9", duration: "1h 58m", color: "#1A2A3A" },
];

function MovieCard({ movie }) {
  return (
    <div className="group cursor-pointer">
      <div
        className="relative aspect-[2/3] rounded-lg overflow-hidden border border-cinema-line"
        style={{ background: movie.color }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <span className="marquee text-2xl tracking-wide text-cinema-cream/90">
            {movie.title}
          </span>
        </div>
        <div className="absolute top-2 right-2 bg-cinema-bg/80 backdrop-blur-sm rounded px-2 py-0.5 text-xs font-semibold text-cinema-orange border border-cinema-orange/40">
          ★ {movie.rating}
        </div>
        <div className="absolute inset-0 bg-cinema-bg/0 group-hover:bg-cinema-bg/40 transition-colors flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
          <button className="card-body text-xs uppercase tracking-widest bg-cinema-orange text-cinema-bg px-4 py-2 rounded-md font-semibold">
            Book Now
          </button>
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="card-body text-sm font-semibold text-cinema-cream truncate">{movie.title}</p>
        <p className="card-body text-xs text-cinema-muted mt-0.5">{movie.genre} · {movie.duration}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [filter, setFilter] = useState("All");
  const genres = ["All", "Action", "Drama", "Sci-Fi", "Comedy", "Thriller", "Romance", "Mystery"];
  const filtered = filter === "All" ? NOW_SHOWING : NOW_SHOWING.filter((m) => m.genre === filter);

  return (
    <main className="min-h-screen bg-cinema-bg card-body">
      {/* Hero */}
      <section
        className="relative h-[60vh] min-h-[420px] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage:"url('src/assets/movie-collage.jpeg')"  }}
      >
        {/* dark overlay */}
        <div className="absolute inset-0 bg-cinema-bg/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/40 to-cinema-bg/70" />

        <div className="relative z-10 text-center px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="card-bulb w-2.5 h-2.5 rounded-full" />
            <h1 className="marquee text-5xl sm:text-7xl tracking-wide text-cinema-cream">
              CINEMA<span className="text-cinema-orange">LIK</span>
            </h1>
            <span className="card-bulb w-2.5 h-2.5 rounded-full" />
          </div>
          <p className="text-cinema-muted text-sm sm:text-base max-w-md mx-auto mb-7">
            Every story deserves the big screen. Book your seat for tonight's show.
          </p>
          <button className="marquee text-xl tracking-wide bg-cinema-orange text-cinema-bg px-8 py-3 rounded-lg hover:bg-cinema-orange-bright transition-colors">
            SEE WHAT'S PLAYING
          </button>
        </div>
      </section>

      {/* Now Showing */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
          <div>
            <p className="marquee text-3xl tracking-wide text-cinema-orange">NOW SHOWING</p>
            <p className="text-cinema-muted text-sm mt-1">Tonight's lineup, fresh off the reel.</p>
          </div>

          {/* genre filter */}
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setFilter(g)}
                className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                  filter === g
                    ? "bg-cinema-orange text-cinema-bg border-cinema-orange"
                    : "border-cinema-line text-cinema-muted hover:border-cinema-orange hover:text-cinema-orange"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {filtered.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-cinema-muted text-sm py-12">
            No films showing in this genre right now.
          </p>
        )}
      </section>
    </main>
  );
}