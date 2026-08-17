import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Users, Loader2, Shield, Mail, Trash2, ArrowLeft, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

export default function StaffManagement() {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("staff");
  const [creating, setCreating] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState(null);
  const [newResetPin, setNewResetPin] = useState("");

  const loadStaff = () => {
    base44.entities.Staff.list()
      .then((data) => setStaffList(data))
      .catch(() => toast({ title: "Could not load staff list", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStaff(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !/^\d{6}$/.test(pin)) {
      toast({ title: "Enter name, email, and a 6-digit PIN", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await base44.entities.Staff.create({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        pin,
        role,
      });
      toast({ title: "Staff account created!", description: `${email.trim()} can now log in with their PIN.` });
      setFullName("");
      setEmail("");
      setPin("");
      setRole("staff");
      loadStaff();
    } catch (err) {
      toast({ title: err?.message || "Could not create staff account", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleResetPin = async (id) => {
    if (!/^\d{6}$/.test(newResetPin)) {
      toast({ title: "Enter a valid 6-digit PIN", variant: "destructive" });
      return;
    }
    try {
      await base44.entities.Staff.update(id, { pin: newResetPin });
      toast({ title: "PIN reset successfully", description: "The staff member can now log in with the new PIN." });
      setResettingId(null);
      setNewResetPin("");
    } catch {
      toast({ title: "Could not reset PIN", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Staff.delete(id);
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Staff account removed" });
    } catch {
      toast({ title: "Could not remove account", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-heading font-bold text-[15px] leading-none">Staff Management</h1>
              <p className="text-[11px] text-muted-foreground">Create & manage staff logins</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <UserPlus className="w-5 h-5 text-emerald-600" /> Create Staff Account
            </CardTitle>
            <CardDescription>
              The staff member will log in with their email and the 6-digit PIN you set here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="staff-name" className="text-xs">Full name</Label>
                  <Input id="staff-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Dr. Mensah" className="h-10" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-email" className="text-xs">Email (login username)</Label>
                  <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@hospital.gov" className="h-10" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-pin" className="text-xs">6-digit PIN</Label>
                  <Input id="staff-pin" inputMode="numeric" pattern="\d{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••••" className="h-10 tracking-[0.3em] text-center font-semibold" required />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Role</Label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-md border border-input bg-transparent px-3 text-sm">
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 sm:w-auto sm:px-8" disabled={creating}>
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Users className="w-5 h-5 text-emerald-600" /> Current Staff
            </CardTitle>
            <CardDescription>Everyone with staff dashboard access.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : staffList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No staff accounts yet.</p>
            ) : (
              <div className="divide-y">
                {staffList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.role === "admin" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {s.role === "admin" ? "Admin" : "Staff"}
                      </span>
                      {resettingId === s.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            inputMode="numeric"
                            maxLength={6}
                            value={newResetPin}
                            onChange={(e) => setNewResetPin(e.target.value.replace(/\D/g, ""))}
                            placeholder="New PIN"
                            className="h-8 w-20 text-xs tracking-widest text-center"
                          />
                          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleResetPin(s.id)}>
                            Save
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setResettingId(null); setNewResetPin(""); }}>
                            <ArrowLeft className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-700" onClick={() => { setResettingId(s.id); setNewResetPin(""); }}>
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}