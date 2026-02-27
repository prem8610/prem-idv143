import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Car,
  Star,
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
  Zap,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";
import type { Ride, RewardInfo } from "../backend.d";

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

export default function DashboardPage() {
  const { user } = useAuth();
  const { actor, isFetching } = useActor();

  const rewardQuery = useQuery<RewardInfo>({
    queryKey: ["rewardInfo", user?.id?.toString()],
    queryFn: async () => {
      if (!actor || !user?.id) throw new Error("Not ready");
      return actor.getRewardInfo(user.id);
    },
    enabled: !!actor && !isFetching && !!user?.id,
  });

  const ridesQuery = useQuery<Ride[]>({
    queryKey: ["rides", user?.id?.toString()],
    queryFn: async () => {
      if (!actor || !user?.id) throw new Error("Not ready");
      return actor.getRidesByUser(user.id);
    },
    enabled: !!actor && !isFetching && !!user?.id,
  });

  const rewardInfo = rewardQuery.data;
  const rides = ridesQuery.data ?? [];
  const recentRides = rides.slice(-3).reverse();

  const totalRides = Number(rewardInfo?.totalRides ?? user?.totalRides ?? 0);
  const rewardPoints = Number(rewardInfo?.rewardPoints ?? user?.rewardPoints ?? 0);
  const moneySaved = rewardInfo?.moneySaved ?? user?.moneySaved ?? 0;
  const pointsProgress = Math.min((rewardPoints / 100) * 100, 100);
  const hasDiscount = rewardPoints >= 100;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <p className="text-muted-foreground text-sm">{greeting}</p>
        <h1 className="text-3xl font-bold text-foreground mt-1">
          Welcome back, <span className="text-primary">{user?.name?.split(" ")[0]}</span>! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your ride overview</p>
      </div>

      {/* Discount Banner */}
      {hasDiscount && (
        <div className="bg-emerald-500 text-white rounded-2xl p-4 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={24} className="shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-lg">50% Discount Available!</div>
            <div className="text-emerald-100 text-sm">Automatically applied on your next ride booking</div>
          </div>
          <Zap size={32} className="text-emerald-200 shrink-0" />
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Rides */}
        <Card className="border-border card-shadow hover:card-shadow-lg transition-shadow animate-slide-up stagger-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Rides</p>
                {ridesQuery.isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">{totalRides}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">+5 pts per ride</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Car size={22} className="text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reward Points */}
        <Card className="border-border card-shadow hover:card-shadow-lg transition-shadow animate-slide-up stagger-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-3">
                <p className="text-sm text-muted-foreground font-medium mb-1">Reward Points</p>
                {rewardQuery.isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold text-amber-500">{rewardPoints}</div>
                )}
                <Progress value={pointsProgress} className="mt-2 h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">{rewardPoints}/100 pts to discount</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Star size={22} className="text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Money Saved */}
        <Card className="border-border card-shadow hover:card-shadow-lg transition-shadow animate-slide-up stagger-3">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Money Saved</p>
                {rewardQuery.isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-3xl font-bold text-emerald-600">{formatRupee(moneySaved)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Via reward discounts</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={22} className="text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reward System Card */}
        <Card className="border-border card-shadow animate-slide-up stagger-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star size={18} className="text-amber-500" />
              Reward System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">Progress to 50% discount</span>
                <span className="text-sm font-bold text-amber-500">{rewardPoints}/100</span>
              </div>
              <Progress value={pointsProgress} className="h-3" />
              {hasDiscount ? (
                <p className="text-xs text-emerald-600 font-medium mt-1">✓ Discount unlocked!</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {100 - rewardPoints} more points to unlock 50% discount
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">How to earn points:</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">+5</Badge>
                <span>per ride completed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 font-mono text-xs">+10</Badge>
                <span>per demand area update</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 font-mono text-xs">50%</Badge>
                <span>discount at 100 points</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Rides */}
        <Card className="border-border card-shadow animate-slide-up stagger-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock size={18} className="text-primary" />
              Recent Rides
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ridesQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentRides.length === 0 ? (
              <div className="text-center py-8">
                <Car size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No rides yet.</p>
                <Link to="/book">
                  <Button size="sm" className="mt-3 ride-gradient text-white">
                    Book your first ride
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-border/50"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CircleDot size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground capitalize">{ride.vehicleType}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground capitalize">{ride.rideType}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={10} />
                        {ride.pickupLat.toFixed(2)}, {ride.pickupLng.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-foreground">{formatRupee(ride.fare)}</div>
                      <StatusBadge status={ride.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up stagger-5">
        <Link to="/book">
          <div className="group p-5 rounded-2xl ride-gradient text-white flex items-center justify-between hover:opacity-90 transition-all hover:scale-[1.02] card-shadow cursor-pointer">
            <div>
              <div className="font-bold text-lg">Book a Ride</div>
              <div className="text-white/70 text-sm">Choose bike, auto or car</div>
            </div>
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link to="/map">
          <div className="group p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between hover:bg-amber-100 transition-all hover:scale-[1.02] card-shadow cursor-pointer">
            <div>
              <div className="font-bold text-lg">Update Demand Area</div>
              <div className="text-amber-700 text-sm">Earn +10 reward points</div>
            </div>
            <MapPin size={24} className="text-amber-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
