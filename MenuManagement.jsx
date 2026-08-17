import React, { useEffect, useState } from "react";
import { api } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";
import MenuItemForm from "@/components/menu-management/MenuItemForm";
import AdminNav from "@/components/AdminNav";

export default function MenuManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/api/menu")
      .then((res) => setItems(res.data))
      .catch(() => toast({ title: "Failed to load menu items", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleAvailable = async (item) => {
    try {
      await api.put(`/api/menu/${item.id}`, { is_available: !item.is_available }, { auth: true });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const toggleSpecial = async (item) => {
    try {
      await api.put(`/api/menu/${item.id}`, { is_special: !item.is_special }, { auth: true });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_special: !i.is_special } : i));
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.delete(`/api/menu/${item.id}`, { auth: true });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast({ title: "Item deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleEdit = (item) => { setEditing(item); setFormOpen(true); };
  const handleAdd = () => { setEditing(null); setFormOpen(true); };

  const handleSave = async (data) => {
    if (editing) {
      await api.put(`/api/menu/${editing.id}`, data, { auth: true });
      toast({ title: "Item updated" });
    } else {
      await api.post("/api/menu", data, { auth: true });
      toast({ title: "Item created" });
    }
    setFormOpen(false);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center"><UtensilsCrossed className="w-5 h-5 text-white" /></div>
              <div>
                <h1 className="font-heading font-bold text-[15px] leading-none">Menu Management</h1>
                <p className="text-[11px] text-muted-foreground">Manage cafeteria items</p>
              </div>
            </div>
          </div>
          <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
            <Plus className="w-4 h-4 mr-1.5" /> Add Item
          </Button>
        </div>
      </header>

      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">No menu items yet.</div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.is_special && <Badge className="bg-amber-100 text-amber-700">Special</Badge>}
                    {!item.is_available && <Badge variant="secondary">Hidden</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.description || "No description"}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-semibold text-emerald-700">₵{item.price?.toFixed(2)}</span>
                    <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground">Available</span><Switch checked={item.is_available} onCheckedChange={() => toggleAvailable(item)} /></div>
                  <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground">Special</span><Switch checked={item.is_special} onCheckedChange={() => toggleSpecial(item)} /></div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MenuItemForm open={formOpen} onOpenChange={setFormOpen} item={editing} onSave={handleSave} />
    </div>
  );
}
