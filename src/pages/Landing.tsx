import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FoodShowcase from '@/components/FoodShowcase';
import { CustomerFeedback } from '@/components/CustomerFeedback';
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
  MapPin,
  Phone,
  Mail,
  Star,
  Headphones,
  MessageCircle,
  Home,
} from 'lucide-react';

const Landing = () => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      {/* Quick Navigation Buttons */}
      <div className="fixed top-0 left-1/2 -translate-x-[-52%] z-50 h-16 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xs font-ethnocentric"
        >
          Home
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => scrollToSection('food-showcase')}
          className="text-xs font-ethnocentric"
        >
          Foods
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => scrollToSection('why-choose')}
          className="text-xs font-ethnocentric"
        >
          Why Us
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => scrollToSection('get-touch')}
          className="text-xs font-ethnocentric"
        >
          Contact
        </Button>
        <div className="h-6 w-px bg-border" />
        <Button
          asChild
          size="sm"
          variant="default"
          className="text-xs font-ethnocentric neon-glow-primary"
        >
          <Link to="/admin-login">Login</Link>
        </Button>
      </div>

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
                A modern ordering and queue management system for cafes and quick-service 
                restaurants. Take orders, track preparation, and keep customers informed in real-time.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Button 
                  asChild 
                  size="lg" 
                  className="gap-2 font-bold neon-glow-primary hover:shadow-lg transition-all duration-300"
                >
                  <Link to="/menu">
                    Start Ordering <ShoppingCart className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-12 text-sm text-muted-foreground pt-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary neon-glow" />
                  Secure & Reliable
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary neon-glow" />
                  Real-time Updates
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
                  <p className="text-sm text-muted-foreground">
                    Order while gaming, pick up when ready, zero interruptions.
                  </p>
                </div>
                
                <div className="tech-card corner-bracket edge-pulse p-4 delay-100">
                  <div className="p-3 rounded-lg bg-secondary text-secondary-foreground w-fit mb-3">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="font-bold font-ethnocentric">No Waiting. No Hassle.</div>
                  <p className="text-sm text-muted-foreground">
                    Skip the line, instant ordering, real-time status tracking.
                  </p>
                </div>
                
                <div className="tech-card corner-bracket edge-pulse p-4 delay-200">
                  <div className="p-3 rounded-lg bg-accent text-accent-foreground w-fit mb-3">
                    <Utensils className="h-6 w-6" />
                  </div>
                  <div className="font-bold font-ethnocentric">Customize Your Cravings</div>
                  <p className="text-sm text-muted-foreground">
                    Build your perfect meal, endless add-ons, exactly how you want it.
                  </p>
                </div>
                
                <div className="tech-card corner-bracket edge-pulse p-4 delay-300">
                  <div className="p-3 rounded-lg bg-muted w-fit mb-3">
                    <Bell className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="font-bold font-ethnocentric">Fast & Smooth Experience</div>
                  <p className="text-sm text-muted-foreground">
                    Never miss your order ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Food Showcase Section */}
<div id="food-showcase" className="pt-20 md:pt-32">
        <FoodShowcase />
      </div>

      {/* Section Spacer */}
      <div className="py-16 md:py-20" />

      {/* Why Choose Section */}
      <section id="why-choose" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 cyber-text neon-glow">
              Why Choose 4G HUB Cafe?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the perfect blend of gaming, dining, and convenience in one vibrant space
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="tech-card corner-bracket border-primary/20 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="p-3 rounded-lg bg-primary text-primary-foreground w-fit mb-3">
                  <Monitor className="h-6 w-6" />
                </div>
                <CardTitle className="font-ethnocentric">Digital Ordering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Fast, efficient ordering system with real-time updates and order tracking
                </p>
              </CardContent>
            </Card>

            <Card className="tech-card corner-bracket border-secondary/20 hover:border-secondary/50 transition-colors">
              <CardHeader>
                <div className="p-3 rounded-lg bg-secondary text-secondary-foreground w-fit mb-3">
                  <Gamepad2 className="h-6 w-6" />
                </div>
                <CardTitle className="font-ethnocentric">Gaming Haven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enjoy premium gaming setup while waiting for your delicious meals
                </p>
              </CardContent>
            </Card>

            <Card className="tech-card corner-bracket border-accent/20 hover:border-accent/50 transition-colors">
              <CardHeader>
                <div className="p-3 rounded-lg bg-accent text-accent-foreground w-fit mb-3">
                  <Wifi className="h-6 w-6" />
                </div>
                <CardTitle className="font-ethnocentric">High-Speed 4G</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Lightning-fast connectivity for seamless gaming and browsing
                </p>
              </CardContent>
            </Card>

            <Card className="tech-card corner-bracket border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
              <CardHeader>
                <div className="p-3 rounded-lg bg-emerald-600 text-white w-fit mb-3">
                  <ChefHat className="h-6 w-6" />
                </div>
                <CardTitle className="font-ethnocentric">Quality Food</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Fresh, delicious menu items prepared by expert chefs
                </p>
              </CardContent>
            </Card>

            <Card className="tech-card corner-bracket border-violet-500/20 hover:border-violet-500/50 transition-colors">
              <CardHeader>
                <div className="p-3 rounded-lg bg-violet-600 text-white w-fit mb-3">
                  <Star className="h-6 w-6" />
                </div>
                <CardTitle className="font-ethnocentric">Premium Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Comfortable seating, clean ambiance, and outstanding service
                </p>
              </CardContent>
            </Card>

            <Card className="tech-card corner-bracket border-orange-500/20 hover:border-orange-500/50 transition-colors">
              <CardHeader>
                <div className="p-3 rounded-lg bg-orange-600 text-white w-fit mb-3">
                  <Headphones className="h-6 w-6" />
                </div>
                <CardTitle className="font-ethnocentric">24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Dedicated customer support ready to assist you anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Get in Touch Section */}
      <section id="get-touch" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 cyber-text neon-glow">
              Get in Touch
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you. Reach out today!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="tech-card corner-bracket border-primary/20 text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-lg bg-primary text-primary-foreground">
                    <Phone className="h-8 w-8" />
                  </div>
                </div>
                <CardTitle className="font-ethnocentric">Call Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Speak with our team directly
                </p>
                <a 
                  href="tel:+639702613054" 
                  className="font-bold text-primary hover:underline"
                >
                  +63 (970) 261-3054
                </a>
              </CardContent>
            </Card>

            <Card className="tech-card corner-bracket border-secondary/20 text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-lg bg-secondary text-secondary-foreground">
                    <Mail className="h-8 w-8" />
                  </div>
                </div>
                <CardTitle className="font-ethnocentric">Email Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Send us your inquiries
                </p>
                <a 
                  href="mailto:hello@4ghubcafe.com" 
                  className="font-bold text-primary hover:underline"
                >
                  hello@4ghubcafe.com
                </a>
              </CardContent>
            </Card>

            <Card className="tech-card corner-bracket border-accent/20 text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-lg bg-accent text-accent-foreground">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                </div>
                <CardTitle className="font-ethnocentric">Live Chat & Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Chat with us and share your feedback
                </p>
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={() => setIsFeedbackOpen(true)}
                >
                  Start Chat <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="tech-card corner-bracket bg-primary/5 border-primary/20 p-8 md:p-12 text-center rounded-lg">
            <h3 className="text-2xl font-bold mb-4 font-ethnocentric">
              Join Our Community
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Follow us on social media for exclusive updates, special offers, and gaming tournaments
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" className="gap-2">
                Facebook <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="gap-2">
                Instagram <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="gap-2">
                Twitter <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="gap-2">
                Discord <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CustomerFeedback isOpen={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </div>
  );
};

export default Landing;