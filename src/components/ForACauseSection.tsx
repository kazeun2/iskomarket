import React from 'react';
import { Heart, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Progress } from './ui/progress';
import { CreditScoreBadge } from './CreditScoreBadge';

interface ForACauseItem {
  id: number;
  title: string;
  description: string;
  cause: string;
  price: number;
  category: string;
  image: string;
  seller: {
    id: number;
    name: string;
    program: string;
    creditScore: number;
  };
  organization: string;
  goalAmount: number;
  raisedAmount: number;
  supporters: number;
}

interface ForACauseSectionProps {
  items: ForACauseItem[];
  onItemClick: (item: ForACauseItem) => void;
  onSellerClick: (seller: any) => void;
}

export function ForACauseSection({ items, onItemClick, onSellerClick }: ForACauseSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-accent fill-accent" />
            <h2 className="text-2xl">For a Cause</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Support fellow students and community causes through marketplace purchases
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {items.length} active causes
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const progressPercentage = (item.raisedAmount / item.goalAmount) * 100;
          
          return (
            <Card 
              key={item.id} 
              className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group rounded-lg border border-border"
              onClick={() => onItemClick(item)}
            >
              <div className="aspect-video overflow-hidden bg-muted relative">
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-accent text-accent-foreground shadow-lg">
                    <Heart className="h-3 w-3 mr-1 fill-current" />
                    Fundraiser
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  <h3 className="text-base line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                {/* Cause Information */}
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <Heart className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-accent-foreground line-clamp-2">
                        {item.cause}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {item.organization}
                      </p>
                    </div>
                  </div>
                  
                  {/* Fundraising Progress */}
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        ₱{item.raisedAmount.toLocaleString()} / ₱{item.goalAmount.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {progressPercentage.toFixed(0)}% funded
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {item.supporters} supporters
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seller Info */}
                <div 
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSellerClick(item.seller);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{(item.seller as any).username || item.seller.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.seller.program}</p>
                  </div>
                  <CreditScoreBadge score={item.seller.creditScore} size="sm" showLabel={false} />
                </div>
                
                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xl text-primary font-semibold">₱{item.price.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">per item</span>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(item);
                  }}
                  className="w-full bg-accent hover:bg-accent/90"
                  size="sm"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Support This Cause
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {items.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Heart className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No active fundraising causes at the moment.</p>
            <p className="text-sm text-muted-foreground">Check back soon to support fellow students!</p>
          </div>
        </Card>
      )}
    </div>
  );
}
