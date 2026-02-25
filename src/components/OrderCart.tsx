import { useState, useEffect } from 'react';
import { OrderItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, X, ShoppingCart, CheckCircle } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

export function OrderCart() {
  const { 
    currentOrder, 
    removeFromOrder, 
    updateOrderItem, 
    getCurrentOrderTotal, 
    submitOrder,
    clearCurrentOrder 
  } = useOrderStore();

  const total = getCurrentOrderTotal();
  const [pcNumber, setPcNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateQuantity = (item: OrderItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(item.id);
    } else {
      updateOrderItem(item.id, newQuantity, item.customizations, item.notes, item.flavors);
    }
  };

  const handleSubmitOrder = async () => {
    if (currentOrder.length === 0) return;
    if (!pcNumber.trim()) return;
    
    setIsSubmitting(true);
    try {
      const order = await submitOrder(undefined, `PC ${pcNumber.trim()}`);
      setSuccessMessage(`Order #${order.orderNumber} submitted!`);
      setShowSuccess(true);
      setPcNumber('');
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  
  if (currentOrder.length === 0) {
    return (
      <div className="tech-card corner-bracket edge-pulse p-6 h-full flex flex-col items-center justify-center text-center border-primary/20">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-primary/40" />
        <h3 className="font-bold text-lg mb-2 font-ethnocentric">Cart Empty</h3>
        <p className="text-muted-foreground text-sm">Add items from the menu</p>
      </div>
    );
  }

  return (
    <div className="tech-card corner-bracket scan-line p-0 h-full border-primary/20 overflow-hidden flex flex-col bg-gradient-to-b from-card to-card/50">
      <div className="bg-gradient-to-r from-primary/10 to-accent/5 border-b border-primary/20 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/20 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold cyber-text text-primary neon-glow">Order Cart</h2>
              <p className="text-xs text-muted-foreground">{currentOrder.length} item{currentOrder.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearCurrentOrder}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            Clear
          </Button>
        </div>
      </div>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* PC Number Input */}
        <div className="tech-card p-5 border border-primary/30 space-y-3">
          <Label htmlFor="pcNumber" className="text-sm font-semibold">PC Number</Label>
          <Input
            id="pcNumber"
            type="number"
            min="1"
            value={pcNumber}
            onChange={(e) => setPcNumber(e.target.value)}
            placeholder="Enter PC number"
            className="border-primary/50 focus:border-primary focus:ring-primary/30 font-bold text-center text-lg"
          />
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {currentOrder.map((item, idx) => (
            <div 
              key={item.id} 
              className="flex flex-col gap-3 p-4 tech-card border border-primary/20 rounded-lg hover:border-primary/40 transition-colors"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base text-primary leading-tight">{item.menuItem.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">₱{item.menuItem.price.toFixed(2)}</p>
                  {item.customizations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.customizations.slice(0, 2).map((custom, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-primary/30">
                          {custom}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {item.flavors && item.flavors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.flavors.map((flavor, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-primary/30 bg-primary/5">
                           {flavor}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-sm font-bold text-primary neon-glow min-w-[70px] text-right">
                  ₱{(item.menuItem.price * item.quantity).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center justify-between bg-primary/5 p-3 rounded border border-primary/30">
                <span className="text-xs font-semibold text-muted-foreground">Qty:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item, item.quantity - 1)}
                    className="h-8 w-8 p-0 border-primary/50 hover:border-primary hover:bg-primary/10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-base font-bold">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item, item.quantity + 1)}
                    className="h-8 w-8 p-0 border-primary/50 hover:border-primary hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromOrder(item.id)}
                    className="h-8 w-8 p-0 ml-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Footer with Total and Submit */}
      <div className="border-t border-primary/20 bg-gradient-to-t from-primary/5 to-transparent p-6 space-y-4 mt-auto">
        <div className="tech-card p-4 bg-primary/5 border border-primary/30 flex justify-between items-center">
          <span className="text-sm font-semibold text-muted-foreground">Total Amount</span>
          <div className="text-2xl font-bold text-primary neon-glow">
            ₱{total.toFixed(2)}
          </div>
        </div>
        
        {showSuccess && (
          <div className="tech-card p-3 bg-green-50 border border-green-300 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">{successMessage}</span>
          </div>
        )}
        
        <Button 
          onClick={handleSubmitOrder} 
          className="w-full font-bold neon-glow-primary hover:shadow-lg transition-all duration-300 gap-2"
          size="lg"
          disabled={currentOrder.length === 0 || !pcNumber.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              Submitting...
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Place Order
            </>
          )}
        </Button>
      </div>
    </div>
  );
}