import { useState, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import {
  Navigation,
  Loader2,
  Bike,
  Car,
  Calculator,
  Star,
  Tag,
  MapPin,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useActor } from "../hooks/useActor";
import { cn } from "@/lib/utils";

type VehicleType = "bike" | "auto" | "car";
type RideType = "normal" | "child";

interface VehicleOption {
  id: VehicleType;
  label: string;
  emoji: string;
  baseFare: number;
  desc: string;
}

const VEHICLES: VehicleOption[] = [
  { id: "bike", label: "Bike", emoji: "🚴", baseFare: 15, desc: "Base ₹15 + ₹4/km" },
  { id: "auto", label: "Auto", emoji: "🛺", baseFare: 25, desc: "Base ₹25 + ₹8/km" },
  { id: "car", label: "Car", emoji: "🚗", baseFare: 50, desc: "Base ₹50 + ₹12/km" },
];

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatRupee(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BookRidePage() {
  const { user } = useAuth();
  const { actor } = useActor();
  const router = useRouter();

  const [vehicle, setVehicle] = useState<VehicleType>("bike");
  const [rideType, setRideType] = useState<RideType>("normal");
  const [pickupLat, setPickupLat] = useState("");
  const [pickupLng, setPickupLng] = useState("");
  const [dropLat, setDropLat] = useState("");
  const [dropLng, setDropLng] = useState("");
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const rewardPoints = BigInt(user?.rewardPoints ?? 0);
  const hasDiscount = rewardPoints >= BigInt(100);

  const distance =
    pickupLat && pickupLng && dropLat && dropLng
      ? calcDistance(
          parseFloat(pickupLat),
          parseFloat(pickupLng),
          parseFloat(dropLat),
          parseFloat(dropLng)
        )
      : null;

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupLat(pos.coords.latitude.toFixed(6));
        setPickupLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("Pickup location set!");
      },
      () => {
        setError("Could not get location");
        setLocating(false);
      }
    );
  }, []);

  const handleEstimate = async () => {
    if (!actor) {
      setError("Not connected. Please wait.");
      return;
    }
    if (!distance || distance <= 0) {
      setError("Please enter valid pickup and drop locations.");
      return;
    }
    setError("");
    setEstimating(true);
    try {
      const fare = await actor.estimateFare(vehicle, rideType, distance, rewardPoints);
      setEstimatedFare(fare);
      toast.success("Fare estimated!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Estimation failed";
      setError(msg);
    } finally {
      setEstimating(false);
    }
  };

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.bookRide({
        vehicleType: vehicle,
        rideType,
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        dropLat: parseFloat(dropLat),
        dropLng: parseFloat(dropLng),
      });
    },
    onSuccess: () => {
      toast.success("Ride booked! +5 reward points earned 🎉");
      void router.navigate({ to: "/dashboard" });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Booking failed";
      setError(msg);
    },
  });

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold text-foreground">Book a Ride</h1>
        <p className="text-muted-foreground mt-1">Choose your vehicle and set your route</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: Booking Form */}
        <div className="space-y-6">
          {/* Vehicle Selection */}
          <Card className="border-border card-shadow animate-slide-up stagger-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car size={18} className="text-primary" />
                Select Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVehicle(v.id);
                      setEstimatedFare(null);
                    }}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-center transition-all duration-200 hover:border-primary/60",
                      vehicle === v.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:bg-muted/30"
                    )}
                  >
                    <div className="text-3xl mb-2">{v.emoji}</div>
                    <div className="font-semibold text-foreground text-sm">{v.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{v.desc}</div>
                    {vehicle === v.id && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ride Type */}
          <Card className="border-border card-shadow animate-slide-up stagger-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag size={18} className="text-primary" />
                Ride Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Normal Ride */}
                <button
                  type="button"
                  onClick={() => {
                    setRideType("normal");
                    setEstimatedFare(null);
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-primary/60",
                    rideType === "normal"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:bg-muted/30"
                  )}
                >
                  <div className="text-2xl mb-2">🚗</div>
                  <div className="font-semibold text-foreground">Normal Ride</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Standard fare</div>
                  {rideType === "normal" && (
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>

                {/* Child Ride */}
                <button
                  type="button"
                  onClick={() => {
                    setRideType("child");
                    setEstimatedFare(null);
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                    rideType === "child"
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                      : "border-border bg-card hover:border-blue-300 hover:bg-blue-50/50"
                  )}
                >
                  <Badge className="absolute top-2 right-2 bg-amber-100 text-amber-700 border-amber-200 text-xs">
                    +₹5
                  </Badge>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                    <Shield size={16} className="text-blue-600" />
                  </div>
                  <div className="font-semibold text-foreground">Child Ride</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Child seat + safety</div>
                  {rideType === "child" && (
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              </div>

              {/* Child ride info note */}
              {rideType === "child" && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-3 text-xs text-blue-700 animate-fade-in">
                  <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-blue-500" />
                  <span>
                    <strong>Child Ride includes:</strong> child safety seat, reduced speed, and a
                    verified parent-safe driver. Extra ₹5 added to base fare.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Locations */}
          <Card className="border-border card-shadow animate-slide-up stagger-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin size={18} className="text-primary" />
                Route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Pickup Location</Label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    type="number"
                    placeholder="Latitude"
                    value={pickupLat}
                    onChange={(e) => { setPickupLat(e.target.value); setEstimatedFare(null); }}
                    step="any"
                  />
                  <Input
                    type="number"
                    placeholder="Longitude"
                    value={pickupLng}
                    onChange={(e) => { setPickupLng(e.target.value); setEstimatedFare(null); }}
                    step="any"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLocate}
                  disabled={locating}
                  className="gap-2 text-primary border-primary/30"
                >
                  {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                  Use Current Location
                </Button>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-2 block">Drop Location</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Latitude"
                    value={dropLat}
                    onChange={(e) => { setDropLat(e.target.value); setEstimatedFare(null); }}
                    step="any"
                  />
                  <Input
                    type="number"
                    placeholder="Longitude"
                    value={dropLng}
                    onChange={(e) => { setDropLng(e.target.value); setEstimatedFare(null); }}
                    step="any"
                  />
                </div>
              </div>

              {distance !== null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                  <Bike size={14} />
                  <span>Distance: <strong className="text-foreground">{distance.toFixed(2)} km</strong></span>
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <Button
                type="button"
                onClick={() => void handleEstimate()}
                disabled={estimating || !pickupLat || !pickupLng || !dropLat || !dropLng}
                className="w-full ride-gradient text-white gap-2"
              >
                {estimating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Calculator size={16} />
                )}
                {estimating ? "Estimating..." : "Estimate Fare"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Fare Summary */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card className="border-border card-shadow-lg animate-slide-up stagger-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator size={18} className="text-primary" />
                Fare Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehicle & Type */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium text-foreground capitalize">{vehicle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ride Type</span>
                  <span className="font-medium text-foreground capitalize">{rideType}</span>
                </div>
                {distance !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="font-medium text-foreground">{distance.toFixed(2)} km</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Fare */}
              <div className="text-center py-4">
                {estimatedFare !== null ? (
                  <>
                    <div className="text-4xl font-bold text-foreground">
                      {formatRupee(estimatedFare)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Estimated fare</p>
                    {hasDiscount && (
                      <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                        <Tag size={12} />
                        50% discount applied!
                      </Badge>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm py-2">
                    Enter locations and click "Estimate Fare"
                  </div>
                )}
              </div>

              {/* Reward points note */}
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <Star size={14} className="text-amber-500 shrink-0" />
                +5 reward points after booking
              </div>

              {hasDiscount && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  <Tag size={14} className="text-emerald-500 shrink-0" />
                  50% discount auto-applied (100+ points)
                </div>
              )}

              <Button
                type="button"
                onClick={() => bookMutation.mutate()}
                disabled={estimatedFare === null || bookMutation.isPending}
                className="w-full h-11 ride-gradient text-white font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {bookMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Ride"
                )}
              </Button>

              {estimatedFare === null && (
                <p className="text-xs text-center text-muted-foreground">
                  Estimate fare first to enable booking
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
