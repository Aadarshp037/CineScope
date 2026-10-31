import React from 'react'

function EmptyState({ title, description, actionLabel, onAction, secondaryLabel, onSecondaryAction }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="empty-state__actions">
        {actionLabel && onAction ? (
          <button type="button" className="button button--primary" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
        {secondaryLabel && onSecondaryAction ? (
          <button type="button" className="button button--secondary" onClick={onSecondaryAction}>
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default EmptyState
