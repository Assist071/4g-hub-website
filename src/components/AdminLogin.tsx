import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Lock, Shield, Mail, Eye, EyeOff, ChefHat, Loader } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const { login, staffLogin, error, isLoading, clearError } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const success = await login(adminEmail, adminPassword);

    if (success) {
      toast({
        title: "Admin Login Successful",
        description: "Redirecting to admin panel...",
      });
      navigate('/admin');
    } else {
      toast({
        title: "Access Denied",
        description: error || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
      setAdminPassword('');
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const success = await staffLogin(staffEmail, staffPassword);

    if (success) {
      toast({
        title: "Staff Login Successful",
        description: "Redirecting to your dashboard...",
      });
      navigate('/queue');
    } else {
      toast({
        title: "Access Denied",
        description: error || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
      setStaffPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />

      <Card className="w-full max-w-md tech-card corner-bracket">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl neon-glow cyber-text">Authentication</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 tech-border mb-6">
              <TabsTrigger value="admin" className="gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="staff" className="gap-2">
                <ChefHat className="h-4 w-4" />
                Staff
              </TabsTrigger>
            </TabsList>

            {/* Admin Login Tab */}
            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-sm font-semibold">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => {
                        setAdminEmail(e.target.value);
                        if (error) clearError();
                      }}
                      placeholder="admin@example.com"
                      className="pl-10 border-primary/20"
                      required  
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-sm font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-password"
                      type={showAdminPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        if (error) clearError();
                      }}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 border-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                    >
                      {showAdminPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2 neon-glow-primary"
                  disabled={isLoading || !adminEmail.trim() || !adminPassword.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Admin Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-xs text-foreground">
                  🔒 Supabase authentication required
                </p>
              </div>
            </TabsContent>

            {/* Staff Login Tab */}
            <TabsContent value="staff" className="space-y-4">
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-email" className="text-sm font-semibold">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="staff-email"
                      type="email"
                      value={staffEmail}
                      onChange={(e) => {
                        setStaffEmail(e.target.value);
                        if (error) clearError();
                      }}
                      placeholder="staff@example.com"
                      className="pl-10 border-primary/20"
                      required  
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password" className="text-sm font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="staff-password"
                      type={showStaffPassword ? "text" : "password"}
                      value={staffPassword}
                      onChange={(e) => {
                        setStaffPassword(e.target.value);
                        if (error) clearError();
                      }}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 border-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                    >
                      {showStaffPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2 neon-glow-primary"
                  disabled={isLoading || !staffEmail.trim() || !staffPassword.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <ChefHat className="h-4 w-4" />
                      Staff Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                <p className="text-xs text-foreground">
                  👨‍🍳 Access kitchen and order queues
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}