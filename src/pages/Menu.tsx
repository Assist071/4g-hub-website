import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuCard } from '@/components/MenuCard';
import { OrderCart } from '@/components/OrderCart';
import { useOrderStore } from '@/store/orderStore';
import { useMenuData } from '@/hooks/useMenuData';
import { MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Utensils, Plus, Loader, Monitor, ChefHat, ArrowLeft } from 'lucide-react';

export default function Menu() {
  const { addToOrder } = useOrderStore();
  const { menuItems, menuCategories, loading, error } = useMenuData();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleAddToOrder = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setSelectedCustomizations([]);
    setSelectedFlavors([]);
    setNotes('');
    setIsDialogOpen(true);
  };

  const handleConfirmAdd = () => {
    if (selectedItem) {
      addToOrder(selectedItem, quantity, selectedCustomizations, notes, selectedFlavors);
      setIsDialogOpen(false);
      setSelectedItem(null);
    }
  };

  const handleCustomizationChange = (option: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomizations(prev => [...prev, option]);
    } else {
      setSelectedCustomizations(prev => prev.filter(item => item !== option));
    }
  };

  const handleFlavorChange = (flavor: string, checked: boolean) => {
    if (checked) {
      setSelectedFlavors(prev => [...prev, flavor]);
    } else {
      setSelectedFlavors(prev => prev.filter(item => item !== flavor));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern relative">
      {/* Decorative gradient overlays */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl -z-10" />
      
      {/* Header Navigation */}
        <div className="container mx-auto px-4 py-6 md:py-8 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary neon-glow">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold cyber-text neon-glow">Select Your Order</h1>
          <div className="w-16" />
        </div>
     

      {/* Loading State */}
      {loading && (
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3 tech-card corner-bracket p-8">
            <Loader className="w-8 h-8 animate-spin text-primary neon-glow" />
            <p className="text-muted-foreground">Loading menu...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="container mx-auto px-4 py-6">
          <div className="tech-card corner-bracket border-2 border-destructive/50 p-6">
            <p className="text-destructive font-semibold">Failed to load menu: {error}</p>
          </div>
        </div>
      )}

      {/* Menu Content */}
      {!loading && !error && (
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Menu Section */}
          <div className="lg:col-span-3 space-y-10">
            {/* Category Filter Header */}
            <div className="space-y-5">
              <div>
                <h2 className="text-3xl font-bold cyber-text neon-glow mb-2">Menu Categories</h2>
                <p className="text-muted-foreground">Choose a category or browse all items</p>
              </div>
              
              {/* Category Buttons with Tech Style */}
              <div className="flex flex-wrap gap-4">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  className={`gap-2 font-bold border-2 transition-all duration-300 ${
                    selectedCategory === 'all' 
                      ? 'neon-glow-primary border-primary bg-primary text-primary-foreground' 
                      : 'border-primary/50 hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <Utensils className="h-4 w-4" />
                  <span>All Items</span>
                  <Badge variant={selectedCategory === 'all' ? 'secondary' : 'outline'} className="ml-2">
                    {menuItems.length}
                  </Badge>
                </Button>
                {menuCategories.map((category, idx) => {
                  const count = menuItems.filter(item => item.category === category.id).length;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`gap-2 font-bold border-2 transition-all duration-300 ${
                        selectedCategory === category.id 
                          ? 'neon-glow-primary border-primary bg-primary text-primary-foreground' 
                          : 'border-primary/50 hover:border-primary hover:bg-primary/5'
                      }`}
                      style={{
                        animationDelay: selectedCategory === category.id ? '0ms' : `${idx * 50}ms`
                      }}
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                      <Badge variant={selectedCategory === category.id ? 'secondary' : 'outline'} className="ml-2">
                        {count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="space-y-6">
              {filteredItems.length > 0 ? (
                <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item, idx) => (
                    <div 
                      key={item.id}
                      className="edge-pulse"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <MenuCard
                        item={item}
                        onAddToOrder={handleAddToOrder}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tech-card corner-bracket edge-pulse p-12 text-center">
                  <Utensils className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground text-lg">No items found in this category</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedCategory('all')}
                    className="mt-4 gap-2 border-primary/50 hover:border-primary"
                  >
                    View All Items
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Order Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="tech-card corner-bracket edge-pulse p-0 overflow-hidden">
                <OrderCart />
              </div>
            </div>
          </div>
        </div>

        {/* Add to Order Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md tech-card corner-bracket border-2 border-primary/50">
            <DialogHeader>
              <DialogTitle className="cyber-text neon-glow text-2xl">Add to Order</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-6">
                <div className="tech-card p-4 border border-primary/30">
                  <h3 className="font-bold text-xl mb-2 cyber-text">{selectedItem.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{selectedItem.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary neon-glow">₱{selectedItem.price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">per item</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-semibold">Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="border-primary/50 hover:border-primary"
                    >
                      −
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="text-center border-primary/50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="border-primary/50 hover:border-primary"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {selectedItem.customization && selectedItem.customization.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Customization Options</Label>
                    <div className="tech-card p-4 border border-primary/30 space-y-3">
                      {selectedItem.customization.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={option}
                            checked={selectedCustomizations.includes(option)}
                            onCheckedChange={(checked) => 
                              handleCustomizationChange(option, !!checked)
                            }
                            className="border-primary/50"
                          />
                          <Label htmlFor={option} className="text-sm font-normal cursor-pointer">{option}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.flavors && selectedItem.flavors.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Flavors</Label>
                    <div className="tech-card p-4 border border-primary/30 space-y-3">
                      {selectedItem.flavors.map((flavor) => (
                        <div key={flavor} className="flex items-center space-x-2">
                          <Checkbox
                            id={flavor}
                            checked={selectedFlavors.includes(flavor)}
                            onCheckedChange={(checked) => 
                              handleFlavorChange(flavor, !!checked)
                            }
                            className="border-primary/50"
                          />
                          <Label htmlFor={flavor} className="text-sm font-normal cursor-pointer">{flavor}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold">Special Instructions (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requests or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="border-primary/50 text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-primary/20 space-y-3">
                  <div className="tech-card p-4 bg-primary/5 border border-primary/30 flex justify-between items-center">
                    <span className="text-sm font-semibold text-muted-foreground">Total Amount</span>
                    <div className="text-2xl font-bold text-primary neon-glow">
                      ₱{(selectedItem.price * quantity).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1 border-primary/50 hover:border-primary"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleConfirmAdd} 
                      className="flex-1 gap-2 font-bold neon-glow-primary hover:shadow-lg transition-all duration-300"
                    >
                      <Plus className="h-4 w-4" />
                      Add to Order
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      )}
    </div>
  );
}