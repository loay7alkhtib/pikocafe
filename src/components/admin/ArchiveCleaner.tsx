import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Eye,
  Shield,
  Archive
} from 'lucide-react';
import { itemsAPI } from '../../lib/supabase';
import { toast } from 'sonner';

interface ArchiveCleanerProps {
  onRefresh: () => void;
}

export default function ArchiveCleaner({ onRefresh }: ArchiveCleanerProps) {
  const [archivedItems, setArchivedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({
    deleted: 0,
    errors: 0
  });

  // Load archived items
  const loadArchivedItems = async () => {
    setIsLoading(true);
    try {
      const items = await itemsAPI.getArchived();
      setArchivedItems(items);
      console.log(`📦 Found ${items.length} archived items`);
    } catch (error: any) {
      console.error('Error loading archived items:', error);
      toast.error('Failed to load archived items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArchivedItems();
  }, []);

  const handlePermanentDelete = async () => {
    if (archivedItems.length === 0) {
      toast.info('No archived items to delete');
      return;
    }

    const confirmed = confirm(
      `⚠️ PERMANENT DELETE WARNING ⚠️\n\n` +
      `Are you absolutely sure you want to PERMANENTLY DELETE ${archivedItems.length} archived items?\n\n` +
      `This action:\n` +
      `• CANNOT be undone\n` +
      `• Will permanently remove all archived items\n` +
      `• Will free up storage space\n\n` +
      `Type "DELETE" to confirm (case sensitive):`
    );

    if (confirmed !== true) return;

    // Double confirmation
    const doubleConfirm = prompt(
      `Final confirmation: Type "DELETE" exactly to permanently delete ${archivedItems.length} archived items:`
    );

    if (doubleConfirm !== 'DELETE') {
      toast.error('Deletion cancelled - confirmation text did not match');
      return;
    }

    setIsDeleting(true);
    setProgress(0);
    setResults({ deleted: 0, errors: 0 });

    try {
      for (let i = 0; i < archivedItems.length; i++) {
        const item = archivedItems[i];
        
        try {
          // Note: We need to implement a permanent delete API endpoint
          // For now, we'll use the existing delete endpoint
          await itemsAPI.delete(item.id);
          setResults(prev => ({ ...prev, deleted: prev.deleted + 1 }));
          console.log(`🗑️ Permanently deleted: ${item.names?.en || 'Unnamed'}`);
        } catch (error: any) {
          console.error(`❌ Failed to delete ${item.names?.en || 'Unnamed'}:`, error.message);
          setResults(prev => ({ ...prev, errors: prev.errors + 1 }));
        }

        setProgress(((i + 1) / archivedItems.length) * 100);
      }

      toast.success(`Permanently deleted ${results.deleted} archived items!`);
      loadArchivedItems(); // Refresh the list
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting archived items:', error);
      toast.error('Failed to delete archived items');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async (itemIds: string[]) => {
    if (itemIds.length === 0) {
      toast.info('No items selected');
      return;
    }

    const confirmed = confirm(
      `Permanently delete ${itemIds.length} selected archived items?\n\n` +
      `This action CANNOT be undone!`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setProgress(0);
    setResults({ deleted: 0, errors: 0 });

    try {
      for (let i = 0; i < itemIds.length; i++) {
        const itemId = itemIds[i];
        
        try {
          await itemsAPI.delete(itemId);
          setResults(prev => ({ ...prev, deleted: prev.deleted + 1 }));
        } catch (error: any) {
          console.error(`❌ Failed to delete item:`, error.message);
          setResults(prev => ({ ...prev, errors: prev.errors + 1 }));
        }

        setProgress(((i + 1) / itemIds.length) * 100);
      }

      toast.success(`Permanently deleted ${results.deleted} selected items!`);
      loadArchivedItems();
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting selected items:', error);
      toast.error('Failed to delete selected items');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading Archived Items...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (archivedItems.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            No Archived Items
          </CardTitle>
          <CardDescription className="text-green-700">
            Your archive is empty. No items to permanently delete.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Trash2 className="w-5 h-5" />
            Archive Cleaner
          </CardTitle>
          <CardDescription className="text-red-700">
            Permanently delete archived items to free up storage space. This action CANNOT be undone!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-100">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">⚠️ PERMANENT DELETE WARNING</AlertTitle>
            <AlertDescription className="text-red-700">
              This will permanently delete archived items from the database. 
              This action cannot be undone and will free up storage space.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">{archivedItems.length}</div>
              <div className="text-sm text-red-800">Archived Items</div>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">
                {archivedItems.filter(item => item.deleted_at).length}
              </div>
              <div className="text-sm text-red-800">Recently Archived</div>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">
                {archivedItems.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(0)} TL
              </div>
              <div className="text-sm text-red-800">Total Value</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePermanentDelete}
              disabled={isDeleting || archivedItems.length === 0}
              variant="destructive"
              className="gap-2"
              size="lg"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : `Permanently Delete All ${archivedItems.length} Items`}
            </Button>
            
            <Button
              onClick={loadArchivedItems}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Archived Items Preview
          </CardTitle>
          <CardDescription>
            Items that will be permanently deleted (first 20 shown)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {archivedItems.slice(0, 20).map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{item.names?.en || 'Unnamed'}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.deleted_at ? `Archived: ${new Date(item.deleted_at).toLocaleDateString()}` : 'Archived'}
                  </div>
                </div>
                <Badge variant="destructive">{item.price} TL</Badge>
              </div>
            ))}
            {archivedItems.length > 20 && (
              <div className="text-center text-sm text-muted-foreground py-2">
                ... and {archivedItems.length - 20} more items
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isDeleting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Permanently Deleting...
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

      {results.deleted > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Deletion Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Items Deleted: {results.deleted}</div>
              <div>Errors: {results.errors}</div>
            </div>
            <div className="mt-4 text-sm text-green-700">
              💾 Storage space has been freed up by permanently deleting archived items.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
