import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Navigation,
  Loader2,
  MapPin,
  AlertCircle,
  Car,
  Users,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";
import type { DemandArea, User } from "../backend.d";

export default function DriverMapPage() {
  const { user } = useAuth();
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [updatingLoc, setUpdatingLoc] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const demandQuery = useQuery<DemandArea[]>({
    queryKey: ["demandAreas"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllDemandAreas();
      } catch {
        setAdminNote("Demand area data requires admin access");
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const usersQuery = useQuery<User[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllUsers();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const updateLocMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await actor.updateDriverLocation(pos.coords.latitude, pos.coords.longitude);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          (err) => reject(new Error(err.message))
        );
      });
    },
    onSuccess: () => {
      toast.success("Location updated! You're now visible on the map.");
      void queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update location");
    },
  });

  // Initialize Leaflet map (using global L from CDN)
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current || typeof L === "undefined") return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    leafletMapRef.current = map;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || typeof L === "undefined") return;

    // Clear old markers
    for (const m of markersRef.current) {
      map.removeLayer(m);
    }
    markersRef.current = [];

    // Blue circle markers for demand areas
    const demandAreas = demandQuery.data ?? [];
    demandAreas.forEach((area) => {
      const circle = L.circleMarker([area.lat, area.lng], {
        radius: 12,
        fillColor: "#1a73e8",
        color: "#0d47a1",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.65,
      })
        .bindPopup(
          `<div style="font-family: 'Space Grotesk', sans-serif; padding: 4px;">
            <strong style="color:#1a73e8">${area.demandLabel}</strong>
            <div style="color:#666; font-size:12px; margin-top:4px">
              Demand Zone — ${area.lat.toFixed(4)}, ${area.lng.toFixed(4)}
            </div>
          </div>`
        )
        .addTo(map);
      markersRef.current.push(circle);
    });

    // Red pin markers for other drivers
    const allUsers = usersQuery.data ?? [];
    const otherDrivers = allUsers.filter(
      (u) =>
        u.role === "driver" &&
        u.id.toString() !== user?.id?.toString() &&
        (u.locationLat !== 0 || u.locationLng !== 0)
    );
    otherDrivers.forEach((driver) => {
      const driverIcon = L.divIcon({
        html: `<div style="width:26px;height:26px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.4)"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        className: "",
      });
      const marker = L.marker([driver.locationLat, driver.locationLng], { icon: driverIcon })
        .bindPopup(
          `<div style="font-family: 'Space Grotesk', sans-serif; padding: 4px;">
            <strong style="color:#dc2626">Driver: ${driver.name}</strong>
            <div style="color:#666; font-size:12px; margin-top:4px">
              ${driver.vehicleType} — ${driver.locationLat.toFixed(4)}, ${driver.locationLng.toFixed(4)}
            </div>
          </div>`
        )
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Green highlighted marker for current driver's own location
    const ownLat = user?.locationLat ?? 0;
    const ownLng = user?.locationLng ?? 0;
    if (ownLat !== 0 || ownLng !== 0) {
      const ownIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(16,185,129,0.3),0 4px 12px rgba(16,185,129,0.4);display:flex;align-items:center;justify-content:center;">
          <div style="width:10px;height:10px;background:white;border-radius:50%;"></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: "",
      });
      const ownMarker = L.marker([ownLat, ownLng], { icon: ownIcon })
        .bindPopup(
          `<div style="font-family: 'Space Grotesk', sans-serif; padding: 4px;">
            <strong style="color:#10b981">📍 You — ${user?.name ?? "Driver"}</strong>
            <div style="color:#666; font-size:12px; margin-top:4px">
              Your current broadcast location
            </div>
          </div>`
        )
        .addTo(map);
      markersRef.current.push(ownMarker);
      // Pan to own location
      map.setView([ownLat, ownLng], 12);
    }
  }, [demandQuery.data, usersQuery.data, user]);

  const demandAreas = demandQuery.data ?? [];
  const allUsers = usersQuery.data ?? [];
  const otherDriversCount = allUsers.filter(
    (u) => u.role === "driver" && u.id.toString() !== user?.id?.toString() && (u.locationLat !== 0 || u.locationLng !== 0)
  ).length;
  const hasOwnLocation = (user?.locationLat ?? 0) !== 0 || (user?.locationLng ?? 0) !== 0;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-3xl font-bold text-foreground">Driver Map</h1>
        <p className="text-muted-foreground mt-1">Your live view — demand zones, nearby drivers, and your location</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 min-h-0">
        {/* Left panel */}
        <div className="lg:w-80 shrink-0 flex flex-col border-r border-border bg-card overflow-auto">
          <div className="p-4 space-y-4">
            {/* Update Location */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Navigation size={16} className="text-primary" />
                  My Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Broadcasting your location makes you visible to riders on the map.
                </p>
                {hasOwnLocation && (
                  <div className="text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-emerald-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Location active: {(user?.locationLat ?? 0).toFixed(3)}, {(user?.locationLng ?? 0).toFixed(3)}
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    setUpdatingLoc(true);
                    updateLocMutation.mutate(undefined, { onSettled: () => setUpdatingLoc(false) });
                  }}
                  disabled={updateLocMutation.isPending || updatingLoc}
                  className="w-full ride-gradient text-white gap-2"
                >
                  {updateLocMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Navigation size={14} />
                  )}
                  {updateLocMutation.isPending ? "Updating..." : "Update My Location"}
                </Button>
              </CardContent>
            </Card>

            <Separator />

            {/* Map Legend */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                  <Info size={14} className="text-primary" />
                  Map Legend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm shrink-0" />
                  <span>You (your location)</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-4 h-4 bg-red-500 shrink-0" style={{ borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)" }} />
                  <span>Other drivers online</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-4 h-4 rounded-full bg-blue-500 opacity-70 shrink-0" />
                  <span>Demand zones</span>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-3 border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={12} className="text-primary" />
                  <span className="text-xs text-muted-foreground">Demand Zones</span>
                </div>
                <div className="text-xl font-bold text-foreground">{demandAreas.length}</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <Car size={12} className="text-amber-500" />
                  <span className="text-xs text-muted-foreground">Drivers Online</span>
                </div>
                <div className="text-xl font-bold text-foreground">{otherDriversCount}</div>
              </div>
            </div>

            {/* Admin note */}
            {adminNote && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>{adminNote}</span>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Users size={12} className="text-primary" />
                <span className="text-xs font-semibold text-primary">How it works</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  Click "Update My Location" to broadcast your position
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  Blue circles show where riders are requesting rides
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  Move to demand zones to increase ride chances
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  Click any marker for more info
                </li>
              </ul>
            </div>

            {/* Driver badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded-lg border border-border">
              <div className="w-7 h-7 ride-gradient rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.name?.charAt(0).toUpperCase() ?? "D"}
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">{user?.name}</div>
                <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 capitalize mt-0.5">
                  {user?.vehicleType ?? "driver"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 relative">
          <div ref={mapRef} className="absolute inset-0" />
          {!leafletMapRef.current && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
