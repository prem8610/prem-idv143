import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Navigation,
  Loader2,
  Car,
  CheckCircle2,
  XCircle,
  MapPin,
  Star,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";
import { cn } from "@/lib/utils";
import type { DemandArea, Ride } from "../backend.d";

function formatRupee(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [updatingLoc, setUpdatingLoc] = useState(false);

  const demandQuery = useQuery<DemandArea[]>({
    queryKey: ["demandAreas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDemandAreas();
    },
    enabled: !!actor && !isFetching,
  });

  const ridesQuery = useQuery<Ride[]>({
    queryKey: ["driverRides", user?.id?.toString()],
    queryFn: async () => {
      if (!actor || !user?.id) return [];
      return actor.getRidesByUser(user.id);
    },
    enabled: !!actor && !isFetching && !!user?.id,
    refetchInterval: 15000,
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
      toast.success("Location updated!");
      void queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update location");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ rideId, status }: { rideId: number; status: string }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateRideStatus(rideId, status);
    },
    onSuccess: () => {
      toast.success("Ride status updated!");
      void queryClient.invalidateQueries({ queryKey: ["driverRides"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  // Init map
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
      attribution: "© OpenStreetMap",
    }).addTo(map);
    leafletMapRef.current = map;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update demand markers on map
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !demandQuery.data || typeof L === "undefined") return;

    for (const m of markersRef.current) map.removeLayer(m);
    markersRef.current = [];

    for (const area of demandQuery.data) {
      const circle = L.circleMarker([area.lat, area.lng], {
        radius: 10,
        fillColor: "#1a73e8",
        color: "#0d47a1",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7,
      }).bindPopup(`<strong>${area.demandLabel}</strong>`).addTo(map);
      markersRef.current.push(circle);
    }
  }, [demandQuery.data]);

  const rides = ridesQuery.data ?? [];
  const pendingRides = rides.filter((r) => r.status === "pending");
  const completedRides = rides.filter((r) => r.status === "completed");
  const vehicleEmoji = user?.vehicleType === "bike" ? "🚴" : user?.vehicleType === "auto" ? "🛺" : "🚗";

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-foreground">Driver Dashboard</h1>
          <span className="text-2xl">{vehicleEmoji}</span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">Welcome, {user?.name}</p>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 capitalize">
            {user?.vehicleType ?? "driver"}
          </Badge>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid sm:grid-cols-3 gap-4 animate-slide-up stagger-1">
        <Card className="border-border card-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed Rides</p>
              <div className="text-3xl font-bold text-foreground">{completedRides.length}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border card-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <div className="text-3xl font-bold text-foreground">{pendingRides.length}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <Car size={22} className="text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border card-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reward Points</p>
              <div className="text-3xl font-bold text-amber-500">{String(user?.rewardPoints ?? 0)}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star size={22} className="text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="border-border card-shadow animate-slide-up stagger-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              Demand Map
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setUpdatingLoc(true);
                updateLocMutation.mutate(undefined, { onSettled: () => setUpdatingLoc(false) });
              }}
              disabled={updateLocMutation.isPending || updatingLoc}
              className="ride-gradient text-white gap-2"
            >
              {updateLocMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Navigation size={14} />
              )}
              Update My Location
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-80 relative rounded-b-2xl overflow-hidden">
            <div ref={mapRef} className="absolute inset-0" />
          </div>
        </CardContent>
      </Card>

      {/* Ride Requests */}
      <Card className="border-border card-shadow animate-slide-up stagger-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car size={18} className="text-primary" />
              Incoming Ride Requests
            </CardTitle>
            {pendingRides.length > 0 && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {pendingRides.length} pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {ridesQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : pendingRides.length === 0 ? (
            <div className="text-center py-8">
              <Car size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No pending ride requests</p>
              <p className="text-xs text-muted-foreground mt-1">Refreshes every 15 seconds</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRides.map((ride) => {
                const isChildRide = ride.rideType === "child";
                return (
                  <div
                    key={ride.id}
                    className={cn(
                      "border rounded-xl p-4 transition-colors",
                      isChildRide
                        ? "border-blue-200 bg-blue-50/40 hover:bg-blue-50/70"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    {isChildRide && (
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-blue-700 font-medium">
                        <Shield size={12} className="text-blue-500" />
                        Child Safety Ride — verified parent-safe driver required
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground capitalize">{ride.vehicleType}</span>
                          <Separator orientation="vertical" className="h-4" />
                          <span className="text-sm text-muted-foreground capitalize">{ride.rideType}</span>
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                          {isChildRide && (
                            <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 gap-1">
                              <Shield size={10} />
                              Child Ride
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin size={10} />
                          From: {ride.pickupLat.toFixed(3)}, {ride.pickupLng.toFixed(3)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Navigation size={10} />
                          To: {ride.dropLat.toFixed(3)}, {ride.dropLng.toFixed(3)}
                        </div>
                        <div className="font-bold text-primary">{formatRupee(ride.fare)}</div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ rideId: ride.id, status: "in_progress" })}
                          disabled={updateStatusMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 h-8"
                        >
                          <CheckCircle2 size={14} />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ rideId: ride.id, status: "cancelled" })}
                          disabled={updateStatusMutation.isPending}
                          className="text-red-600 border-red-200 hover:bg-red-50 gap-1 h-8"
                        >
                          <XCircle size={14} />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
