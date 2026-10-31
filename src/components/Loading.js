import React from 'react'

function Loading({ label = 'Loading movies' }) {
  return (
    <div className="loading" role="status" aria-live="polite" aria-busy="true">
      <span className="loading__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export default Loading
