import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, Flame, CheckCircle2, ChefHat, PackageCheck, Smartphone, Banknote, Phone, Hash } from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "New", color: "text-slate-600", bg: "bg-slate-50", ring: "ring-slate-200", icon: Clock },
  preparing: { label: "In Progress", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200", icon: ChefHat },
  ready: { label: "Ready for Pickup", color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200", icon: PackageCheck },
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", icon: CheckCircle2 },
};

const NEXT_ACTION = {
  pending: { status: "preparing", label: "Start Cooking", icon: Flame, className: "bg-amber-600 hover:bg-amber-700 text-white" },
  preparing: { status: "ready", label: "Mark Ready", icon: PackageCheck, className: "bg-blue-600 hover:bg-blue-700 text-white" },
  ready: { status: "completed", label: "Complete", icon: CheckCircle2, className: "bg-emerald-600 hover:bg-emerald-700 text-white" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function orderNumber(id) {
  if (!id) return "------";
  return id.replace(/-/g, "").slice(-6).toUpperCase();
}

export default function OrderCard({ order, onAdvance }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const action = NEXT_ACTION[order.status];
  const Icon = cfg.icon;
  const isCash = order.payment_method === "cash";

  return (
    <div className={`rounded-2xl bg-card border shadow-sm p-4 ring-1 ${cfg.ring} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-mono font-semibold text-muted-foreground flex items-center gap-1">
            <Hash className="w-2.5 h-2.5" /> {orderNumber(order.id)}
          </p>
          <p className="font-heading font-semibold text-sm leading-tight">{order.customer_name}</p>
          {order.client_phone && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {order.client_phone}</p>
          )}
          <p className="text-[11px] text-muted-foreground">{timeAgo(order.created_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-3 h-3" /> {cfg.label}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isCash ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
            {isCash ? <><Banknote className="w-2.5 h-2.5" /> Cash</> : <><Smartphone className="w-2.5 h-2.5" /> MoMo</>}
          </span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5">
        {order.items?.slice(0, 3).map((it, i) => (
          <div key={i} className="flex justify-between"><span>{it.quantity}x {it.name}</span><span>{"\u20B5"}{(it.price * it.quantity).toFixed(2)}</span></div>
        ))}
        {order.items?.length > 3 && <p className="text-[11px] italic">+{order.items.length - 3} more</p>}
      </div>

      {order.pickup_note && <p className="text-[11px] bg-muted/50 rounded-md px-2 py-1 text-muted-foreground">Note: {order.pickup_note}</p>}

      <div className="flex items-center justify-between pt-1 border-t">
        <span className="text-sm font-bold">{"\u20B5"}{order.total?.toFixed(2)}</span>
        {action && (
          <Button size="sm" className={action.className} onClick={() => onAdvance(order, action.status)}>
            <action.icon className="w-3.5 h-3.5 mr-1" /> {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
