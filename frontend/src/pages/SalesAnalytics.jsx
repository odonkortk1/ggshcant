import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, TrendingUp, ShoppingBag, DollarSign, Smartphone, Banknote, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import AdminNav from "@/components/AdminNav";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

const PAY_METHOD_COLORS = { momo: "#7c3aed", cash: "#f59e0b" };

function toISODate(d) { return d.toISOString().split("T")[0]; }
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function orderTotal(order) { return Number(order.total ?? order.total_amount) || 0; }
function isCashOrder(order) { return order.payment_method === "cash"; }
function isCompleted(order) { return String(order.status || "").toLowerCase() === "completed"; }
function revenueDate(order) { return order.updated_at || order.created_at; }

export default function SalesAnalytics() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 29);
  const [startDate, setStartDate] = useState(toISODate(monthAgo));
  const [endDate, setEndDate] = useState(toISODate(today));

  useEffect(() => {
    const loadOrders = () => {
      api.get("/api/orders", { auth: true })
        .then((res) => setOrders(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const applyPreset = (preset) => {
    const now = new Date();
    let s, e = toISODate(now);
    if (preset === "today") s = toISODate(now);
    else if (preset === "week") { const w = new Date(now); w.setDate(w.getDate() - 6); s = toISODate(w); }
    else if (preset === "month") { const m = new Date(now); m.setDate(1); s = toISODate(m); }
    else if (preset === "year") { const y = new Date(now); y.setMonth(0, 1); s = toISODate(y); }
    else if (preset === "all") { s = toISODate(new Date(2000, 0, 1)); e = toISODate(now); }
    setStartDate(s); setEndDate(e);
  };

  const rangeOrders = useMemo(() => {
    const s = startOfDay(new Date(startDate));
    const e = endOfDay(new Date(endDate));
    return orders.filter((o) => {
      const od = new Date(revenueDate(o));
      return isCompleted(o) && od >= s && od <= e;
    });
  }, [orders, startDate, endDate]);

  const totalRevenue = rangeOrders.reduce((s, o) => s + orderTotal(o), 0);
  const totalOrders = rangeOrders.length;

  const momoOrders = rangeOrders.filter((o) => !isCashOrder(o));
  const cashOrders = rangeOrders.filter(isCashOrder);
  const momoRevenue = momoOrders.reduce((s, o) => s + orderTotal(o), 0);
  const cashRevenue = cashOrders.reduce((s, o) => s + orderTotal(o), 0);

  const payMethodData = [
    { name: "MoMo", value: momoRevenue, count: momoOrders.length, color: PAY_METHOD_COLORS.momo },
    { name: "Cash", value: cashRevenue, count: cashOrders.length, color: PAY_METHOD_COLORS.cash },
  ].filter((d) => d.count > 0);

  const itemCounts = {};
  rangeOrders.forEach((o) => {
    o.items?.forEach((it) => { itemCounts[it.name] = (itemCounts[it.name] || 0) + (it.quantity || 1); });
  });
  const topItems = Object.entries(itemCounts).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const chartData = useMemo(() => {
    const s = startOfDay(new Date(startDate));
    const e = endOfDay(new Date(endDate));
    const spanDays = Math.max(1, Math.round((e - s) / 86400000));
    const buckets = [];
    if (spanDays <= 31) {
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const dateStr = toISODate(d);
        const dayOrders = orders.filter((o) => isCompleted(o) && revenueDate(o)?.split("T")[0] === dateStr);
        buckets.push({
          label: new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" }),
          momo: dayOrders.filter((o) => !isCashOrder(o)).reduce((s, o) => s + orderTotal(o), 0),
          cash: dayOrders.filter(isCashOrder).reduce((s, o) => s + orderTotal(o), 0),
        });
      }
    } else {
      const cursor = new Date(s);
      while (cursor <= e) {
        const bEnd = new Date(cursor); bEnd.setDate(bEnd.getDate() + 6); bEnd.setHours(23, 59, 59, 999);
        const weekOrders = orders.filter((o) => { const od = new Date(revenueDate(o)); return isCompleted(o) && od >= cursor && od <= bEnd; });
        buckets.push({
          label: cursor.toLocaleDateString("en", { month: "short", day: "numeric" }),
          momo: weekOrders.filter((o) => !isCashOrder(o)).reduce((s, o) => s + orderTotal(o), 0),
          cash: weekOrders.filter(isCashOrder).reduce((s, o) => s + orderTotal(o), 0),
        });
        cursor.setDate(cursor.getDate() + 7);
      }
    }
    return buckets;
  }, [orders, startDate, endDate]);

  const transactions = [...rangeOrders].sort((a, b) => new Date(revenueDate(b)) - new Date(revenueDate(a))).slice(0, 100);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  const stats = [
    { label: "Revenue", value: `${"\u20B5"}${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Orders", value: totalOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "MoMo Revenue", value: `${"\u20B5"}${momoRevenue.toFixed(2)}`, icon: Smartphone, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Cash Revenue", value: `${"\u20B5"}${cashRevenue.toFixed(2)}`, icon: Banknote, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-background to-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="font-heading font-bold text-[15px] leading-none">Sales Analytics</h1>
              <p className="text-[11px] text-muted-foreground">Cafeteria performance</p>
            </div>
          </div>
        </div>
      </header>

      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-blue-600" /><h3 className="font-heading font-semibold text-sm">Select Date Range</h3></div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="grid gap-1.5"><label className="text-xs text-muted-foreground">From</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 w-full sm:w-44" /></div>
            <div className="grid gap-1.5"><label className="text-xs text-muted-foreground">To</label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 w-full sm:w-44" /></div>
            <div className="flex flex-wrap gap-1.5">
              {[{ key: "today", label: "Today" }, { key: "week", label: "This Week" }, { key: "month", label: "This Month" }, { key: "year", label: "This Year" }, { key: "all", label: "All Time" }].map((p) => (
                <Button key={p.key} variant="outline" size="sm" className="h-9 text-xs" onClick={() => applyPreset(p.key)}>{p.label}</Button>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-4">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-heading font-bold">{s.value}</p>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <h3 className="font-heading font-semibold text-base mb-4">Revenue by Payment Method</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="momoGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${"\u20B5"}${Number(v).toFixed(2)}`} />
                <Area type="monotone" dataKey="momo" stroke="#7c3aed" fill="url(#momoGrad)" strokeWidth={2} name="MoMo" />
                <Area type="monotone" dataKey="cash" stroke="#f59e0b" fill="url(#cashGrad)" strokeWidth={2} name="Cash" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No data in this range</div>}
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-violet-600" /> MoMo</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Cash</span>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-heading font-semibold text-base mb-4">Revenue Split</h3>
            {payMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={payMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}: ${"\u20B5"}${Number(e.value).toFixed(0)}`}>
                    {payMethodData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${"\u20B5"}${Number(v).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">No completed sales in this range</div>}
          </Card>

          <Card className="p-5">
            <h3 className="font-heading font-semibold text-base mb-4">Top Selling Items</h3>
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">No item data</div>}
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-heading font-semibold text-base mb-4">Transactions</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions in this date range.</p>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {transactions.map((o) => {
                const isCash = o.payment_method === "cash";
                return (
                  <div key={o.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{o.customer_name}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isCash ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
                          {isCash ? <><Banknote className="w-2.5 h-2.5" /> Cash</> : <><Smartphone className="w-2.5 h-2.5" /> MoMo</>}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(revenueDate(o)).toLocaleString("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {" . "}{o.items?.length || 0} item(s){" . "}
                        <span className={o.status === "completed" ? "text-emerald-600" : o.status === "pending" ? "text-amber-600" : o.status === "preparing" ? "text-blue-600" : "text-violet-600"}>{o.status}</span>
                      </p>
                    </div>
                    <span className="text-sm font-bold shrink-0">{"\u20B5"}{orderTotal(o).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
