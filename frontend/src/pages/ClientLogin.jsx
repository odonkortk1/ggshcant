import React, { useState } from "react";
import { api } from "@/api/client";
import { useClientAuth } from "@/lib/ClientAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Smartphone, Loader2, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function ClientLogin() {
  const { loginClient } = useClientAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!/^0\d{9}$/.test(phone) || pin.length !== 6) return;
    setLoading(true);
    try {
      const res = await api.post("/api/client-auth/login", { phone_number: phone.trim(), pin });
      loginClient(res.data);
      toast({ title: "Login successful", description: `Welcome back, ${res.data.full_name}!` });
      navigate("/");
    } catch (err) {
      toast({ title: "Login failed", description: err.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !fullName.trim() || newPin.length !== 6) {
      toast({ title: "Fill in all fields with a valid 6-digit PIN", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "PINs do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/client-auth/reset-pin", {
        phone_number: phone.trim(),
        full_name: fullName.trim(),
        pin: newPin,
      });
      toast({ title: "PIN reset successfully!", description: "You can now log in with your new PIN." });
      setMode("login");
      setPin(""); setFullName(""); setNewPin(""); setConfirmPin("");
    } catch (err) {
      toast({ title: "Reset failed", description: err.message || "Could not reset PIN", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex flex-col">
      <header className="px-4 sm:px-6 h-16 flex items-center">
        <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm p-6 space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-3">
              {mode === "login" ? <Smartphone className="w-6 h-6 text-white" /> : <KeyRound className="w-6 h-6 text-white" />}
            </div>
            <h1 className="font-heading font-bold text-xl">{mode === "login" ? "Client Login" : "Reset PIN"}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "login" ? "Enter your phone number and 6-digit PIN" : "Verify your identity to set a new PIN"}
            </p>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="e.g. 0244123456" inputMode="tel" maxLength={10} required />
                {phone.length > 0 && !/^0\d{9}$/.test(phone) && (
                  <p className="text-[11px] text-amber-600">Phone must be 10 digits starting with 0</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pin">6-Digit PIN</Label>
                <Input id="pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="******" inputMode="numeric" type="password" maxLength={6} required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading || pin.length !== 6}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Login
              </Button>
              <button type="button" onClick={() => { setMode("reset"); setPin(""); }} className="w-full text-xs text-muted-foreground hover:text-emerald-700 inline-flex items-center justify-center gap-1">
                <KeyRound className="w-3 h-3" /> Forgot PIN? Reset it
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPin} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="rp-phone">Phone Number</Label>
                <Input id="rp-phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="e.g. 0244123456" inputMode="tel" maxLength={10} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rp-name">Full Name (for verification)</Label>
                <Input id="rp-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your registered name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rp-new">New 6-Digit PIN</Label>
                <Input id="rp-new" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="******" inputMode="numeric" type="password" maxLength={6} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rp-confirm">Confirm New PIN</Label>
                <Input id="rp-confirm" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="******" inputMode="numeric" type="password" maxLength={6} required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading || newPin.length !== 6}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset PIN
              </Button>
              <button type="button" onClick={() => { setMode("login"); setFullName(""); setNewPin(""); setConfirmPin(""); }} className="w-full text-xs text-muted-foreground hover:text-emerald-700 inline-flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to login
              </button>
            </form>
          )}

          {mode === "login" && (
            <p className="text-center text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/client-register" className="text-emerald-600 font-medium hover:underline">Register</Link>
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
