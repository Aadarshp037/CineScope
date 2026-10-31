import { useEffect, useState } from 'react'

function readStoredValue(key, initialValue) {
  if (typeof window === 'undefined') {
    return initialValue
  }

  try {
    const rawValue = window.localStorage.getItem(key)

    if (rawValue === null) {
      return initialValue
    }

    return JSON.parse(rawValue)
  } catch (error) {
    return initialValue
  }
}

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readStoredValue(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      // Ignore storage write failures in constrained environments.
    }
  }, [key, value])

  return [value, setValue]
}
