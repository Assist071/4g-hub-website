import { useMenuStore } from '@/store/menuStore';
import { useMenuData } from '@/hooks/useMenuData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Edit2, Search, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function MenuInventory() {
  const { menuItems, menuCategories, loading } = useMenuData();
  const { updateMenuItem } = useMenuStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editQuantity, setEditQuantity] = useState(0);

  const getStockStatus = (quantity: number | undefined) => {
    const qty = quantity || 0;
    if (qty === 0) return { label: 'Out of Stock', color: 'destructive', bgColor: 'bg-red-500/10', icon: AlertTriangle };
    if (qty < 10) return { label: 'Low Stock', color: 'secondary', bgColor: 'bg-yellow-500/10', icon: AlertTriangle };
    return { label: 'In Stock', color: 'default', bgColor: 'bg-green-500/10', icon: CheckCircle2 };
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditStock = (item: any) => {
    setSelectedItem(item);
    setEditQuantity(item.quantity || 0);
    setIsEditOpen(true);
  };

  const handleSaveStock = async () => {
    if (selectedItem) {
      await updateMenuItem(selectedItem.id, { quantity: editQuantity });
      setIsEditOpen(false);
      setSelectedItem(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-pulse flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground font-ethnocentric">Loading inventory...</p>
        </div>
      </div>
    );
  }

  const totalLowStock = menuItems.filter(i => (i.quantity || 0) > 0 && (i.quantity || 0) < 10).length;
  const totalOutOfStock = menuItems.filter(i => (i.quantity || 0) === 0).length;

  return (
    <div className="space-y-8 relative">
      {/* Background effects */}
      <div className="absolute top-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-40 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10" />

      {/* Header Section */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-ethnocentric neon-glow cyber-text">Inventory</h2>
        </div>

        {/* Search Bar */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-semibold text-foreground/80">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" /> Search Items
            </div>
          </Label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/50" />
            <Input
              id="search"
              placeholder="Search by product name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300"
            />
          </div>
        </div>

        {/* Summary Cards - Tech Style */}
        <div className="grid gap-4 md:grid-cols-3 mt-8">
          <div className="tech-card corner-bracket edge-pulse p-6 scan-line overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/20 text-primary w-fit neon-glow-primary">
                  <Package className="h-6 w-6" />
                </div>
                <div className="animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-2 font-ethnocentric">Total Items</p>
              <div className="text-3xl font-bold font-ethnocentric neon-glow">
                {menuItems.length}
              </div>
            </div>
          </div>

          <div className="tech-card corner-bracket edge-pulse p-6 scan-line overflow-hidden delay-100">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-600 w-fit">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                {totalLowStock > 0 && (
                  <div className="animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-2 font-ethnocentric">Low Stock Items</p>
              <div className="text-3xl font-bold font-ethnocentric text-yellow-600">
                {totalLowStock}
              </div>
            </div>
          </div>

          <div className="tech-card corner-bracket edge-pulse p-6 scan-line overflow-hidden delay-200">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-red-500/20 text-red-600 w-fit">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                {totalOutOfStock > 0 && (
                  <div className="animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-2 font-ethnocentric">Out of Stock</p>
              <div className="text-3xl font-bold font-ethnocentric text-red-600">
                {totalOutOfStock}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table - Tech Style */}
      <div className="tech-card corner-bracket scan-line overflow-hidden border-primary/30">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5 hover:bg-primary/5 border-primary/20">
              <TableHead className="font-ethnocentric text-primary font-bold">Product Name</TableHead>
              <TableHead className="font-ethnocentric text-primary font-bold">Category</TableHead>
              <TableHead className="font-ethnocentric text-primary font-bold">Price</TableHead>
              <TableHead className="text-right font-ethnocentric text-primary font-bold">Stock Qty</TableHead>
              <TableHead className="font-ethnocentric text-primary font-bold">Status</TableHead>
              <TableHead className="text-right font-ethnocentric text-primary font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="space-y-2">
                    <Package className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <p className="text-muted-foreground font-ethnocentric">No items found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item, index) => {
                const status = getStockStatus(item.quantity);
                const categoryName = menuCategories.find(c => c.id === item.category)?.name || item.category;
                const StatusIcon = status.icon;
                
                return (
                  <TableRow 
                    key={item.id} 
                    className="border-primary/10 group"
                  >
                    <TableCell className="font-medium font-ethnocentric group-hover:text-primary transition-colors">{item.name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10 transition-colors"
                      >
                        {categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">₱{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-ethnocentric text-lg">{item.quantity || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="w-4 h-4" />
                        <Badge 
                          variant={status.color as any}
                          className={`${status.color === 'destructive' ? 'bg-red-500/20 text-red-600 border-red-500/30' : status.color === 'secondary' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' : 'bg-green-500/20 text-green-600 border-green-500/30'} border`}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={isEditOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                        if (!open) {
                          setIsEditOpen(false);
                          setSelectedItem(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStock(item)}
                            className="hover:bg-primary/20 hover:text-primary transition-colors duration-200 group/btn"
                          >
                            <Edit2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="tech-card border-primary/30">
                          <DialogHeader>
                            <DialogTitle className="font-ethnocentric neon-glow text-lg">
                              Update Stock - {selectedItem?.name}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="quantity" className="font-ethnocentric text-sm font-semibold">
                                Quantity
                              </Label>
                              <Input
                                id="quantity"
                                type="number"
                                min="0"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                className="mt-2 tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300"
                              />
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsEditOpen(false);
                                  setSelectedItem(null);
                                }}
                                className="border-primary/30 hover:bg-primary/5 transition-colors"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleSaveStock}
                                className="bg-primary hover:bg-primary/90 neon-glow-primary transition-all duration-300"
                              >
                                Update Stock
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
