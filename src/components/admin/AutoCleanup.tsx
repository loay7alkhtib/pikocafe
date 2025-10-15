import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  Settings,
  Trash2,
  Tag,
  Merge
} from 'lucide-react';
import { Item, Category, itemsAPI, categoriesAPI } from '../../lib/supabase';
import { toast } from 'sonner';

interface AutoCleanupProps {
  items: Item[];
  categories: Category[];
  onRefresh: () => void;
}

export default function AutoCleanup({ items, categories, onRefresh }: AutoCleanupProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({
    categoriesAssigned: 0,
    itemsMerged: 0,
    archivedDeleted: 0,
    errors: 0
  });

  const assignCategories = async () => {
    const itemsWithoutCategory = items.filter(item => !item.category_id || item.category_id === '');
    
    if (itemsWithoutCategory.length === 0) {
      return { assigned: 0, errors: 0 };
    }

    let assigned = 0;
    let errors = 0;

    for (const item of itemsWithoutCategory) {
      try {
        let assignedCategory = null;
        const itemName = (item.names?.en || '').toLowerCase();
        const itemTags = (item.tags || []).join(' ').toLowerCase();
        
        // Smart category assignment based on keywords
        if (itemName.includes('coffee') || itemName.includes('americano') || itemName.includes('latte') || itemName.includes('cappuccino')) {
          assignedCategory = categories.find(cat => cat.names?.en?.toLowerCase().includes('coffee'))?.id;
        } else if (itemName.includes('tea') || itemName.includes('chai')) {
          assignedCategory = categories.find(cat => cat.names?.en?.toLowerCase().includes('tea'))?.id;
        } else if (itemName.includes('juice') || itemName.includes('smoothie') || itemName.includes('shake')) {
          assignedCategory = categories.find(cat => cat.names?.en?.toLowerCase().includes('juice') || cat.names?.en?.toLowerCase().includes('smoothie'))?.id;
        } else if (itemName.includes('cake') || itemName.includes('dessert') || itemName.includes('pastry')) {
          assignedCategory = categories.find(cat => cat.names?.en?.toLowerCase().includes('dessert'))?.id;
        } else {
          // Default to first category
          assignedCategory = categories[0]?.id;
        }
        
        if (assignedCategory) {
          await itemsAPI.update(item.id, {
            ...item,
            category_id: assignedCategory
          });
          assigned++;
        }
      } catch (error) {
        console.error(`Failed to assign category for ${item.names?.en}:`, error);
        errors++;
      }
    }

    return { assigned, errors };
  };

  const mergeSizeVariants = async () => {
    // Group items by base name
    const itemGroups: { [key: string]: Item[] } = {};
    items.forEach(item => {
      const baseName = (item.names?.en || '').toLowerCase().trim();
      if (!itemGroups[baseName]) {
        itemGroups[baseName] = [];
      }
      itemGroups[baseName].push(item);
    });

    // Find groups with multiple items (potential size variants)
    const mergeGroups = Object.values(itemGroups).filter(group => group.length > 1);
    
    let merged = 0;
    let errors = 0;

    for (const group of mergeGroups) {
      try {
        const baseItem = group[0];
        const variants = group.map(item => ({
          size: (item.names?.en || '').replace(baseItem.names?.en || '', '').trim() || 'Regular',
          price: item.price
        }));

        // Create merged item
        const mergedItem = {
          names: baseItem.names,
          category_id: baseItem.category_id,
          price: Math.min(...group.map(item => item.price)),
          image: baseItem.image,
          tags: baseItem.tags,
          variants: variants,
          order: baseItem.order
        };

        await itemsAPI.create(mergedItem);

        // Delete original items
        for (const item of group) {
          await itemsAPI.delete(item.id);
        }

        merged++;
      } catch (error) {
        console.error(`Failed to merge group:`, error);
        errors++;
      }
    }

    return { merged, errors };
  };

  const cleanupArchived = async () => {
    try {
      const archivedItems = await itemsAPI.getArchived();
      
      let deleted = 0;
      let errors = 0;

      for (const item of archivedItems) {
        try {
          await itemsAPI.delete(item.id);
          deleted++;
        } catch (error) {
          console.error(`Failed to delete archived item:`, error);
          errors++;
        }
      }

      return { deleted, errors };
    } catch (error) {
      console.error('Failed to get archived items:', error);
      return { deleted: 0, errors: 1 };
    }
  };

  const runAutoCleanup = async () => {
    const confirmed = confirm(
      `🤖 Run Automated Menu Cleanup?\n\n` +
      `This will automatically:\n` +
      `• Assign categories to items without categories\n` +
      `• Merge items with similar names into size variants\n` +
      `• Permanently delete archived items\n\n` +
      `This action cannot be undone. Continue?`
    );

    if (!confirmed) return;

    setIsRunning(true);
    setProgress(0);
    setResults({
      categoriesAssigned: 0,
      itemsMerged: 0,
      archivedDeleted: 0,
      errors: 0
    });

    try {
      // Step 1: Assign categories
      setCurrentStep('Assigning categories...');
      setProgress(25);
      const categoryResults = await assignCategories();
      setResults(prev => ({ ...prev, categoriesAssigned: categoryResults.assigned, errors: prev.errors + categoryResults.errors }));

      // Step 2: Merge size variants
      setCurrentStep('Merging size variants...');
      setProgress(50);
      const mergeResults = await mergeSizeVariants();
      setResults(prev => ({ ...prev, itemsMerged: mergeResults.merged, errors: prev.errors + mergeResults.errors }));

      // Step 3: Clean up archived items
      setCurrentStep('Cleaning archived items...');
      setProgress(75);
      const archiveResults = await cleanupArchived();
      setResults(prev => ({ ...prev, archivedDeleted: archiveResults.deleted, errors: prev.errors + archiveResults.errors }));

      // Complete
      setCurrentStep('Cleanup completed!');
      setProgress(100);

      toast.success('Automated cleanup completed successfully!');
      onRefresh();
    } catch (error: any) {
      console.error('Auto cleanup error:', error);
      toast.error('Automated cleanup failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Zap className="w-5 h-5" />
            Automated Menu Cleanup
          </CardTitle>
          <CardDescription className="text-purple-700">
            One-click solution to clean up your entire menu automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-purple-200 bg-purple-100">
            <AlertTriangle className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-800">🤖 Automated Process</AlertTitle>
            <AlertDescription className="text-purple-700">
              This will automatically assign categories, merge size variants, and clean archived items. 
              The process is intelligent and will make smart decisions based on item names and tags.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Category Assignment</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Automatically assign categories based on item names and tags
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Merge className="w-4 h-4 text-green-600" />
                <span className="font-medium">Size Variant Merging</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Merge items with similar names into size variants
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span className="font-medium">Archive Cleanup</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Permanently delete archived items to free space
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={runAutoCleanup}
              disabled={isRunning}
              className="gap-2"
              size="lg"
            >
              <Zap className="w-4 h-4" />
              {isRunning ? 'Running Cleanup...' : 'Run Automated Cleanup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Running Automated Cleanup...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">{currentStep}</div>
            <Progress value={progress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </div>
          </CardContent>
        </Card>
      )}

      {results.categoriesAssigned > 0 || results.itemsMerged > 0 || results.archivedDeleted > 0 ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Cleanup Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-800">Categories Assigned</div>
                <div className="text-2xl font-bold text-green-600">{results.categoriesAssigned}</div>
              </div>
              <div>
                <div className="font-medium text-green-800">Items Merged</div>
                <div className="text-2xl font-bold text-green-600">{results.itemsMerged}</div>
              </div>
              <div>
                <div className="font-medium text-green-800">Archived Deleted</div>
                <div className="text-2xl font-bold text-green-600">{results.archivedDeleted}</div>
              </div>
              <div>
                <div className="font-medium text-green-800">Errors</div>
                <div className="text-2xl font-bold text-red-600">{results.errors}</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-green-700">
              🎉 Your menu has been automatically cleaned and organized!
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}