import { useEffect, useMemo, useState } from 'react'
import { ensureInventorySeeded, InventoryItem, useInventoryStore } from '@/store/inventoryStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Upload, PlusCircle } from 'lucide-react'

function exportCSV(items: InventoryItem[]) {
  const headers = ['SKU', 'Name', 'Category', 'Unit', 'Stock', 'Reorder Threshold', 'Cost Price', 'Selling Price', 'Notes']
  const rows = items.map(item => [
    item.sku,
    item.name,
    item.category,
    item.unit,
    item.stock.toString(),
    item.reorderThreshold.toString(),
    item.costPrice?.toString() || '',
    item.sellingPrice?.toString() || '',
    item.notes || ''
  ])
  const csvContent = [headers, ...rows].map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'inventory.csv'
  link.click()
}

function importCSV(event: React.ChangeEvent<HTMLInputElement>, addItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => string, updateItem: (id: string, item: Omit<InventoryItem, 'id' | 'updatedAt'>) => void) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const csv = e.target?.result as string
    const lines = csv.split('\n')
    if (lines.length < 2) return
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
      if (values.length < 9) continue
      const item: Omit<InventoryItem, 'id' | 'updatedAt'> = {
        sku: values[0],
        name: values[1],
        category: values[2],
        unit: values[3] as any,
        stock: parseFloat(values[4]) || 0,
        reorderThreshold: parseFloat(values[5]) || 0,
        costPrice: values[6] ? parseFloat(values[6]) : undefined,
        sellingPrice: values[7] ? parseFloat(values[7]) : undefined,
        notes: values[8]
      }
      addItem(item)
    }
  }
  reader.readAsText(file)
}

function StatusBadge({ item }: { item: InventoryItem }) {
  const status = useInventoryStore((s) => s.getStatus(item))
  const map: Record<string, { label: string; style: string }> = {
    'in-stock': { label: 'In Stock', style: 'bg-green-100 text-green-800' },
    low: { label: 'Low', style: 'bg-yellow-100 text-yellow-800' },
    out: { label: 'Out', style: 'bg-red-100 text-red-800' },
  }
  const s = map[status]
  return <Badge className={s.style}>{s.label}</Badge>
}

function useFilteredItems(query: string, category: string, status: string) {
  const list = useInventoryStore((s) => s.list())
  const getStatus = useInventoryStore((s) => s.getStatus)
  return useMemo(() => {
    return list.filter((i) => {
      const matchesQuery = query
        ? `${i.name} ${i.sku}`.toLowerCase().includes(query.toLowerCase())
        : true
      const matchesCategory = category ? i.category === category : true
      const matchesStatus = status ? getStatus(i) === status : true
      return matchesQuery && matchesCategory && matchesStatus
    })
  }, [list, query, category, status, getStatus])
}

function ItemForm({ initial, onSubmit, onCancel }: { initial?: Partial<InventoryItem>; onSubmit: (data: Omit<InventoryItem, 'id' | 'updatedAt'>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<InventoryItem>>({
    sku: initial?.sku ?? '',
    name: initial?.name ?? '',
    category: initial?.category ?? '',
    unit: (initial?.unit as any) ?? 'pcs',
    stock: initial?.stock ?? 0,
    reorderThreshold: initial?.reorderThreshold ?? 0,
    costPrice: initial?.costPrice ?? undefined,
    sellingPrice: initial?.sellingPrice ?? undefined,
    notes: initial?.notes ?? '',
  })

  return ( 
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const data = form as Omit<InventoryItem, 'id' | 'updatedAt'>
        onSubmit(data)
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>SKU</Label>
          <Input value={form.sku ?? ''} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} required />
        </div>
        <div>
          <Label>Name</Label>
          <Input value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Input value={form.category ?? ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <div>
          <Label>Unit</Label>
          <Select value={String(form.unit)} onValueChange={(v) => setForm((f) => ({ ...f, unit: v as any }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pcs">pcs</SelectItem>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="g">g</SelectItem>
              <SelectItem value="l">l</SelectItem>
              <SelectItem value="ml">ml</SelectItem>
              <SelectItem value="pack">pack</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Stock</Label>
          <Input type="number" value={form.stock ?? 0} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} />
        </div>
        <div>
          <Label>Reorder Threshold</Label>
          <Input type="number" value={form.reorderThreshold ?? 0} onChange={(e) => setForm((f) => ({ ...f, reorderThreshold: Number(e.target.value) }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cost Price</Label>
          <Input type="number" step="0.01" value={form.costPrice ?? ''} onChange={(e) => setForm((f) => ({ ...f, costPrice: Number(e.target.value) }))} />
        </div>
        <div>
          <Label>Selling Price</Label>
          <Input type="number" step="0.01" value={form.sellingPrice ?? ''} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: Number(e.target.value) }))} />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Input value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export default function InventoryManagement() {
  const addItem = useInventoryStore((s) => s.addItem)
  const updateItem = useInventoryStore((s) => s.updateItem)
  const deleteItem = useInventoryStore((s) => s.deleteItem)
  const adjustStock = useInventoryStore((s) => s.adjustStock)
  const list = useInventoryStore((s) => s.list())

  useEffect(() => {
    ensureInventorySeeded()
  }, [])

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const filtered = useFilteredItems(query, category, status)

  const [openAdd, setOpenAdd] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null)

  const categories = Array.from(new Set(list.map((i) => i.category).filter(Boolean))) as string[]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">Inventory Management</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <label className="inline-flex items-center">
              <input type="file" accept=".csv" className="hidden" onChange={(e) => importCSV(e, addItem, updateItem)} />
              <Button asChild variant="outline" size="sm" className="gap-2">
                <span><Upload className="h-4 w-4 inline" /> Import CSV</span>
              </Button>
            </label>
            <Button onClick={() => setOpenAdd(true)} size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
            <div className="flex-1 w-full">
              <Input placeholder="Search by name or SKU" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="out">Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className={item.stock <= item.reorderThreshold ? 'bg-yellow-50' : ''}>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.stock} {item.unit}</TableCell>
                    <TableCell className="text-right">{item.reorderThreshold}</TableCell>
                    <TableCell><StatusBadge item={item} /></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => setAdjusting(item)}>Adjust</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(item)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => { deleteItem(item.id); toast({ title: 'Deleted', description: `${item.name} removed` }) }}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">No items</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Enter details for the new item.</DialogDescription>
          </DialogHeader>
          <ItemForm
            onSubmit={(data) => {
              const id = addItem(data)
              setOpenAdd(false)
              toast({ title: 'Item added', description: `#${id} ${data.name}` })
            }}
            onCancel={() => setOpenAdd(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update inventory details.</DialogDescription>
          </DialogHeader>
          {editing && (
            <ItemForm
              initial={editing}
              onSubmit={(data) => {
                updateItem(editing.id, data)
                setEditing(null)
                toast({ title: 'Updated', description: editing.name })
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={!!adjusting} onOpenChange={(o) => !o && setAdjusting(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>Receive or consume inventory with a reason.</DialogDescription>
          </DialogHeader>
          {adjusting && <AdjustForm item={adjusting} onClose={() => setAdjusting(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdjustForm({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const adjustStock = useInventoryStore((s) => s.adjustStock)
  const [mode, setMode] = useState<'receive' | 'usage' | 'spoilage' | 'adjustment'>('receive')
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const delta = mode === 'receive' ? amount : -Math.abs(amount)
        if (!Number.isFinite(delta) || amount <= 0) {
          toast({ title: 'Invalid amount', variant: 'destructive' })
          return
        }
        adjustStock(item.id, delta, mode, note)
        toast({ title: 'Stock adjusted', description: `${item.name}: ${delta > 0 ? '+' : ''}${delta} ${item.unit}` })
        onClose()
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="receive">Receive</SelectItem>
              <SelectItem value="usage">Usage</SelectItem>
              <SelectItem value="spoilage">Spoilage</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Amount ({item.unit})</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
      </div>
      <div>
        <Label>Note</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Apply</Button>
      </div>
    </form>
  )
}
