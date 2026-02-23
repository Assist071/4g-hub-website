import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type InventoryStatus = 'in-stock' | 'low' | 'out'

export type InventoryItem = {
  id: string
  sku: string
  name: string
  category?: string
  unit: 'pcs' | 'kg' | 'g' | 'l' | 'ml' | 'pack'
  stock: number
  reorderThreshold: number
  costPrice?: number
  sellingPrice?: number
  notes?: string
  updatedAt: number
}

export type StockAdjustment = {
  id: string
  itemId: string
  delta: number // positive for receive, negative for usage/spoilage
  reason: 'receive' | 'usage' | 'spoilage' | 'adjustment'
  note?: string
  createdAt: number
}

type InventoryState = {
  items: Record<string, InventoryItem>
  adjustments: StockAdjustment[]
}

type InventoryActions = {
  addItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'> & { id?: string }) => string
  updateItem: (id: string, patch: Partial<Omit<InventoryItem, 'id'>>) => void
  deleteItem: (id: string) => void
  adjustStock: (itemId: string, delta: number, reason: StockAdjustment['reason'], note?: string) => void
  bulkImport: (items: Array<Omit<InventoryItem, 'updatedAt'>>) => void
  setReorderThreshold: (id: string, threshold: number) => void
  getById: (id: string) => InventoryItem | undefined
  list: () => InventoryItem[]
  lowStockItems: () => InventoryItem[]
  getStatus: (item: InventoryItem) => InventoryStatus
}

const genId = () => Math.random().toString(36).slice(2, 10)

export const useInventoryStore = create<InventoryState & InventoryActions>()(
  persist(
    (set, get) => ({
      items: {},
      adjustments: [],

      addItem: (item) => {
        const id = item.id ?? genId()
        const now = Date.now()
        set((state) => ({
          items: {
            ...state.items,
            [id]: { ...item, id, updatedAt: now },
          },
        }))
        return id
      },

      updateItem: (id, patch) => {
        set((state) => {
          const existing = state.items[id]
          if (!existing) return state
          return {
            items: {
              ...state.items,
              [id]: { ...existing, ...patch, updatedAt: Date.now() },
            },
          }
        })
      },

      deleteItem: (id) => {
        set((state) => {
          const items = { ...state.items }
          delete items[id]
          return { items }
        })
      },

      adjustStock: (itemId, delta, reason, note) => {
        set((state) => {
          const item = state.items[itemId]
          if (!item) return state
          const nextStock = Math.max(0, (item.stock ?? 0) + delta)
          const adj: StockAdjustment = {
            id: genId(),
            itemId,
            delta,
            reason,
            note,
            createdAt: Date.now(),
          }
          return {
            items: { ...state.items, [itemId]: { ...item, stock: nextStock, updatedAt: Date.now() } },
            adjustments: [adj, ...state.adjustments].slice(0, 500),
          }
        })
      },

      bulkImport: (items) => {
        set((state) => {
          const next = { ...state.items }
          const now = Date.now()
          for (const it of items) {
            next[it.id] = { ...it, updatedAt: now }
          }
          return { items: next }
        })
      },

      setReorderThreshold: (id, threshold) => {
        get().updateItem(id, { reorderThreshold: Math.max(0, threshold) })
      },

      getById: (id) => get().items[id],

      list: () => Object.values(get().items).sort((a, b) => a.name.localeCompare(b.name)),

      lowStockItems: () => Object.values(get().items).filter((i) => (i.stock ?? 0) <= (i.reorderThreshold ?? 0)),

      getStatus: (item) => {
        if ((item.stock ?? 0) === 0) return 'out'
        if ((item.stock ?? 0) <= (item.reorderThreshold ?? 0)) return 'low'
        return 'in-stock'
      },
    }),
    { name: 'inventory-store' }
  )
)

// Seed helper for first run (can be invoked in a component once)
export const ensureInventorySeeded = () => {
  const { list, addItem } = useInventoryStore.getState()
  if (list().length > 0) return
  const seed: Omit<InventoryItem, 'updatedAt'>[] = [
    { id: 'ing-001', sku: 'RICE-5KG', name: 'Rice', category: 'Staples', unit: 'kg', stock: 25, reorderThreshold: 10, costPrice: 2.2 },
    { id: 'ing-002', sku: 'CHK-BRST', name: 'Chicken Breast', category: 'Protein', unit: 'kg', stock: 8, reorderThreshold: 5, costPrice: 6.4 },
    { id: 'ing-003', sku: 'OIL-1L', name: 'Cooking Oil', category: 'Staples', unit: 'l', stock: 3, reorderThreshold: 3 },
    { id: 'ing-004', sku: 'TOM-BOX', name: 'Tomato', category: 'Veggies', unit: 'kg', stock: 6, reorderThreshold: 4 },
  ]
  seed.forEach((s) => addItem(s))
}
