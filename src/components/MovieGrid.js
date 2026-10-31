import React from 'react'

import MovieCard from './MovieCard'

function MovieGrid({
  title,
  subtitle,
  movies,
  savedIds,
  onOpenMovie,
  onToggleWatchlist,
  onLoadMore,
  hasMore,
  loadingMore,
}) {
  const headingId = title ? `${title.replace(/\s+/g, '-').toLowerCase()}-title` : undefined

  return (
    <section className="section section--results" aria-labelledby={headingId}>
      {title || subtitle ? (
        <div className="section__header">
          <div>
            {title ? <h2 id={headingId}>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="movie-grid">
        {movies.map(movie => (
          <MovieCard
            key={movie.imdbID}
            movie={movie}
            isSaved={savedIds.has(movie.imdbID)}
            onOpenMovie={onOpenMovie}
            onToggleWatchlist={onToggleWatchlist}
          />
        ))}
      </div>

      {hasMore ? (
        <div className="section__footer">
          <button type="button" className="button button--secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading more...' : 'Load more'}
          </button>
        </div>
      ) : null}
    </section>
  )
}

export default MovieGrid
