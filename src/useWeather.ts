import { useState, useEffect } from 'react'

export interface WeatherData {
  city: string
  country: string
  temp: number
  feels_like: number
  description: string
  humidity: number
  wind_speed: number
  lat: number
  lon: number
}

export interface GeoResult {
  name: string
  state: string
  country: string
  lat: number
  lon: number
}

const STATE_ABBREVS: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH',
  'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
  'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA',
  'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN',
  Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA',
  'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY'
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedCities, setSavedCities] = useState<WeatherData[]>(() => {
    const stored = localStorage.getItem('savedCities')
    return stored ? JSON.parse(stored) : []
  })
  const [sidebarWeather, setSidebarWeather] = useState<Record<string, WeatherData>>({})

  useEffect(() => {
    localStorage.setItem('savedCities', JSON.stringify(savedCities))
    savedCities.forEach(city => {
      if (!sidebarWeather[city.city]) {
        fetchWeatherByCoords({ name: city.city, state: city.country, country: city.country, lat: city.lat, lon: city.lon })
          .then(data => {
            if (data) setSidebarWeather(prev => ({ ...prev, [city.city]: data }))
          })
      }
    })
  }, [savedCities])

  async function fetchWeatherByCoords(result: GeoResult): Promise<WeatherData | null> {
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${result.lat}&lon=${result.lon}&appid=${apiKey}&units=imperial`
      )
      if (!res.ok) throw new Error('City not found')
      const data = await res.json()
      return {
        city: data.name,
        country: result.state || result.country,
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        lat: result.lat,
        lon: result.lon,
      }
    } catch {
      return null
    }
  }

  async function selectCity(result: GeoResult) {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWeatherByCoords(result)
      if (data) setWeather(data)
      else throw new Error('City not found')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function searchCities(query: string): Promise<GeoResult[]> {
    if (query.length < 2) return []
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`
    )
    const data = await res.json()
    const seen = new Set<string>()
    return data
      .map((item: any) => ({
        name: item.name,
        state: item.state ? (STATE_ABBREVS[item.state] || item.state) : '',
        country: item.country,
        lat: item.lat,
        lon: item.lon,
      }))
      .filter((item: GeoResult) => {
        const key = `${item.name}-${item.state}-${item.country}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }

  function saveCity(cityData: WeatherData) {
    if (!savedCities.find(c => c.city === cityData.city && c.country === cityData.country)) {
      setSavedCities([...savedCities, cityData])
      setSidebarWeather(prev => ({ ...prev, [cityData.city]: cityData }))
    }
  }

  function removeCity(cityName: string) {
    setSavedCities(savedCities.filter(c => c.city !== cityName))
    setSidebarWeather(prev => {
      const updated = { ...prev }
      delete updated[cityName]
      return updated
    })
  }

  function loadSavedCity(cityData: WeatherData) {
    selectCity({ name: cityData.city, state: cityData.country, country: cityData.country, lat: cityData.lat, lon: cityData.lon })
  }

  return { weather, loading, error, selectCity, savedCities, saveCity, removeCity, sidebarWeather, searchCities, loadSavedCity }
}