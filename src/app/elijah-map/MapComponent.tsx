'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Waypoint } from './ElijahMap'

const KIBBUTZ_CENTER: [number, number] = [31.6140, 34.7752]

// House marker icon
const houseIcon = L.divIcon({
  html: `<div style="font-size:1.4rem;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.4));">🏠</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

// Elijah icon — recreated whenever message changes
function makeElijahIcon(hasMessage: boolean) {
  return L.divIcon({
    html: `<div class="elijah-marker-wrap" style="position:relative;width:44px;">
      <div style="
        font-size:2.2rem;line-height:1;
        filter:drop-shadow(0 2px 10px rgba(139,38,53,0.6));
        animation:elijahBob 1.4s ease-in-out infinite;
        text-align:center;
      ">🧙‍♂️</div>
      ${hasMessage
        ? '<div class="elijah-arrow" style="text-align:center;font-size:0.7rem;line-height:1;margin-top:2px;">📍</div>'
        : ''}
    </div>`,
    className: 'elijah-map-marker',
    iconSize: [44, hasMessage ? 54 : 44],
    iconAnchor: [22, hasMessage ? 54 : 44],
  })
}

// Smooth-pan component: pans map whenever currentIdx changes
function MapPanner({ pos }: { pos: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.panTo(pos, { animate: true, duration: 1.5 })
  }, [map, pos])
  return null
}

interface Props {
  waypoints: Waypoint[]
  currentIdx: number
  message: string | null
}

export default function MapComponent({ waypoints, currentIdx, message }: Props) {
  const elijahPos = waypoints[currentIdx].pos

  return (
    <MapContainer
      center={KIBBUTZ_CENTER}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap"
      />
      <MapPanner pos={elijahPos} />

      {/* House markers */}
      {waypoints.map((wp, i) => (
        <Marker key={i} position={wp.pos} icon={houseIcon}>
          <Tooltip direction="top" offset={[0, -28]} permanent={false}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{wp.name}</span>
          </Tooltip>
        </Marker>
      ))}

      {/* Elijah marker */}
      <Marker position={elijahPos} icon={makeElijahIcon(!!message)} zIndexOffset={1000}>
        {message && (
          <Tooltip
            direction="top"
            offset={[0, -58]}
            permanent
            className="elijah-speech-tooltip"
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'normal', maxWidth: 200, display: 'block' }}>
              {message}
            </span>
          </Tooltip>
        )}
      </Marker>
    </MapContainer>
  )
}
