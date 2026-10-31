import React from 'react'

function Hero({ featuredMovie, onViewDetails, onExplore, onToggleWatchlist, isSaved }) {
  const title = featuredMovie ? featuredMovie.Title : 'Discover movies worth watching'
  const year = featuredMovie ? featuredMovie.Year : 'Search, save and revisit films in one place'
  const type = featuredMovie ? featuredMovie.Type : 'CineScope curates your search around OMDb data'
  const plot = featuredMovie
    ? featuredMovie.Plot || 'Open the details view to inspect the full OMDb record for this movie.'
    : 'Search by title, filter by type, open details and build a local watchlist without creating an account.'
  const imageUrl = featuredMovie && featuredMovie.Poster ? featuredMovie.Poster : featuredMovie ? featuredMovie.PosterFallback : ''

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__background" style={imageUrl ? { backgroundImage: `linear-gradient(115deg, rgba(4, 8, 15, 0.18), rgba(4, 8, 15, 0.9)), url(${imageUrl})` } : undefined} />

      <div className="hero__content">
        <div className="hero__eyebrow">CineScope</div>
        <h1 id="hero-title">{title}</h1>
        <p className="hero__meta">
          <span>{year}</span>
          <span>{type}</span>
        </p>
        <p className="hero__plot">{plot}</p>

        <div className="hero__actions">
          {featuredMovie ? (
            <button type="button" className="button button--primary" onClick={onViewDetails}>
              View Details
            </button>
          ) : null}
          <button type="button" className="button button--secondary" onClick={onExplore}>
            Explore Movies
          </button>
          {featuredMovie ? (
            <button type="button" className="button button--ghost" onClick={onToggleWatchlist}>
              {isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default Hero
