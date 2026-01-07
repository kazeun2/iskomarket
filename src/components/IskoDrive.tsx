import React, { useState } from 'react';
import { Search, Heart, TrendingUp, Users, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { normalizeForCompare } from '../hooks/useMarketplaceFilters';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { Progress } from './ui/progress';

interface FundraisingItem {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  cause: string;
  organizer: string;
  organization: string;
  goalAmount: number;
  raisedAmount: number;
  supporters: number;
  datePosted: string;
  featured: boolean;
  trending: boolean;
}

const fundraisingItems: FundraisingItem[] = [
  {
    id: 1,
    title: "Homemade Chocolate Chip Cookies",
    description: "Freshly baked cookies made with love. Pack of 12 cookies.",
    price: 150,
    category: "Food & Baked Goods",
    image: "https://images.unsplash.com/photo-1702743116767-c59de4e90d5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtlZCUyMGdvb2RzJTIwY29va2llc3xlbnwxfHx8fDE3NjAwMjQ0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    cause: "Medical Assistance for Student with Cancer",
    organizer: "Sarah Johnson",
    organization: "BS Biology Class 2025",
    goalAmount: 50000,
    raisedAmount: 32500,
    supporters: 87,
    datePosted: "2025-01-08",
    featured: true,
    trending: true
  },
  {
    id: 2,
    title: "Handmade Beaded Bracelets",
    description: "Beautiful handcrafted bracelets. Multiple colors available.",
    price: 80,
    category: "Handmade Crafts",
    image: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMGNyYWZ0c3xlbnwxfHx8fDE3NTk5Mjk1NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    cause: "Scholarship Fund for Underprivileged Students",
    organizer: "Mark Cruz",
    organization: "CvSU Student Council",
    goalAmount: 100000,
    raisedAmount: 45800,
    supporters: 156,
    datePosted: "2025-01-07",
    featured: true,
    trending: true
  },
  {
    id: 3,
    title: "Study Guide Bundle",
    description: "Comprehensive study guides for major subjects. Digital + printed copies.",
    price: 200,
    category: "Books & Study Materials",
    image: "https://images.unsplash.com/photo-1557734864-c78b6dfef1b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwZnVuZHJhaXNlcnxlbnwxfHx8fDE3NjAwMjQ0ODl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    cause: "Library Restoration Project",
    organizer: "Jane Mendoza",
    organization: "Library Science Students",
    goalAmount: 75000,
    raisedAmount: 58200,
    supporters: 94,
    datePosted: "2025-01-09",
    featured: false,
    trending: true
  },
  {
    id: 4,
    title: "Eco-Friendly Tote Bags",
    description: "Sustainable canvas tote bags with CvSU-inspired designs.",
    price: 120,
    category: "Handmade Crafts",
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFyaXR5JTIwZG9uYXRpb258ZW58MXx8fHwxNzYwMDIyNzcwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    cause: "Tree Planting Campaign - 1000 Trees Initiative",
    organizer: "Environmental Club",
    organization: "CvSU Green Warriors",
    goalAmount: 30000,
    raisedAmount: 22400,
    supporters: 68,
    datePosted: "2025-01-06",
    featured: true,
    trending: false
  },
  {
    id: 5,
    title: "Customized Photo Prints",
    description: "Personalized photo prints and frames. Perfect for gifts!",
    price: 180,
    category: "Handmade Crafts",
    image: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMGNyYWZ0c3xlbnwxfHx8fDE3NTk5Mjk1NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    cause: "Support for Student with Typhoon Damage",
    organizer: "Photography Club",
    organization: "CvSU Arts & Media",
    goalAmount: 40000,
    raisedAmount: 18750,
    supporters: 42,
    datePosted: "2025-01-05",
    featured: false,
    trending: false
  },
  {
    id: 6,
    title: "Premium Cupcakes (Box of 6)",
    description: "Delicious cupcakes with various flavors. Made fresh daily.",
    price: 200,
    category: "Food & Baked Goods",
    image: "https://images.unsplash.com/photo-1702743116767-c59de4e90d5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtlZCUyMGdvb2RzJTIwY29va2llc3xlbnwxfHx8fDE3NjAwMjQ0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    cause: "Sports Equipment for Athletics Team",
    organizer: "Athletes Association",
    organization: "CvSU Sports Council",
    goalAmount: 80000,
    raisedAmount: 61200,
    supporters: 103,
    datePosted: "2025-01-04",
    featured: false,
    trending: true
  }
];

interface IskoDriveProps {
  onPostForCause?: () => void;
}

export function IskoDrive({ onPostForCause }: IskoDriveProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const categories = ['all', 'Food & Baked Goods', 'Handmade Crafts', 'Books & Study Materials', 'Services', 'Others'];

  const handleBuy = (item: FundraisingItem) => {
    toast.success(`Added ${item.title} to cart!`, {
      description: `Supporting: ${item.cause}`,
    });
  };

  const handleLearnMore = (item: FundraisingItem) => {
    toast.info(`${item.cause}`, {
      description: `Organized by ${item.organization}`,
    });
  };

  const scrollToProducts = () => {
    const productsSection = document.getElementById('fundraising-items-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredItems = fundraisingItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.cause.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.category || '').toString().toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || normalizeForCompare(item.category).includes(normalizeForCompare(selectedCategory));
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
    if (sortBy === 'trending') return b.supporters - a.supporters;
    if (sortBy === 'goal') return (b.raisedAmount / b.goalAmount) - (a.raisedAmount / a.goalAmount);
    return 0;
  });

  const featuredDrives = fundraisingItems.filter(item => item.featured);
  const trendingCauses = fundraisingItems.filter(item => item.trending).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary via-secondary to-accent rounded-lg p-8 md:p-12">
        <div className="max-w-4xl mx-auto text-center text-primary-foreground">
          <div className="flex items-center justify-center mb-3">
            <Heart className="h-10 w-10 mr-3 fill-current" />
            <h1 className="text-3xl md:text-4xl">Support Student Causes</h1>
          </div>
          <p className="text-base md:text-lg opacity-90 mb-2">
            Join IskoDrive — Help fellow students achieve their goals
          </p>
          <p className="text-sm md:text-base opacity-80 mb-6">
            Every purchase directly supports student-led initiatives and causes within our CvSU community
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={scrollToProducts}
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg"
            >
              <Heart className="h-5 w-5 mr-2" />
              Browse Fundraisers
            </Button>
            <Button 
              onClick={onPostForCause}
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Post for a Cause
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fundraisers, causes, or organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-xl transition-all duration-300 hover:bg-[#e6f4ea] dark:hover:bg-[#193821]">
                  <SelectValue>
                    {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border shadow-lg">
                  {categories.map(category => (
                    <SelectItem 
                      key={category} 
                      value={category}
                      className="rounded-lg cursor-pointer transition-all duration-300 hover:bg-[#e6f4ea] dark:hover:bg-[#193821]"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{category === 'all' ? 'All Categories' : category}</span>

                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="trending">Most Supporters</SelectItem>
                  <SelectItem value="goal">Closest to Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fundraising Items Grid */}
          <div id="fundraising-items-section" className="scroll-mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl">Active Fundraisers</h2>
              <Badge variant="secondary" className="text-sm">
                {filteredItems.length} {filteredItems.length === 1 ? 'cause' : 'causes'}
              </Badge>
            </div>
            
            {filteredItems.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Heart className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No fundraisers found matching your filters.</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map(item => {
                  const progressPercentage = (item.raisedAmount / item.goalAmount) * 100;
                  
                  return (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                      <div className="aspect-video overflow-hidden bg-muted relative">
                        {item.trending && (
                          <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                        <ImageWithFallback
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader className="pb-3">
                        <div className="space-y-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                          <h3 className="text-lg">{item.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-3">
                        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <Heart className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-accent-foreground">{item.cause}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                by {item.organization}
                              </p>
                            </div>
                          </div>
                          
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
                        
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xl text-primary">₱{item.price.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">per item</span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2 pt-0">
                        <Button
                          onClick={() => handleBuy(item)}
                          className="flex-1"
                          size="sm"
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Buy & Support
                        </Button>
                        <Button
                          onClick={() => handleLearnMore(item)}
                          variant="outline"
                          size="sm"
                        >
                          Learn More
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Featured Drives */}
          <Card>
            <CardHeader>
              <h3 className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Featured Drives
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredDrives.map(item => {
                const progressPercentage = (item.raisedAmount / item.goalAmount) * 100;
                
                return (
                  <div key={item.id} className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 mb-1">{item.cause}</p>
                        <p className="text-xs text-muted-foreground">{item.organization}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={progressPercentage} className="h-1.5" />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{progressPercentage.toFixed(0)}% funded</span>
                        <span className="text-primary font-medium">₱{item.raisedAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Trending Causes */}
          <Card>
            <CardHeader>
              <h3 className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Trending Causes
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingCauses.map((item, index) => (
                <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 mb-1">{item.cause}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{item.supporters} supporters</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Impact Stats */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <h3 className="text-lg">Community Impact</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Raised</span>
                  <span className="text-xl font-semibold text-primary">
                    ₱{fundraisingItems.reduce((sum, item) => sum + item.raisedAmount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Causes</span>
                  <span className="text-xl font-semibold text-secondary">
                    {fundraisingItems.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Supporters</span>
                  <span className="text-xl font-semibold text-accent">
                    {fundraisingItems.reduce((sum, item) => sum + item.supporters, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Call-to-Action Banner */}
      <div className="bg-accent/10 border border-accent rounded-lg p-6 text-center">
        <p className="text-base text-foreground mb-3">
          <span className="font-semibold">Want to start your own fundraiser?</span>
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Post products for a cause and make a difference in our CvSU community!
        </p>
        <Button
          onClick={onPostForCause}
          className="bg-accent hover:bg-accent/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Post for a Cause
        </Button>
      </div>
    </div>
  );
}
