import { Link } from "@tanstack/react-router";
import { Zap, Shield, Star, MapPin, ArrowRight, Car, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Gradient Background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, oklch(0.35 0.18 262) 0%, oklch(0.20 0.10 260) 60%, oklch(0.15 0.06 260) 100%)",
          }}
        />
        {/* Decorative mesh */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, oklch(0.60 0.22 262) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, oklch(0.52 0.22 262) 0%, transparent 40%),
                              radial-gradient(circle at 60% 80%, oklch(0.82 0.15 75 / 0.3) 0%, transparent 40%)`,
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(oklch(1 0 0 / 0.1) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 ride-gradient rounded-xl flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">RideRapid</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link to="/login">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5">
                <User size={15} />
                Rider Login
              </Button>
            </Link>
            <Link to="/driver/login">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5">
                <Car size={15} />
                Driver Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
              <Zap size={14} className="text-amber-400" />
              <span className="text-white/90 text-sm font-medium">Fast. Reliable. Rewarding.</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight animate-slide-up stagger-1">
              Your Ride,{" "}
              <span
                className="relative"
                style={{
                  background: "linear-gradient(135deg, oklch(0.82 0.15 75), oklch(0.70 0.20 50))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Your Way
              </span>
            </h1>

            <p className="text-xl text-white/70 mb-10 max-w-xl mx-auto animate-slide-up stagger-2">
              Book bikes, autos, and cars instantly. Earn reward points with every ride. 
              Experience smarter urban mobility.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up stagger-3">
              <Link to="/login">
                <Button
                  size="lg"
                  className="ride-gradient text-white font-semibold px-8 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all gap-2"
                >
                  <User size={18} />
                  Rider Login
                </Button>
              </Link>
              <Link to="/driver/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white bg-white/10 hover:bg-white/20 font-semibold px-8 h-12 gap-2 backdrop-blur-sm"
                >
                  <Car size={18} />
                  Driver Login
                </Button>
              </Link>
            </div>

            <div className="text-center mt-4 animate-slide-up stagger-4">
              <p className="text-white/50 text-sm">
                New here?{" "}
                <Link to="/signup" className="text-white/80 hover:text-white underline underline-offset-2 font-medium transition-colors">
                  Sign up as a Rider
                </Link>
                {" "}or{" "}
                <Link to="/driver/signup" className="text-white/80 hover:text-white underline underline-offset-2 font-medium transition-colors">
                  Register as a Driver
                </Link>
              </p>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-6 mt-16 animate-slide-up stagger-5">
              {[
                { value: "50K+", label: "Active Riders" },
                { value: "4.8★", label: "Avg. Rating" },
                { value: "2 min", label: "Avg. Pickup" },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl py-4 px-6">
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-sm text-white/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative z-10">
        <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" role="presentation">
          <title>Wave divider</title>
          <path
              d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
              fill="oklch(0.96 0.012 240)"
            />
        </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything you need for
              <span className="text-primary"> smarter rides</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Built for urban commuters who value speed, savings, and reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="text-primary" size={28} />,
                title: "Instant Booking",
                desc: "Book bikes, autos, and cars in seconds. See real-time driver locations and estimated arrival times.",
                bg: "bg-primary/5 border-primary/15",
              },
              {
                icon: <Star className="text-amber-500" size={28} />,
                title: "Reward Points",
                desc: "Earn 5 points per ride, 10 points for demand area updates. Hit 100 points for a 50% discount!",
                bg: "bg-amber-50 border-amber-100",
              },
              {
                icon: <MapPin className="text-emerald-500" size={28} />,
                title: "Live Demand Map",
                desc: "See high-demand zones in real-time. Help shape supply with your location data and earn points.",
                bg: "bg-emerald-50 border-emerald-100",
              },
              {
                icon: <Shield className="text-purple-500" size={28} />,
                title: "Safe Rides",
                desc: "Verified drivers, tracked rides, and a Child Ride mode with parental safety features.",
                bg: "bg-purple-50 border-purple-100",
              },
              {
                icon: <Zap className="text-blue-500" size={28} />,
                title: "ML-Powered Demand",
                desc: "Our AI predicts demand surges so you never miss a ride during peak hours.",
                bg: "bg-blue-50 border-blue-100",
              },
              {
                icon: <Car className="text-primary" size={28} />,
                title: "Multi-Vehicle",
                desc: "Choose from bikes, autos, and cabs. Get fare estimates before confirming your ride.",
                bg: "bg-primary/5 border-primary/15",
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border p-6 card-shadow hover:card-shadow-lg hover:-translate-y-1 transition-all duration-300 ${f.bg}`}
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 px-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.35 0.18 262) 0%, oklch(0.20 0.10 260) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, oklch(0.60 0.22 262) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to ride smarter?</h2>
          <p className="text-white/70 mb-8 text-lg">
            Join thousands of riders earning rewards while commuting every day.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-white text-primary font-semibold px-8 h-12 hover:bg-white/90 gap-2"
              >
                Sign Up Free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/driver/signup">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20 font-semibold px-8 h-12"
              >
                Become a Driver
              </Button>
            </Link>
          </div>
          <p className="text-white/50 text-sm mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-white/80 hover:text-white underline underline-offset-2 font-medium transition-colors">
              Rider Login
            </Link>
            {" · "}
            <Link to="/driver/login" className="text-white/80 hover:text-white underline underline-offset-2 font-medium transition-colors">
              Driver Login
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-border py-8 px-8 text-center">
        <p className="text-muted-foreground text-sm">
          @ 2026 prem.idv143@gmail.com
        </p>
      </footer>
    </div>
  );
}
