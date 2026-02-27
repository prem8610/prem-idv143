import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Navigation,
  Loader2,
  Plus,
  Cpu,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";
import type { DemandArea, User } from "../backend.d";

export default function MapPage() {
  const { user } = useAuth();
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [label, setLabel] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [formError, setFormError] = useState("");

  const demandQuery = useQuery<DemandArea[]>({
    queryKey: ["demandAreas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDemandAreas();
    },
    enabled: !!actor && !isFetching,
  });

  const usersQuery = useQuery<User[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });

  const addDemandMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.addDemandArea({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        demandLabel: label,
      });
    },
    onSuccess: () => {
      toast.success("Demand area added! +10 reward points 🎉");
      setLabel("");
      setLat("");
      setLng("");
      setFormError("");
      void queryClient.invalidateQueries({ queryKey: ["demandAreas"] });
      void queryClient.invalidateQueries({ queryKey: ["rewardInfo"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to add demand area";
      setFormError(msg);
    },
  });

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setFormError("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("Location captured!");
      },
      () => {
        setFormError("Could not get location");
        setLocating(false);
      }
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!label.trim()) { setFormError("Please enter a label"); return; }
    if (!lat || !lng) { setFormError("Please enter or capture location"); return; }
    addDemandMutation.mutate();
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current || typeof L === "undefined") return;

    // Fix default marker icons
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
        radius: 10,
        fillColor: "#1a73e8",
        color: "#0d47a1",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7,
      })
        .bindPopup(
          `<div style="font-family: 'Space Grotesk', sans-serif; padding: 4px;">
            <strong style="color:#1a73e8">${area.demandLabel}</strong>
            <div style="color:#666; font-size:12px; margin-top:4px">
              ${area.lat.toFixed(4)}, ${area.lng.toFixed(4)}
            </div>
          </div>`
        )
        .addTo(map);
      markersRef.current.push(circle);
    });

    // Red markers for driver locations
    const allUsers = usersQuery.data ?? [];
    const drivers = allUsers.filter(
      (u) => u.role === "driver" && (u.locationLat !== 0 || u.locationLng !== 0)
    );
    drivers.forEach((driver) => {
      const driverIcon = L.divIcon({
        html: `<div style="width:28px;height:28px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.4)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        className: "",
      });
      const marker = L.marker([driver.locationLat, driver.locationLng], {
        icon: driverIcon,
      })
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
  }, [demandQuery.data, usersQuery.data]);

  const demandAreas = demandQuery.data ?? [];
  const drivers = (usersQuery.data ?? []).filter((u) => u.role === "driver");

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-3xl font-bold text-foreground">Map & Demand Areas</h1>
        <p className="text-muted-foreground mt-1">Track demand zones and driver locations</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 min-h-0">
        {/* Left panel */}
        <div className="lg:w-96 shrink-0 flex flex-col border-r border-border bg-card">
          <div className="p-4 space-y-4 overflow-auto">
            {/* Add Demand Area Form */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus size={16} className="text-primary" />
                  Add Demand Area
                  <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200 text-xs">+10 pts</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Label</Label>
                    <Input
                      placeholder="e.g., Airport Terminal 1"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Coordinates</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Latitude"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        step="any"
                        className="h-9 text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Longitude"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        step="any"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLocate}
                    disabled={locating}
                    className="w-full gap-1 text-primary border-primary/30 h-8 text-xs"
                  >
                    {locating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                    Use Current Location
                  </Button>

                  {formError && (
                    <div className="flex items-center gap-1.5 text-destructive text-xs">
                      <AlertCircle size={12} />
                      {formError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="sm"
                    disabled={addDemandMutation.isPending || !user}
                    className="w-full ride-gradient text-white h-9"
                  >
                    {addDemandMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Plus size={14} className="mr-1" />
                        Add Demand Area
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Separator />

            {/* ML Model Info */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-primary">
                  <Cpu size={16} />
                  ML Demand Prediction
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Connect your trained model via Flask API:</p>
                <code className="block bg-card border border-border rounded px-2 py-1 text-xs font-mono text-foreground">
                  POST /api/predict-demand
                </code>
                <p>Pass <strong>lat</strong>, <strong>lng</strong>, <strong>time</strong> as inputs. Returns predicted demand level.</p>
              </CardContent>
            </Card>

            <Separator />

            {/* Demand Area List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary" />
                  Demand Areas ({demandAreas.length})
                </h3>
                <span className="text-xs text-muted-foreground">{drivers.length} drivers online</span>
              </div>

              <ScrollArea className="h-48">
                {demandQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : demandAreas.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No demand areas yet. Be the first to add one!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {demandAreas.map((area) => (
                      <div
                        key={area.id}
                        className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/60 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={12} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-foreground truncate">{area.demandLabel}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {area.lat.toFixed(3)}, {area.lng.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 relative">
          <div ref={mapRef} className="absolute inset-0" />
          {(!leafletMapRef.current) && (
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
