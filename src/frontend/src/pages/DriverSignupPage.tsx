import { useState, FormEvent } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Zap, Phone, Lock, User, Car, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getAnonymousActor } from "../utils/anonymousActor";

export default function DriverSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
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
        setError("Could not get location. Please enter manually.");
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicleType) {
      setError("Please select a vehicle type.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const actor = await getAnonymousActor();
      await actor.registerUser({
        name,
        phone,
        password,
        role: "driver",
        vehicleType,
        locationLat: lat ? parseFloat(lat) : 0,
        locationLng: lng ? parseFloat(lng) : 0,
      });
      toast.success("Driver account created! Please login.");
      await router.navigate({ to: "/driver/login" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, oklch(0.96 0.012 240) 0%, oklch(0.92 0.04 240) 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, oklch(0.60 0.22 262 / 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, oklch(0.82 0.15 75 / 0.15) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-11 h-11 ride-gradient rounded-2xl flex items-center justify-center shadow-lg">
              <Zap size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">RideRapid</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-1">Driver Signup</h1>
          <p className="text-muted-foreground">Start earning by driving with us</p>
        </div>

        <div className="bg-card rounded-2xl card-shadow p-8 border border-border animate-slide-up stagger-1">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Car size={16} className="text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Select vehicle type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">🚴 Bike</SelectItem>
                  <SelectItem value="auto">🛺 Auto</SelectItem>
                  <SelectItem value="car">🚗 Car</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Location (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  step="any"
                />
                <Input
                  type="number"
                  placeholder="Longitude"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  step="any"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLocate}
                disabled={locating}
                className="w-full gap-2"
              >
                {locating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Navigation size={14} />
                )}
                Use My Location
              </Button>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 ride-gradient text-white font-semibold hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Register as Driver"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            <p className="text-muted-foreground">
              Already a driver?{" "}
              <Link to="/driver/login" className="text-primary font-medium hover:underline">
                Driver Login
              </Link>
            </p>
            <p className="text-muted-foreground">
              Want to ride?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                User Signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
