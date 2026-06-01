import { useEffect, useRef, useState } from 'react'
import type { Map, Marker, TileLayer } from 'leaflet'
import { LocateFixed, MapPin, Search, X } from 'lucide-react'

type LocationPickerProps = {
  lat: string
  lng: string
  onChange: (lat: string, lng: string) => void
}

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const NEPAL_CENTER: [number, number] = [28.3949, 84.124]
const NEPAL_ZOOM = 7

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const tileRef = useRef<TileLayer | null>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return

    import('leaflet').then((L) => {
      // @ts-expect-error leaflet internal
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapDivRef.current!, { zoomControl: true }).setView(NEPAL_CENTER, NEPAL_ZOOM)
      mapRef.current = map

      tileRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const initLat = Number(lat)
      const initLng = Number(lng)
      if (initLat && initLng) {
        placeMarker(L, map, initLat, initLng)
      }

      map.on('click', (event) => {
        placeMarker(L, map, event.latlng.lat, event.latlng.lng)
        onChange(String(event.latlng.lat.toFixed(6)), String(event.latlng.lng.toFixed(6)))
        setLabel('')
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function placeMarker(L: typeof import('leaflet'), map: Map, latVal: number, lngVal: number) {
    if (markerRef.current) {
      markerRef.current.setLatLng([latVal, lngVal])
    } else {
      markerRef.current = L.marker([latVal, lngVal], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const position = markerRef.current!.getLatLng()
        onChange(String(position.lat.toFixed(6)), String(position.lng.toFixed(6)))
      })
    }

    map.setView([latVal, lngVal], Math.max(map.getZoom(), 13))
  }

  const search = async () => {
    const nextQuery = query.trim()
    if (!nextQuery) return

    setSearching(true)
    setResults([])
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${nextQuery}, Nepal`)}&format=json&limit=5&accept-language=en`
      const response = await fetch(url, { headers: { 'Accept-Language': 'en' } })
      const data = (await response.json()) as NominatimResult[]
      setResults(data)
    } catch {
      setLabel('Search failed. You can still click the map to place a pin.')
    } finally {
      setSearching(false)
    }
  }

  const selectResult = (result: NominatimResult) => {
    const latVal = parseFloat(result.lat)
    const lngVal = parseFloat(result.lon)
    onChange(String(latVal.toFixed(6)), String(lngVal.toFixed(6)))
    setLabel(result.display_name)
    setResults([])
    setQuery(result.display_name.split(',')[0])
    import('leaflet').then((L) => {
      if (mapRef.current) placeMarker(L, mapRef.current, latVal, lngVal)
    })
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLabel('Your browser does not support live location.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latVal = position.coords.latitude
        const lngVal = position.coords.longitude
        onChange(String(latVal.toFixed(6)), String(lngVal.toFixed(6)))
        setLabel('Current location')
        import('leaflet').then((L) => {
          if (mapRef.current) placeMarker(L, mapRef.current, latVal, lngVal)
        })
        setLocating(false)
      },
      () => {
        setLabel('Could not access current location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const clear = () => {
    onChange('', '')
    setLabel('')
    setQuery('')
    markerRef.current?.remove()
    markerRef.current = null
    mapRef.current?.setView(NEPAL_CENTER, NEPAL_ZOOM)
  }

  const hasCoords = lat && lng

  return (
    <div className="location-picker">
      <div className="location-search-row">
        <div className="location-search-input-wrap">
          <Search size={14} className="location-search-icon" />
          <input
            className="location-search-input"
            type="text"
            placeholder="Search a place in Nepal..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), search())}
          />
          {query && (
            <button type="button" className="location-clear-btn" onClick={() => { setQuery(''); setResults([]) }}>
              <X size={13} />
            </button>
          )}
        </div>
        <button type="button" className="post-action-btn post-action-btn--primary" onClick={search} disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
        <button
          type="button"
          className="post-action-btn post-action-btn--ghost location-live-btn"
          onClick={useCurrentLocation}
          disabled={locating}
        >
          <LocateFixed size={13} />
          {locating ? 'Locating...' : 'Use my location'}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="location-results">
          {results.map((result) => (
            <li key={result.place_id}>
              <button type="button" onClick={() => selectResult(result)}>
                <MapPin size={13} />
                <span>{result.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div ref={mapDivRef} className="location-map" />

      {hasCoords ? (
        <div className="location-coords">
          <MapPin size={13} style={{ color: 'var(--green)' }} />
          <span>
            {label || 'Custom pin'} - {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </span>
          <button type="button" className="location-clear-btn" onClick={clear} title="Clear location">
            <X size={13} />
          </button>
        </div>
      ) : (
        <p className="location-hint">Click the map, search, or use live location to place a pin.</p>
      )}

      <input type="hidden" name="latitude" value={lat} required />
      <input type="hidden" name="longitude" value={lng} required />
    </div>
  )
}
