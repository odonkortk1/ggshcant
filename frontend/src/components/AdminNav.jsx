import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ClipboardList, TrendingUp, UtensilsCrossed, History } from "lucide-react";

const TABS = [
  { path: "/orders", label: "Orders", icon: ClipboardList },
  { path: "/analytics", label: "Analytics", icon: TrendingUp },
  { path: "/menu-management", label: "Menu", icon: UtensilsCrossed },
  { path: "/order-history", label: "History", icon: History },
];

export default function AdminNav() {
  const location = useLocation();
  return (
    <nav className="sticky top-16 z-20 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}