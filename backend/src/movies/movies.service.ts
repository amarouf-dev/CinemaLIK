import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

interface Genres {
  id: number;
  name: string;
}

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  runtime: number;
  genres: Genres[];
}

interface TmdbPopularResponse {
  page: number;
  results: TmdbMovie[];
}

@Injectable()
export class MoviesService {
  constructor(
    private readonly http: HttpService,
    private readonly configservice: ConfigService,
  ) {}

  async getPopularMovies(page: string) {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${this.configservice.getOrThrow<string>('MOVIES_API_KEY')}&include_adult=false&page=${page}`;
    const res = await firstValueFrom(this.http.get<TmdbPopularResponse>(url));

    return res.data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      rating: movie.vote_average,
    }));
  }

  async getMovieById(id: string) {
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${this.configservice.getOrThrow<string>('MOVIES_API_KEY')}`;
    const res = await firstValueFrom(this.http.get<TmdbMovie>(url));

    return {
      id: res.data.id,
      title: res.data.title,
      overview: res.data.overview,
      poster: res.data.poster_path
        ? `https://image.tmdb.org/t/p/w500${res.data.poster_path}`
        : null,
      rating: res.data.vote_average,
      duration: res.data.runtime, // in minutes
      genres: res.data.genres.map((genre) => genre.name),
    };
  }
}
