import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { categoriesAPI, itemsAPI } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Database, 
  AlertTriangle,
  Info
} from 'lucide-react';

export default function DiagnosticTool() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Check categories
      try {
        const categories = await categoriesAPI.getAll();
        results.tests.categories = {
          status: 'success',
          count: categories.length,
          data: categories,
          message: `Found ${categories.length} categories`
        };
      } catch (error: any) {
        results.tests.categories = {
          status: 'error',
          error: error.message,
          message: 'Failed to fetch categories'
        };
      }

      // Test 2: Check items
      try {
        const items = await itemsAPI.getAll();
        results.tests.items = {
          status: 'success',
          count: items.length,
          data: items,
          message: `Found ${items.length} items`
        };
      } catch (error: any) {
        results.tests.items = {
          status: 'error',
          error: error.message,
          message: 'Failed to fetch items'
        };
      }

      // Test 3: Check for specific categories
      if (results.tests.categories.status === 'success') {
        const categories = results.tests.categories.data;
        const allItemsCategory = categories.find((c: any) => c.id === 'cat-all-items');
        const otherCategory = categories.find((c: any) => c.id === 'cat-other');
        
        results.tests.specialCategories = {
          status: 'success',
          allItems: !!allItemsCategory,
          other: !!otherCategory,
          message: `All Items: ${allItemsCategory ? '✅' : '❌'}, Other: ${otherCategory ? '✅' : '❌'}`
        };
      }

      setDiagnostics(results);
      
      if (results.tests.categories.status === 'success' && results.tests.categories.count === 0) {
        toast.error('No categories found! Database needs initialization.');
      } else if (results.tests.categories.status === 'success') {
        toast.success(`Diagnostics complete! Found ${results.tests.categories.count} categories.`);
      } else {
        toast.error('Database connection failed!');
      }

    } catch (error: any) {
      results.error = error.message;
      setDiagnostics(results);
      toast.error('Diagnostics failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const initializeDatabase = async () => {
    try {
      setIsRunning(true);
      
      // Try to initialize categories
      const response = await fetch('/api/init-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Initialized ${result.categoriesCount} categories!`);
        // Re-run diagnostics
        setTimeout(() => runDiagnostics(), 1000);
      } else {
        throw new Error('Failed to initialize database');
      }
    } catch (error: any) {
      toast.error('Failed to initialize database: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Diagnostics
        </CardTitle>
        <CardDescription>
          Check the status of your Piko Cafe database and initialize if needed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Run Diagnostics
          </Button>
          
          <Button 
            onClick={initializeDatabase} 
            disabled={isRunning}
            variant="outline"
            className="gap-2"
          >
            <Database className="w-4 h-4" />
            Initialize Database
          </Button>
        </div>

        {diagnostics && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Diagnostics completed at {new Date(diagnostics.timestamp).toLocaleString()}
              </AlertDescription>
            </Alert>

            {Object.entries(diagnostics.tests).map(([testName, result]: [string, any]) => (
              <Card key={testName}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium capitalize">
                        {testName.replace(/([A-Z])/g, ' $1')}
                      </span>
                    </div>
                    <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                      {result.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    {result.message}
                  </p>

                  {result.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-700 dark:text-red-400">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}

                  {result.count !== undefined && (
                    <div className="mt-2">
                      <Badge variant="secondary">Count: {result.count}</Badge>
                    </div>
                  )}

                  {testName === 'categories' && result.data && result.data.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Categories Found:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {result.data.map((category: any) => (
                          <div key={category.id} className="flex items-center gap-2 text-sm">
                            <span>{category.icon}</span>
                            <span>{category.names?.en || category.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {diagnostics.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>General Error:</strong> {diagnostics.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            {diagnostics.tests.categories?.status === 'success' && diagnostics.tests.categories.count === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommendation:</strong> No categories found. Click "Initialize Database" to set up your menu categories.
                </AlertDescription>
              </Alert>
            )}

            {diagnostics.tests.specialCategories?.status === 'success' && 
             (!diagnostics.tests.specialCategories.allItems || !diagnostics.tests.specialCategories.other) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Missing Categories:</strong> Some special categories are missing. Re-initialize the database to fix this.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
