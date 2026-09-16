import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Crosshair, 
  Shield, 
  Building2, 
  Phone, 
  Navigation, 
  Layers, 
  Battery, 
  Wifi, 
  AlertTriangle 
} from 'lucide-react';
import { LocationPoint, SafeZone } from '../types';
import { locationService } from '../services/locationService';

interface LiveMapProps {
  currentLocation: LocationPoint;
  isEmergencyActive: boolean;
  locationTrail?: LocationPoint[];
  onSelectSafeZone?: (zone: SafeZone) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  currentLocation,
  isEmergencyActive,
  locationTrail = [],
  onSelectSafeZone,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const circleRadiusRef = useRef<L.Circle | null>(null);
  const trailPolylineRef = useRef<L.Polyline | null>(null);
  const safeZoneMarkersRef = useRef<L.Marker[]>([]);

  const [nearbyZones, setNearbyZones] = useState<SafeZone[]>([]);
  const [mapTheme, setMapTheme] = useState<'dark' | 'standard'>('dark');
  const [selectedZone, setSelectedZone] = useState<SafeZone | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: [currentLocation.latitude, currentLocation.longitude],
      zoom: 16,
      zoomControl: false,
    });

    // Add high-contrast tile layer
    const tileUrl = mapTheme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    });
    tiles.addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Load nearby safe zones
    const zones = locationService.getNearbySafeZones(currentLocation.latitude, currentLocation.longitude);
    setNearbyZones(zones);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer if theme switches
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    const tileUrl = mapTheme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, [mapTheme]);

  // Update User Marker & Pulsing Circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const { latitude, longitude, accuracy } = currentLocation;

    const userBeaconIcon = L.divIcon({
      className: 'user-beacon-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 rounded-full ${isEmergencyActive ? 'bg-rose-500/50 animate-ping' : 'bg-emerald-500/40 animate-pulse'}"></div>
          <div class="h-6 w-6 rounded-full ${isEmergencyActive ? 'bg-rose-600 border-2 border-white' : 'bg-emerald-500 border-2 border-slate-900'} shadow-xl flex items-center justify-center text-white text-[10px] font-bold">
            YOU
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([latitude, longitude]);
      userMarkerRef.current.setIcon(userBeaconIcon);
    } else {
      userMarkerRef.current = L.marker([latitude, longitude], { icon: userBeaconIcon })
        .addTo(map)
        .bindPopup(`<b>Your Live Beacon</b><br/>Accuracy: ±${accuracy}m`);
    }

    // Accuracy circle
    if (circleRadiusRef.current) {
      circleRadiusRef.current.setLatLng([latitude, longitude]);
      circleRadiusRef.current.setRadius(accuracy || 15);
      circleRadiusRef.current.setStyle({
        color: isEmergencyActive ? '#ef4444' : '#10b981',
        fillColor: isEmergencyActive ? '#ef4444' : '#10b981',
        fillOpacity: 0.12,
      });
    } else {
      circleRadiusRef.current = L.circle([latitude, longitude], {
        radius: accuracy || 15,
        color: isEmergencyActive ? '#ef4444' : '#10b981',
        fillColor: isEmergencyActive ? '#ef4444' : '#10b981',
        fillOpacity: 0.12,
      }).addTo(map);
    }
  }, [currentLocation, isEmergencyActive]);

  // Update Breadcrumb Polyline during active emergency
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (isEmergencyActive && locationTrail.length > 1) {
      const latlngs: [number, number][] = locationTrail.map(pt => [pt.latitude, pt.longitude]);
      if (trailPolylineRef.current) {
        trailPolylineRef.current.setLatLngs(latlngs);
      } else {
        trailPolylineRef.current = L.polyline(latlngs, {
          color: '#f43f5e',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 6',
        }).addTo(map);
      }
    } else if (!isEmergencyActive && trailPolylineRef.current) {
      map.removeLayer(trailPolylineRef.current);
      trailPolylineRef.current = null;
    }
  }, [locationTrail, isEmergencyActive]);

  // Render Safe Zones markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old safe markers
    safeZoneMarkersRef.current.forEach(m => map.removeLayer(m));
    safeZoneMarkersRef.current = [];

    nearbyZones.forEach(zone => {
      const zoneColor = zone.type === 'police_station' ? '#3b82f6' : zone.type === 'hospital' ? '#ef4444' : '#10b981';
      const zoneIcon = L.divIcon({
        className: 'zone-pin',
        html: `
          <div style="background-color: ${zoneColor}" class="h-6 w-6 rounded-lg text-white border-2 border-slate-900 shadow-md flex items-center justify-center text-[9px] font-bold">
            ${zone.type === 'police_station' ? 'POL' : zone.type === 'hospital' ? 'MED' : 'SAFE'}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([zone.latitude, zone.longitude], { icon: zoneIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-size: 12px; color: #1e293b;">
            <b style="font-size: 13px;">${zone.name}</b><br/>
            <span>${zone.address}</span><br/>
            <b>Phone:</b> <a href="tel:${zone.phone}">${zone.phone}</a><br/>
            <b>Distance:</b> ${zone.distanceMeters}m
          </div>
        `);

      marker.on('click', () => {
        setSelectedZone(zone);
        onSelectSafeZone?.(zone);
      });

      safeZoneMarkersRef.current.push(marker);
    });
  }, [nearbyZones]);

  const recenterMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentLocation.latitude, currentLocation.longitude], 17, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Map Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {/* Map Top Status Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 py-2.5 backdrop-blur-sm z-10 relative">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isEmergencyActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {isEmergencyActive ? 'LIVE SOS TRACKING STREAM' : 'SECURE GPS BEACON'}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>Lat: {currentLocation.latitude.toFixed(5)}</span>
              <span>•</span>
              <span>Lng: {currentLocation.longitude.toFixed(5)}</span>
              <span>•</span>
              <span className="text-emerald-400">±{currentLocation.accuracy}m</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMapTheme(mapTheme === 'dark' ? 'standard' : 'dark')}
              className="rounded-lg bg-slate-800 p-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
              title="Toggle Map Style"
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              id="btn-recenter-map"
              onClick={recenterMap}
              className="rounded-lg bg-rose-600/90 hover:bg-rose-500 p-1.5 text-xs font-bold text-white transition-colors flex items-center gap-1 shadow-sm"
              title="Recenter to current location"
            >
              <Crosshair className="h-4 w-4" />
              <span className="hidden md:inline pr-1 text-[11px]">Recenter</span>
            </button>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div 
          ref={mapContainerRef} 
          className="h-[360px] sm:h-[440px] w-full z-0" 
          style={{ background: '#090d16' }}
        />

        {/* Live Telemetry Floating Pill */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Wifi className="h-3.5 w-3.5" />
            <span>5G Cloud Connected</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Battery className="h-3.5 w-3.5 text-emerald-400" />
            <span>86% Batt</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1 text-slate-300">
            <span>Speed: {currentLocation.speed || 1.3} m/s</span>
          </div>
        </div>
      </div>

      {/* Nearby Safe Zones & Authorities Hub */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-rose-400" />
            <h4 className="text-sm font-bold text-white">
              Nearby Safe Havens & Emergency Response Stations
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Within 1 km radius
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {nearbyZones.map((zone) => {
            const isSelected = selectedZone?.id === zone.id;
            return (
              <div
                key={zone.id}
                onClick={() => {
                  setSelectedZone(zone);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([zone.latitude, zone.longitude], 17);
                  }
                }}
                className={`cursor-pointer rounded-xl border p-3 transition-all ${
                  isSelected 
                    ? 'bg-slate-800/90 border-rose-500 shadow-md shadow-rose-500/10' 
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    zone.type === 'police_station'
                      ? 'bg-blue-500/20 text-blue-400'
                      : zone.type === 'hospital'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {zone.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {zone.distanceMeters}m away
                  </span>
                </div>

                <div className="mt-2 text-xs font-semibold text-white line-clamp-1">
                  {zone.name}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {zone.address}
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <a
                    href={`tel:${zone.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-slate-300 hover:text-white font-medium"
                  >
                    <Phone className="h-3 w-3 text-rose-400" />
                    <span>Call Safezone</span>
                  </a>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    24/7 OPEN
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
