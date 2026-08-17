import React from "react";
import { Coffee, Salad, Cookie, CupSoda, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "All", label: "All", icon: Star },
  { id: "Breakfast", label: "Breakfast", icon: Coffee },
  { id: "Lunch", label: "Lunch", icon: Salad },
  { id: "Snacks", label: "Snacks", icon: Cookie },
  { id: "Beverages", label: "Beverages", icon: CupSoda },
];

export default function CategoryNav({ active, onSelect, counts }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {CATEGORIES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border",
            active === id
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-card text-muted-foreground border-border/60 hover:border-blue-300 hover:text-blue-700"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
          {counts && counts[id] > 0 && (
            <span className={cn(
              "text-[10px] px-1.5 rounded-full",
              active === id ? "bg-white/20" : "bg-muted"
            )}>
              {counts[id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}