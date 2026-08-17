import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import OrderCard from "@/components/OrderCard";
import { Link } from "react-router-dom";
import { UtensilsCrossed, RefreshCw, Loader2 } from "lucide-react";
import AdminNav from "@/components/AdminNav";

const COLUMNS = [
  { id: "pending", title: "New Orders", accent: "border-t-slate-400" },
  { id: "preparing", title: "In Progress", accent: "border-t-amber-500" },
  { id: "ready", title: "Ready for Pickup", accent: "border-t-blue-500" },
  { id: "completed", title: "Completed", accent: "border-t-emerald-500" },
];

// The original used Base44's live Order.subscribe() for real-time updates.
// That infrastructure doesn't exist here, so we poll instead.
const POLL_INTERVAL_MS = 8000;

export default function OrderTracking() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(() => {
    setLoading(true);
    api.get("/api/orders?active_only=true", { auth: true })
      .then((res) => setOrders(res.data))
      .catch(() => toast({ title: "Could not load orders", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const advanceOrder = async (order, newStatus) => {
    const prev = orders;
    setOrders((cur) => cur.map((o) => o.id === order.id ? { ...o, status: newStatus } : o));
    try {
      await api.patch(`/api/orders/${order.id}/status`, { status: newStatus }, { auth: true });
      toast({ title: `Order moved to ${newStatus}`, duration: 1500 });
      if (newStatus === "completed") {
        setOrders((cur) => cur.filter((o) => o.id !== order.id));
      }
    } catch {
      setOrders(prev);
      toast({ title: "Failed to update order", variant: "destructive" });
    }
  };

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = orders.filter((o) => o.status === col.id);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center"><UtensilsCrossed className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="font-heading font-bold text-[15px] leading-none">Order Tracking</h1>
              <p className="text-[11px] text-muted-foreground">Staff kitchen dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Link to="/"><Button variant="ghost" size="sm">Menu</Button></Link>
          </div>
        </div>
      </header>

      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex flex-col gap-3">
                <div className={`rounded-xl bg-card border shadow-sm p-3 border-t-4 ${col.accent}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading font-semibold text-sm">{col.title}</h2>
                    <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">{grouped[col.id]?.length || 0}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {grouped[col.id]?.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-xl">No orders</p>
                  ) : (
                    grouped[col.id].map((order) => <OrderCard key={order.id} order={order} onAdvance={advanceOrder} />)
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
