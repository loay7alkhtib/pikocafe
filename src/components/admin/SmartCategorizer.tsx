import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Brain, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Zap,
  Eye,
  Settings,
  TrendingUp,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { Category, Item, itemsAPI } from '../../lib/supabase';
import { useLang } from '../../lib/LangContext';
import { t } from '../../lib/i18n';
import { toast } from 'sonner';

interface CategorizationResult {
  item: Item;
  suggestedCategory: Category | null;
  confidence: number;
  reasoning: string;
  alternativeCategories: Array<{
    category: Category;
    confidence: number;
    reasoning: string;
  }>;
}

interface CategoryAnalysis {
  category: Category;
  items: Item[];
  characteristics: {
    commonTags: string[];
    priceRange: { min: number; max: number; avg: number };
    namePatterns: string[];
    totalItems: number;
  };
  suggestions: string[];
}

interface SmartCategorizerProps {
  categories: Category[];
  items: Item[];
  onRefresh: () => void;
}

// Smart categorization algorithms
class SmartCategorizationEngine {
  private categories: Category[];
  private items: Item[];

  constructor(categories: Category[], items: Item[]) {
    this.categories = categories;
    this.items = items;
  }

  // Main categorization logic
  categorizeItems(): CategorizationResult[] {
    return this.items
      .filter(item => !item.category_id) // Only uncategorized items
      .map(item => this.categorizeItem(item));
  }

  private categorizeItem(item: Item): CategorizationResult {
    const scores = this.categories.map(category => ({
      category,
      score: this.calculateCategoryScore(item, category),
      reasoning: this.generateReasoning(item, category)
    }));

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    const bestMatch = scores[0];
    const alternatives = scores.slice(1, 4); // Top 3 alternatives

    return {
      item,
      suggestedCategory: bestMatch.score > 0.3 ? bestMatch.category : null,
      confidence: bestMatch.score,
      reasoning: bestMatch.reasoning,
      alternativeCategories: alternatives.map(alt => ({
        category: alt.category,
        confidence: alt.score,
        reasoning: alt.reasoning
      }))
    };
  }

  private calculateCategoryScore(item: Item, category: Category): number {
    let score = 0;
    const weights = {
      nameSimilarity: 0.4,
      tagMatching: 0.3,
      priceRange: 0.15,
      iconContext: 0.1,
      categoryCharacteristics: 0.05
    };

    // 1. Name similarity analysis
    const nameScore = this.calculateNameSimilarity(item, category);
    score += nameScore * weights.nameSimilarity;

    // 2. Tag matching
    const tagScore = this.calculateTagMatching(item, category);
    score += tagScore * weights.tagMatching;

    // 3. Price range analysis
    const priceScore = this.calculatePriceScore(item, category);
    score += priceScore * weights.priceRange;

    // 4. Icon context analysis
    const iconScore = this.calculateIconScore(item, category);
    score += iconScore * weights.iconContext;

    // 5. Category characteristics
    const charScore = this.calculateCharacteristicScore(item, category);
    score += charScore * weights.categoryCharacteristics;

    return Math.min(1, Math.max(0, score));
  }

  private calculateNameSimilarity(item: Item, category: Category): number {
    const itemNames = [item.names.en, item.names.tr, item.names.ar].filter(Boolean);
    const categoryNames = [category.names.en, category.names.tr, category.names.ar].filter(Boolean);
    
    let maxSimilarity = 0;
    
    for (const itemName of itemNames) {
      for (const categoryName of categoryNames) {
        const similarity = this.stringSimilarity(itemName.toLowerCase(), categoryName.toLowerCase());
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    // Also check for keyword matching
    const keywordScore = this.keywordMatching(itemNames, categoryNames);
    return Math.max(maxSimilarity, keywordScore);
  }

  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private keywordMatching(itemNames: string[], categoryNames: string[]): number {
    // Food-related keyword mappings
    const keywordMappings: { [key: string]: string[] } = {
      // Hot Drinks
      'hot': ['coffee', 'tea', 'hot', 'espresso', 'cappuccino', 'latte', 'americano', 'mocha'],
      'coffee': ['coffee', 'espresso', 'cappuccino', 'latte', 'americano', 'mocha', 'macchiato'],
      'tea': ['tea', 'chai', 'green tea', 'black tea', 'herbal'],
      
      // Cold Drinks
      'cold': ['cold', 'iced', 'smoothie', 'juice', 'soda', 'lemonade'],
      'juice': ['juice', 'fresh', 'orange', 'apple', 'grape'],
      
      // Desserts
      'dessert': ['cake', 'pie', 'cookie', 'muffin', 'donut', 'ice cream', 'pudding', 'tart'],
      'cake': ['cake', 'cheesecake', 'chocolate cake', 'birthday'],
      'ice cream': ['ice cream', 'gelato', 'sorbet', 'frozen'],
      
      // Sandwiches
      'sandwich': ['sandwich', 'burger', 'panini', 'wrap', 'sub', 'club'],
      
      // Breakfast
      'breakfast': ['pancake', 'waffle', 'toast', 'bagel', 'croissant', 'muffin'],
      
      // Pastries
      'pastry': ['croissant', 'danish', 'scone', 'muffin', 'biscuit', 'roll'],
    };

    let maxScore = 0;
    
    for (const itemName of itemNames) {
      for (const categoryName of categoryNames) {
        const itemWords = itemName.toLowerCase().split(/\s+/);
        const categoryWords = categoryName.toLowerCase().split(/\s+/);
        
        let score = 0;
        for (const itemWord of itemWords) {
          for (const categoryWord of categoryWords) {
            // Direct word match
            if (itemWord === categoryWord) {
              score += 1;
              continue;
            }
            
            // Check keyword mappings
            if (keywordMappings[itemWord] && keywordMappings[itemWord].includes(categoryWord)) {
              score += 0.8;
            }
            if (keywordMappings[categoryWord] && keywordMappings[categoryWord].includes(itemWord)) {
              score += 0.8;
            }
          }
        }
        
        // Normalize score by number of words
        const normalizedScore = score / Math.max(itemWords.length, categoryWords.length);
        maxScore = Math.max(maxScore, normalizedScore);
      }
    }
    
    return Math.min(1, maxScore);
  }

  private calculateTagMatching(item: Item, category: Category): number {
    if (!item.tags || item.tags.length === 0) return 0;
    
    // Get existing items in this category to analyze their tags
    const categoryItems = this.items.filter(i => i.category_id === category.id);
    const categoryTags = categoryItems.flatMap(i => i.tags || []);
    
    // Count tag frequency in category
    const tagFrequency: { [key: string]: number } = {};
    categoryTags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
    
    // Calculate score based on how many item tags match category's common tags
    let matchingTags = 0;
    let totalItemTags = item.tags.length;
    
    item.tags.forEach(tag => {
      if (tagFrequency[tag] > 0) {
        matchingTags += Math.min(1, tagFrequency[tag] / categoryItems.length);
      }
    });
    
    return matchingTags / totalItemTags;
  }

  private calculatePriceScore(item: Item, category: Category): number {
    const categoryItems = this.items.filter(i => i.category_id === category.id);
    if (categoryItems.length === 0) return 0.5; // Neutral score if no items in category
    
    const prices = categoryItems.map(i => i.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Check if item price is within reasonable range of category
    if (item.price >= minPrice && item.price <= maxPrice) {
      // Higher score if closer to average
      const distanceFromAvg = Math.abs(item.price - avgPrice);
      const maxDistance = Math.max(avgPrice - minPrice, maxPrice - avgPrice);
      return Math.max(0, 1 - (distanceFromAvg / maxDistance));
    }
    
    return 0; // Outside price range
  }

  private calculateIconScore(item: Item, category: Category): number {
    // Map common food icons to categories
    const iconMappings: { [key: string]: string[] } = {
      '☕': ['coffee', 'hot', 'drink', 'espresso', 'latte', 'cappuccino'],
      '🧊': ['cold', 'ice', 'iced', 'smoothie', 'juice'],
      '🍰': ['cake', 'dessert', 'sweet', 'chocolate', 'cheesecake'],
      '🍨': ['ice cream', 'frozen', 'gelato', 'sorbet'],
      '🥪': ['sandwich', 'burger', 'panini', 'wrap'],
      '🥐': ['croissant', 'pastry', 'breakfast', 'baked'],
      '🍞': ['bread', 'toast', 'sandwich', 'baked'],
      '🥞': ['pancake', 'breakfast', 'sweet', 'fluffy'],
      '🧁': ['cupcake', 'dessert', 'sweet', 'small'],
      '🍪': ['cookie', 'dessert', 'sweet', 'baked'],
    };

    const itemNames = [item.names.en, item.names.tr, item.names.ar].filter(Boolean);
    const categoryNames = [category.names.en, category.names.tr, category.names.ar].filter(Boolean);
    
    // Check if category icon suggests items that match this item
    const iconKeywords = iconMappings[category.icon] || [];
    let score = 0;
    
    for (const itemName of itemNames) {
      for (const keyword of iconKeywords) {
        if (itemName.toLowerCase().includes(keyword)) {
          score += 0.3;
        }
      }
    }
    
    return Math.min(1, score);
  }

  private calculateCharacteristicScore(item: Item, category: Category): number {
    // Analyze category characteristics and see how well item fits
    const categoryItems = this.items.filter(i => i.category_id === category.id);
    if (categoryItems.length === 0) return 0.5;
    
    // Check if item follows similar naming patterns
    const categoryNamePatterns = this.extractNamePatterns(categoryItems);
    const itemNames = [item.names.en, item.names.tr, item.names.ar].filter(Boolean);
    
    let patternScore = 0;
    itemNames.forEach(name => {
      categoryNamePatterns.forEach(pattern => {
        if (name.toLowerCase().includes(pattern.toLowerCase())) {
          patternScore += 0.2;
        }
      });
    });
    
    return Math.min(1, patternScore);
  }

  private extractNamePatterns(items: Item[]): string[] {
    const patterns: string[] = [];
    const allNames = items.flatMap(item => [item.names.en, item.names.tr, item.names.ar]).filter(Boolean);
    
    // Extract common words
    const wordCounts: { [key: string]: number } = {};
    allNames.forEach(name => {
      const words = name.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) { // Ignore short words
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });
    
    // Return words that appear in multiple items
    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count >= 2) {
        patterns.push(word);
      }
    });
    
    return patterns;
  }

  private generateReasoning(item: Item, category: Category): string {
    const reasons: string[] = [];
    
    // Name similarity reasoning
    const nameScore = this.calculateNameSimilarity(item, category);
    if (nameScore > 0.5) {
      reasons.push(`Name similarity: ${Math.round(nameScore * 100)}%`);
    }
    
    // Tag matching reasoning
    const tagScore = this.calculateTagMatching(item, category);
    if (tagScore > 0.3) {
      reasons.push(`Tag compatibility: ${Math.round(tagScore * 100)}%`);
    }
    
    // Price reasoning
    const priceScore = this.calculatePriceScore(item, category);
    if (priceScore > 0.6) {
      reasons.push(`Price range fits category`);
    }
    
    // Icon reasoning
    const iconScore = this.calculateIconScore(item, category);
    if (iconScore > 0.2) {
      reasons.push(`Icon context matches`);
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Low confidence match';
  }

  // Analyze existing categories
  analyzeCategories(): CategoryAnalysis[] {
    return this.categories.map(category => {
      const categoryItems = this.items.filter(item => item.category_id === category.id);
      
      return {
        category,
        items: categoryItems,
        characteristics: {
          commonTags: this.getCommonTags(categoryItems),
          priceRange: this.getPriceRange(categoryItems),
          namePatterns: this.extractNamePatterns(categoryItems),
          totalItems: categoryItems.length
        },
        suggestions: this.generateCategorySuggestions(category, categoryItems)
      };
    });
  }

  private getCommonTags(items: Item[]): string[] {
    const tagCounts: { [key: string]: number } = {};
    
    items.forEach(item => {
      (item.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  private getPriceRange(items: Item[]): { min: number; max: number; avg: number } {
    if (items.length === 0) return { min: 0, max: 0, avg: 0 };
    
    const prices = items.map(item => item.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
    };
  }

  private generateCategorySuggestions(category: Category, items: Item[]): string[] {
    const suggestions: string[] = [];
    
    if (items.length === 0) {
      suggestions.push('Add some items to this category');
      suggestions.push('Consider adding popular items');
      return suggestions;
    }
    
    if (items.length < 3) {
      suggestions.push('Category could use more items');
    }
    
    const priceRange = this.getPriceRange(items);
    if (priceRange.max - priceRange.min > 100) {
      suggestions.push('Consider splitting into price-based subcategories');
    }
    
    const commonTags = this.getCommonTags(items);
    if (commonTags.length === 0) {
      suggestions.push('Add tags to items for better organization');
    }
    
    return suggestions;
  }
}

export default function SmartCategorizer({ categories, items, onRefresh }: SmartCategorizerProps) {
  const { lang } = useLang();
  const [engine] = useState(() => new SmartCategorizationEngine(categories, items));
  const [categorizationResults, setCategorizationResults] = useState<CategorizationResult[]>([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  // Update engine when data changes
  useEffect(() => {
    const newEngine = new SmartCategorizationEngine(categories, items);
    // Note: We can't update the engine state directly, so we'll recreate results
  }, [categories, items]);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setProgress(0);
    
    try {
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Run categorization analysis
      const results = engine.categorizeItems();
      setCategorizationResults(results);
      
      // Run category analysis
      const analysis = engine.analyzeCategories();
      setCategoryAnalysis(analysis);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setIsAnalyzing(false);
        setProgress(0);
        toast.success(`Analysis complete! Found ${results.length} uncategorized items.`);
      }, 500);
      
    } catch (error) {
      setIsAnalyzing(false);
      setProgress(0);
      toast.error('Analysis failed. Please try again.');
      console.error('Analysis error:', error);
    }
  }, [engine]);

  const applyCategorization = useCallback(async (itemId: string, categoryId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      
      await itemsAPI.update(itemId, {
        ...item,
        category_id: categoryId
      });
      
      toast.success(`Item categorized successfully!`);
      onRefresh();
      
      // Remove from results
      setCategorizationResults(prev => prev.filter(r => r.item.id !== itemId));
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to categorize item');
      console.error('Categorization error:', error);
    }
  }, [items, onRefresh]);

  const applyAllSelected = useCallback(async () => {
    const selectedResults = categorizationResults.filter(r => selectedResults.has(r.item.id));
    let successCount = 0;
    let errorCount = 0;
    
    for (const result of selectedResults) {
      if (result.suggestedCategory) {
        try {
          await applyCategorization(result.item.id, result.suggestedCategory.id);
          successCount++;
        } catch {
          errorCount++;
        }
      }
    }
    
    if (successCount > 0) {
      toast.success(`Successfully categorized ${successCount} items!`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to categorize ${errorCount} items.`);
    }
    
    setSelectedResults(new Set());
  }, [categorizationResults, applyCategorization]);

  const toggleSelection = useCallback((itemId: string) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    if (confidence >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceBadgeVariant = (confidence: number): "default" | "secondary" | "destructive" | "outline" => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    if (confidence >= 0.4) return 'outline';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Smart Categorization System
          </h2>
          <p className="text-muted-foreground">
            AI-powered analysis to automatically categorize your menu items
          </p>
        </div>
        <Button 
          onClick={runAnalysis} 
          disabled={isAnalyzing}
          className="gap-2"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analyzing items...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {categorizationResults.length > 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Found {categorizationResults.length} uncategorized items. Review the suggestions below and apply the ones you agree with.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="categorization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categorization" className="gap-2">
            <Target className="w-4 h-4" />
            Item Categorization
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Category Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categorization" className="space-y-4">
          {categorizationResults.length === 0 && !isAnalyzing ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-medium">All items are categorized!</h3>
                  <p className="text-muted-foreground">
                    No uncategorized items found. Your menu is well organized.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {categorizationResults.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedResults.size} of {categorizationResults.length} items selected
                  </p>
                  <Button 
                    onClick={applyAllSelected}
                    disabled={selectedResults.size === 0}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Apply Selected ({selectedResults.size})
                  </Button>
                </div>
              )}

              <div className="grid gap-4">
                {categorizationResults.map((result) => (
                  <Card key={result.item.id} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedResults.has(result.item.id)}
                              onChange={() => toggleSelection(result.item.id)}
                              className="rounded"
                            />
                            <h4 className="font-medium">
                              {result.item.names[lang] || result.item.names.en}
                            </h4>
                            <Badge variant="outline">
                              ₺{result.item.price}
                            </Badge>
                          </div>
                          
                          {result.item.tags && result.item.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {result.item.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <p className="text-sm text-muted-foreground">
                            {result.reasoning}
                          </p>
                        </div>

                        <div className="text-right space-y-2">
                          {result.suggestedCategory ? (
                            <>
                              <Badge 
                                variant={getConfidenceBadgeVariant(result.confidence)}
                                className="gap-1"
                              >
                                <Target className="w-3 h-3" />
                                {Math.round(result.confidence * 100)}% confidence
                              </Badge>
                              
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  {result.suggestedCategory.names[lang] || result.suggestedCategory.names.en}
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => applyCategorization(result.item.id, result.suggestedCategory!.id)}
                                  className="gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Apply
                                </Button>
                              </div>
                            </>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              No clear match
                            </Badge>
                          )}
                        </div>
                      </div>

                      {result.alternativeCategories.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Alternative suggestions:</p>
                          <div className="flex gap-2 flex-wrap">
                            {result.alternativeCategories.map((alt, index) => (
                              <div key={index} className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {alt.category.names[lang] || alt.category.names.en}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(alt.confidence * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4">
            {categoryAnalysis.map((analysis) => (
              <Card key={analysis.category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{analysis.category.icon}</span>
                    {analysis.category.names[lang] || analysis.category.names.en}
                  </CardTitle>
                  <CardDescription>
                    {analysis.characteristics.totalItems} items • 
                    Price range: ₺{analysis.characteristics.priceRange.min} - ₺{analysis.characteristics.priceRange.max} 
                    (avg: ₺{analysis.characteristics.priceRange.avg})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.characteristics.commonTags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Common Tags</h4>
                      <div className="flex gap-1 flex-wrap">
                        {analysis.characteristics.commonTags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.characteristics.namePatterns.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Name Patterns</h4>
                      <div className="flex gap-1 flex-wrap">
                        {analysis.characteristics.namePatterns.map((pattern, index) => (
                          <Badge key={index} variant="outline">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Suggestions</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
