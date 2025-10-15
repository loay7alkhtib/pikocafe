import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Merge,
  Eye,
  Save,
  Trash2
} from 'lucide-react';
import { Item, itemsAPI } from '../../lib/supabase';
import { toast } from 'sonner';

interface SizeVariantMergerProps {
  items: Item[];
  onRefresh: () => void;
}

interface MergeGroup {
  baseName: string;
  items: Item[];
  mergedItem?: Item;
}

export default function SizeVariantMerger({ items, onRefresh }: SizeVariantMergerProps) {
  const [mergeGroups, setMergeGroups] = useState<MergeGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({
    merged: 0,
    deleted: 0,
    errors: 0
  });

  // Find items that can be merged based on similar names
  useEffect(() => {
    const groups: MergeGroup[] = [];
    const processedItems = new Set<string>();

    items.forEach(item => {
      if (processedItems.has(item.id)) return;

      // Find items with similar names (same base name)
      const baseName = item.names?.en?.toLowerCase().trim() || '';
      const similarItems = items.filter(otherItem => 
        otherItem.id !== item.id &&
        !processedItems.has(otherItem.id) &&
        otherItem.names?.en?.toLowerCase().trim() === baseName
      );

      if (similarItems.length > 0) {
        const group: MergeGroup = {
          baseName: item.names?.en || 'Unnamed',
          items: [item, ...similarItems]
        };
        groups.push(group);
        
        // Mark all items in this group as processed
        [item, ...similarItems].forEach(groupItem => {
          processedItems.add(groupItem.id);
        });
      }
    });

    setMergeGroups(groups);
  }, [items]);

  const createMergedItem = (group: MergeGroup): Item => {
    const baseItem = group.items[0];
    const variants = group.items.map(item => ({
      size: item.names?.en?.replace(baseItem.names?.en || '', '').trim() || 'Regular',
      price: item.price
    }));

    // If no size difference, use "Regular" for the base item
    if (variants[0].size === '') {
      variants[0].size = 'Regular';
    }

    return {
      ...baseItem,
      variants: variants,
      price: Math.min(...group.items.map(item => item.price)) // Use lowest price as base
    };
  };

  const handleMergeGroup = async (groupIndex: number) => {
    const group = mergeGroups[groupIndex];
    if (!group) return;

    const mergedItem = createMergedItem(group);
    
    try {
      // Create the merged item
      await itemsAPI.create({
        names: mergedItem.names,
        category_id: mergedItem.category_id,
        price: mergedItem.price,
        image: mergedItem.image,
        tags: mergedItem.tags,
        variants: mergedItem.variants,
        order: mergedItem.order
      });

      // Delete the original items
      for (const item of group.items) {
        await itemsAPI.delete(item.id);
      }

      toast.success(`Merged ${group.items.length} items into one with size variants`);
      onRefresh();
    } catch (error: any) {
      console.error('Error merging group:', error);
      toast.error('Failed to merge items');
    }
  };

  const handleMergeAll = async () => {
    if (mergeGroups.length === 0) return;

    const confirmed = confirm(
      `Merge ${mergeGroups.length} groups of items with similar names?\n\n` +
      `This will:\n` +
      `• Create items with size variants\n` +
      `• Delete duplicate items\n` +
      `• Keep the first item as the base\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    setProgress(0);
    setResults({ merged: 0, deleted: 0, errors: 0 });

    try {
      for (let i = 0; i < mergeGroups.length; i++) {
        const group = mergeGroups[i];
        
        try {
          const mergedItem = createMergedItem(group);
          
          // Create the merged item
          await itemsAPI.create({
            names: mergedItem.names,
            category_id: mergedItem.category_id,
            price: mergedItem.price,
            image: mergedItem.image,
            tags: mergedItem.tags,
            variants: mergedItem.variants,
            order: mergedItem.order
          });

          // Delete the original items
          for (const item of group.items) {
            await itemsAPI.delete(item.id);
          }

          setResults(prev => ({ 
            ...prev, 
            merged: prev.merged + 1,
            deleted: prev.deleted + group.items.length
          }));
        } catch (error: any) {
          console.error(`Error merging group ${i + 1}:`, error);
          setResults(prev => ({ ...prev, errors: prev.errors + 1 }));
        }

        setProgress(((i + 1) / mergeGroups.length) * 100);
      }

      toast.success(`Successfully merged ${results.merged} groups!`);
      onRefresh();
    } catch (error: any) {
      console.error('Error merging all groups:', error);
      toast.error('Failed to merge groups');
    } finally {
      setIsProcessing(false);
    }
  };

  if (mergeGroups.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            No Items to Merge
          </CardTitle>
          <CardDescription className="text-green-700">
            No items found with similar names that can be merged into size variants.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Merge className="w-5 h-5" />
            Size Variant Merger
          </CardTitle>
          <CardDescription className="text-blue-700">
            Found {mergeGroups.length} groups of items with similar names that can be merged into size variants.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-100">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Merge Items with Similar Names</AlertTitle>
            <AlertDescription className="text-blue-700">
              This will merge items with similar names into single items with size variants. 
              The original items will be deleted and replaced with one item containing all size options.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={handleMergeAll}
              disabled={isProcessing}
              className="gap-2"
              size="lg"
            >
              <Merge className="w-4 h-4" />
              {isProcessing ? 'Merging...' : `Merge All ${mergeGroups.length} Groups`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {mergeGroups.map((group, index) => (
          <Card key={index} className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{group.baseName}</span>
                <div className="flex gap-2">
                  <Badge variant="outline">{group.items.length} items</Badge>
                  <Button
                    onClick={() => handleMergeGroup(index)}
                    size="sm"
                    className="gap-2"
                  >
                    <Merge className="w-3 h-3" />
                    Merge
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.items.map((item, itemIndex) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{item.names?.en || 'Unnamed'}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.names?.tr || 'No Turkish name'} • {item.price} TL
                      </div>
                    </div>
                    <Badge variant="secondary">{item.price} TL</Badge>
                  </div>
                ))}
                
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Will become:
                  </div>
                  <div className="space-y-1">
                    {createMergedItem(group).variants?.map((variant, variantIndex) => (
                      <div key={variantIndex} className="flex justify-between text-sm">
                        <span>{variant.size}</span>
                        <span className="font-medium">{variant.price} TL</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Merging Items...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </div>
          </CardContent>
        </Card>
      )}

      {results.merged > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Merge Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>Groups Merged: {results.merged}</div>
              <div>Items Deleted: {results.deleted}</div>
              <div>Errors: {results.errors}</div>
            </div>
            <div className="mt-4 text-sm text-green-700">
              💡 Items have been merged into size variants. Check your menu to see the changes!
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
