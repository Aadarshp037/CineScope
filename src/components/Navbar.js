import React from 'react'

import Search from './Search'
import Logo from './Logo'

function Navbar({
  activeView,
  savedCount,
  query,
  onQueryChange,
  onSubmit,
  onClear,
  onDiscover,
  onWatchlist,
}) {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <button
          type="button"
          className="brand"
          onClick={onDiscover}
          aria-label="Go to CineScope home"
        >
          <span className="brand__mark">
            <Logo />
          </span>

          <span className="brand__copy">
            <span className="brand__name">
              <span className="brand__name--cine">Cine</span>
              <span className="brand__name--scope">Scope</span>
            </span>
            <span className="brand__tagline">Discover your next favorite film.</span>
          </span>
        </button>
      </div>

      <nav className="navbar__nav" aria-label="Primary navigation">
        <button
          type="button"
          className={activeView === 'discover' ? 'navlink navlink--active' : 'navlink'}
          onClick={onDiscover}
        >
          Discover
        </button>
        <button
          type="button"
          className={activeView === 'watchlist' ? 'navlink navlink--active' : 'navlink'}
          onClick={onWatchlist}
        >
          Watchlist <span className="navlink__count">{savedCount}</span>
        </button>
      </nav>

      <div className="navbar__search">
        <Search
          compact
          query={query}
          onQueryChange={onQueryChange}
          onSubmit={onSubmit}
          onClear={onClear}
          placeholder="Search movies"
        />
      </div>
    </header>
  )
}

export default Navbar
