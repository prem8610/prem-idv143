import { useState, FormEvent } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Zap, Phone, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getAnonymousActor } from "../utils/anonymousActor";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const actor = await getAnonymousActor();
      await actor.registerUser({
        name,
        phone,
        password,
        role: "user",
        vehicleType: "",
        locationLat: 0,
        locationLng: 0,
      });
      toast.success("Account created! Please login.");
      await router.navigate({ to: "/login" });
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
          <h1 className="text-3xl font-bold text-foreground mb-1">Create Account</h1>
          <p className="text-muted-foreground">Start riding and earning rewards today</p>
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
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
