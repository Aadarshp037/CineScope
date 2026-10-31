import React, { useEffect, useMemo, useRef, useState } from 'react'

import EmptyState from './components/EmptyState'
import Hero from './components/Hero'
import Loading from './components/Loading'
import MovieGrid from './components/MovieGrid'
import Navbar from './components/Navbar'
import Popup from './components/Popup'
import Search from './components/Search'
import { getMovieDetails, getMovieWatchProviders, getDefaultProviderRegion, getSupportedProviderRegions, normalizeMovieSummary, searchMovies, getTrendingMovies, getPopularMovies, getUpcomingMovies, getTopRatedMovies, getMovieGenres, getMoviesByGenre } from './services/movieApi'
import useLocalStorage from './hooks/useLocalStorage'

const DEFAULT_FILTERS = {
  type: 'all',
  year: '',
  sort: 'relevance',
}

const POPULAR_SEARCHES = ['Interstellar', 'The Matrix', 'Inception', 'Arrival', 'Blade Runner', 'Spider-Man']
const RECENT_SEARCH_LIMIT = 5

function parseNumberYear(value) {
  if (!value) {
    return ''
  }

  return String(value).replace(/[^0-9]/g, '').slice(0, 4)
}

function movieYearAsNumber(movie) {
  const match = String(movie.Year || '').match(/\d{4}/)
  return match ? Number(match[0]) : 0
}

function sortMovies(movies, sort) {
  const nextMovies = [...movies]

  if (sort === 'title-asc') {
    return nextMovies.sort((left, right) => left.Title.localeCompare(right.Title))
  }

  if (sort === 'title-desc') {
    return nextMovies.sort((left, right) => right.Title.localeCompare(left.Title))
  }

  if (sort === 'year-asc') {
    return nextMovies.sort((left, right) => movieYearAsNumber(left) - movieYearAsNumber(right))
  }

  if (sort === 'year-desc') {
    return nextMovies.sort((left, right) => movieYearAsNumber(right) - movieYearAsNumber(left))
  }

  return nextMovies
}

function dedupeMovies(movies) {
  const seen = new Set()

  return movies.filter(movie => {
    if (!movie.imdbID || seen.has(movie.imdbID)) {
      return false
    }

    seen.add(movie.imdbID)
    return true
  })
}

function mapSearchError(errorMessage, query) {
  if (!errorMessage) {
    return 'Something went wrong while searching.'
  }

  if (errorMessage === 'Enter a title to search.') {
    return 'Type a movie title to begin.'
  }

  if (errorMessage === 'Movie not found!' || errorMessage === 'No movies found for that title.') {
    return `No movies found for "${query}". Try a different title or widen the search.`
  }

  if (errorMessage === 'Invalid API key!' || errorMessage.indexOf('OMDb API key') !== -1) {
    return 'OMDb rejected the API key. Add a valid key to your .env file.'
  }

  return errorMessage
}

function App() {
  const [activeView, setActiveView] = useState('discover')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [searchStatus, setSearchStatus] = useState('idle')
  const [searchError, setSearchError] = useState('')
  const [movies, setMovies] = useState([])

  // --- Discovery data state ---
  const [trending, setTrending] = useState({movies: [], loading: false, error: ''});
  const [popular, setPopular] = useState({movies: [], loading: false, error: ''});
  const [upcoming, setUpcoming] = useState({movies: [], loading: false, error: ''});
  const [topRated, setTopRated] = useState({movies: [] , loading: false, error: ''});
  const [genres, setGenres] = useState({list: [], loading: false, error: ''});
  const [genreMovies, setGenreMovies] = useState({movies: [], loading: false, error: ''});
  const [selectedGenre, setSelectedGenre] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [watchlist, setWatchlist] = useLocalStorage('cinescope-watchlist', [])
  const [recentSearches, setRecentSearches] = useLocalStorage('cinescope-recent-searches', [])
  const [modalState, setModalState] = useState({
    isOpen: false,
    loading: false,
    error: '',
    movie: null,
    movieId: '',
  })
  const [providerRegion, setProviderRegion] = useState(getDefaultProviderRegion())
  const [providerState, setProviderState] = useState({
    loading: false,
    error: '',
    providers: [],
    watchPageUrl: '',
    status: 'idle',
  })
  const [modalSaved, setModalSaved] = useState(false)
  const searchInputRef = useRef(null)
  const searchRequestId = useRef(0)
  const detailRequestId = useRef(0)
  const providerRequestId = useRef(0)
  const supportedProviderRegions = useMemo(() => getSupportedProviderRegions(), [])

  const scheduleFrame = callback => {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(callback)
    }

    return window.setTimeout(callback, 0)
  }



  useEffect(() => {
    if (filters.sort === 'relevance' || movies.length === 0) {
      return
    }

    setMovies(previousMovies => sortMovies(previousMovies, filters.sort))
  }, [filters.sort]);

  // Fetch discovery data on component mount
  useEffect(() => {
    async function loadDiscovery() {
      // Trending
      setTrending(prev => ({...prev, loading: true}));
      try {
        const data = await getTrendingMovies();
        setTrending({movies: data, loading: false, error: ''});
      } catch (e) {
        setTrending({movies: [], loading: false, error: 'Failed to load trending movies.'});
      }
      // Popular
      setPopular(prev => ({...prev, loading: true}));
      try {
        const data = await getPopularMovies();
        setPopular({movies: data, loading: false, error: ''});
      } catch (e) {
        setPopular({movies: [], loading: false, error: 'Failed to load popular movies.'});
      }
      // Upcoming
      setUpcoming(prev => ({...prev, loading: true}));
      try {
        const data = await getUpcomingMovies();
        setUpcoming({movies: data, loading: false, error: ''});
      } catch (e) {
        setUpcoming({movies: [], loading: false, error: 'Failed to load upcoming movies.'});
      }
      // Top Rated
      setTopRated(prev => ({...prev, loading: true}));
      try {
        const data = await getTopRatedMovies();
        setTopRated({movies: data, loading: false, error: ''});
      } catch (e) {
        setTopRated({movies: [], loading: false, error: 'Failed to load top rated movies.'});
      }
      // Genres list
      setGenres(prev => ({...prev, loading: true}));
      try {
        const list = await getMovieGenres();
        setGenres({list, loading: false, error: ''});
      } catch (e) {
        setGenres({list: [], loading: false, error: 'Failed to load genres.'});
      }
    }
    loadDiscovery();
  }, []);


  const savedIdSet = useMemo(() => {
    return new Set(watchlist.map(item => item.imdbID))
  }, [watchlist])

  // Load movies for selected genre
  useEffect(() => {
    if (!selectedGenre) {
      setGenreMovies({ movies: [], loading: false, error: '' })
      return
    }
    setGenreMovies(prev => ({ ...prev, loading: true }))
    async function loadGenre() {
      try {
        const data = await getMoviesByGenre(selectedGenre)
        setGenreMovies({ movies: data, loading: false, error: '' })
      } catch (e) {
        setGenreMovies({ movies: [], loading: false, error: 'Failed to load movies for genre.' })
      }
    }
    loadGenre()
  }, [selectedGenre])

  const featuredMovie = useMemo(() => {
    if (activeView === 'watchlist' && watchlist.length > 0) {
      return watchlist[0]
    }

    return movies[0] || watchlist[0] || null
  }, [activeView, movies, watchlist])

  const searchMeta = useMemo(() => {
    if (!totalResults || searchStatus !== 'success') {
      return ''
    }

    return `Showing ${movies.length} of ${totalResults.toLocaleString()} results`
  }, [movies.length, searchStatus, totalResults])

  const updateRecentSearches = nextQuery => {
    const normalizedQuery = nextQuery.trim()

    if (!normalizedQuery) {
      return
    }

    setRecentSearches(previous => {
      const next = [normalizedQuery, ...(previous || []).filter(item => item.toLowerCase() !== normalizedQuery.toLowerCase())]
      return next.slice(0, RECENT_SEARCH_LIMIT)
    })
  }

  const runSearch = async ({ nextQuery = query, nextPage = 1, append = false, forceView = true } = {}) => {
    const searchTerm = nextQuery.trim()

    if (!searchTerm) {
      setMovies([])
      setTotalResults(0)
      setPage(0)
      setHasMore(false)
      setSearchStatus('idle')
      setSearchError('Type a movie title to begin.')
      return
    }

    const requestId = searchRequestId.current + 1
    searchRequestId.current = requestId

    if (append) {
      setLoadingMore(true)
    } else {
      setSearchStatus('loading')
      setSearchError('')
    }

    const response = await searchMovies({
      query: searchTerm,
      page: nextPage,
      type: filters.type,
      year: parseNumberYear(filters.year),
    })

    if (searchRequestId.current !== requestId) {
      return
    }

    if (response.errorMessage) {
      const friendlyMessage = mapSearchError(response.errorMessage, searchTerm)

      setMovies([])
      setTotalResults(0)
      setPage(0)
      setHasMore(false)
      setLoadingMore(false)
      setSearchStatus('error')
      setSearchError(friendlyMessage)
      return
    }

    const normalizedMovies = response.movies.map(normalizeMovieSummary)
    const nextMovies = append ? dedupeMovies([...movies, ...normalizedMovies]) : dedupeMovies(normalizedMovies)
    const sortedMovies = sortMovies(nextMovies, filters.sort)

    setMovies(sortedMovies)
    setTotalResults(response.totalResults)
    setPage(nextPage)
    setHasMore(nextPage * 10 < response.totalResults)
    setLoadingMore(false)
    setSearchStatus(sortedMovies.length > 0 ? 'success' : 'empty')
    setSearchError('')
    setQuery(searchTerm)
    setActiveView(previousView => (forceView ? 'discover' : previousView))
    updateRecentSearches(searchTerm)
  }

  const handleSubmitSearch = () => {
    runSearch({ nextQuery: query, nextPage: 1, append: false })
  }

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || searchStatus === 'loading') {
      return
    }

    runSearch({ nextQuery: query, nextPage: page + 1, append: true, forceView: false })
  }

  const handleClearSearch = () => {
    searchRequestId.current += 1
    setQuery('')
    setMovies([])
    setTotalResults(0)
    setPage(0)
    setHasMore(false)
    setSearchStatus('idle')
    setSearchError('')
    setFilters(DEFAULT_FILTERS)
    setActiveView('discover')
  }

  const handleOpenMovie = async movie => {
    if (!movie || !movie.imdbID) {
      return
    }

    const requestId = detailRequestId.current + 1
    detailRequestId.current = requestId

    setModalSaved(savedIdSet.has(movie.imdbID))
    setModalState({
      isOpen: true,
      loading: true,
      error: '',
      movie,
      movieId: movie.imdbID,
    })

    const details = await getMovieDetails(movie.imdbID)

    if (detailRequestId.current !== requestId) {
      return
    }

    if (details.errorMessage) {
      setModalState(previous => ({
        ...previous,
        loading: false,
        error: details.errorMessage,
      }))
      setProviderState({
        loading: false,
        error: '',
        providers: [],
        watchPageUrl: '',
        status: 'idle',
      })
      return
    }

    const requestIdProvider = providerRequestId.current + 1
    providerRequestId.current = requestIdProvider

    setProviderState({
      loading: true,
      error: '',
      providers: [],
      watchPageUrl: '',
      status: 'loading',
    })

    const providerData = await getMovieWatchProviders(details.movie || movie, providerRegion)

    if (providerRequestId.current !== requestIdProvider) {
      return
    }

    setProviderState({
      loading: false,
      error: providerData.errorMessage || '',
      providers: providerData.providers || [],
      watchPageUrl: providerData.watchPageUrl || '',
      status: providerData.status || 'idle',
    })

    setModalState(previous => ({
      ...previous,
      loading: false,
      error: '',
      movie: details.movie,
    }))
    setModalSaved(savedIdSet.has(movie.imdbID))
  }

  const handleCloseMovie = () => {
    detailRequestId.current += 1
    providerRequestId.current += 1
    setModalState({
      isOpen: false,
      loading: false,
      error: '',
      movie: null,
      movieId: '',
    })
    setProviderState({
      loading: false,
      error: '',
      providers: [],
      watchPageUrl: '',
      status: 'idle',
    })
  }

  const handleToggleWatchlist = movie => {
    if (!movie || !movie.imdbID) {
      return
    }

    setWatchlist(previousWatchlist => {
      const exists = previousWatchlist.some(item => item.imdbID === movie.imdbID)

      if (exists) {
        return previousWatchlist.filter(item => item.imdbID !== movie.imdbID)
      }

      return [normalizeMovieSummary(movie), ...previousWatchlist]
    })

    setModalSaved(previous => !previous)
  }

  useEffect(() => {
    if (modalState.isOpen && modalState.movie) {
      setModalSaved(savedIdSet.has(modalState.movie.imdbID))
    }
  }, [modalState.isOpen, modalState.movie, savedIdSet])

  const handleDiscover = () => {
    setActiveView('discover')
    scheduleFrame(() => {
      if (searchInputRef.current) {
        if (typeof searchInputRef.current.focus === 'function') {
          searchInputRef.current.focus()
        }

        if (typeof searchInputRef.current.scrollIntoView === 'function') {
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    })
  }

  const handleWatchlist = () => {
    setActiveView('watchlist')
    scheduleFrame(() => {
      const watchlistSection = document.getElementById('watchlist-section')
      if (watchlistSection && typeof watchlistSection.scrollIntoView === 'function') {
        watchlistSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  const openSuggestion = suggestion => {
    setQuery(suggestion)
    runSearch({ nextQuery: suggestion, nextPage: 1, append: false })
  }

  const handleProviderRegionChange = async nextRegion => {
    setProviderRegion(nextRegion)

    if (!modalState.isOpen || !modalState.movie) {
      return
    }

    const requestId = providerRequestId.current + 1
    providerRequestId.current = requestId

    setProviderState({
      loading: true,
      error: '',
      providers: [],
      watchPageUrl: '',
      status: 'loading',
    })

    const providerData = await getMovieWatchProviders(modalState.movie, nextRegion)

    if (providerRequestId.current !== requestId) {
      return
    }

    setProviderState({
      loading: false,
      error: providerData.errorMessage || '',
      providers: providerData.providers || [],
      watchPageUrl: providerData.watchPageUrl || '',
      status: providerData.status || 'idle',
    })
  }

  return (
    <div className="app-shell">
      <Navbar
        activeView={activeView}
        savedCount={watchlist.length}
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSubmitSearch}
        onClear={handleClearSearch}
        onDiscover={handleDiscover}
        onWatchlist={handleWatchlist}
      />

      <main className="app-main">
        <Hero
          featuredMovie={featuredMovie}
          onViewDetails={() => handleOpenMovie(featuredMovie)}
          onExplore={handleDiscover}
          onToggleWatchlist={() => handleToggleWatchlist(featuredMovie)}
          isSaved={featuredMovie ? savedIdSet.has(featuredMovie.imdbID) : false}
        />

        {activeView === 'discover' ? (
          <>
            <div className="section-anchor" id="discover-search-anchor">
              <Search
                inputRef={searchInputRef}
                query={query}
                onQueryChange={setQuery}
                onSubmit={handleSubmitSearch}
                onClear={handleClearSearch}
                type={filters.type}
                onTypeChange={value => setFilters(previous => ({ ...previous, type: value }))}
                year={filters.year}
                onYearChange={value => setFilters(previous => ({ ...previous, year: value }))}
                sort={filters.sort}
                onSortChange={value => setFilters(previous => ({ ...previous, sort: value }))}
                recentSearches={recentSearches}
                popularSearches={POPULAR_SEARCHES}
                onSuggestionSelect={openSuggestion}
              />

              {/* Discovery Sections */}
              {/* Trending */}
              {trending.loading && <Loading label="Loading trending movies" />}
              {trending.error && <EmptyState title="Trending" description={trending.error} />}
              {trending.movies.length > 0 && (
                <MovieGrid title="Trending Now" movies={trending.movies} savedIds={savedIdSet} onOpenMovie={handleOpenMovie} onToggleWatchlist={handleToggleWatchlist} />
              )}
              {/* Popular */}
              {popular.loading && <Loading label="Loading popular movies" />}
              {popular.error && <EmptyState title="Popular" description={popular.error} />}
              {popular.movies.length > 0 && (
                <MovieGrid title="Popular Movies" movies={popular.movies} savedIds={savedIdSet} onOpenMovie={handleOpenMovie} onToggleWatchlist={handleToggleWatchlist} />
              )}
              {/* Upcoming */}
              {upcoming.loading && <Loading label="Loading upcoming movies" />}
              {upcoming.error && <EmptyState title="Upcoming" description={upcoming.error} />}
              {upcoming.movies.length > 0 && (
                <MovieGrid title="Upcoming Releases" movies={upcoming.movies} savedIds={savedIdSet} onOpenMovie={handleOpenMovie} onToggleWatchlist={handleToggleWatchlist} />
              )}
              {/* Top Rated */}
              {topRated.loading && <Loading label="Loading top rated movies" />}
              {topRated.error && <EmptyState title="Top Rated" description={topRated.error} />}
              {topRated.movies.length > 0 && (
                <MovieGrid title="Top Rated" movies={topRated.movies} savedIds={savedIdSet} onOpenMovie={handleOpenMovie} onToggleWatchlist={handleToggleWatchlist} />
              )}
              {/* Genres */}
              <div className="genres-section">
                <h2>Discover by Genre</h2>
                {genres.loading && <Loading label="Loading genres" />}
                {genres.error && <EmptyState title="Genres" description={genres.error} />}
                <div className="genre-list">
                  {genres.list.map(g => (
                    <button key={g.id} className={selectedGenre===g.id? 'genre-button selected':'genre-button'} onClick={() => setSelectedGenre(g.id)}>{g.name}</button>
                  ))}
                </div>
              </div>
              {/* Selected Genre Movies */}
              {selectedGenre && genreMovies.loading && <Loading label="Loading genre movies" />}
              {selectedGenre && genreMovies.error && <EmptyState title="Genre Movies" description={genreMovies.error} />}
              {selectedGenre && genreMovies.movies.length > 0 && (
                <MovieGrid title={genres.list.find(g=>g.id===selectedGenre)?.name || 'Genre'} movies={genreMovies.movies} savedIds={savedIdSet} onOpenMovie={handleOpenMovie} onToggleWatchlist={handleToggleWatchlist} />
              )}

            </div>

            {searchStatus === 'loading' ? <Loading label="Searching movies" /> : null}

            {searchStatus === 'error' ? (
              <EmptyState
                title="Search failed"
                description={searchError}
                actionLabel="Try again"
                onAction={handleSubmitSearch}
                secondaryLabel="Clear search"
                onSecondaryAction={handleClearSearch}
              />
            ) : null}

            {searchStatus === 'idle' ? (
              <EmptyState
                title="Start with a title"
                description="Use the search box to look up a movie, series, or episode. Recent searches and popular examples are shown above."
                actionLabel="Explore movies"
                onAction={handleDiscover}
              />
            ) : null}

            {searchStatus === 'empty' ? (
              <EmptyState
                title="No movies found"
                description={searchError || 'Try a different title or remove a filter to broaden the results.'}
                actionLabel="Search again"
                onAction={handleSubmitSearch}
                secondaryLabel="Clear search"
                onSecondaryAction={handleClearSearch}
              />
            ) : null}

            {searchStatus === 'success' && movies.length > 0 ? (
              <MovieGrid
                title="Search results"
                subtitle={searchMeta}
                movies={movies}
                savedIds={savedIdSet}
                onOpenMovie={handleOpenMovie}
                onToggleWatchlist={handleToggleWatchlist}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                loadingMore={loadingMore}
              />
            ) : null}
          </>
        ) : null}

        {activeView === 'watchlist' ? (
          <section className="section section--watchlist" id="watchlist-section">
            <div className="section__header">
              <div>
                <p className="section__eyebrow">Watchlist</p>
                <h2>Your saved movies</h2>
                <p className="section__lede">Movies you save here are stored locally in your browser.</p>
              </div>
            </div>

            {watchlist.length > 0 ? (
              <MovieGrid
                movies={watchlist}
                savedIds={savedIdSet}
                onOpenMovie={handleOpenMovie}
                onToggleWatchlist={handleToggleWatchlist}
              />
            ) : (
              <EmptyState
                title="Your watchlist is empty"
                description="Save movies from search results or the details modal to build your own local collection."
                actionLabel="Discover movies"
                onAction={handleDiscover}
              />
            )}
          </section>
        ) : null}
      </main>

      <footer className="footer">
        <p>CineScope</p>
        <p>
          Movie data powered by <a href="https://www.omdbapi.com/" target="_blank" rel="noreferrer">OMDb</a>. Watch availability data provided by <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" aria-label="The Movie Database">TMDB</a> and JustWatch.
        </p>
      </footer>

      <Popup
        isOpen={modalState.isOpen}
        loading={modalState.loading}
        movie={modalState.movie}
        error={modalState.error}
        isSaved={modalSaved}
        onClose={handleCloseMovie}
        onToggleWatchlist={handleToggleWatchlist}
        watchProviders={providerState.providers}
        providerLoading={providerState.loading}
        providerError={providerState.error}
        providerStatus={providerState.status}
        providerRegion={providerRegion}
        supportedRegions={supportedProviderRegions}
        onRegionChange={handleProviderRegionChange}
        watchPageUrl={providerState.watchPageUrl}
      />
    </div>
  )
}

export default App
