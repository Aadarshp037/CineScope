import React from 'react'

function Search({
	compact = false,
	query,
	onQueryChange,
	onSubmit,
	onClear,
	inputRef,
	placeholder = 'Search by movie title',
	type,
	onTypeChange,
	year,
	onYearChange,
	sort,
	onSortChange,
	recentSearches = [],
	popularSearches = [],
	onSuggestionSelect,
}) {
	const handleSubmit = event => {
		event.preventDefault()
		onSubmit()
	}

	if (compact) {
		return (
			<form className="search search--compact" onSubmit={handleSubmit}>
				<label className="sr-only" htmlFor="nav-search-input">
					Search movies
				</label>
				<input
					id="nav-search-input"
					className="search__input"
					type="search"
					value={query}
					ref={inputRef}
					placeholder={placeholder}
					onChange={event => onQueryChange(event.target.value)}
				/>
				<button type="submit" className="button button--primary button--small">
					Search
				</button>
			</form>
		)
	}

	return (
		<section className="search-panel" aria-labelledby="discover-search-title">
			<div className="section__header section__header--stacked">
				<div>
					<p className="section__eyebrow">Discover</p>
					<h2 id="discover-search-title">Search the OMDb catalog</h2>
					<p className="section__lede">Search by title, narrow the type, and sort the results that come back from OMDb.</p>
				</div>
			</div>

			<form className="search" onSubmit={handleSubmit}>
				<div className="search__row search__row--primary">
					<label className="sr-only" htmlFor="main-search-input">
						Search movies
					</label>
					<input
						id="main-search-input"
						className="search__input"
						type="search"
						value={query}
						ref={inputRef}
						placeholder={placeholder}
						onChange={event => onQueryChange(event.target.value)}
					/>

					<button type="submit" className="button button--primary" disabled={!query.trim()}>
						Search
					</button>
					<button type="button" className="button button--ghost" onClick={onClear}>
						Clear
					</button>
				</div>

				<div className="search__row search__row--filters">
					<label>
						<span>Type</span>
						<select value={type} onChange={event => onTypeChange(event.target.value)}>
							<option value="all">All</option>
							<option value="movie">Movies</option>
							<option value="series">Series</option>
							<option value="episode">Episodes</option>
						</select>
					</label>

					<label>
						<span>Year</span>
						<input
							type="number"
							inputMode="numeric"
							min="1878"
							max="2100"
							placeholder="Any"
							value={year}
							onChange={event => onYearChange(event.target.value)}
						/>
					</label>

					<label>
						<span>Sort</span>
						<select value={sort} onChange={event => onSortChange(event.target.value)}>
							<option value="relevance">Relevance</option>
							<option value="title-asc">Title A-Z</option>
							<option value="title-desc">Title Z-A</option>
							<option value="year-desc">Newest first</option>
							<option value="year-asc">Oldest first</option>
						</select>
					</label>
				</div>
			</form>

			{recentSearches.length > 0 ? (
				<div className="search__group">
					<h3>Recent searches</h3>
					<div className="chip-row">
						{recentSearches.map(item => (
							<button key={item} type="button" className="chip" onClick={() => onSuggestionSelect(item)}>
								{item}
							</button>
						))}
					</div>
				</div>
			) : null}

			{popularSearches.length > 0 ? (
				<div className="search__group">
					<h3>Popular searches</h3>
					<div className="chip-row">
						{popularSearches.map(item => (
							<button key={item} type="button" className="chip chip--subtle" onClick={() => onSuggestionSelect(item)}>
								{item}
							</button>
						))}
					</div>
				</div>
			) : null}
		</section>
	)
}

export default Search
