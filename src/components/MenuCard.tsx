import { MenuItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ImageIcon } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem) => void;
}

export function MenuCard({ item, onAddToOrder }: MenuCardProps) {
  const imageUrl = item.image 
    ? `${item.image}?t=${new Date(item.id).getTime()}`
    : null;

  return (
    <Card className="tech-card corner-bracket h-full flex flex-col overflow-hidden bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group">
      
      {/* Image Container with 16:9 Aspect Ratio */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-100">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
            />
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-primary/20 transition-all duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <ImageIcon className="w-10 h-10 text-primary/30" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-4 space-y-3">
        
        {/* Header: Name and Badges */}
        <div className="space-y-2">
          <CardTitle className="text-lg font-black font-ethnocentric uppercase leading-tight tracking-tighter text-foreground">
            {item.name}
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={`inline-flex text-xs px-2.5 py-1 rounded-full border-none uppercase font-bold ${
              item.quantity !== undefined && item.quantity <= 0
                ? 'bg-destructive text-destructive-foreground neon-glow'
                : (item.available ? 'bg-primary text-primary-foreground neon-glow-primary' : 'bg-destructive text-destructive-foreground neon-glow')
            }`}>
              {item.quantity !== undefined && item.quantity <= 0 
                ? "UNAVAILABLE" 
                : (item.available ? "Available" : "Sold Out")}
            </Badge>
            {item.quantity !== undefined && (
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20">
                {item.quantity > 0 ? `${item.quantity} left` : "Out of stock"}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Spacer to push footer down */}
        <div className="flex-grow" />

        {/* Footer: Price and Button */}
        <div className="flex justify-between items-center pt-2 gap-3 border-t border-primary/10">
          <div className="text-2xl font-black text-primary neon-glow">
            ₱{item.price.toFixed(2)}
          </div>
          
          <Button 
            onClick={() => onAddToOrder(item)}
            disabled={!item.available || (item.quantity !== undefined && item.quantity <= 0)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg px-4 py-2 h-auto flex items-center gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:shadow-none neon-glow-primary"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            <span className="text-sm">Add</span>
          </Button>
        </div>

      </div>
    </Card>
  );
}