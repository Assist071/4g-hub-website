import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Mail, Eye, EyeOff, Loader, AlertTriangle, LogIn, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { login, staffLogin, error, isLoading, clearError, accountLocked, lockoutTimeRemaining } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (accountLocked) {
      toast({
        title: "Account Locked",
        description: `Account temporarily locked. Try again in ${lockoutTimeRemaining} seconds.`,
        variant: "destructive",
      });
      return;
    }

    // Try admin login first
    let success = await login(email, password);
    let isAdmin = success;
    
    // If admin login fails, try staff login
    if (!success) {
      success = await staffLogin(email, password);
      isAdmin = false;
    }

    if (success) {
      setShowSuccess(true);
      setEmail('');
      setPassword('');
      
      // Navigate to correct dashboard based on which login succeeded
      navigate(isAdmin ? '/admin' : '/queue');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4 relative overflow-hidden">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="tech-card corner-bracket p-5 bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/50 flex items-center gap-3 shadow-2xl max-w-xs">
            <CheckCircle className="h-6 w-6 text-primary neon-glow animate-pulse flex-shrink-0" />
            <span className="text-sm font-bold text-primary neon-glow">Login Successful!</span>
          </div>
        </div>
      )}

      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />

      <Card className="w-full max-w-sm tech-card corner-bracket shadow-2xl border-primary/30 backdrop-blur-sm">
        <CardHeader className="text-center space-y-3 pb-8">
          <div className="inline-flex items-center justify-center space-x-2 mb-2">
            <LogIn className="h-7 w-7 text-primary neon-glow" />
            <CardTitle className="text-3xl neon-glow cyber-text">Welcome</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) clearError();
                  }}
                  placeholder="your@email.com"
                  className="pl-10 border-primary/20 focus:border-primary/50 transition-all duration-200 h-11"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) clearError();
                  }}
                  placeholder="••••••••"
                  className="pl-10 pr-10 border-primary/20 focus:border-primary/50 transition-all duration-200 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="bg-destructive/10 border-destructive/30 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive text-sm ml-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 neon-glow-primary font-semibold transition-all duration-300"
              disabled={isLoading || !email.trim() || !password.trim() || accountLocked}
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : accountLocked ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Account Locked ({lockoutTimeRemaining}s)
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}