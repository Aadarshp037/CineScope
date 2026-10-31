import React from 'react'
import { cleanup, fireEvent, render, within } from '@testing-library/react'

import App from './App'
import { getMovieDetails, getMovieWatchProviders, searchMovies } from './services/movieApi'

jest.mock('./services/movieApi', () => ({
  searchMovies: jest.fn(),
  getMovieDetails: jest.fn(),
  getMovieWatchProviders: jest.fn(),
  getDefaultProviderRegion: jest.fn(() => 'IN'),
  getSupportedProviderRegions: jest.fn(() => ['IN', 'US', 'GB']),
  normalizeMovieSummary: movie => movie,
}))

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  jest.clearAllMocks()
})

function renderApp() {
  return render(<App />)
}

test('searches for movies and opens the details modal', async () => {
  searchMovies.mockResolvedValue({
    movies: [
      {
        Title: 'The Matrix',
        Year: '1999',
        imdbID: 'tt0133093',
        Type: 'movie',
        Poster: 'N/A',
        PosterFallback: 'poster-fallback',
      },
    ],
    totalResults: 1,
    errorMessage: '',
  })

  getMovieDetails.mockResolvedValue({
    movie: {
      Title: 'The Matrix',
      Year: '1999',
      Poster: 'N/A',
      PosterFallback: 'poster-fallback',
      Plot: 'A hacker discovers the truth about his world.',
      Genre: 'Action, Sci-Fi',
      Director: 'Lana Wachowski, Lilly Wachowski',
      Actors: 'Keanu Reeves, Carrie-Anne Moss, Laurence Fishburne',
      Runtime: '136 min',
      Language: 'English',
      Released: '31 Mar 1999',
      imdbRating: '8.7',
      imdbVotes: '2,000,000',
      Rated: 'R',
      Awards: 'Won 4 Oscars',
    },
    errorMessage: '',
  })

  getMovieWatchProviders.mockResolvedValue({
    region: 'IN',
    providers: [{ id: 8, name: 'Netflix', category: 'flatrate', logoUrl: 'https://cdn.example.com/netflix.png' }],
    watchPageUrl: 'https://www.themoviedb.org/movie/603/watch?locale=IN',
    errorMessage: '',
    status: 'success',
  })

  const { getByPlaceholderText, getByRole, getByAltText, findByText } = renderApp()

  fireEvent.change(getByPlaceholderText('Search by movie title'), {
    target: { value: 'Matrix' },
  })

  fireEvent.submit(getByPlaceholderText('Search by movie title').closest('form'))

  await findByText('The Matrix')

  const posterImg = getByAltText('The Matrix')
  fireEvent.click(posterImg.closest('button'))

  await findByText('A hacker discovers the truth about his world.')
  await findByText('Action, Sci-Fi')
  await findByText('Netflix')
  expect(getByRole('link', { name: 'TMDB' })).toHaveAttribute('href', 'https://www.themoviedb.org/movie/603/watch?locale=IN')
})

test('stores watchlist entries and restores them after reload', async () => {
  searchMovies.mockResolvedValue({
    movies: [
      {
        Title: 'The Matrix',
        Year: '1999',
        imdbID: 'tt0133093',
        Type: 'movie',
        Poster: 'N/A',
        PosterFallback: 'poster-fallback',
      },
    ],
    totalResults: 1,
    errorMessage: '',
  })

  getMovieDetails.mockResolvedValue({ movie: null, errorMessage: 'Movie details unavailable' })

  const firstRender = renderApp()

  fireEvent.change(firstRender.getByPlaceholderText('Search by movie title'), {
    target: { value: 'Matrix' },
  })

  fireEvent.submit(firstRender.getByPlaceholderText('Search by movie title').closest('form'))

  const posterImg = await firstRender.findByAltText('The Matrix')
  const movieCard = posterImg.closest('article')
  const saveBtn = movieCard.querySelector('button[aria-label="Save The Matrix to watchlist"]')
  expect(saveBtn).toBeTruthy()
  fireEvent.click(saveBtn)

  const primaryNav = firstRender.getByRole('navigation', { name: /primary navigation/i })
  const watchlistButton = within(primaryNav)
    .getAllByRole('button')
    .find(button => button.textContent && button.textContent.includes('Watchlist'))

  expect(watchlistButton).toHaveTextContent('1')

  firstRender.unmount()

  const secondRender = renderApp()

  const nextWatchlistButton = within(secondRender.getByRole('navigation', { name: /primary navigation/i }))
    .getAllByRole('button')
    .find(button => button.textContent && button.textContent.includes('Watchlist'))

  fireEvent.click(nextWatchlistButton)

  await secondRender.findByAltText('The Matrix')
})

test('shows a friendly no-results state', async () => {
  searchMovies.mockResolvedValue({
    movies: [],
    totalResults: 0,
    errorMessage: 'No movies found for that title.',
  })

  const { getByPlaceholderText, findByText } = renderApp()

  fireEvent.change(getByPlaceholderText('Search by movie title'), {
    target: { value: 'zzzzzzzz' },
  })

  fireEvent.submit(getByPlaceholderText('Search by movie title').closest('form'))

  await findByText(/No movies found/i)
})

test('displays an empty availability state when TMDB has no region match', async () => {
  searchMovies.mockResolvedValue({
    movies: [{ Title: 'Dune', Year: '2021', imdbID: 'tt1160419', Type: 'movie', Poster: 'N/A', PosterFallback: 'poster-fallback' }],
    totalResults: 1,
    errorMessage: '',
  })

  getMovieDetails.mockResolvedValue({
    movie: { Title: 'Dune', Year: '2021', Poster: 'N/A', PosterFallback: 'poster-fallback', Plot: 'A desert adventure.' },
    errorMessage: '',
  })

  getMovieWatchProviders.mockResolvedValue({
    region: 'IN',
    providers: [],
    watchPageUrl: '',
    errorMessage: 'No watch options are available for this title in the selected region.',
    status: 'empty',
  })

  const { getByPlaceholderText, findByText, findByAltText } = renderApp()

  fireEvent.change(getByPlaceholderText('Search by movie title'), { target: { value: 'Dune' } })
  fireEvent.submit(getByPlaceholderText('Search by movie title').closest('form'))

  const posterImg = await findByAltText('Dune')
  fireEvent.click(posterImg.closest('button'))

  await findByText('No watch options are available in this region yet.')
})

test('shows a friendly message when TMDB has no match for a title', async () => {
  searchMovies.mockResolvedValue({
    movies: [{ Title: 'Unknown Title', Year: '2025', imdbID: 'tt0000000', Type: 'movie', Poster: 'N/A', PosterFallback: 'poster-fallback' }],
    totalResults: 1,
    errorMessage: '',
  })

  getMovieDetails.mockResolvedValue({
    movie: { Title: 'Unknown Title', Year: '2025', Poster: 'N/A', PosterFallback: 'poster-fallback', Plot: 'Placeholder.' },
    errorMessage: '',
  })

  getMovieWatchProviders.mockResolvedValue({
    region: 'IN',
    providers: [],
    watchPageUrl: '',
    errorMessage: 'No matching title was found in TMDB for this region.',
    status: 'not-found',
  })

  const { getByPlaceholderText, findByText, findByAltText } = renderApp()

  fireEvent.change(getByPlaceholderText('Search by movie title'), { target: { value: 'Unknown Title' } })
  fireEvent.submit(getByPlaceholderText('Search by movie title').closest('form'))

  const posterImg = await findByAltText('Unknown Title')
  fireEvent.click(posterImg.closest('button'))

  await findByText('No matching title was found in TMDB for this region.')
})

test('shows a provider failure message when TMDB errors', async () => {
  searchMovies.mockResolvedValue({
    movies: [{ Title: 'Arrival', Year: '2016', imdbID: 'tt2543164', Type: 'movie', Poster: 'N/A', PosterFallback: 'poster-fallback' }],
    totalResults: 1,
    errorMessage: '',
  })

  getMovieDetails.mockResolvedValue({
    movie: { Title: 'Arrival', Year: '2016', Poster: 'N/A', PosterFallback: 'poster-fallback', Plot: 'Language and time collapse.' },
    errorMessage: '',
  })

  getMovieWatchProviders.mockResolvedValue({
    region: 'IN',
    providers: [],
    watchPageUrl: '',
    errorMessage: 'TMDB watch-provider data is unavailable right now.',
    status: 'error',
  })

  const { getByPlaceholderText, findByText, findByAltText } = renderApp()

  fireEvent.change(getByPlaceholderText('Search by movie title'), { target: { value: 'Arrival' } })
  fireEvent.submit(getByPlaceholderText('Search by movie title').closest('form'))

  const posterImg = await findByAltText('Arrival')
  fireEvent.click(posterImg.closest('button'))

  await findByText('TMDB watch-provider data is unavailable right now.')
})