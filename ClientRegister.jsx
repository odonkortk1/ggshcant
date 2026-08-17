import React, { useState } from "react";
import { api } from "@/api/client";
import { useClientAuth } from "@/lib/ClientAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export default function ClientRegister() {
  const { loginClient } = useClientAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !/^0\d{9}$/.test(phone) || pin.length !== 6) return;
    setLoading(true);
    try {
      const res = await api.post("/api/client-auth/register", {
        phone_number: phone.trim(), pin, full_name: name.trim(),
      });
      loginClient(res.data);
      toast({ title: "Account created!", description: `Welcome, ${name}!` });
      navigate("/");
    } catch (err) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex flex-col">
      <header className="px-4 sm:px-6 h-16 flex items-center">
        <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm p-6 space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-heading font-bold text-xl">Create Account</h1>
            <p className="text-xs text-muted-foreground mt-1">Register with your phone number and a 6-digit PIN</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Doe" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="e.g. 0244123456" inputMode="tel" maxLength={10} required />
              {phone.length > 0 && !/^0\d{9}$/.test(phone) && (
                <p className="text-[11px] text-amber-600">Phone must be 10 digits starting with 0</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pin">6-Digit PIN</Label>
              <Input id="pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" inputMode="numeric" type="password" maxLength={6} required />
              {pin.length > 0 && pin.length < 6 && (
                <p className="text-[11px] text-amber-600">PIN must be exactly 6 digits</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading || pin.length !== 6}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/client-login" className="text-emerald-600 font-medium hover:underline">Login</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
