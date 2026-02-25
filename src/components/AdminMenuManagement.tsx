import { useState } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { MenuItem, MenuCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Edit2, Plus, Upload, X, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { compressImage, createPreviewUrl, validateImageFile } from '@/lib/imageUtils';
import { CustomerFeedbackManagement } from '@/components/CustomerFeedbackManagement';

export function AdminMenuManagement() {
  const { 
    menuItems, 
    menuCategories, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem,
    addMenuCategory,
    deleteMenuCategory,
    error
  } = useMenuStore();

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'item' | 'category'; id: string } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newAddOn, setNewAddOn] = useState('');
  const [newFlavor, setNewFlavor] = useState('');
  const [hoveredAddOnsId, setHoveredAddOnsId] = useState<string | null>(null);
  const [hoveredFlavorId, setHoveredFlavorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'feedback'>('menu');

  // Form state for menu item
  const [itemFormData, setItemFormData] = useState<Omit<MenuItem, 'id'>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true,
    image: '',
    customization: [],
    flavors: [],
  });

  // Form state for category
  const [categoryFormData, setCategoryFormData] = useState<Omit<MenuCategory, 'id'>>({
    name: '',
    description: '',
    icon: '🍽️',
  });

  const handleAddItem = () => {
    setSelectedItem(null);
    setItemFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      available: true,
      image: '',
      customization: [],
      flavors: [],
    });
    setNewAddOn('');
    setNewFlavor('');
    clearImageUpload();
    setIsItemDialogOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setItemFormData(item);
    setNewAddOn('');
    setNewFlavor('');
    setIsItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemFormData.name || !itemFormData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (selectedItem?.id) {
        await updateMenuItem(selectedItem.id, itemFormData, imageFile || undefined);
      } else {
        await addMenuItem(itemFormData, imageFile || undefined);
      }

      setIsItemDialogOpen(false);
      setSelectedItem(null);
      clearImageUpload();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save item';
      alert(errorMsg);
    }
  };

  const handleDeleteItem = async (id: string) => {
    await deleteMenuItem(id);
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    // Validate image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid image');
      return;
    }

    try {
      setIsUploadingImage(true);

      // Create preview
      const preview = await createPreviewUrl(file);
      setImagePreview(preview);

      // Compress image
      const compressedBlob = await compressImage(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.85,
        mimeType: 'image/jpeg',
      });

      // Convert blob back to File
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg',
      });

      setImageFile(compressedFile);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process image';
      setImageError(errorMsg);
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const clearImageUpload = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
  };

  const handleAddAddOn = () => {
    if (newAddOn.trim()) {
      setItemFormData({
        ...itemFormData,
        customization: [...(itemFormData.customization || []), newAddOn.trim()]
      });
      setNewAddOn('');
    }
  };

  const handleRemoveAddOn = (index: number) => {
    setItemFormData({
      ...itemFormData,
      customization: (itemFormData.customization || []).filter((_, i) => i !== index)
    });
  };

  const handleAddFlavor = () => {
    if (newFlavor.trim()) {
      setItemFormData({
        ...itemFormData,
        flavors: [...(itemFormData.flavors || []), newFlavor.trim()]
      });
      setNewFlavor('');
    }
  };

  const handleRemoveFlavor = (index: number) => {
    setItemFormData({
      ...itemFormData,
      flavors: (itemFormData.flavors || []).filter((_, i) => i !== index)
    });
  };

  const handleAddCategory = () => {
    setCategoryFormData({
      name: '',
      description: '',
      icon: '🍽️',
    });
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name) {
      alert('Please enter a category name');
      return;
    }

    await addMenuCategory(categoryFormData);
    setIsCategoryDialogOpen(false);
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteMenuCategory(id);
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'menu' | 'feedback')} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="menu">Menu Management</TabsTrigger>
        <TabsTrigger value="feedback">Customer Feedback</TabsTrigger>
      </TabsList>

      <TabsContent value="menu">
        <div className="space-y-8 relative">  {/* eto yung width container */}
      {/* Background effects */}
      <div className="absolute top-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-40 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10" />
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 tech-border">
          {error}
        </div>
      )}

      {/* Categories Section */}
      <div>
        <div className="flex items-center justify-between mb-6 -mt-2">
          <h2 className="text-2xl font-bold font-ethnocentric neon-glow cyber-text">
          Menu Categories</h2>
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddCategory} className="gap-2 neon-glow-primary hover:shadow-lg transition-all duration-300">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="tech-card border-primary/30">
              <DialogHeader>
                <DialogTitle className="font-ethnocentric neon-glow text-lg">Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="font-ethnocentric text-sm font-semibold">Category Name *</Label>
                  <Input
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    placeholder="e.g., Drinks"
                    className="tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300 mt-2"
                  />
                </div>
                <div>
                  <Label className="font-ethnocentric text-sm font-semibold">Description</Label>
                  <Textarea
                    value={categoryFormData.description || ''}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    placeholder="e.g., Refreshing beverages"
                    className="tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300 mt-2"
                  />
                </div>
                <div>
                  <Label className="font-ethnocentric text-sm font-semibold">Icon/Emoji</Label>
                  <Input
                    value={categoryFormData.icon}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                    placeholder="🥤"
                    maxLength={2}
                    className="tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300 mt-2"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-6">
                <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} className="border-primary/30 hover:bg-primary/5 transition-colors">
                  Cancel
                </Button>
                <Button onClick={handleSaveCategory} className="bg-primary hover:bg-primary/90 neon-glow-primary transition-all duration-300">Save Category</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menuCategories.map((category) => (
            <div key={category.id} className="tech-card corner-bracket edge-pulse p-4 flex items-center justify-between scan-line overflow-hidden border-primary/20">
              <div className="flex-1 relative z-10">
                <div className="text-3xl mb-2">{category.icon}</div>
                <p className="font-semibold text-sm font-ethnocentric group-hover:text-primary transition-colors">{category.name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDeleteTarget({ type: 'category', id: category.id });
                  setIsDeleteOpen(true);
                }}
                className="hover:bg-primary/20 hover:text-primary transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-ethnocentric neon-glow cyber-text">Menu Items</h2>
          <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddItem} className="gap-2 neon-glow-primary hover:shadow-lg transition-all duration-300">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl tech-card border-primary/30 max-h-[90vh] overflow-y-auto">
              <DialogHeader className="border-b border-primary/20 pb-4">
                <DialogTitle className="font-ethnocentric neon-glow text-2xl">{selectedItem ? '✏️ Edit Menu Item' : '➕ Add New Menu Item'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                {/* Basic Information Section */}
                <div className="space-y-4 pb-4 border-b border-primary/10">
                  <h3 className="font-ethnocentric font-semibold text-primary text-sm">Basic Information</h3>
                  <div>
                    <Label className="font-ethnocentric text-sm font-semibold">Item Name *</Label>
                    <Input
                      value={itemFormData.name}
                      onChange={(e) => {
                        // Remove numbers from item name
                        const value = e.target.value.replace(/[0-9]/g, '');
                        setItemFormData({ ...itemFormData, name: value });
                      }}
                      placeholder="e.g., Fried Chicken"
                      className="tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300 mt-2"
                    />
                  </div>
                  <div>
                    <Label className="font-ethnocentric text-sm font-semibold">Description</Label>
                    <Textarea
                      value={itemFormData.description}
                      onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                      placeholder="Describe the item"
                      className="tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300 mt-2 resize-none h-24"
                    />
                  </div>
                </div>

                {/* Image Section */}
                <div className="space-y-3 pb-4 border-b border-primary/10">
                  <h3 className="font-ethnocentric font-semibold text-primary text-sm">📸 Product Image</h3>
                  <div className="mt-2 space-y-3">
                    {imageError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 tech-border">
                        {imageError}
                      </div>
                    )}
                    
                    {imagePreview ? (
                      <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-primary/40 tech-card shadow-lg">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover object-center"
                        />
                        <button
                          type="button"
                          onClick={clearImageUpload}
                          className="absolute top-2 right-2 p-2 bg-primary hover:bg-primary/90 text-white rounded-full transition-colors neon-glow-primary shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                          {(imageFile?.size || 0) > 0 ? `${(imageFile!.size / 1024).toFixed(1)}KB` : 'Preview'}
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="block w-full h-64 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 cursor-pointer tech-card"
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <Upload className="w-10 h-10 text-primary/40 mx-auto mb-3" />
                              <p className="text-sm font-semibold text-foreground">
                                {isUploadingImage ? 'Processing image...' : 'Click to upload image'}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG, WebP (Max 10MB)</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing & Stock Section */}
                <div className="space-y-4 pb-4 border-b border-primary/10">
                  <h3 className="font-ethnocentric font-semibold text-primary text-sm">💰 Pricing & Stock</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-ethnocentric text-sm font-semibold">Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={itemFormData.price || ''}
                        onChange={(e) => {
                          let price = parseFloat(e.target.value) || 0;
                          // Ensure price is not negative
                          if (price < 0) price = 0;
                          setItemFormData({ ...itemFormData, price });
                        }}
                        placeholder="0.00"
                        className="tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300 mt-2"
                      />
                    </div>
                    <div>
                      <Label className="font-ethnocentric text-sm font-semibold">Stock Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={itemFormData.quantity || 0}
                        onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className="tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300 mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Category & Availability Section */}
                <div className="space-y-4 pb-4 border-b border-primary/10">
                  <h3 className="font-ethnocentric font-semibold text-primary text-sm">🏷️ Category & Status</h3>
                  <div>
                    <Label className="font-ethnocentric text-sm font-semibold">Category *</Label>
                    <Select value={itemFormData.category} onValueChange={(value) => setItemFormData({ ...itemFormData, category: value })}>
                      <SelectTrigger className="tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300 mt-2">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="tech-card border-primary/30">
                        {menuCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Checkbox
                      id="available"
                      checked={itemFormData.available}
                      onCheckedChange={(checked) => setItemFormData({ ...itemFormData, available: checked as boolean })}
                    />
                    <Label htmlFor="available" className="font-ethnocentric cursor-pointer flex-1 mb-0">
                      {itemFormData.available ? '✅ Available for Order' : '⏸️ Unavailable'}
                    </Label>
                  </div>
                </div>

                {/* Add-ons Section */}
                <div className="space-y-3">
                  <h3 className="font-ethnocentric font-semibold text-primary text-sm">🎯 Customizations</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newAddOn}
                        onChange={(e) => setNewAddOn(e.target.value)}
                        placeholder="e.g., Extra Spicy, Mild, Large Size"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddAddOn()}
                        className="tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300"
                      />
                      <Button
                        type="button"
                        onClick={handleAddAddOn}
                        variant="secondary"
                        size="sm"
                        className="bg-accent/20 hover:bg-accent/40 text-accent-foreground transition-colors font-semibold"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {(itemFormData.customization && itemFormData.customization.length > 0) && (
                      <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground font-ethnocentric font-semibold">Added customizations:</p>
                        <div className="flex flex-wrap gap-2">
                          {itemFormData.customization.map((addOn, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-2 bg-primary/30 text-foreground px-3 py-1.5 rounded-full text-sm border border-primary/50 hover:bg-primary/40 transition-colors"
                            >
                              <span className="font-ethnocentric">{addOn}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAddOn(index)}
                                className="ml-1 hover:text-primary transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Flavors Section */}
                <div className="space-y-3 pb-4 border-b border-primary/10">
                  <h3 className="font-ethnocentric font-semibold text-primary text-sm">Flavors</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newFlavor}
                        onChange={(e) => setNewFlavor(e.target.value)}
                        placeholder="e.g., Vanilla, Chocolate, Strawberry"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddFlavor()}
                        className="tech-border border-primary/30 focus:neon-glow-primary transition-all duration-300"
                      />
                      <Button
                        type="button"
                        onClick={handleAddFlavor}
                        variant="secondary"
                        size="sm"
                        className="bg-secondary/20 hover:bg-secondary/40 text-secondary-foreground transition-colors font-semibold"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {(itemFormData.flavors && itemFormData.flavors.length > 0) && (
                      <div className="space-y-2 p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                        <p className="text-xs text-muted-foreground font-ethnocentric font-semibold">Added flavors:</p>
                        <div className="flex flex-wrap gap-2">
                          {itemFormData.flavors.map((flavor, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-2 bg-secondary/30 text-foreground px-3 py-1.5 rounded-full text-sm border border-secondary/50 hover:bg-secondary/40 transition-colors"
                            >
                              <span className="font-ethnocentric">{flavor}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFlavor(index)}
                                className="ml-1 hover:text-secondary transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-6 border-t border-primary/20 mt-6">
                <Button variant="outline" onClick={() => setIsItemDialogOpen(false)} className="border-primary/30 hover:bg-primary/5 transition-colors font-semibold">
                  Cancel
                </Button>
                <Button onClick={handleSaveItem} className="bg-primary hover:bg-primary/90 neon-glow-primary transition-all duration-300 font-semibold">
                  {selectedItem ? '💾 Update Item' : '➕ Add Item'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {menuItems.map((item) => (
            <div key={item.id} className="tech-card corner-bracket scan-line p-0 overflow-hidden flex flex-col border-primary/30 hover:border-primary/50 transition-all duration-300 group h-full">
              {item.image && (
                <div className="w-full h-56 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              {!item.image && (
                <div className="w-full h-56 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/15 transition-colors">
                  <Package className="w-12 h-12 text-primary/30" />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1 relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base font-ethnocentric group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                      className="hover:bg-primary/20 hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteTarget({ type: 'item', id: item.id });
                        setIsDeleteOpen(true);
                      }}
                      className="hover:bg-red-500/20 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-xs border-t border-primary/10 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-ethnocentric font-bold text-primary">₱{item.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-ethnocentric">{menuCategories.find(c => c.id === item.category)?.name || item.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-ethnocentric font">{item.quantity || 0} units</span>
                  </div>
                  {item.customization && item.customization.length > 0 ? (
                    <div className="w-full border-t border-primary/10 mt-3 h-10 flex items-center px-3">
                      <Popover open={hoveredAddOnsId === `${item.id}-addon`} onOpenChange={(open) => {
                        if (!open) setHoveredAddOnsId(null);
                      }}>
                        <PopoverTrigger asChild>
                          <button 
                            onMouseEnter={() => setHoveredAddOnsId(`${item.id}-addon`)}
                            onMouseLeave={() => setHoveredAddOnsId(null)}
                            className="text-xs bg-accent/30 hover:bg-accent/50 text-accent-foreground px-4 py-1.5 rounded border border-accent/50 font-ethnocentric font-semibold transition-colors cursor-default"
                          >
                            ADD ONS ({item.customization.length})
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto tech-card border-primary/30 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                              <span className="text-lg">🎯</span>
                              <p className="text-xs font-ethnocentric font-semibold text-primary">CUSTOMIZATIONS (ADD-ONS)</p>
                            </div>
                            <div className="space-y-1.5">
                              {item.customization.map((addon, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm bg-primary/10 px-3 py-2 rounded border border-primary/20 hover:bg-primary/20 transition-colors">
                                  <span className="text-primary font-bold">✓</span>
                                  <span className="font-ethnocentric">{addon}</span>

                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div className="w-full border-t border-primary/10 mt-3 h-10 flex items-center px-3">
                      <span className="text-xs font-ethnocentric text-muted-foreground/50">No add-ons</span>
                    </div>
                  )}

                  {item.flavors && item.flavors.length > 0 ? (
                    <div className="w-full border-t border-primary/10 mt-2 h-10 flex items-center px-3">
                      <Popover open={hoveredFlavorId === `${item.id}-flavor`} onOpenChange={(open) => {
                        if (!open) setHoveredFlavorId(null);
                      }}>
                        <PopoverTrigger asChild>
                          <button 
                            onMouseEnter={() => setHoveredFlavorId(`${item.id}-flavor`)}
                            onMouseLeave={() => setHoveredFlavorId(null)}
                            className="text-xs bg-accent/30 hover:bg-accent/50 text-accent-foreground px-4 py-1.5 rounded border border-accent/50 font-ethnocentric font-semibold transition-colors cursor-default"
                          >
                            FLAVORS ({item.flavors.length})
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto tech-card border-accent/30 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-accent/20 pb-2">
                              <span className="text-lg">🍨</span>
                              <p className="text-xs font-ethnocentric font-semibold text-primary">FLAVORS</p>
                            </div>
                            <div className="space-y-1.5">
                              {item.flavors.map((flavor, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm bg-accent/10 px-3 py-2 rounded border border-accent/20 hover:bg-accent/20 transition-colors">
                                  <span className="text-accent font-bold">✓</span>
                                  <span className="font-ethnocentric">{flavor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div className="w-full border-t border-primary/10 mt-2 h-10 flex items-center px-3">
                      <span className="text-xs font-ethnocentric text-muted-foreground/50">No flavors</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-primary/10 mt-3">
                    <span className={`text-xs px-2 py-1 rounded border font-ethnocentric ${item.available ? 'bg-green-500/20 text-green-600 border-green-500/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded border font-ethnocentric ${item.quantity === 0 ? 'bg-red-500/20 text-red-600 border-red-500/30' : item.quantity && item.quantity < 10 ? 'bg-accent/30 text-accent-foreground border-accent/50' : 'bg-green-500/20 text-green-600 border-green-500/30'}`}>
                      {item.quantity === 0 ? 'Out of Stock' : item.quantity && item.quantity < 10 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="tech-card border-primary/30">
          <AlertDialogTitle className="font-ethnocentric neon-glow">
            Delete {deleteTarget?.type === 'item' ? 'Menu Item' : 'Category'}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end pt-4">
            <AlertDialogCancel className="border-primary/30 hover:bg-primary/5 transition-colors">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  if (deleteTarget.type === 'item') {
                    handleDeleteItem(deleteTarget.id);
                  } else {
                    handleDeleteCategory(deleteTarget.id);
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700 transition-colors"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </TabsContent>

      <TabsContent value="feedback">
        <CustomerFeedbackManagement />
      </TabsContent>
    </Tabs>
  );
}
