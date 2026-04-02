import { useState, useEffect, useRef } from 'react'
import { useWeather } from './useWeather'
import type { GeoResult } from './useWeather'
import './App.css'

function App() {
  const [city, setCity] = useState('')
  const [suggestions, setSuggestions] = useState<GeoResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { weather, loading, error, selectCity, savedCities, saveCity, removeCity, sidebarWeather, searchCities, loadSavedCity } = useWeather()

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (city.length >= 2) {
        const results = await searchCities(city)
        setSuggestions(results)
        setShowDropdown(true)
      } else {
        setSuggestions([])
        setShowDropdown(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [city])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(result: GeoResult) {
    setCity('')
    setSuggestions([])
    setShowDropdown(false)
    selectCity(result)
  }

  const isSaved = weather ? savedCities.some(c => c.city === weather.city && c.country === weather.country) : false

  return (
    <div className="layout">

      <div className="sidebar">
        <h2 className="sidebar-title">Saved Cities</h2>
        {savedCities.length === 0 && (
          <p className="sidebar-empty">No saved cities yet</p>
        )}
        {savedCities.map(c => (
          <div
            key={`${c.city}-${c.country}`}
            className={`sidebar-card ${weather?.city === c.city ? 'active' : ''}`}
            onClick={() => loadSavedCity(c)}
          >
            <div className="sidebar-card-left">
              <span className="sidebar-city">
                {sidebarWeather[c.city] ? `${sidebarWeather[c.city].city}, ${sidebarWeather[c.city].country}` : c.city}
              </span>
              <span className="sidebar-desc">
                {sidebarWeather[c.city]?.description || '...'}
              </span>
            </div>
            <div className="sidebar-card-right">
              <span className="sidebar-temp">
                {sidebarWeather[c.city] ? `${sidebarWeather[c.city].temp}°` : '...'}
              </span>
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  removeCity(c.city)
                }}
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="main">
        <h1 className="app-title">Weather App</h1>

        <div className="search-wrapper" ref={dropdownRef}>
          <div className="search">
            <input
              type="text"
              placeholder="Enter a city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div className="dropdown">
              {suggestions.map((result, i) => (
                <div
                  key={i}
                  className="dropdown-item"
                  onClick={() => handleSelect(result)}
                >
                  <span className="dropdown-city">{result.name}</span>
                  <span className="dropdown-meta">
                    {result.state ? `${result.state}, ` : ''}{result.country}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading && <p className="status">Loading...</p>}
        {error && <p className="error">{error}</p>}

        {!weather && !loading && !error && (
          <p className="status">Search a city to see the weather</p>
        )}

        {weather && (
          <div className="weather-card">
            <div className="card-header">
              <h2>{weather.city}, {weather.country}</h2>
              <button
                className="save-btn"
                onClick={() => saveCity(weather)}
                disabled={isSaved}
              >
                {isSaved ? 'Saved' : '+ Save'}
              </button>
            </div>
            <div className="temp">{weather.temp}°F</div>
            <p className="description">{weather.description}</p>
            <div className="details">
              <div className="detail">
                <p>Feels like</p>
                <p>{weather.feels_like}°F</p>
              </div>
              <div className="detail">
                <p>Humidity</p>
                <p>{weather.humidity}%</p>
              </div>
              <div className="detail">
                <p>Wind</p>
                <p>{weather.wind_speed} mph</p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default App