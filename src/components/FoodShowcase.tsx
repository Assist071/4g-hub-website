    import { useMenuData } from '@/hooks/useMenuData';
import { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import './FoodShowcase.css';

const FoodShowcase = () => {
  // Fetch menu items from Supabase
  const { menuItems, menuCategories, loading } = useMenuData();
  const [api, setApi] = useState<any>(null);

  // Keyboard navigation only (no auto-play)
  useEffect(() => {
    if (!api) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        api.scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        api.scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [api]);

  const getCategoryLabel = (categoryId: string) => {
    const category = menuCategories.find(cat => cat.id === categoryId);
    return category?.name || '';
  };

  // Show loading state
  if (loading) {
    return (
      <section className="relative py-16 md:py-28 lg:py-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-40 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 neon-glow cyber-text">
              Featured Foods
            </h2>
            <p className="text-muted-foreground text-lg">Loading menu items...</p>
          </div>
        </div>
      </section>
    );
  }

  // Show empty state if no items
  if (!menuItems || menuItems.length === 0) {
    return (
      <section className="relative py-16 md:py-28 lg:py-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-40 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl md:text-2xl font-bold mb-4 neon-glow cyber-text">
              Featured Foods
            </h2>
            <p className="text-muted-foreground text-lg">No menu items available yet.</p>
          </div>
        </div>
      </section>
    );
  }

  // Use all items from Supabase (will scroll through all available items)

  const getCategoryColor = (categoryId: string): string => {
    switch (categoryId) {
      case 'drinks':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-200/30';
      case 'snacks':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-200/30';
      case 'meals':
        return 'from-red-500/20 to-pink-500/20 border-red-200/30';
      case 'desserts':
        return 'from-purple-500/20 to-pink-500/20 border-purple-200/30';
      default:
        return 'from-slate-500/20 to-gray-500/20 border-slate-200/30';
    }
  };

  const getCategoryBadgeColor = (categoryId: string): string => {
    switch (categoryId) {
      case 'drinks':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'snacks':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'meals':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'desserts':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
    }
  };

  return (
    <section className="relative py-16 md:py-28 lg:py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-40 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 neon-glow cyber-text">
            Featured Foods
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full mx-auto" />
        </div>

        {/* Carousel Container with Enhanced Theme */}
        <div className="relative w-full carousel-theme-container">
          <Carousel 
            className="w-full carousel-wrapper"
            opts={{
              align: "start",
              loop: true,
              duration: 800,
            }}
            setApi={setApi}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {menuItems.map((food) => (
                <CarouselItem key={food.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <div className="food-card group/card h-full">
                    <div
                      className={`
                        relative h-full rounded-2xl border overflow-hidden
                        bg-gradient-to-br ${getCategoryColor(food.category)}
                        backdrop-blur-sm
                        shadow-lg hover:shadow-xl
                        transition-all duration-300
                        group-hover/card:scale-105
                        flex flex-col
                      `}
                    >
                      {/* Food Image Container */}
                      <div className="relative w-full h-48 bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {food.image ? (
                          <>
                            <img
                              src={food.image}
                              alt={food.name}
                              className="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {/* Hover overlay with gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover/card:from-primary/40 transition-all duration-300" />
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                            <div className="text-4xl drop-shadow-lg filter group-hover/card:scale-110 transition-transform duration-300">
                              📦
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="pt-6 px-5 pb-6 space-y-3 flex-1 flex flex-col">
                        {/* Category Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`
                            text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap
                            ${getCategoryBadgeColor(food.category)}
                          `}
                          >
                            {getCategoryLabel(food.category)}
                          </span>
                        </div>

                        {/* Food Name */}
                        <div>
                          <h3 className="font-bold text-sm leading-snug">
                            {food.name}
                          </h3>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {food.description}
                        </p>

                        {/* Price */}
                        <div className="pt-2 border-t border-white/10 mt-auto">
                          <p className="text-lg font-bold text-primary neon-glow">
                            ₱{food.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Controls with Neon Theme */}
            <div className="carousel-controls">
              <CarouselPrevious className="carousel-button-prev" />
              <CarouselNext className="carousel-button-next" />
            </div>
          </Carousel>
        </div>

      </div>
    </section>
  );
};

export default FoodShowcase;
