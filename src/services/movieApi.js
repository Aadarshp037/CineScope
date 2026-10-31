import axios from 'axios'

const OMDB_API_BASE = 'https://www.omdbapi.com/'
const TMDB_API_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original'
const DEFAULT_PROVIDER_REGION = 'IN'
const TMDB_MATCH_CACHE = new Map()
const TMDB_PROVIDER_CACHE = new Map()

const omdbClient = axios.create({
  baseURL: OMDB_API_BASE,
  timeout: 10000,
})

const TMDB_ACCESS_TOKEN = process.env.REACT_APP_TMDB_ACCESS_TOKEN || ''
const OMDB_API_KEY = process.env.REACT_APP_OMDB_API_KEY || ''

function normalizeRegionCode(value) {
  return String(value || DEFAULT_PROVIDER_REGION).trim().toUpperCase() || DEFAULT_PROVIDER_REGION
}

function getTmdbHeaders() {
  return {
    accept: 'application/json',
    ...(TMDB_ACCESS_TOKEN ? { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } : {}),
  }
}


export function createPosterFallback(label) {
  const safeLabel = (label || 'No poster available').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" role="img" aria-label="${safeLabel}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#152238" />
          <stop offset="100%" stop-color="#0b1018" />
        </linearGradient>
      </defs>
      <rect width="600" height="900" rx="28" fill="url(#g)" />
      <rect x="48" y="48" width="504" height="804" rx="20" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="4" stroke-dasharray="16 14" />
      <circle cx="300" cy="350" r="88" fill="rgba(255,255,255,0.08)" />
      <path d="M260 320h80l-30 64-20-22-24 36z" fill="rgba(255,255,255,0.55)" />
      <text x="300" y="560" fill="#f5f7fb" font-family="Arial, sans-serif" font-size="32" font-weight="700" text-anchor="middle">No poster available</text>
      <text x="300" y="610" fill="rgba(245,247,251,0.72)" font-family="Arial, sans-serif" font-size="22" text-anchor="middle">${safeLabel}</text>
    </svg>`
  )}`
}

function safeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback
  }

  return value.trim() || fallback
}

function normalizePoster(movie) {
  const poster = safeText(movie.Poster)
  return poster && poster !== 'N/A' ? poster : ''
}

export function normalizeMovieSummary(movie = {}) {
  const title = safeText(movie.Title, 'Untitled movie')
  const poster = normalizePoster(movie)

  return {
    imdbID: safeText(movie.imdbID),
    Title: title,
    Year: safeText(movie.Year, 'Unknown year'),
    Type: safeText(movie.Type, 'movie'),
    Poster: poster,
    PosterFallback: createPosterFallback(title),
  }
}

// New helper to normalize TMDB movie objects for discovery sections
export function normalizeTmdbSummary(movie = {}) {
  const title = safeText(movie.title || movie.name, 'Untitled movie')
  const year = safeText(movie.release_date?.slice(0, 4) || movie.first_air_date?.slice(0, 4), '')
  const poster = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : ''
  const imdbID = `tmdb_${safeText(movie.id)}` // prefix to avoid clash with real IMDb IDs
  return {
    imdbID,
    Title: title,
    Year: year,
    Type: safeText(movie.media_type || 'movie'),
    Poster: poster,
    PosterFallback: createPosterFallback(title),
  }
}

export function normalizeMovieDetails(movie = {}) {
  const summary = normalizeMovieSummary(movie)

  return {
    ...summary,
    Rated: safeText(movie.Rated),
    Released: safeText(movie.Released),
    Runtime: safeText(movie.Runtime),
    Genre: safeText(movie.Genre),
    Director: safeText(movie.Director),
    Writer: safeText(movie.Writer),
    Actors: safeText(movie.Actors),
    Plot: safeText(movie.Plot),
    Language: safeText(movie.Language),
    Country: safeText(movie.Country),
    Awards: safeText(movie.Awards),
    imdbRating: safeText(movie.imdbRating),
    imdbVotes: safeText(movie.imdbVotes),
    Metascore: safeText(movie.Metascore),
    BoxOffice: safeText(movie.BoxOffice),
    Production: safeText(movie.Production),
    Website: safeText(movie.Website),
  }
}

function buildOmdbErrorMessage(error, fallbackMessage) {
  if (error.response && error.response.status >= 500) {
    return 'OMDb is temporarily unavailable. Please try again.'
  }

  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.'
  }

  if (!OMDB_API_KEY) {
    return 'Add a valid OMDb API key to your .env file before searching.'
  }

  return fallbackMessage || 'Unable to load movie data right now.'
}

function buildTmdbErrorMessage(error, fallbackMessage) {
  if (error.response && error.response.status === 401) {
    return 'TMDB rejected the configured access token. Add REACT_APP_TMDB_ACCESS_TOKEN in .env for local development.'
  }

  if (error.response && error.response.status >= 500) {
    return 'TMDB watch-provider data is temporarily unavailable. Please try again.'
  }

  if (error.code === 'ECONNABORTED') {
    return 'TMDB watch-provider request timed out. Please try again.'
  }

  return fallbackMessage || 'Unable to load Where to Watch data right now.'
}

export async function searchMovies({ query, page = 1, type = 'all', year = '' }) {
  const searchTerm = safeText(query)

  if (!searchTerm) {
    return {
      movies: [],
      totalResults: 0,
      errorMessage: 'Enter a title to search.',
    }
  }

  try {
    const { data } = await omdbClient.get('', {
      params: {
        apikey: OMDB_API_KEY,
        s: searchTerm,
        page,
        type: type && type !== 'all' ? type : undefined,
        y: year || undefined,
      },
    })

    if (data.Response === 'False') {
      return {
        movies: [],
        totalResults: 0,
        errorMessage: data.Error || 'No movies found for that title.',
      }
    }

    const movies = Array.isArray(data.Search) ? data.Search.map(normalizeMovieSummary) : []

    return {
      movies,
      totalResults: Number(data.totalResults) || movies.length,
      errorMessage: '',
    }
  } catch (error) {
    return {
      movies: [],
      totalResults: 0,
      errorMessage: buildOmdbErrorMessage(error, 'Unable to search movies right now.'),
    }
  }
}

export async function getMovieDetails(imdbID) {
  if (!imdbID) {
    return {
      movie: null,
      errorMessage: 'Missing movie identifier.',
    }
  }

  try {
    const { data } = await omdbClient.get('', {
      params: {
        apikey: OMDB_API_KEY,
        i: imdbID,
        plot: 'full',
      },
    })

    if (data.Response === 'False') {
      return {
        movie: null,
        errorMessage: data.Error || 'Unable to load movie details.',
      }
    }

    return {
      movie: normalizeMovieDetails(data),
      errorMessage: '',
    }
  } catch (error) {
    return {
      movie: null,
      errorMessage: buildOmdbErrorMessage(error, 'Unable to load movie details.'),
    }
  }
}

export async function findTmdbMatch({ imdbID = '', title = '', type = 'movie', year = '' } = {}) {
  if (!imdbID && !title) {
    return {
      match: null,
      errorMessage: 'Missing movie title or IMDb identifier for provider lookup.',
    }
  }

  const cacheKey = `match:${String(imdbID || title).toLowerCase()}:${String(type).toLowerCase()}:${String(year)}`

  if (TMDB_MATCH_CACHE.has(cacheKey)) {
    return TMDB_MATCH_CACHE.get(cacheKey)
  }

  const buildMatchResult = match => ({
    match: match
      ? {
          tmdbId: Number(match.id),
          mediaType: match.media_type === 'tv' ? 'tv' : 'movie',
          title: safeText(match.title || match.name || title, title || 'Unknown title'),
          year: safeText(match.release_date || match.first_air_date || year, year),
        }
      : null,
    errorMessage: match ? '' : 'No TMDB match found for this title.',
  })

  try {
    if (imdbID) {
      const { data } = await axios.get(`${TMDB_API_BASE}/find/${imdbID}`, {
        params: { external_source: 'imdb_id' },
        headers: getTmdbHeaders(),
      })

      const movieMatch = Array.isArray(data.movie_results) ? data.movie_results[0] : null
      const tvMatch = Array.isArray(data.tv_results) ? data.tv_results[0] : null
      let match = movieMatch || tvMatch || null

      if (!match && title) {
        const query = safeText(title)
        const typeParam = type === 'series' ? 'tv' : 'movie'
        try {
          const searchRes = await axios.get(`${TMDB_API_BASE}/search/${typeParam}`, {
            params: {
              query,
              include_adult: false,
              page: 1,
              ...(year ? { first_air_date_year: year } : {}),
            },
            headers: getTmdbHeaders(),
          })
          match = Array.isArray(searchRes.data?.results) && searchRes.data.results.length > 0 ? searchRes.data.results[0] : null
        } catch (_) {
          // ignore fallback error and use original match
        }
      }

      const result = buildMatchResult(match)
      TMDB_MATCH_CACHE.set(cacheKey, result)
      return result
    }

    const query = safeText(title)
    const typeParam = type === 'series' ? 'tv' : 'movie'

    const { data } = await axios.get(`${TMDB_API_BASE}/search/${typeParam}`, {
      params: {
        query,
        include_adult: false,
        page: 1,
        ...(year ? { first_air_date_year: year } : {}),
      },
      headers: getTmdbHeaders(),
    })

    const match = Array.isArray(data.results) && data.results.length > 0 ? data.results[0] : null
    const result = buildMatchResult(match)
    TMDB_MATCH_CACHE.set(cacheKey, result)
    return result
  } catch (error) {
    const message = buildTmdbErrorMessage(error, 'TMDB title lookup failed.')
    const result = { match: null, errorMessage: message }
    TMDB_MATCH_CACHE.set(cacheKey, result)
    return result
  }
}

export async function getWatchProviders({ imdbID = '', title = '', type = 'movie', region = DEFAULT_PROVIDER_REGION } = {}) {
  const normalizedRegion = normalizeRegionCode(region)

  const matchResult = await findTmdbMatch({ imdbID, title, type })

  if (matchResult.errorMessage || !matchResult.match) {
    const isError = Boolean(matchResult.errorMessage && !matchResult.errorMessage.includes('No TMDB match found'))
    return {
      watchProviders: null,
      matched: false,
      region: normalizedRegion,
      errorMessage: matchResult.errorMessage || 'No matching title was found in TMDB for this region.',
      status: isError ? 'error' : 'not-found',
    }
  }

  const { match } = matchResult
  const mediaType = match.mediaType
  const cacheKey = `providers:${mediaType}:${match.tmdbId}:${normalizedRegion}`

  if (TMDB_PROVIDER_CACHE.has(cacheKey)) {
    const cached = TMDB_PROVIDER_CACHE.get(cacheKey)
    return {
      watchProviders: cached,
      matched: true,
      region: normalizedRegion,
      errorMessage: cached.hasAvailability ? '' : 'No watch options are available for this title in the selected region.',
      status: cached.hasAvailability ? 'success' : 'empty',
    }
  }

  try {
    const { data } = await axios.get(`${TMDB_API_BASE}/${mediaType}/${match.tmdbId}/watch/providers`, {
      headers: getTmdbHeaders(),
    })

    const regionResults = data && data.results ? data.results[normalizedRegion] : null
    const watchPageUrl = regionResults && regionResults.link ? regionResults.link : `https://www.themoviedb.org/${mediaType}/${match.tmdbId}/watch?locale=${normalizedRegion}`

    const providerGroups = [
      { key: 'flatrate', label: 'Streaming' },
      { key: 'rent', label: 'Rent' },
      { key: 'buy', label: 'Buy' },
    ]

    const providerMap = new Map()

    providerGroups.forEach(group => {
      const items = Array.isArray(regionResults && regionResults[group.key]) ? regionResults[group.key] : []

      items.forEach(item => {
        const providerId = Number(item.provider_id || 0)
        const name = safeText(item.provider_name, 'Service')
        const logoPath = item.logo_path ? `${TMDB_IMAGE_BASE}${item.logo_path}` : ''

        if (!providerId || providerMap.has(providerId)) {
          return
        }

        providerMap.set(providerId, {
          id: providerId,
          name,
          category: group.label,
          displayPriority: Number(item.display_priority || 0),
          logoPath,
          link: watchPageUrl,
        })
      })
    })

    const providers = Array.from(providerMap.values()).sort((left, right) => left.category.localeCompare(right.category) || left.displayPriority - right.displayPriority)
    const hasAvailability = providers.length > 0
    const response = {
      region: normalizedRegion,
      title: match.title,
      mediaType,
      link: watchPageUrl,
      providers,
      providerCount: providers.length,
      hasAvailability,
      attribution: 'Availability data provided by JustWatch via TMDB.',
    }

    TMDB_PROVIDER_CACHE.set(cacheKey, response)

    return {
      watchProviders: response,
      matched: true,
      region: normalizedRegion,
      errorMessage: hasAvailability ? '' : 'No watch options are available for this title in the selected region.',
      status: hasAvailability ? 'success' : 'empty',
    }
  } catch (error) {
    const message = buildTmdbErrorMessage(error, 'TMDB watch-provider data is unavailable right now.')
    return {
      watchProviders: null,
      matched: true,
      region: normalizedRegion,
      errorMessage: message,
      status: 'error',
    }
  }
}

export const DEFAULT_PROVIDER_REGION_CODE = DEFAULT_PROVIDER_REGION

export function getDefaultProviderRegion() {
  return DEFAULT_PROVIDER_REGION
}

export function getSupportedProviderRegions() {
  return ['IN', 'US', 'GB', 'CA', 'AU']
}

// ---------- Discovery API ----------
// Simple in‑memory caches for discovery endpoints (valid for the app session)
const TMDB_TRENDING_CACHE = new Map();
const TMDB_POPULAR_CACHE = new Map();
const TMDB_UPCOMING_CACHE = new Map();
const TMDB_TOP_RATED_CACHE = new Map();
const TMDB_GENRES_CACHE = new Map();

/**
 * Generic helper to fetch TMDB data with auth headers and simple caching.
 * cacheMap: Map where the key is the request URL.
 */
async function fetchTmdbWithCache(url, cacheMap) {
  if (cacheMap.has(url)) {
    return cacheMap.get(url);
  }
  try {
    const { data } = await axios.get(url, { headers: getTmdbHeaders() });
    cacheMap.set(url, data);
    return data;
  } catch (error) {
    // Propagate error handling to callers; they will translate to UI messages.
    throw error;
  }
}

/** Fetch trending movies (week) */
export async function getTrendingMovies() {
  const url = `${TMDB_API_BASE}/trending/movie/week`;
  const data = await fetchTmdbWithCache(url, TMDB_TRENDING_CACHE);
  return (Array.isArray(data.results) ? data.results : []).map(normalizeTmdbSummary);
}

/** Fetch popular movies */
export async function getPopularMovies() {
  const url = `${TMDB_API_BASE}/movie/popular`;
  const data = await fetchTmdbWithCache(url, TMDB_POPULAR_CACHE);
  return (Array.isArray(data.results) ? data.results : []).map(normalizeTmdbSummary);
}

/** Fetch upcoming movies */
export async function getUpcomingMovies() {
  const url = `${TMDB_API_BASE}/movie/upcoming`;
  const data = await fetchTmdbWithCache(url, TMDB_UPCOMING_CACHE);
  return (Array.isArray(data.results) ? data.results : []).map(normalizeTmdbSummary);
}

/** Fetch top‑rated movies */
export async function getTopRatedMovies() {
  const url = `${TMDB_API_BASE}/movie/top_rated`;
  const data = await fetchTmdbWithCache(url, TMDB_TOP_RATED_CACHE);
  return (Array.isArray(data.results) ? data.results : []).map(normalizeTmdbSummary);
}

/** Fetch genre list */
export async function getMovieGenres() {
  const url = `${TMDB_API_BASE}/genre/movie/list`;
  const data = await fetchTmdbWithCache(url, TMDB_GENRES_CACHE);
  // Return array of { id, name }
  return Array.isArray(data.genres) ? data.genres : [];
}

/** Discover movies by a given genre id */
export async function getMoviesByGenre(genreId) {
  const url = `${TMDB_API_BASE}/discover/movie?with_genres=${genreId}`;
  const data = await fetchTmdbWithCache(url, TMDB_GENRES_CACHE);
  return (Array.isArray(data.results) ? data.results : []).map(normalizeTmdbSummary);
}

export const getMovieWatchProviders = (movie, region) => {
  const normalizedRegion = normalizeRegionCode(region)
  return getWatchProviders({
    imdbID: movie?.imdbID || '',
    title: movie?.Title || '',
    type: movie?.Type || 'movie',
    year: movie?.Year || '',
    region: normalizedRegion,
  }).then(result => {
    let status = result.status
    if (!status) {
      if (result.watchProviders?.hasAvailability) {
        status = 'success'
      } else if (result.errorMessage) {
        status = result.matched ? 'error' : 'not-found'
      } else {
        status = 'empty'
      }
    }

    let errorMessage = result.errorMessage || ''
    if (status === 'not-found' && !errorMessage) {
      errorMessage = 'No matching title was found in TMDB for this region.'
    } else if (status === 'empty' && !errorMessage) {
      errorMessage = 'No watch options are available for this title in the selected region.'
    } else if (status === 'success') {
      errorMessage = ''
    }

    return {
      region: result.region || normalizedRegion,
      providers: result.watchProviders?.providers || [],
      watchPageUrl: result.watchProviders?.link || '',
      errorMessage,
      status,
    }
  })
}
