import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { ChefHat, Loader } from 'lucide-react';

export default function StaffLogin() {
  const navigate = useNavigate();
  const { staffLogin, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    const success = await staffLogin(email, password);
    if (success) {
      navigate('/queue');
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />

      <Card className="w-full max-w-md tech-card corner-bracket">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <ChefHat className="h-12 w-12 text-primary neon-glow" />
          </div>
          <CardTitle className="text-2xl neon-glow cyber-text">Staff Login</CardTitle>
          <p className="text-sm text-muted-foreground">Access your kitchen dashboard</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) clearError();
                }}
                className="border-primary/20"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                className="border-primary/20"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full gap-2 neon-glow-primary"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            <p>Ask your manager for credentials</p>
          </div>

          {/* Demo Info */}
          <div className="p-3 bg-muted/50 border border-primary/20 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Available Roles:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">Staff</Badge>
              <Badge variant="outline" className="text-xs">Chef</Badge>
              <Badge variant="outline" className="text-xs">Manager</Badge>
              <Badge variant="outline" className="text-xs">Cashier</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
