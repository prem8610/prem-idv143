import { useQuery } from "@tanstack/react-query";
import { Car, MapPin, Navigation, Clock, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";
import type { Ride } from "../backend.d";

function formatRupee(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    completed: { className: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Completed" },
    in_progress: { className: "bg-primary/10 text-primary border-primary/20", label: "In Progress" },
    pending: { className: "bg-gray-100 text-gray-600 border-gray-200", label: "Pending" },
    cancelled: { className: "bg-red-100 text-red-600 border-red-200", label: "Cancelled" },
  };
  const v = variants[status] ?? variants["pending"];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${v.className}`}>
      {v.label}
    </span>
  );
}

const vehicleEmojis: Record<string, string> = {
  bike: "🚴",
  auto: "🛺",
  car: "🚗",
};

export default function MyRidesPage() {
  const { user } = useAuth();
  const { actor, isFetching } = useActor();

  const ridesQuery = useQuery<Ride[]>({
    queryKey: ["rides", user?.id?.toString()],
    queryFn: async () => {
      if (!actor || !user?.id) return [];
      return actor.getRidesByUser(user.id);
    },
    enabled: !!actor && !isFetching && !!user?.id,
  });

  const rides = (ridesQuery.data ?? []).slice().reverse();

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-foreground">My Rides</h1>
        <p className="text-muted-foreground mt-1">Your complete ride history</p>
      </div>

      {ridesQuery.isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : rides.length === 0 ? (
        <Card className="border-border card-shadow">
          <CardContent className="py-16 text-center">
            <Car size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No rides yet</h3>
            <p className="text-muted-foreground mb-6">Book your first ride and start earning reward points!</p>
            <Link to="/book">
              <Button className="ride-gradient text-white">Book a Ride</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <Card key={ride.id} className="border-border card-shadow hover:card-shadow-lg transition-shadow animate-slide-up">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                      {vehicleEmojis[ride.vehicleType] ?? "🚗"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground capitalize">{ride.vehicleType}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground capitalize">{ride.rideType} ride</span>
                        <StatusBadge status={ride.status} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin size={11} className="text-emerald-500" />
                          <span>From: {ride.pickupLat.toFixed(4)}, {ride.pickupLng.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Navigation size={11} className="text-red-500" />
                          <span>To: {ride.dropLat.toFixed(4)}, {ride.dropLng.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-foreground">{formatRupee(ride.fare)}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                      <Clock size={10} />
                      Ride #{ride.id}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rides.length > 0 && (
        <div className="mt-6 animate-slide-up">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <Car size={16} />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">{rides.length}</div>
                  <div className="text-xs text-muted-foreground">Total Rides</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {rides.filter((r) => r.status === "completed").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {formatRupee(rides.reduce((sum, r) => sum + (r.status === "completed" ? r.fare : 0), 0))}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Spent</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
