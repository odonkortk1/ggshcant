import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/api/client";
import { useStaffAuth } from "@/lib/StaffAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { UtensilsCrossed, Loader2, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";

export default function StaffLogin() {
  const navigate = useNavigate();
  const { loginStaff } = useStaffAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^\d{6}$/.test(pin)) {
      toast({ title: "Enter your email and 6-digit PIN", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/staff-auth/login", { email: email.trim(), pin });
      loginStaff(res.data);
      toast({ title: `Welcome, ${res.data.staff.full_name}!` });
      navigate("/orders");
    } catch (err) {
      toast({ title: err?.message || "Login failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^\d{6}$/.test(oldPin) || !/^\d{6}$/.test(newPin)) {
      toast({ title: "Fill in all fields with valid 6-digit PINs", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "New PINs do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/staff-auth/change-pin", { email: email.trim(), old_pin: oldPin, new_pin: newPin });
      toast({ title: "PIN changed successfully!", description: "You can now log in with your new PIN." });
      setMode("login");
      setPin(""); setOldPin(""); setNewPin(""); setConfirmPin("");
    } catch (err) {
      toast({ title: err?.message || "Could not change PIN", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-background to-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="w-9 h-9" />
            <div>
              <h1 className="font-heading font-bold text-lg sm:text-xl leading-none">GGSH Canteen</h1>
              <p className="text-[11px] text-muted-foreground">Hospital cafeteria</p>
            </div>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4" /> Back to menu
          </Link>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <Logo className="w-16 h-16" />
            <div className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-blue-600 ring-2 ring-background flex items-center justify-center">
              {mode === "login" ? <ShieldCheck className="w-3.5 h-3.5 text-white" /> : <KeyRound className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
          <CardTitle className="font-heading">{mode === "login" ? "Staff Login" : "Change PIN"}</CardTitle>
          <CardDescription>
            {mode === "login" ? "Sign in to track orders & manage the menu" : "Enter your current PIN and choose a new one"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@yourorg.com" className="h-10" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff-pin">6-digit PIN</Label>
                <Input id="staff-pin" inputMode="numeric" pattern="\d{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••••" className="h-10 tracking-[0.3em] text-center font-semibold" required />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</> : "Sign In"}
              </Button>
              <button type="button" onClick={() => { setMode("change"); setPin(""); }} className="w-full text-xs text-muted-foreground hover:text-blue-700 inline-flex items-center justify-center gap-1">
                <KeyRound className="w-3 h-3" /> Change PIN
              </button>
              <p className="text-[11px] text-muted-foreground text-center">Forgot your PIN? Contact your administrator to reset it.</p>
            </form>
          ) : (
            <form onSubmit={handleChangePin} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cp-email">Email</Label>
                <Input id="cp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@yourorg.com" className="h-10" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cp-old">Current PIN</Label>
                <Input id="cp-old" inputMode="numeric" pattern="\d{6}" maxLength={6} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))} placeholder="••••••" className="h-10 tracking-[0.3em] text-center font-semibold" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cp-new">New PIN</Label>
                <Input id="cp-new" inputMode="numeric" pattern="\d{6}" maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="••••••" className="h-10 tracking-[0.3em] text-center font-semibold" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cp-confirm">Confirm New PIN</Label>
                <Input id="cp-confirm" inputMode="numeric" pattern="\d{6}" maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} placeholder="••••••" className="h-10 tracking-[0.3em] text-center font-semibold" required />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : "Update PIN"}
              </Button>
              <button type="button" onClick={() => { setMode("login"); setOldPin(""); setNewPin(""); setConfirmPin(""); }} className="w-full text-xs text-muted-foreground hover:text-blue-700 inline-flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to login
              </button>
            </form>
          )}
          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-blue-700 inline-flex items-center gap-1">
              <UtensilsCrossed className="w-3 h-3" /> Back to menu
            </Link>
          </div>
        </CardContent>
        </Card>
      </main>
    </div>
  );
}