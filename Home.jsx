import React, { useEffect, useState } from "react";
import { api } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import MenuItemCard from "@/components/MenuItemCard";
import CategoryNav from "@/components/CategoryNav";
import CartDrawer from "@/components/CartDrawer";
import GGSHDialog from "@/components/GGSHDialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, UtensilsCrossed, CheckCircle2, Loader2, ClipboardList, BarChart3, Receipt, BookOpen, User, LogOut, UserCog } from "lucide-react";
import { Link } from "react-router-dom";
import { useClientAuth } from "@/lib/ClientAuthContext";
import { useStaffAuth } from "@/lib/StaffAuthContext";

export default function Home() {
  const { toast } = useToast();
  const { client, logoutClient } = useClientAuth();
  const { staff } = useStaffAuth();
  const isAdmin = staff?.role === "admin";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("All");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [ggshOpen, setGgshOpen] = useState(false);
  const [ggshPhone, setGgshPhone] = useState("");
  const [ggshTotal, setGgshTotal] = useState(0);

  useEffect(() => {
    api.get("/api/menu")
      .then((res) => setItems(res.data))
      .catch(() => toast({ title: "Could not load menu", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      const orderId = params.get("order");
      if (orderId) {
        api.get(`/api/orders/${orderId}`).then((res) => setLastOrder(res.data)).catch(() => {});
      }
      toast({ title: "Payment successful!", description: "Your order is being prepared." });
      window.history.replaceState({}, "", "/");
    } else if (payment === "cancelled") {
      toast({ title: "Payment cancelled", description: "Your cart was saved.", variant: "destructive" });
      window.history.replaceState({}, "", "/");
    } else if (payment === "paystack") {
      const reference = params.get("reference");
      if (reference) {
        api.post("/api/payments/paystack/verify", { reference })
          .then((res) => {
            if (res.data?.success) {
              const orderId = res.data.order_id;
              if (orderId) api.get(`/api/orders/${orderId}`).then((r) => setLastOrder(r.data)).catch(() => {});
              toast({ title: "MoMo payment successful!", description: "Your order is being prepared." });
            } else {
              toast({ title: "Payment not completed", description: "Please try again.", variant: "destructive" });
            }
          })
          .catch(() => toast({ title: "Payment verification failed", description: "Please contact support.", variant: "destructive" }));
      }
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const counts = items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    acc.All = (acc.All || 0) + 1;
    return acc;
  }, {});

  const available = items.filter((i) => i.is_available);
  const filtered = activeCat === "All" ? available : available.filter((i) => i.category === activeCat);
  const specials = available.filter((i) => i.is_special);

  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((c) => c.name === item.name);
      if (found) return prev.map((c) => c.name === item.name ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { name: item.name, price: item.price, quantity: 1 }];
    });
    toast({ title: `${item.name} added`, duration: 1500 });
  };

  const changeQty = (name, qty) => {
    if (qty <= 0) setCart((prev) => prev.filter((c) => c.name !== name));
    else setCart((prev) => prev.map((c) => c.name === name ? { ...c, quantity: qty } : c));
  };

  const removeFromCart = (name) => setCart((prev) => prev.filter((c) => c.name !== name));

  const placeOrder = async ({ customer_name, pickup_note, momoSuccess, cashPayment, ggshPayment, client_phone }) => {
    if (momoSuccess) {
      setCart([]); setCartOpen(false);
      toast({ title: "MoMo payment successful!", description: "Your order is being prepared." });
      return;
    }
    if (cashPayment || ggshPayment) {
      setSubmitting(true);
      const orderItems = cart.map((c) => ({ name: c.name, price: c.price, quantity: c.quantity }));
      setCart([]); setCartOpen(false);
      try {
        const res = await api.post("/api/orders", {
          customer_name, items: orderItems, pickup_note,
          payment_method: ggshPayment ? "ggsh_ussd" : "cash",
          client_phone: client_phone || "",
        });
        setLastOrder(res.data);
        if (ggshPayment) {
          setGgshPhone(client_phone || "");
          setGgshTotal(res.data.total);
          setGgshOpen(true);
          toast({ title: "Order placed!", description: "Dial the USSD code to complete payment." });
        } else {
          toast({ title: "Order confirmed!", description: "Pay at the pickup counter. Your order is being tracked." });
        }
      } catch {
        toast({ title: "Order failed", description: "Please try again.", variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setSubmitting(true);
    try {
      const orderItems = cart.map((c) => ({ name: c.name, price: c.price, quantity: c.quantity }));
      const res = await api.post("/api/payments/stripe/create-checkout-session", {
        items: orderItems, customer_name, pickup_note,
      });
      if (res.data?.url) {
        setCart([]); setCartOpen(false);
        window.location.href = res.data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch {
      toast({ title: "Checkout failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-background to-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-[15px] leading-none">GGSH Canteen</h1>
              <p className="text-[11px] text-muted-foreground">Hospital cafeteria</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {client && (
              <Link to="/order-history">
                <Button variant="ghost" size="icon" className="rounded-full"><Receipt className="w-4 h-4" /></Button>
              </Link>
            )}
            {isAdmin && (
              <>
                <Link to="/analytics"><Button variant="ghost" size="icon" className="rounded-full"><BarChart3 className="w-4 h-4" /></Button></Link>
                <Link to="/menu-management"><Button variant="ghost" size="icon" className="rounded-full"><BookOpen className="w-4 h-4" /></Button></Link>
                <Link to="/staff"><Button variant="ghost" size="icon" className="rounded-full"><UserCog className="w-4 h-4" /></Button></Link>
                <Link to="/orders"><Button variant="outline" size="sm" className="rounded-full"><ClipboardList className="w-4 h-4 mr-1.5" /> Orders</Button></Link>
              </>
            )}
            {!isAdmin && !staff && (
              <Link to="/staff-login">
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground"><ClipboardList className="w-4 h-4 mr-1.5" /> Staff</Button>
              </Link>
            )}
            {staff && !isAdmin && (
              <Link to="/orders"><Button variant="outline" size="sm" className="rounded-full"><ClipboardList className="w-4 h-4 mr-1.5" /> Orders</Button></Link>
            )}
            {client ? (
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium hidden sm:inline">{client.full_name}</span>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={logoutClient}><LogOut className="w-4 h-4" /></Button>
              </div>
            ) : (
              <Link to="/client-login"><Button variant="outline" size="sm" className="rounded-full"><User className="w-4 h-4 mr-1.5" /> Login</Button></Link>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          <div className="relative rounded-3xl overflow-hidden text-white p-8 sm:p-12 min-h-[260px] flex items-center">
            <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80" alt="Fresh cafeteria meals" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/75 to-blue-700/40" />
            <div className="relative max-w-lg">
              <span className="inline-block bg-white/15 backdrop-blur-sm text-[11px] font-medium px-3 py-1 rounded-full mb-3">Open daily · 6 AM – 8 PM</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold leading-tight mb-2">Fresh meals for our care teams &amp; visitors</h2>
              <p className="text-blue-50/90 text-sm leading-relaxed">Nourishing, affordable food prepared daily. Place your order and pick it up at the counter — no queue, no waiting.</p>
            </div>
          </div>
        </div>
      </section>

      {specials.length > 0 && !loading && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-5 w-1 bg-blue-600 rounded-full" />
            <h3 className="font-heading font-semibold text-base">Today's Specials</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {specials.map((item) => <MenuItemCard key={item.id} item={item} onAdd={addToCart} />)}
          </div>
        </section>
      )}

      <section className={`max-w-6xl mx-auto px-4 sm:px-6 ${cart.length > 0 ? "pb-28" : "pb-16"}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-5 w-1 bg-blue-600 rounded-full" />
          <h3 className="font-heading font-semibold text-base">Full Menu</h3>
        </div>
        <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          <CategoryNav active={activeCat} onSelect={setActiveCat} counts={counts} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">No items in this category.</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4">
            {filtered.map((item) => <MenuItemCard key={item.id} item={item} onAdd={addToCart} />)}
          </div>
        )}
      </section>

      {cart.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <Button onClick={() => setCartOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg h-12 px-6">
            <ShoppingBag className="w-5 h-5 mr-2" /> View Cart
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {cart.reduce((s, i) => s + i.quantity, 0)} · ₵{cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
            </span>
          </Button>
        </div>
      )}

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} items={cart} onRemove={removeFromCart} onQtyChange={changeQty} onPlaceOrder={placeOrder} submitting={submitting} />

      {lastOrder && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 max-w-sm bg-card border border-blue-200 shadow-lg rounded-2xl p-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Order placed, {lastOrder.customer_name}!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pickup at the counter. Total ₵{lastOrder.total.toFixed(2)}.</p>
              <Button variant="link" className="h-auto p-0 mt-1 text-xs text-blue-700" onClick={() => { setLastOrder(null); setCartOpen(false); }}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}
      <GGSHDialog open={ggshOpen} onOpenChange={setGgshOpen} phone={ggshPhone} total={ggshTotal} />
    </div>
  );
}
