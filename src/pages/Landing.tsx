import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FoodShowcase from '@/components/FoodShowcase';
import {
  Utensils,
  Monitor,
  ChefHat,
  ShieldCheck,
  ShoppingCart,
  Clock,
  Wifi,
  TrendingUp,
  ArrowRight,
  Gamepad2,
  Zap,
  Bell,
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
        <div className="container mx-auto px-4 py-32 md:py-40 lg:py-38">
          <div className="grid gap-16 md:grid-cols-2 items-center">
            <div className="space-y-10 md:space-y-12">
              <h1 className="text-5xl md:text-4xl font-extrabold leading-tight neon-glow cyber-text">
                Enjoy Your Cafe With Gaming in 4G HUB
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                A modern ordering and queue management system for cafes and quick-service restaurants. Take orders, track preparation, and keep customers informed in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <Button asChild size="lg" className="gap-2 font-bold neon-glow-primary hover:shadow-lg transition-all duration-300">
                  <Link to="/menu">
                    Start Ordering <ShoppingCart className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-12 text-sm text-muted-foreground pt-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary neon-glow" /> Secure & Reliable
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary neon-glow" /> Real-time Updates
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-10 bg-primary/10 blur-3xl rounded-full animate-pulse" />
              <div className="relative grid grid-cols-2 gap-8 md:gap-10">
                <div className="tech-card corner-bracket edge-pulse p-4">
                  <div className="p-3 rounded-lg bg-primary text-primary-foreground w-fit mb-3">
                    <Gamepad2 className="h-6 w-6" />
                  </div>
                  <div className="font-bold font-ethnocentric">Game. Order. Chill.</div>
                  <p className="text-sm text-muted-foreground">Order while gaming, pick up when ready, zero interruptions.</p>
                </div>
                <div className="tech-card corner-bracket edge-pulse p-4 delay-100">
                  <div className="p-3 rounded-lg bg-secondary text-secondary-foreground w-fit mb-3">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="font-bold font-ethnocentric">No Waiting. No Hassle.</div>
                  <p className="text-sm text-muted-foreground">Skip the line, instant ordering, real-time status tracking.</p>
                </div>
                <div className="tech-card corner-bracket edge-pulse p-4 delay-200">
                  <div className="p-3 rounded-lg bg-accent text-accent-foreground w-fit mb-3">
                    <Utensils className="h-6 w-6" />
                  </div>
                  <div className="font-bold font-ethnocentric">Customize Your Cravings</div>
                  <p className="text-sm text-muted-foreground">Build your perfect meal, endless add-ons, exactly how you want it.</p>
                </div>
                <div className="tech-card corner-bracket edge-pulse p-4 delay-300">
                  <div className="p-3 rounded-lg bg-muted w-fit mb-3">
                    <Bell className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="font-bold font-ethnocentric">Fast & Smooth Experience</div>
                  <p className="text-sm text-muted-foreground">Never miss your order ready.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Food Showcase Section */}
      <FoodShowcase />


    </div>
  );
};

export default Landing;
