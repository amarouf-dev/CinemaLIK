import { useEffect, useState } from "react";
import movieCollage from "../assets/movie-collage.jpeg";
import client from '../api/client'
import { useNavigate } from "react-router-dom";

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster: string | null;
  rating: number;
}

function StarRating({ rating }: { rating: number }) {
  const pct = Math.round((rating / 10) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative text-base leading-none" style={{ color: "#332B22" }}>
        {"★★★★★"}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%`, color: "#FF5A1F" }}>
          {"★★★★★"}
        </div>
      </div>
      <span className="card-body text-xs text-cinema-muted">{rating.toFixed(1)}</span>
    </div>
  );
}

function MovieCard({ movie }: { movie: TmdbMovie }) {
  const navigate = useNavigate();
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-2/3 rounded-lg overflow-hidden border border-cinema-line bg-cinema-surface">

        {/* Poster image — replace null with real poster URL from your API */}
        {movie.poster ? (
          <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center bg-cinema-surface-2">
            <span className="marquee text-xl tracking-wide text-cinema-cream/60">{movie.title}</span>
          </div>
        )}

        {/* Rating badge */}
        <div className="absolute top-2 right-2 bg-cinema-bg/90 backdrop-blur-sm rounded px-2 py-0.5 text-xs font-semibold text-cinema-orange border border-cinema-orange/40">
          ★ {movie.rating.toFixed(1)}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg/95 via-cinema-bg/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 gap-3">
          <p className="card-body text-xs text-cinema-cream/80 line-clamp-3 leading-relaxed">
            {movie.overview}
          </p>
          <button
          onClick={() => navigate(`/home/booking/${movie.id}`)}
          className="card-body text-xs uppercase tracking-widest bg-cinema-orange text-cinema-bg px-4 py-2 rounded-md font-semibold w-full">
            Book Now
          </button>
        </div>
      </div>

      <div className="mt-2.5 px-0.5 space-y-1">
        <p className="card-body text-sm font-semibold text-cinema-cream truncate">{movie.title}</p>
        <StarRating rating={movie.rating} />
      </div>
    </div>
  );
}

export default function Home() {

  const [Page, setPage] = useState(1);
  const [Movies, setMovies] = useState<TmdbMovie[]>([]);
  useEffect(() => {
    async function fetchMovies()
    {
      try
      {
        const movies = await client.get('/movies/popular', {
          params: {page: Page},
          }
        );
        setMovies(movies.data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchMovies();
  }, [Page])

  return (
    <main className="min-h-screen bg-cinema-bg card-body">

      {/* Hero */}
      <section
        className="relative h-[50vh] min-h-60 flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${movieCollage})` }}
        id="hero"
      >
        <div className="absolute inset-0 bg-cinema-bg/80" />
        <div className="absolute inset-0 bg-linear-to-t from-cinema-bg via-cinema-bg/40 to-cinema-bg/70" />

        <div className="relative z-10 text-center px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="card-bulb w-2.5 h-2.5 rounded-full" />
            <h1 className="marquee text-5xl sm:text-7xl tracking-wide text-cinema-cream">
              CINEMA<span className="text-cinema-orange">LIK</span>
            </h1>
            <span className="card-bulb w-2.5 h-2.5 rounded-full" />
          </div>
          <p className="text-cinema-muted text-sm sm:text-base max-w-md mx-auto mb-7">
            Book your seat for tonight's show.
          </p>
          {/* <button className="marquee text-xl tracking-wide bg-cinema-orange text-cinema-bg px-8 py-3 rounded-lg hover:bg-cinema-orange-bright transition-colors">
            SEE WHAT'S PLAYING
          </button> */}
        </div>
      </section>

      {/* Now Showing */}
      <section id="Now Showing" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-7">
          <p className="marquee text-3xl tracking-wide text-cinema-orange">NOW SHOWING</p>
        </div>

        {/* Movie grid — replace MOVIES with your real data from the API */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6">
          {Movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {/* Load More button — wire onClick to fetch the next page */}
        <div className="flex justify-center mt-10">
          <a
            href="#Now Showing"
          onClick={() => setPage(Page + 1)}
          className="marquee text-xl tracking-wide px-10 py-3 rounded-lg border border-cinema-orange text-cinema-orange hover:bg-cinema-orange hover:text-cinema-bg transition-colors cursor-pointer">
            LOAD MORE
          </a>
        </div>
      </section>

    </main>
  );
}