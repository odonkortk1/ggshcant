import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, CheckCircle2 } from "lucide-react";

export default function GGSHDialog({ open, onOpenChange, total }) {
  // Generic USSD code, not tied to any specific customer's phone number.
  const ussdCode = "*713*1332#";
  const dialUrl = `tel:${encodeURIComponent(ussdCode)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Phone className="w-5 h-5 text-blue-600" /> MoMo USSD Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-center bg-blue-50 rounded-lg py-3">
            <p className="text-xs text-muted-foreground">Amount to pay</p>
            <p className="text-2xl font-bold text-blue-700">{"\u20B5"}{total.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Dial this code on your phone to complete payment:</p>
            <div className="text-center bg-muted rounded-lg py-4">
              <p className="text-xl font-bold tracking-wide font-mono">{ussdCode}</p>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-blue-600" /> Your order is placed and being tracked.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2">
          <a href={dialUrl} className="w-full">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Phone className="w-4 h-4 mr-2" /> Dial now
            </Button>
          </a>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
