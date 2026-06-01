import { useEffect, useRef, useState } from 'react'
import type { Map, Marker, TileLayer } from 'leaflet'
import { Search, MapPin, X } from 'lucide-react'

type Coords = { lat: number; lng: number; label?: string }

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

// Nepal center
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
  const [label, setLabel] = useState('')

  // Initialise Leaflet once
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return

    // Dynamic import so SSR/Vite doesn't choke on window refs
    import('leaflet').then((L) => {
      // Fix default icon paths broken by Vite bundling
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
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // If coords already set (e.g. edit mode), place marker
      const initLat = Number(lat)
      const initLng = Number(lng)
      if (initLat && initLng) {
        placeMarker(L, map, initLat, initLng)
      }

      map.on('click', (e) => {
        import('leaflet').then((L2) => {
          placeMarker(L2, map, e.latlng.lat, e.latlng.lng)
          onChange(String(e.latlng.lat.toFixed(6)), String(e.latlng.lng.toFixed(6)))
          setLabel('')
        })
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
        const pos = markerRef.current!.getLatLng()
        onChange(String(pos.lat.toFixed(6)), String(pos.lng.toFixed(6)))
      })
    }
    map.setView([latVal, lngVal], Math.max(map.getZoom(), 13))
  }

  const search = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setResults([])
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Nepal')}&format=json&limit=5&accept-language=en`
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
      const data = (await res.json()) as NominatimResult[]
      setResults(data)
    } catch {
      // silently fail — user can still click the map
    } finally {
      setSearching(false)
    }
  }

  const selectResult = (r: NominatimResult) => {
    const latVal = parseFloat(r.lat)
    const lngVal = parseFloat(r.lon)
    onChange(String(latVal.toFixed(6)), String(lngVal.toFixed(6)))
    setLabel(r.display_name)
    setResults([])
    setQuery(r.display_name.split(',')[0])
    import('leaflet').then((L) => {
      if (mapRef.current) placeMarker(L, mapRef.current, latVal, lngVal)
    })
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
      {/* Search bar */}
      <div className="location-search-row">
        <div className="location-search-input-wrap">
          <Search size={14} className="location-search-icon" />
          <input
            className="location-search-input"
            type="text"
            placeholder="Search a place in Nepal…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
          />
          {query && (
            <button type="button" className="location-clear-btn" onClick={() => { setQuery(''); setResults([]) }}>
              <X size={13} />
            </button>
          )}
        </div>
        <button type="button" className="post-action-btn post-action-btn--primary" onClick={search} disabled={searching}>
          {searching ? '…' : 'Search'}
        </button>
      </div>

      {/* Search results dropdown */}
      {results.length > 0 && (
        <ul className="location-results">
          {results.map((r) => (
            <li key={r.place_id}>
              <button type="button" onClick={() => selectResult(r)}>
                <MapPin size={13} />
                <span>{r.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Map container */}
      <div ref={mapDivRef} className="location-map" />

      {/* Selected coords display */}
      {hasCoords ? (
        <div className="location-coords">
          <MapPin size={13} style={{ color: 'var(--green)' }} />
          <span>
            {label || 'Custom pin'} — {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </span>
          <button type="button" className="location-clear-btn" onClick={clear} title="Clear location">
            <X size={13} />
          </button>
        </div>
      ) : (
        <p className="location-hint">Click the map or search above to pin a location.</p>
      )}

      {/* Hidden inputs so form validation still works */}
      <input type="hidden" name="latitude" value={lat} required />
      <input type="hidden" name="longitude" value={lng} required />
    </div>
  )
}
