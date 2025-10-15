import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Archive,
  X
} from 'lucide-react';
import { itemsAPI, Item } from '../../lib/supabase';
import { toast } from 'sonner';

interface ArchiveCleanerProps {
  onComplete?: () => void;
}

export function ArchiveCleaner({ onComplete }: ArchiveCleanerProps = {}) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [archivedItems, setArchivedItems] = useState<Item[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load archived items
  const loadArchivedItems = async () => {
    setLoading(true);
    setCurrentStep('Loading archived items...');

    try {
      const items = await itemsAPI.getArchived();
      setArchivedItems(items || []);
      setProgress(100);
      setCurrentStep('Archived items loaded successfully');
    } catch (error: any) {
      console.error('Error loading archived items:', error);
      toast.error(`Failed to load archived items: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Permanently delete all archived items (fast bulk)
  const deleteAllArchived = async () => {
    if (archivedItems.length === 0) {
      toast.info('No archived items to delete');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setCurrentStep('Starting permanent deletion...');

    try {
      setCurrentStep('Deleting archived items (bulk)...');
      try {
        const res = await itemsAPI.deleteArchivedBulk(); // delete all archived on server
        setProgress(100);
        setCurrentStep(`Deleted ${res.deleted}/${res.total} (errors: ${res.errors || 0})`);
        toast.success(`Deleted ${res.deleted} archived items`);
      } catch (bulkErr: any) {
        // Fallback if bulk not available
        console.warn('Bulk delete unavailable, falling back to per-item delete:', bulkErr?.message);
        const total = archivedItems.length;
        let processed = 0;
        let errors = 0;
        const maxConcurrency = 8;
        let idx = 0;
        let active = 0;
        await new Promise<void>((resolve) => {
          const next = () => {
            if (idx >= total && active === 0) return resolve();
            while (active < maxConcurrency && idx < total) {
              const item = archivedItems[idx++];
              active++;
              (async () => {
                try {
                  await itemsAPI.deleteArchived(item.id);
                  processed++;
                } catch {
                  errors++;
                } finally {
                  active--;
                  setProgress(Math.round(((processed + errors) / total) * 100));
                  next();
                }
              })();
            }
          };
          next();
        });
        setCurrentStep(`Deleted ${processed}/${total} (errors: ${errors})`);
        toast.success(`Deleted ${processed} archived items`);
      }
      await loadArchivedItems();
      setShowConfirmDialog(false);
      onComplete?.();
    } catch (error: any) {
      console.error('Delete all error:', error);
      toast.error(`Failed to delete archived items: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const totalArchived = archivedItems.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Archive Cleaner
          </CardTitle>
          <CardDescription>
            Permanently delete all archived items from your database. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={loadArchivedItems} 
              disabled={loading || processing}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Load Archived Items
                </>
              )}
            </Button>
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

          {totalArchived > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Found {totalArchived} archived items. These can be permanently deleted.
              </AlertDescription>
            </Alert>
          )}

          {totalArchived === 0 && archivedItems.length === 0 && !loading && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                No archived items found. Your archive is clean!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {totalArchived > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Archived Items ({totalArchived})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {archivedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.names.en}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.names.tr} • {item.price} TL
                    </p>
                    {item.archived_at && (
                      <p className="text-xs text-muted-foreground">
                        Archived: {new Date(item.archived_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant="destructive">Archived</Badge>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">
                    ⚠️ Permanent Deletion
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete all {totalArchived} archived items. This action cannot be undone.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={processing}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All Permanently
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Permanent Deletion
              </CardTitle>
              <CardDescription>
                This action cannot be undone. All {totalArchived} archived items will be permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This will permanently delete all archived items from your database. 
                  This action cannot be undone and the items cannot be restored.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowConfirmDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={deleteAllArchived}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ArchiveCleaner;
