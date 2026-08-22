import React, { useState } from "react";
import { api } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Loader2 } from "lucide-react";

export default function MoMoDialog({ open, onOpenChange, total, items, customerName, pickupNote, clientPhone, onSuccess }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setPhone(""); setLoading(false); setError(""); };
  const handleClose = (open) => { if (!open) reset(); onOpenChange(open); };

  const submitPayment = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/payments/paystack/initialize", {
        items, customer_name: customerName, pickup_note: pickupNote,
        phone_number: phone, client_phone: clientPhone || "",
      });
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        throw new Error(res.data?.error || "Failed to initiate payment");
      }
    } catch (err) {
      setError(err.message || "Payment initiation failed");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading"><Smartphone className="w-5 h-5 text-blue-600" /> Mobile Money Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-center bg-blue-50 rounded-lg py-3">
            <p className="text-xs text-muted-foreground">Amount to pay</p>
            <p className="text-2xl font-bold text-blue-700">{"\u20B5"}{total.toFixed(2)}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="momo-phone" className="text-xs">Phone number</Label>
            <Input id="momo-phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="e.g. 0244123456" className="h-10" inputMode="tel" maxLength={10} />
            {phone.length > 0 && !/^0\d{9}$/.test(phone) && <p className="text-[11px] text-amber-600">Must be 10 digits starting with 0</p>}
            <p className="text-[11px] text-muted-foreground">You'll be redirected to Paystack to approve the mobile money payment on your phone.</p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={!/^0\d{9}$/.test(phone) || loading} onClick={submitPayment}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting...</> : <><Smartphone className="w-4 h-4 mr-2" /> Pay {"\u20B5"}{total.toFixed(2)} via MoMo</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
