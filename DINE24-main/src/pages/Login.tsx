
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Crown, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib/apiClient";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Try Flask backend with MongoDB first
      const data = await authApi.login(adminCredentials.username, adminCredentials.password);
      if (data.success) {
        navigate("/admin/dashboard");
        return;
      }
    } catch (apiError: any) {
      // If backend is unavailable, fall back to hardcoded demo credentials
      console.warn("Backend unavailable, using demo credentials:", apiError.message);
      if (
        adminCredentials.username === "Dhana" &&
        adminCredentials.password === "miniproject"
      ) {
        localStorage.setItem("adminAuth", "true");
        navigate("/admin/dashboard");
        return;
      }
      setError("Invalid credentials. Please check your username and password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Crown className="h-16 w-16 text-royal-gold mx-auto mb-4" />
          <h1 className="font-great-vibes text-5xl font-bold text-royal-gold mb-4">
            Dine 24 Admin
          </h1>
          <p className="font-playfair text-xl text-muted-foreground">
            Administrator Access Portal
          </p>
        </div>

        {/* Admin Login */}
        <Card className="card-royal">
          <CardHeader>
            <CardTitle className="text-royal-subtitle text-center flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Username</Label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="Admin username"
                  className="royal-border"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials({...adminCredentials, username: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Admin password"
                    className="royal-border pr-10"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials({...adminCredentials, password: e.target.value})}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}
              <Button type="submit" className="btn-royal w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Admin Sign In"
                )}
              </Button>
            </form>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
