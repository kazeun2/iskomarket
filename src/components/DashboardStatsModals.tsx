import React from 'react';
import { Package, Eye, CheckCircle, Star, X, Calendar, User, MapPin, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getPrimaryImage } from '../utils/images';

interface Product {
  id: number;
  title: string;
  price: number;
  status: string;
  views: number;
  interested: number;
  image: string;
  datePosted: string;
  description: string;
  category: string;
  condition: string;
  location: string;
}

interface Review {
  id: number;
  from: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
  product?: string;
}

interface TotalProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}



interface CompletedSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedCount: number;
}

interface RatingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rating: number;
  totalRatings: number;
  reviews: Review[];
}

export function TotalProductsModal({ isOpen, onClose, products }: TotalProductsModalProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Total Products
          </DialogTitle>
          <DialogDescription>
            All products you've posted on IskoMarket
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto max-h-[calc(90vh-150px)]">
          {products.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                <Package className="h-12 w-12" />
                <p className="text-base">No products posted yet</p>
                <p className="text-sm">Start selling to build your marketplace presence!</p>
              </div>
            </Card>
          ) : (
            products.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <ImageWithFallback
                      src={getPrimaryImage(product)}
                      alt={product.title}
                      className="w-20 h-20 object-contain p-1 rounded-lg flex-shrink-0 bg-card dark:bg-[var(--card)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium line-clamp-1">{product.title}</h4>
                          <p className="text-lg text-primary mt-1">{formatPrice(product.price)}</p>
                        </div>
                        <Badge 
                          variant={product.status === 'available' ? 'default' : 'secondary'}
                          className="flex-shrink-0"
                        >
                          {product.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {product.views} views
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {product.interested} interested
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(product.datePosted).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



export function CompletedSalesModal({ isOpen, onClose, completedCount }: CompletedSalesModalProps) {
  // Mock completed sales data
  const completedSales = Array.from({ length: completedCount }, (_, i) => ({
    id: i + 1,
    title: ['Advanced Calculus Textbook', 'Scientific Calculator', 'Lab Coat', 'Art Supplies Set', 'Gaming Laptop'][i % 5],
    buyer: ['Maria Santos', 'John Doe', 'Anna Reyes', 'Carlos Martinez', 'Lisa Chen'][i % 5],
    price: [1200, 800, 450, 2500, 45000][i % 5],
    completedDate: new Date(Date.now() - (i * 86400000)).toISOString(),
    rating: [5, 4, 5, 4, 5][i % 5],
    image: [
      'https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?w=80&h=80&fit=crop',
      'https://images.unsplash.com/photo-1715520530023-cc8a1b2044ab?w=80&h=80&fit=crop',
      'https://images.unsplash.com/photo-1566827886031-7d0f288f76ed?w=80&h=80&fit=crop',
      'https://images.unsplash.com/photo-1715520530023-cc8a1b2044ab?w=80&h=80&fit=crop',
      'https://images.unsplash.com/photo-1689857538296-b6e1a392a91d?w=80&h=80&fit=crop'
    ][i % 5]
  }));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            Completed Sales
          </DialogTitle>
          <DialogDescription>
            Successfully completed transactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto max-h-[calc(90vh-150px)]">
          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Completed</p>
                  <p className="text-3xl font-bold text-accent">{completedCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-primary">92%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {completedSales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-md transition-all border-accent/20">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <ImageWithFallback
                    src={sale.image}
                    alt={sale.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-1 text-sm">{sale.title}</h4>
                        <p className="text-base text-primary mt-0.5">{formatPrice(sale.price)}</p>
                      </div>
                      <Badge className="bg-accent/20 text-accent-foreground flex-shrink-0">
                        Completed
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Buyer: {sale.buyer}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(sale.completedDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-accent fill-accent" />
                        {sale.rating}/5
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RatingHistoryModal({ isOpen, onClose, rating, totalRatings, reviews }: RatingHistoryModalProps) {
  const ratingDistribution = {
    5: Math.floor(totalRatings * 0.65),
    4: Math.floor(totalRatings * 0.25),
    3: Math.floor(totalRatings * 0.07),
    2: Math.floor(totalRatings * 0.02),
    1: Math.floor(totalRatings * 0.01),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-accent fill-accent" />
            Rating History
          </DialogTitle>
          <DialogDescription>
            Your seller ratings and reviews from buyers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-150px)]">
          {/* Overall Rating Card */}
          <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Rating</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-accent">{rating}</span>
                    <span className="text-xl text-muted-foreground">/ 5.0</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(rating)
                            ? 'text-accent fill-accent'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                  <p className="text-3xl font-bold text-primary">{totalRatings}</p>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm">{stars}</span>
                      <Star className="h-3 w-3 text-accent fill-accent" />
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{
                          width: `${(ratingDistribution[stars as keyof typeof ratingDistribution] / totalRatings) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {ratingDistribution[stars as keyof typeof ratingDistribution]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div>
            <h3 className="font-medium mb-3">Recent Reviews</h3>
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                    <Star className="h-12 w-12" />
                    <p className="text-base">No reviews yet</p>
                    <p className="text-sm">Complete sales to receive ratings!</p>
                  </div>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{review.from}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating
                                        ? 'text-accent fill-accent'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {review.comment}
                          </p>
                          {review.product && (
                            <p className="text-xs text-primary mt-2">
                              Product: {review.product}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
