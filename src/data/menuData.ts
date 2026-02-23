import { MenuItem, MenuCategory } from '@/types';

export const menuCategories: MenuCategory[] = [
  { id: 'drinks', name: 'Drinks', description: 'Refreshing beverages', icon: '🥤' },
  { id: 'snacks', name: 'Snacks', description: 'Quick bites', icon: '🍿' },
  { id: 'meals', name: 'Meals', description: 'Full meals', icon: '🍽️' },
  { id: 'desserts', name: 'Desserts', description: 'Sweet treats', icon: '🍰' }
];


export const menuItems: MenuItem[] = [
  // Drinks
  {
    id: 'drink-1',
    name: 'Coke (in can)',
    description: 'Chilled Coca-Cola softdrink',
    price: 15.00,
    category: 'drinks',
    available: true
  },
  {
    id: 'drink-2',
    name: 'Bottled Water',
    description: '500ml purified bottled water',
    price: 15.00,
    category: 'drinks',
    available: true
  },
  {
    id: 'drink-3',
    name: 'Iced Coffee',
    description: 'Ready-to-drink iced coffee',
    price: 25.00,
    category: 'drinks',
    available: true
  },
  {
    id: 'drink-4',
    name: 'Zesto Juice',
    description: 'Zesto tetra pack juice',
    price: 10.00,
    category: 'drinks',
    available: true
  },
  {
    id: 'drink-5',
    name: 'Mountain Dew (in bottle)',
    description: 'Refreshing citrus-flavored softdrink',
    price: 20.00,
    category: 'drinks',
    available: true
  },
  {
    id: 'drink-6',
    name: 'Gulaman Drink',
    description: 'Local sweet jelly drink',
    price: 8.00,
    category: 'drinks',
    available: true
  },

    // Snacks
  {
    id: 'snack-1',
    name: 'Potato Chips',
    description: 'Assorted flavored chips',
    price: 10.00,
    category: 'snacks',
    available: true
  },
  {
    id: 'snack-2',
    name: 'Cup Noodles',
    description: 'Instant cup noodles (beef/chicken)',
    price: 17.00,
    category: 'snacks',
    available: true,
    customization: ['Beef flavor', 'Chicken flavor']
  },
  {
    id: 'snack-3',
    name: 'Pandesal with Palaman',
    description: 'Toasted pandesal with filling',
    price: 4.00,
    category: 'snacks',
    available: true,
    customization: ['Cheese', 'Hotdog', 'Tuna']
  },
  {
    id: 'snack-4',
    name: 'Choco Mucho',
    description: 'Chocolate wafer snack bar',
    price: 8.00,
    category: 'snacks',
    available: true
  },
  {
    id: 'snack-5',
    name: 'Skyflakes + Peanut Butter',
    description: 'Skyflakes crackers with peanut butter spread',
    price: 8.00,
    category: 'snacks',
    available: true
  },
  {
    id: 'snack-6',
    name: 'Tortillos (Small Pack)',
    description: 'Crunchy corn chips - BBQ flavor',
    price: 10.00,
    category: 'snacks',
    available: true
  },

    // Meals
  {
    id: 'meal-1',
    name: 'Pancit Canton',
    description: 'Hot and tasty instant pancit canton',
    price: 14.00,
    category: 'meals',
    available: true,
    customization: ['With Egg', 'With Hotdog']
  },
  {
    id: 'meal-2',
    name: 'Hotdog Sandwich',
    description: 'Hotdog in bun with ketchup and mayo',
    price: 15.00,
    category: 'meals',
    available: true,
    customization: ['Add Cheese', 'Add Egg']
  },
  {
    id: 'meal-3',
    name: 'Rice Meal',
    description: 'Rice with your choice of ulam',
    price: 25.00,
    category: 'meals',
    available: true,
    customization: ['Tocino', 'Longganisa', 'Hotdog']
  },
  {
    id: 'meal-4',
    name: 'Tuna Sandwich',
    description: 'Tuna spread with lettuce on sliced bread',
    price: 15.00,
    category: 'meals',
    available: true
  },
  {
    id: 'meal-5',
    name: 'Fried Egg + Garlic Rice',
    description: 'Simple budget meal with egg',
    price: 25.00,
    category: 'meals',
    available: true
  },
  {
    id: 'meal-6',
    name: 'Burger Steak w/ Rice',
    description: 'Burger patty with gravy on rice',
    price: 25.00,
    category: 'meals',
    available: true
  },


    // Desserts
  {
    id: 'dessert-1',
    name: 'Ice Cream Cup',
    description: 'Small cup of assorted ice cream flavors',
    price: 15.00,
    category: 'desserts',
    available: true
  },
  {
    id: 'dessert-2',
    name: 'Choco Bar',
    description: 'Chocolate-coated ice cream bar',
    price: 15.00,
    category: 'desserts',
    available: true
  },
  {
    id: 'dessert-3',
    name: 'Banana Cue',
    description: 'Fried banana coated in caramelized sugar',
    price: 12.00,
    category: 'desserts',
    available: true
  },
  {
    id: 'dessert-4',
    name: 'Leche Flan',
    description: 'Creamy caramel custard dessert',
    price: 12.00,
    category: 'desserts',
    available: true
  },
  {
    id: 'dessert-5',
    name: 'Graham Balls',
    description: 'Sweet snack with marshmallow inside',
    price: 5.00,
    category: 'desserts',
    available: true
  },
  {
    id: 'dessert-6',
    name: 'Maja Blanca',
    description: 'Coconut pudding with corn and milk',
    price: 5.00,
    category: 'desserts',
    available: true
  }
];