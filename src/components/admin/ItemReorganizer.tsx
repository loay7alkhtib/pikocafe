import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { 
  RefreshCw, 
  Merge, 
  FolderOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit
} from 'lucide-react';
import { itemsAPI, categoriesAPI, Item, Category } from '../../lib/supabase';
import { toast } from 'sonner';

interface ItemReorganizerProps {
  onComplete?: () => void;
}

interface MergeCandidate {
  baseItem: Item;
  duplicates: Item[];
  totalItems: number;
  priceRange: { min: number; max: number };
  sizeVariants: string[];
}

interface CategoryAnalysis {
  category: Category;
  itemCount: number;
  unassignedItems: Item[];
  duplicateGroups: MergeCandidate[];
  sizeVariants: Item[];
}

export function ItemReorganizer({ onComplete }: ItemReorganizerProps = {}) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [analysis, setAnalysis] = useState<CategoryAnalysis[]>([]);
  const [selectedMerges, setSelectedMerges] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Load and analyze data
  const analyzeData = async () => {
    setLoading(true);
    setProgress(0);
    setCurrentStep('Loading items and categories...');

    try {
      const [items, categories] = await Promise.all([
        itemsAPI.getAll(),
        categoriesAPI.getAll()
      ]);

      setProgress(30);
      setCurrentStep('Analyzing categories...');

      const analysisResults: CategoryAnalysis[] = [];

      for (const category of categories) {
        const categoryItems = items.filter((item: Item) => item.category_id === category.id);
        const unassignedItems = items.filter((item: Item) => !item.category_id);
        
        setProgress(40 + (categories.indexOf(category) * 10));
        setCurrentStep(`Analyzing ${category.names.en}...`);

        // Find potential duplicates and size variants
        const duplicateGroups = findDuplicateGroups(categoryItems);
        const sizeVariants = findSizeVariants(categoryItems);

        analysisResults.push({
          category,
          itemCount: categoryItems.length,
          unassignedItems: [], // Unassigned items will be handled separately
          duplicateGroups,
          sizeVariants
        });
      }

      // Add unassigned items as a separate analysis item
      const unassignedItems = items.filter((item: Item) => !item.category_id);
      if (unassignedItems.length > 0) {
        analysisResults.push({
          category: {
            id: 'unassigned',
            names: { en: 'Unassigned Items', tr: 'Atanmamış Öğeler', ar: 'عناصر غير مخصصة' },
            icon: '❓',
            order: 999,
            created_at: new Date().toISOString()
          },
          itemCount: unassignedItems.length,
          unassignedItems: unassignedItems,
          duplicateGroups: [],
          sizeVariants: []
        });
      }

      setAnalysis(analysisResults);
      setProgress(100);
      setCurrentStep('Analysis complete!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Find items that are likely duplicates or size variants
  const findDuplicateGroups = (items: Item[]): MergeCandidate[] => {
    const groups = new Map<string, MergeCandidate>();
    
    items.forEach(item => {
      if (!item.names?.en) return;
      
      // Create a normalized key for grouping
      const normalizedName = item.names.en.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();
      
      // Extract base name (remove size indicators)
      const baseName = normalizedName
        .replace(/\b(small|medium|large|big|regular|tall|grande|venti|single|double|triple)\b/g, '')
        .replace(/\b\d+\s*(ml|oz|size)\b/g, '')
        .trim();
      
      if (!groups.has(baseName)) {
        groups.set(baseName, {
          baseItem: item,
          duplicates: [],
          totalItems: 1,
          priceRange: { min: item.price, max: item.price },
          sizeVariants: []
        });
      } else {
        const group = groups.get(baseName)!;
        group.duplicates.push(item);
        group.totalItems++;
        group.priceRange.min = Math.min(group.priceRange.min, item.price);
        group.priceRange.max = Math.max(group.priceRange.max, item.price);
      }
    });

    // Filter to only groups with potential duplicates
    return Array.from(groups.values()).filter(group => group.totalItems > 1);
  };

  // Find items that might be size variants
  const findSizeVariants = (items: Item[]): Item[] => {
    return items.filter(item => {
      if (!item.names?.en) return false;
      
      const name = item.names.en.toLowerCase();
      const sizeIndicators = [
        'small', 'medium', 'large', 'big', 'regular', 'tall', 'grande', 'venti',
        'single', 'double', 'triple', 'mini', 'maxi', 'jumbo'
      ];
      
      return sizeIndicators.some(indicator => name.includes(indicator));
    });
  };

  // Merge selected items
  const mergeSelectedItems = async () => {
    if (selectedMerges.size === 0) {
      toast.error('Please select items to merge');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setCurrentStep('Starting merge process...');

    try {
      let processed = 0;
      const totalMerges = selectedMerges.size;

      for (const mergeKey of Array.from(selectedMerges)) {
        const [categoryId, baseName] = mergeKey.split('|');
        const categoryAnalysis = analysis.find(a => a.category.id === categoryId);
        
        if (!categoryAnalysis) continue;

        const mergeGroup = categoryAnalysis.duplicateGroups.find(
          group => group.baseItem.names.en.toLowerCase().replace(/\s+/g, ' ') === baseName
        );

        if (!mergeGroup) continue;

        setCurrentStep(`Merging ${mergeGroup.baseItem.names.en}...`);
        setProgress((processed / totalMerges) * 100);

        // Create variants array from duplicates
        const variants = mergeGroup.duplicates.map(duplicate => ({
          size: extractSizeFromName(duplicate.names.en),
          price: duplicate.price
        }));

        // Update base item with variants
        await itemsAPI.update(mergeGroup.baseItem.id, {
          ...mergeGroup.baseItem,
          variants: variants.length > 0 ? variants : undefined,
          price: Math.min(...[mergeGroup.baseItem.price, ...mergeGroup.duplicates.map(d => d.price)])
        });

        // Archive duplicates
        for (const duplicate of mergeGroup.duplicates) {
          await itemsAPI.archive(duplicate.id);
        }

        processed++;
      }

      setProgress(100);
      setCurrentStep('Merge process complete!');
      toast.success(`Successfully merged ${processed} item groups`);
      
      // Refresh analysis
      await analyzeData();
      setSelectedMerges(new Set());
      
      if (onComplete) onComplete();
    } catch (error: any) {
      console.error('Merge error:', error);
      toast.error(`Merge failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Merge all duplicate groups with concurrency
  const mergeAllDuplicates = async () => {
    // Collect all groups across categories
    const groups = analysis.flatMap(a => a.duplicateGroups.map(g => ({ categoryId: a.category.id, group: g })));
    if (groups.length === 0) {
      toast.info('No duplicate groups found');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setCurrentStep('Merging all duplicate groups...');

    try {
      const total = groups.length;
      let processed = 0;
      const maxConcurrency = 6;
      let idx = 0;
      let active = 0;

      await new Promise<void>((resolve) => {
        const next = () => {
          if (idx >= total && active === 0) return resolve();
          while (active < maxConcurrency && idx < total) {
            const entry = groups[idx++];
            active++;
            (async () => {
              try {
                const mergeGroup = entry.group;
                // Build variants from duplicates
                const variants = mergeGroup.duplicates.map(duplicate => ({
                  size: extractSizeFromName(duplicate.names.en),
                  price: duplicate.price,
                }));

                await itemsAPI.update(mergeGroup.baseItem.id, {
                  ...mergeGroup.baseItem,
                  variants: variants.length > 0 ? variants : undefined,
                  price: Math.min(...[mergeGroup.baseItem.price, ...mergeGroup.duplicates.map(d => d.price)]),
                });

                // Archive duplicates (best-effort)
                await Promise.all(
                  mergeGroup.duplicates.map(d => itemsAPI.archive(d.id).catch(() => {}))
                );
              } catch {
                // Continue other groups
              } finally {
                processed++;
                active--;
                setProgress(Math.round((processed / total) * 100));
                if (processed % 5 === 0 || processed === total) {
                  setCurrentStep(`Merged ${processed}/${total} groups`);
                }
                next();
              }
            })();
          }
        };
        next();
      });

      setProgress(100);
      setCurrentStep('All duplicates merged!');
      toast.success('Merged duplicate groups into size variants');
      await analyzeData();
      onComplete?.();
    } catch (error: any) {
      console.error('Merge all error:', error);
      toast.error(error.message || 'Failed to merge duplicates');
    } finally {
      setProcessing(false);
    }
  };

  // Extract size from item name
  const extractSizeFromName = (name: string): string => {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('small') || nameLower.includes('mini')) return 'Small';
    if (nameLower.includes('medium') || nameLower.includes('regular')) return 'Medium';
    if (nameLower.includes('large') || nameLower.includes('big') || nameLower.includes('grande')) return 'Large';
    if (nameLower.includes('double')) return 'Double';
    if (nameLower.includes('triple')) return 'Triple';
    
    return 'Regular';
  };

  // Assign unassigned items to categories
  const assignUnassignedItems = async () => {
    const unassignedItems = analysis.flatMap(a => a.unassignedItems);
    
    if (unassignedItems.length === 0) {
      toast.info('No unassigned items found');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setCurrentStep('Assigning unassigned items...');

    try {
      let processed = 0;
      const total = unassignedItems.length;

      for (const item of unassignedItems) {
        setCurrentStep(`Assigning ${item.names.en}...`);
        setProgress((processed / total) * 100);

        // Simple category assignment based on item name
        let suggestedCategory = analysis[0]?.category; // Default to first category
        
        const itemName = item.names.en.toLowerCase();
        
        // Coffee-related items
        if (itemName.includes('coffee') || itemName.includes('espresso') || itemName.includes('cappuccino') || itemName.includes('latte')) {
          suggestedCategory = analysis.find(a => a.category.names.en.toLowerCase().includes('coffee'))?.category || analysis[0]?.category;
        }
        // Tea-related items
        else if (itemName.includes('tea') || itemName.includes('chai')) {
          suggestedCategory = analysis.find(a => a.category.names.en.toLowerCase().includes('tea'))?.category || analysis[0]?.category;
        }
        // Dessert items
        else if (itemName.includes('cake') || itemName.includes('dessert') || itemName.includes('sweet') || itemName.includes('pastry')) {
          suggestedCategory = analysis.find(a => a.category.names.en.toLowerCase().includes('dessert'))?.category || analysis[0]?.category;
        }

        if (suggestedCategory) {
          await itemsAPI.update(item.id, {
            ...item,
            category_id: suggestedCategory.id
          });
        }

        processed++;
      }

      setProgress(100);
      setCurrentStep('Assignment complete!');
      toast.success(`Assigned ${processed} items to categories`);
      
      // Refresh analysis
      await analyzeData();
      
      if (onComplete) onComplete();
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast.error(`Assignment failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Smart organize: assign unassigned items, then merge all duplicates
  const smartOrganize = async () => {
    setProcessing(true);
    setProgress(0);
    setCurrentStep('Assigning unassigned items...');
    try {
      // Assign first
      const unassignedItems = analysis.flatMap(a => a.unassignedItems);
      if (unassignedItems.length > 0) {
        let processed = 0;
        const total = unassignedItems.length;
        for (const item of unassignedItems) {
          let suggestedCategory = analysis[0]?.category;
          const itemName = item.names.en.toLowerCase();
          if (itemName.includes('coffee') || itemName.includes('espresso') || itemName.includes('cappuccino') || itemName.includes('latte')) {
            suggestedCategory = analysis.find(a => a.category.names.en.toLowerCase().includes('coffee'))?.category || analysis[0]?.category;
          } else if (itemName.includes('tea') || itemName.includes('chai')) {
            suggestedCategory = analysis.find(a => a.category.names.en.toLowerCase().includes('tea'))?.category || analysis[0]?.category;
          } else if (itemName.includes('cake') || itemName.includes('dessert') || itemName.includes('sweet') || itemName.includes('pastry')) {
            suggestedCategory = analysis.find(a => a.category.names.en.toLowerCase().includes('dessert'))?.category || analysis[0]?.category;
          }
          if (suggestedCategory) {
            await itemsAPI.update(item.id, { ...item, category_id: suggestedCategory.id });
          }
          processed++;
          setProgress(Math.round((processed / total) * 30)); // first 30%
        }
      }

      // Re-analyze after assignment
      await analyzeData();
      setCurrentStep('Merging duplicates...');
      setProgress(35);

      // Merge all duplicates (will manage own progress up to 100)
      await mergeAllDuplicates();
    } catch (error: any) {
      console.error('Smart organize error:', error);
      toast.error(error.message || 'Smart organize failed');
    } finally {
      setProcessing(false);
    }
  };

  // Filter analysis based on search and category
  const filteredAnalysis = analysis.filter(analysisItem => {
    if (filterCategory !== 'all' && analysisItem.category.id !== filterCategory) {
      return false;
    }
    
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return analysisItem.category.names.en.toLowerCase().includes(query) ||
           analysisItem.duplicateGroups.some(group => 
             group.baseItem.names.en.toLowerCase().includes(query)
           );
  });

  const totalDuplicates = analysis.reduce((sum, a) => sum + a.duplicateGroups.length, 0);
  const totalUnassigned = analysis.reduce((sum, a) => sum + a.unassignedItems.length, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Item Reorganizer & Size Merger
          </CardTitle>
          <CardDescription>
            Analyze and reorganize your menu items, merge duplicates, and assign categories automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={analyzeData} 
              disabled={loading || processing}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze Items
                </>
              )}
            </Button>
            {analysis.length > 0 && (
              <>
                <Button 
                  onClick={mergeAllDuplicates}
                  disabled={processing || totalDuplicates === 0}
                  variant="outline"
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Working...
                    </>
                  ) : (
                    <>
                      <Merge className="h-4 w-4 mr-2" />
                      Merge All Duplicates
                    </>
                  )}
                </Button>
                <Button 
                  onClick={smartOrganize}
                  disabled={processing}
                  variant="outline"
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Organizing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Smart Organize
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {analysis.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Found {totalDuplicates} potential duplicate groups and {totalUnassigned} unassigned items.
                Review the analysis below and select items to merge.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analysis.length > 0 && (
        <Tabs defaultValue="duplicates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="duplicates">Duplicates ({totalDuplicates})</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned ({totalUnassigned})</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="duplicates" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Categories</option>
                {analysis.map(a => (
                  <option key={a.category.id} value={a.category.id}>
                    {a.category.names.en}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {filteredAnalysis.map(analysisItem => (
                <Card key={analysisItem.category.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {analysisItem.category.icon} {analysisItem.category.names.en}
                      <Badge variant="outline" className="ml-2">
                        {analysisItem.duplicateGroups.length} groups
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisItem.duplicateGroups.length === 0 ? (
                      <p className="text-muted-foreground">No duplicate groups found in this category.</p>
                    ) : (
                      <div className="space-y-3">
                        {analysisItem.duplicateGroups.map((group, index) => {
                          const mergeKey = `${analysisItem.category.id}|${group.baseItem.names.en.toLowerCase().replace(/\s+/g, ' ')}`;
                          const isSelected = selectedMerges.has(mergeKey);
                          
                          return (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const newSelected = new Set(selectedMerges);
                                    if (checked) {
                                      newSelected.add(mergeKey);
                                    } else {
                                      newSelected.delete(mergeKey);
                                    }
                                    setSelectedMerges(newSelected);
                                  }}
                                />
                                <span className="font-medium">{group.baseItem.names.en}</span>
                                <Badge variant="secondary">
                                  {group.totalItems} items
                                </Badge>
                                <Badge variant="outline">
                                  {group.priceRange.min} - {group.priceRange.max} TL
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-muted-foreground ml-6">
                                <p>Base item: {group.baseItem.names.en} ({group.baseItem.price} TL)</p>
                                <p>Duplicates: {group.duplicates.map(d => `${d.names.en} (${d.price} TL)`).join(', ')}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedMerges.size > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedMerges.size} groups selected for merging</p>
                      <p className="text-sm text-muted-foreground">
                        This will merge duplicate items into single items with size variants.
                      </p>
                    </div>
                    <Button 
                      onClick={mergeSelectedItems}
                      disabled={processing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Merging...
                        </>
                      ) : (
                        <>
                          <Merge className="h-4 w-4 mr-2" />
                          Merge Selected
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {processing && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{currentStep}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="unassigned" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Unassigned Items</h3>
              {totalUnassigned > 0 && (
                <Button 
                  onClick={assignUnassignedItems}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Auto-Assign All
                    </>
                  )}
                </Button>
              )}
            </div>

            {totalUnassigned === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  All items are properly assigned to categories!
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {analysis.map(analysisItem => 
                  analysisItem.unassignedItems.length > 0 && (
                    <Card key={analysisItem.category.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {analysisItem.category.icon} {analysisItem.category.names.en}
                          <Badge variant="outline" className="ml-2">
                            {analysisItem.unassignedItems.length} items
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysisItem.unassignedItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <p className="font-medium">{item.names.en}</p>
                                <p className="text-sm text-muted-foreground">{item.price} TL</p>
                              </div>
                              <Badge variant="secondary">Unassigned</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.map(analysisItem => (
                <Card key={analysisItem.category.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {analysisItem.category.icon} {analysisItem.category.names.en}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Items:</span>
                        <Badge variant="outline">{analysisItem.itemCount}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Duplicate Groups:</span>
                        <Badge variant={analysisItem.duplicateGroups.length > 0 ? "destructive" : "secondary"}>
                          {analysisItem.duplicateGroups.length}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Unassigned:</span>
                        <Badge variant={analysisItem.unassignedItems.length > 0 ? "destructive" : "secondary"}>
                          {analysisItem.unassignedItems.length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default ItemReorganizer;
