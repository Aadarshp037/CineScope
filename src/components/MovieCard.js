import React, { useState } from 'react'

function MovieCard({ movie, isSaved, onOpenMovie, onToggleWatchlist }) {
  const [posterError, setPosterError] = useState(false)
  const posterSource = !posterError && movie.Poster ? movie.Poster : movie.PosterFallback

  return (
    <article className="movie-card">
      <button
        type="button"
        className="movie-card__poster-button"
        onClick={() => onOpenMovie(movie)}
        aria-label={`Open details for ${movie.Title}`}
      >
        <img
          className="movie-card__poster"
          src={posterSource}
          alt={movie.Title}
          onError={() => setPosterError(true)}
        />
      </button>

      <div className="movie-card__body">
        <div className="movie-card__copy">
          <h3>{movie.Title}</h3>
          <p>
            <span>{movie.Year}</span>
            <span>{movie.Type}</span>
          </p>
        </div>

        <div className="movie-card__actions">
          <button
            type="button"
            className={isSaved ? 'icon-button icon-button--active' : 'icon-button'}
            onClick={() => onToggleWatchlist(movie)}
            aria-label={isSaved ? `Remove ${movie.Title} from watchlist` : `Save ${movie.Title} to watchlist`}
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>

          <button
            type="button"
            className="button button--tertiary"
            onClick={() => onOpenMovie(movie)}
            aria-label={`Details`}
          >
            Details
          </button>
        </div>
      </div>
    </article>
  )
}

export default MovieCard
