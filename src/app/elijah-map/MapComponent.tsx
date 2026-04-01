'use client'

import { useEffect, useRef } from 'react'
import type { Waypoint } from './ElijahMap'

// קיבוץ גת — מרכז הקיבוץ
const KIBBUTZ_CENTER: [number, number] = [31.6285, 34.7936]

export default function MapComponent({ waypoints, currentIdx, message }: {
  waypoints: Waypoint[]
  currentIdx: number
  message: string | null
}) {
  const containerRef    = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const elijahMarkerRef = useRef<any>(null)
  const initializedRef  = useRef(false)

  // Load Leaflet from CDN + initialize map once
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // Inject CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id   = 'leaflet-css'
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const init = () => {
      const L = (window as any).L
      if (!L || !containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      })
      map.setView(KIBBUTZ_CENTER, 16)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)

      // House markers
      const houseIcon = L.divIcon({
        html: '<div style="font-size:1.4rem;line-height:1;">🏠</div>',
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })
      waypoints.forEach(wp => {
        L.marker(wp.pos, { icon: houseIcon })
          .addTo(map)
          .bindTooltip(wp.name, { direction: 'top', offset: [0, -28] })
      })

      // Elijah marker
      const elijahIcon = L.divIcon({
        html: '<div style="font-size:2.2rem;text-align:center;line-height:1;filter:drop-shadow(0 2px 8px rgba(139,38,53,0.6));animation:elijahBob 1.4s ease-in-out infinite;">🧙‍♂️</div>',
        className: 'elijah-map-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      })
      const elijahMarker = L.marker(waypoints[0].pos, {
        icon: elijahIcon,
        zIndexOffset: 1000,
      }).addTo(map)

      mapRef.current          = map
      elijahMarkerRef.current = elijahMarker
    }

    if ((window as any).L) {
      init()
    } else {
      const script    = document.createElement('script')
      script.src      = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload   = init
      document.head.appendChild(script)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current          = null
        elijahMarkerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Move Elijah when waypoint changes
  useEffect(() => {
    const marker = elijahMarkerRef.current
    const map    = mapRef.current
    if (!marker || !map) return
    const pos = waypoints[currentIdx].pos
    marker.setLatLng(pos)
    map.panTo(pos, { animate: true, duration: 1.5 })
  }, [currentIdx, waypoints])

  // Speech bubble
  useEffect(() => {
    const marker = elijahMarkerRef.current
    if (!marker) return
    marker.unbindTooltip()
    if (message) {
      marker.bindTooltip(message, {
        permanent: true,
        direction: 'top',
        offset: [0, -52],
        className: 'elijah-speech-tooltip',
      }).openTooltip()
    }
  }, [message])

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}
