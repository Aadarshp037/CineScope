import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

import Loading from './Loading'

function renderDetailRow(label, value) {
	if (!value) {
		return null
	}

	return (
		<div className="details__row">
			<span>{label}</span>
			<p>{value}</p>
		</div>
	)
}

function ProviderCard({ provider }) {
	if (!provider) {
		return null
	}

	return (
		<a className="provider-card" href={provider.link} target="_blank" rel="noreferrer" aria-label={`${provider.name} availability details`}>
			{provider.logoPath ? <img className="provider-card__logo" src={provider.logoPath} alt="" /> : <span className="provider-card__logo provider-card__logo--fallback">{provider.name.slice(0, 2).toUpperCase()}</span>}
			<div className="provider-card__meta">
				<strong>{provider.name}</strong>
				<span>{provider.category}</span>
			</div>
		</a>
	)
}

function Popup({
	isOpen,
	loading,
	movie,
	error,
	isSaved,
	onClose,
	onToggleWatchlist,
	watchProviders = [],
	providerLoading = false,
	providerError = '',
	providerStatus = 'idle',
	providerRegion = 'IN',
	supportedRegions = [],
	onRegionChange = () => {},
	watchPageUrl = '',
}) {
	const closeButtonRef = useRef(null)

	useEffect(() => {
		if (!isOpen) {
			return undefined
		}

		const handleKeyDown = event => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		document.body.classList.add('modal-open')
		document.addEventListener('keydown', handleKeyDown)

		if (closeButtonRef.current) {
			closeButtonRef.current.focus()
		}

		return () => {
			document.body.classList.remove('modal-open')
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen, onClose])

	if (!isOpen) {
		return null
	}

	const handleBackdropClick = event => {
		if (event.target === event.currentTarget) {
			onClose()
		}
	}

	const posterSource = movie && movie.Poster ? movie.Poster : movie && movie.PosterFallback ? movie.PosterFallback : ''

	return ReactDOM.createPortal(
		<div className="modal" role="presentation" onMouseDown={handleBackdropClick}>
			<div className="modal__panel" role="dialog" aria-modal="true" aria-labelledby="movie-dialog-title">
				<button ref={closeButtonRef} type="button" className="modal__close" onClick={onClose} aria-label="Close details">
					×
				</button>

				{loading ? (
					<Loading label="Loading movie details" />
				) : error ? (
					<div className="modal__message">
						<h2>Movie details unavailable</h2>
						<p>{error}</p>
						<button type="button" className="button button--primary" onClick={onClose}>
							Close
						</button>
					</div>
				) : movie ? (
					<div className="modal__content">
						<div className="modal__poster-wrap">
							<img className="modal__poster" src={posterSource} alt={movie.Title} />
						</div>

						<div className="modal__copy">
							<div className="modal__headline">
								<div>
									<p className="modal__eyebrow">Movie details</p>
									<h2 id="movie-dialog-title">
										{movie.Title} <span>({movie.Year})</span>
									</h2>
								</div>

								<button type="button" className="button button--ghost" onClick={() => onToggleWatchlist(movie)}>
									{isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}
								</button>
							</div>

							{movie.Plot ? <p className="modal__plot">{movie.Plot}</p> : null}

							<div className="details-grid">
								{renderDetailRow('Genre', movie.Genre)}
								{renderDetailRow('Runtime', movie.Runtime)}
								{renderDetailRow('Director', movie.Director)}
								{renderDetailRow('Actors', movie.Actors)}
								{renderDetailRow('Language', movie.Language)}
								{renderDetailRow('Released', movie.Released)}
								{renderDetailRow('IMDb rating', movie.imdbRating)}
								{renderDetailRow('IMDb votes', movie.imdbVotes)}
								{renderDetailRow('Rated', movie.Rated)}
								{renderDetailRow('Awards', movie.Awards)}
							</div>

							<div className="watch-provider-panel" aria-live="polite">
								<div className="watch-provider-panel__header">
									<div>
										<p className="modal__eyebrow">Where to Watch</p>
										<h3>Provider availability</h3>
									</div>

									<label className="region-picker">
										<span>Region</span>
										<select value={providerRegion} onChange={event => onRegionChange(event.target.value)}>
											{supportedRegions.map(region => {
												const code = typeof region === 'string' ? region : region?.code || ''
												const label = typeof region === 'string' ? region : region?.name || region?.code || ''
												return (
													<option key={code} value={code}>
														{label}
													</option>
												)
											})}
										</select>
									</label>
								</div>

								{providerLoading ? (
									<Loading label="Loading provider availability" />
								) : providerStatus === 'empty' ? (
									<div className="watch-provider-panel__empty">
										<p>No watch options are available in this region yet.</p>
									</div>
								) : providerError ? (
									<div className="watch-provider-panel__empty">
										<p>{providerError}</p>
									</div>
								) : providerStatus === 'success' && watchProviders.length > 0 ? (
									<div>
										<div className="provider-list">
											{watchProviders.map(provider => (
												<ProviderCard key={`${provider.id}-${provider.category}`} provider={provider} />
											))}
										</div>
										<p className="watch-provider-attribution">Streaming, rental and purchase data are provided by JustWatch via TMDB.</p>
										<a className="provider-link" href={watchPageUrl} target="_blank" rel="noreferrer" aria-label="TMDB">
											TMDB
										</a>
									</div>
								) : (
									<div className="watch-provider-panel__empty">
										<p>No streaming, rental or purchase options are currently available in {providerRegion}.</p>
									</div>
								)}
							</div>
						</div>
					</div>
				) : null}
			</div>
		</div>,
		document.body
	)
}

export default Popup
