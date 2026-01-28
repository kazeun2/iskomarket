import React, { useEffect, useState, useCallback } from 'react'
import { X, Package, Eye, Calendar, User, MapPin } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { getProducts, subscribeToProducts, ProductWithSeller } from '../lib/services/products'
import { Skeleton } from './ui/skeleton'
import { toast } from 'sonner'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialCount?: number
}

export function ActiveProductsModal({ isOpen, onClose, initialCount, onSelectProduct }: Props & { onSelectProduct?: (p: ProductWithSeller) => void }) {
  const [products, setProducts] = useState<ProductWithSeller[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(null)
    try {
      const all = await getProducts()

      // Filter to "active" criteria consistent with marketplace listing logic
      const active = (all || []).filter((p) => {
        // A product is active if it's explicitly available and not sold, deleted or hidden
        if (p.is_deleted) return false
        if (p.is_hidden) return false
        if (p.is_sold) return false
        if (p.is_available === false) return false
        if ((p as any).is_cvsu_only) return false
        return true
      })

      // Sort newest first
      active.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      if (signal?.aborted) return
      setProducts(active)
    } catch (e: any) {
      const msg = e?.message || String(e)
      setError(msg)
      toast.error(`Failed to load active products: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const controller = new AbortController()

    // Initial load
    load(controller.signal)

    // Subscribe to realtime product changes and refresh when relevant
    const unsubscribe = subscribeToProducts({
      onInsert: (row) => {
        // If inserted row would be active on the server side, reload list
        const shouldShow = !(row.is_deleted || row.is_hidden || row.is_sold || (row as any).is_cvsu_only) && (row.is_available !== false)
        if (shouldShow) load()
      },
      onUpdate: (row) => {
        // Any update could affect active status or visible fields -> reload
        load()
      },
      onDelete: (id) => {
        // Normalize both sides to string to avoid type mismatches
        const sid = String(id);
        setProducts((prev) => prev.filter((p) => String(p.id) !== sid));
      }
    })

    return () => {
      controller.abort()
      try { unsubscribe() } catch (e) { /* ignore */ }
    }
  }, [isOpen, load])

  const formatPrice = (price: number) => {
    try {
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(price)
    } catch (e) {
      return `₱${Number(price || 0).toLocaleString()}`
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
          <div className="pr-12">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Active Products ({products.length ?? (initialCount ?? 0)})
            </DialogTitle>
            <DialogDescription className="sr-only">
              View and manage all active product listings in the marketplace
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted hover:scale-110 transition-all duration-200 absolute top-4 right-6"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <CardContent className="flex items-center gap-4">
                    <Skeleton className="w-20 h-20 rounded-md" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-2" />
                      <div className="flex items-center gap-4 mt-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Failed to load active products.</p>
              <p className="text-xs text-muted-foreground mb-4">{error}</p>
              <div className="flex justify-center">
                <Button onClick={() => load()}>Retry</Button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                <Eye className="h-12 w-12" />
                <p className="text-base">No active products</p>
                <p className="text-sm">There are currently no active listings in the marketplace.</p>
              </div>
            </Card>
          ) : (
            products.map((product) => (
              <Card
                key={product.id}
                onClick={() => onSelectProduct?.(product)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectProduct?.(product) }}
                className="cursor-pointer hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.08)] transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] backdrop-blur-sm"
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <ImageWithFallback
                      src={(product.images && product.images[0]) || '/placeholder.png'}
                      alt={product.title}
                      className="w-20 h-20 object-contain p-1 rounded-lg flex-shrink-0 bg-[var(--card)] dark:bg-[var(--card)]"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-medium mb-1">{product.title}</h4>
                          <p className="text-sm text-muted-foreground">{product.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg text-primary">{formatPrice(product.price)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Seller: {product.seller?.username ?? product.seller_id}
                        </span>
                        <span>•</span>
                        <span>{product.category ? (product.category as any).name ?? product.category : ''}</span>
                        <span>•</span>
                        <span>{product.views ?? 0} views</span>
                        <span>•</span>
                        <span>Posted: {new Date(product.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
