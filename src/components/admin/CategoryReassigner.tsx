import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Tag,
  Eye,
  Save
} from 'lucide-react';
import { Item, Category, itemsAPI } from '../../lib/supabase';
import { toast } from 'sonner';

interface CategoryReassignerProps {
  items: Item[];
  categories: Category[];
  onRefresh: () => void;
}

export default function CategoryReassigner({ items, categories, onRefresh }: CategoryReassignerProps) {
  const [itemsWithoutCategory, setItemsWithoutCategory] = useState<Item[]>([]);
  const [categoryAssignments, setCategoryAssignments] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({
    updated: 0,
    errors: 0
  });

  // Find items without categories
  useEffect(() => {
    const itemsWithoutCat = items.filter(item => !item.category_id || item.category_id === '');
    setItemsWithoutCategory(itemsWithoutCat);
    
    // Initialize assignments with empty values
    const initialAssignments: Record<string, string> = {};
    itemsWithoutCat.forEach(item => {
      initialAssignments[item.id] = '';
    });
    setCategoryAssignments(initialAssignments);
  }, [items]);

  const handleCategoryChange = (itemId: string, categoryId: string) => {
    setCategoryAssignments(prev => ({
      ...prev,
      [itemId]: categoryId
    }));
  };

  const assignAllToCategory = (categoryId: string) => {
    const newAssignments: Record<string, string> = {};
    itemsWithoutCategory.forEach(item => {
      newAssignments[item.id] = categoryId;
    });
    setCategoryAssignments(newAssignments);
    toast.success(`Assigned all items to ${categories.find(c => c.id === categoryId)?.names?.en || 'category'}`);
  };

  const processAssignments = async () => {
    const assignmentsToProcess = Object.entries(categoryAssignments).filter(
      ([_, categoryId]) => categoryId !== ''
    );

    if (assignmentsToProcess.length === 0) {
      toast.info('No assignments to process');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults({ updated: 0, errors: 0 });

    try {
      for (let i = 0; i < assignmentsToProcess.length; i++) {
        const [itemId, categoryId] = assignmentsToProcess[i];
        
        try {
          const item = itemsWithoutCategory.find(item => item.id === itemId);
          if (!item) continue;

          await itemsAPI.update(itemId, {
            ...item,
            category_id: categoryId
          });

          setResults(prev => ({ ...prev, updated: prev.updated + 1 }));
          console.log(`✅ Updated: ${item.names?.en || 'Unnamed'}`);
        } catch (error: any) {
          console.error(`❌ Failed to update item:`, error.message);
          setResults(prev => ({ ...prev, errors: prev.errors + 1 }));
        }

        setProgress(((i + 1) / assignmentsToProcess.length) * 100);
      }

      toast.success(`Successfully updated ${results.updated} items!`);
      onRefresh();
    } catch (error: any) {
      console.error('Error processing assignments:', error);
      toast.error('Failed to process assignments');
    } finally {
      setIsProcessing(false);
    }
  };

  const getUnassignedCount = () => {
    return Object.values(categoryAssignments).filter(categoryId => categoryId === '').length;
  };

  if (itemsWithoutCategory.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            All Items Have Categories
          </CardTitle>
          <CardDescription className="text-green-700">
            Great! All items are properly assigned to categories.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Tag className="w-5 h-5" />
            Category Reassigner
          </CardTitle>
          <CardDescription className="text-orange-700">
            Found {itemsWithoutCategory.length} items without categories. Assign them to appropriate categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-100">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">Items Need Categories</AlertTitle>
            <AlertDescription className="text-orange-700">
              These items don't have categories assigned. Please assign them to appropriate categories before proceeding.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={() => setCategoryAssignments({})}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset All
            </Button>
            
            <Select onValueChange={assignAllToCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Assign all to..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.names?.en || 'Category'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {itemsWithoutCategory.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{item.names?.en || 'Unnamed Item'}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.names?.tr || 'No Turkish name'} • {item.price} TL
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {item.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={categoryAssignments[item.id] || ''}
                    onValueChange={(value) => handleCategoryChange(item.id, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.names?.en || 'Category'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {getUnassignedCount()} items still need categories
            </div>
            
            <Button
              onClick={processAssignments}
              disabled={isProcessing || getUnassignedCount() > 0}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isProcessing ? 'Processing...' : `Update ${Object.values(categoryAssignments).filter(c => c !== '').length} Items`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Processing Assignments...
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

      {results.updated > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Categories Assigned!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Items Updated: {results.updated}</div>
              <div>Errors: {results.errors}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
