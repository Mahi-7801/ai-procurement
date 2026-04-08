import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { UserRole, roleLabels } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("PROCUREMENT_OFFICER");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      const success = await register({
        username,
        email,
        password,
        full_name: fullName,
        role,
        department: "Procurement Dept"
      });
      if (success) {
        toast.success("Registration successful! Please login.");
        setIsRegister(false);
      } else {
        toast.error("Registration failed. Data was not stored.");
      }
    } else {
      const success = await login(username, password, role);
      if (success) {
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    }
  };

  const handleDemo = async () => {
    await login("demo", "demo", role);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white selection:bg-gov-blue/10 selection:text-gov-blue">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-gov-blue rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-gov-teal rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md p-4 animate-slide-up">
        <Card className="border-border/40 bg-white/70 backdrop-blur-2xl shadow-2xl shadow-gov-blue/10 rounded-[2.5rem] border-2">
          <CardHeader className="text-center space-y-4 pb-2 pt-10">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gov-blue shadow-lg shadow-gov-blue/30 flex items-center justify-center transform hover:rotate-6 transition-transform">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tighter text-foreground">
                RTGS <span className="text-gov-blue">Portal</span>
              </CardTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Govt. of Andhra Pradesh
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
               <button 
                onClick={() => setIsRegister(false)}
                className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all ${!isRegister ? 'bg-gov-blue text-white shadow-lg shadow-gov-blue/20' : 'text-muted-foreground hover:text-gov-blue'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => setIsRegister(true)}
                className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all ${isRegister ? 'bg-gov-blue text-white shadow-lg shadow-gov-blue/20' : 'text-muted-foreground hover:text-gov-blue'}`}
              >
                Sign Up
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-10 pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest ml-1">Full Name</Label>
                    <Input
                      id="fullName"
                      className="h-11 rounded-2xl bg-white/50 border-2 focus-visible:ring-gov-blue transition-all"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="h-11 rounded-2xl bg-white/50 border-2 focus-visible:ring-gov-blue transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-1">
                <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest ml-1">Username</Label>
                <Input
                  id="username"
                  className="h-11 rounded-2xl bg-white/50 border-2 focus-visible:ring-gov-blue transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="h-11 rounded-2xl bg-white/50 border-2 focus-visible:ring-gov-blue transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest ml-1">Access Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger className="h-11 rounded-2xl bg-white/50 border-2 focus:ring-gov-blue transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2">
                    {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                      <SelectItem key={r} value={r} className="rounded-xl focus:bg-gov-blue/10 focus:text-gov-blue">
                        {roleLabels[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 space-y-3">
                <Button type="submit" className="w-full h-12 rounded-2xl bg-foreground hover:bg-foreground/90 font-bold text-base shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                  {isRegister ? <><UserPlus className="w-5 h-5" /> Sign Up</> : <><LogIn className="w-5 h-5" /> Sign In</>}
                </Button>
                
                {!isRegister && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-2xl bg-gov-blue/5 border-2 border-gov-blue/10 text-gov-blue font-bold hover:bg-gov-blue hover:text-white transition-all active:scale-95 group"
                    onClick={handleDemo}
                  >
                    Quick Demo <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>

              <div className="flex flex-col items-center gap-4 pt-2">
                <p className="text-[9px] text-center font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-1 rounded-full">
                  Secure On-Premise Gateway • DPDP Compliant
                </p>
                <Button
                  variant="link"
                  onClick={() => navigate("/")}
                  className="text-xs text-muted-foreground hover:text-gov-blue"
                >
                  Back to Landing Page
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
