import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Receipt, Clock, Smartphone, Banknote, Phone } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useClientAuth } from "@/lib/ClientAuthContext";
import { useStaffAuth } from "@/lib/StaffAuthContext";
import AdminNav from "@/components/AdminNav";
import moment from "moment";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  preparing: { label: "Preparing", color: "bg-blue-100 text-blue-700" },
  ready: { label: "Ready", color: "bg-purple-100 text-purple-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
};

export default function OrderHistory() {
  const { client, loading: clientLoading } = useClientAuth();
  const { staff, loading: staffLoading } = useStaffAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const isStaff = !!staff;

  useEffect(() => {
    if (isStaff) {
      base44.entities.Order.list("-created_date", 500)
        .then(setOrders)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (client) {
      base44.entities.Order.filter({ client_phone: client.phone_number }, "-created_date", 100)
        .then(setOrders)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [client, isStaff]);

  if (clientLoading || staffLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!client && !isStaff) {
    return <Navigate to="/client-login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-background to-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-[15px] leading-none">Order History</h1>
              <p className="text-[11px] text-muted-foreground">{isStaff ? "All orders" : `${client.full_name}'s orders`}</p>
            </div>
          </div>
        </div>
      </header>

      {isStaff && <AdminNav />}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">{isStaff ? "There are no orders in the system." : "Your placed orders will appear here."}</p>
            {!isStaff && <Link to="/"><Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">Browse Menu</Button></Link>}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isCash = order.payment_method === "cash";
              return (
                <Card key={order.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={status.color}>{status.label}</Badge>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isCash ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
                      }`}>
                        {isCash ? <><Banknote className="w-2.5 h-2.5" /> Cash</> : <><Smartphone className="w-2.5 h-2.5" /> MoMo</>}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {moment(order.created_date).format("MMM D, YYYY · h:mm A")}
                      </span>
                    </div>
                    <span className="font-heading font-bold text-emerald-700">₵{order.total?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium">{order.customer_name}</p>
                    {order.client_phone && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="w-3 h-3" /> {order.client_phone}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.quantity}× {item.name}</span>
                        <span>₵{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {order.pickup_note && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">Note: {order.pickup_note}</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}