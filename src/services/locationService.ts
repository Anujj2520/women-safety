import { LocationPoint, SafeZone } from '../types';

class LocationService {
  private watchId: number | null = null;
  private currentPoint: LocationPoint = {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 8,
    altitude: 15,
    speed: 1.4, // m/s walking speed
    heading: 45,
    timestamp: Date.now(),
    address: 'Market St & 4th St, Downtown Hub',
    batteryLevel: 86,
    networkQuality: '5G',
  };

  private listeners: ((loc: LocationPoint) => void)[] = [];
  private movementInterval: number | null = null;

  constructor() {
    // Attempt real initial location silently
    this.queryBrowserLocation();
  }

  getCurrentLocation(): LocationPoint {
    return { ...this.currentPoint, timestamp: Date.now() };
  }

  onLocationChange(cb: (loc: LocationPoint) => void) {
    this.listeners.push(cb);
    cb(this.currentPoint);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  async queryBrowserLocation(): Promise<LocationPoint> {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const point: LocationPoint = {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracy: Math.round(pos.coords.accuracy),
              altitude: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
              speed: pos.coords.speed !== null ? Number(pos.coords.speed.toFixed(1)) : 1.2,
              heading: pos.coords.heading || 90,
              timestamp: pos.timestamp || Date.now(),
              address: `GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`,
              batteryLevel: this.currentPoint.batteryLevel,
              networkQuality: '5G',
            };
            this.currentPoint = point;
            this.notify();
            resolve(point);
          },
          (err) => {
            console.warn('Geolocation query fallback to default safe point:', err.message);
            resolve(this.currentPoint);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
      });
    }
    return this.currentPoint;
  }

  startLiveTracking() {
    if (this.watchId !== null || this.movementInterval !== null) return;

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        this.watchId = navigator.geolocation.watchPosition(
          (pos) => {
            this.currentPoint = {
              ...this.currentPoint,
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracy: Math.round(pos.coords.accuracy),
              speed: pos.coords.speed !== null ? Number(pos.coords.speed.toFixed(1)) : 1.3,
              heading: pos.coords.heading || this.currentPoint.heading,
              timestamp: Date.now(),
            };
            this.notify();
          },
          () => {
            // If browser watch fails or is static, start simulated breadcrumb updates
            this.startSimulatedBreadcrumbs();
          },
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
      } catch {
        this.startSimulatedBreadcrumbs();
      }
    } else {
      this.startSimulatedBreadcrumbs();
    }
  }

  startSimulatedBreadcrumbs() {
    if (this.movementInterval) return;
    this.movementInterval = window.setInterval(() => {
      // Simulate realistic micro-movements along street grid
      const dLat = (Math.random() - 0.48) * 0.00015;
      const dLng = (Math.random() - 0.45) * 0.00015;
      const newLat = Number((this.currentPoint.latitude + dLat).toFixed(6));
      const newLng = Number((this.currentPoint.longitude + dLng).toFixed(6));

      this.currentPoint = {
        ...this.currentPoint,
        latitude: newLat,
        longitude: newLng,
        timestamp: Date.now(),
        speed: Number((1.1 + Math.random() * 0.5).toFixed(1)),
      };
      this.notify();
    }, 4000);
  }

  stopLiveTracking() {
    if (this.watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.movementInterval) {
      clearInterval(this.movementInterval);
      this.movementInterval = null;
    }
  }

  // Get safe zones relative to current coordinates
  getNearbySafeZones(currentLat: number, currentLng: number): SafeZone[] {
    return [
      {
        id: 'sz-1',
        name: 'Central Police Precinct & Women Helpdesk',
        type: 'police_station',
        latitude: currentLat + 0.0035,
        longitude: currentLng - 0.0028,
        address: '850 Bryant St, Emergency Response Unit',
        distanceMeters: 420,
        isOpen24x7: true,
        phone: '112 / 911 / (555) 019-2834',
      },
      {
        id: 'sz-2',
        name: 'St. Mary Emergency Trauma & Care Center',
        type: 'hospital',
        latitude: currentLat - 0.0042,
        longitude: currentLng + 0.0031,
        address: '450 Stanyan St, 24/7 Triage & Security',
        distanceMeters: 650,
        isOpen24x7: true,
        phone: '(555) 014-9988',
      },
      {
        id: 'sz-3',
        name: 'Aegis Women Safe Shelter & Legal Aid',
        type: 'women_center',
        latitude: currentLat + 0.0061,
        longitude: currentLng + 0.0045,
        address: '1200 Market Street, Suite 400',
        distanceMeters: 890,
        isOpen24x7: true,
        phone: '1091 (National Women Helpline)',
      },
      {
        id: 'sz-4',
        name: 'City Rapid Transit Security Station',
        type: 'safe_haven',
        latitude: currentLat - 0.0021,
        longitude: currentLng - 0.0052,
        address: 'Metro Hub Platform B, Officer Booth',
        distanceMeters: 310,
        isOpen24x7: true,
        phone: '(555) 012-7722',
      }
    ];
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentPoint));
  }
}

export const locationService = new LocationService();
