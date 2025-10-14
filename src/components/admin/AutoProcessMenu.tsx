import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { AlertCircle, CheckCircle2, Loader2, Upload, FileJson, TrendingUp, FileUp } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface RawMenuItem {
  names: {
    en: string;
    tr: string;
    ar: string;
  };
  price: number;
  category_id: string;
  tags: string[];
  variants?: Array<{
    size: string;
    price: number;
  }>;
}

interface ProcessedItem {
  names: {
    en: string;
    tr: string;
    ar: string;
  };
  price: number;
  category_id: string;
  tags: string[];
  variants: Array<{
    size: string;
    price: number;
  }>;
}

interface AutoProcessMenuProps {
  onComplete?: () => void;
}

export function AutoProcessMenu({ onComplete }: AutoProcessMenuProps = {}) {
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jsonInput, setJsonInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    duplicates: number;
    consolidated: number;
    uploaded: number;
    errors: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Consolidate duplicate items
  const consolidateItems = (items: RawMenuItem[]): ProcessedItem[] => {
    // Validate input
    if (!Array.isArray(items)) {
      throw new Error('consolidateItems: items parameter must be an array');
    }
    
    const grouped = new Map<string, ProcessedItem>();

    items.forEach(item => {
      // Create unique key based on English name + category
      const key = `${item.names.en.toLowerCase().trim()}_${item.category_id}`;
      
      if (!grouped.has(key)) {
        // First occurrence - create base item
        const baseItem: ProcessedItem = {
          names: item.names,
          price: item.price,
          category_id: item.category_id,
          tags: item.tags,
          variants: []
        };
        
        // If this item already has variants, add them
        if (item.variants && item.variants.length > 0) {
          baseItem.variants.push(...item.variants);
        }
        
        grouped.set(key, baseItem);
      } else {
        // Duplicate found - merge variants
        const existing = grouped.get(key)!;
        
        // If this variant has a different price, add it as a variant
        if (item.price !== existing.price) {
          // Determine size name from Arabic suffix or default to price-based name
          let sizeName = '';
          
          if (item.names.ar.includes('وسط')) {
            sizeName = 'Medium';
          } else if (item.names.ar.includes('كبير')) {
            sizeName = 'Large';
          } else if (item.names.ar.includes('دبل') || item.names.ar.includes('Double')) {
            sizeName = 'Double';
          } else if (item.variants && item.variants.length > 0) {
            sizeName = item.variants[0].size;
          } else {
            // Default naming
            sizeName = `${item.price} TL`;
          }
          
          // Check if this variant already exists
          const variantExists = existing.variants.some(
            v => v.size === sizeName || v.price === item.price
          );
          
          if (!variantExists) {
            existing.variants.push({
              size: sizeName,
              price: item.price
            });
          }
        }
        
        // Also add any variants from this duplicate
        if (item.variants && item.variants.length > 0) {
          item.variants.forEach(variant => {
            const variantExists = existing.variants.some(
              v => v.size === variant.size || v.price === variant.price
            );
            if (!variantExists) {
              existing.variants.push(variant);
            }
          });
        }
        
        // Update base price to lowest price
        existing.price = Math.min(existing.price, item.price);
      }
    });

    return Array.from(grouped.values());
  };

  const processAndUpload = async () => {
    setProcessing(true);
    setUploading(false);
    setError(null);
    setSuccess(false);
    setLogs([]);
    setStats(null);
    setProgress(0);

    try {
      addLog('📖 Reading menu data...');
      
      // Parse JSON input
      let rawItems: RawMenuItem[];
      try {
        const data = JSON.parse(jsonInput);
        
        // Validate that it's an array
        if (!Array.isArray(data)) {
          throw new Error('Menu data is not an array. Expected JSON array of items.');
        }
        
        rawItems = data;
        addLog(`✅ Found ${rawItems.length} raw items`);
      } catch (parseError) {
        throw new Error(`Error parsing JSON: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}`);
      }

      addLog('🔄 Consolidating duplicate items...');
      const consolidated = consolidateItems(rawItems);
      
      const duplicatesRemoved = rawItems.length - consolidated.length;
      addLog(`✅ Consolidated to ${consolidated.length} unique items`);
      addLog(`🗑️  Removed ${duplicatesRemoved} duplicates`);

      setStats({
        total: rawItems.length,
        duplicates: duplicatesRemoved,
        consolidated: consolidated.length,
        uploaded: 0,
        errors: 0
      });

      setProcessing(false);
      setUploading(true);
      setProgress(0);

      addLog('📤 Starting upload to Supabase...');

      let uploadedCount = 0;
      let errorCount = 0;

      // Upload items one by one with progress
      for (let i = 0; i < consolidated.length; i++) {
        const item = consolidated[i];
        const progressPercent = ((i + 1) / consolidated.length) * 100;
        setProgress(progressPercent);

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-4050140e/items`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify(item),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            addLog(`❌ Failed to upload "${item.names.en}": ${errorText}`);
            errorCount++;
          } else {
            uploadedCount++;
            if ((i + 1) % 10 === 0) {
              addLog(`✅ Uploaded ${i + 1}/${consolidated.length} items...`);
            }
          }
        } catch (err) {
          addLog(`❌ Error uploading "${item.names.en}": ${err}`);
          errorCount++;
        }

        // Update stats
        setStats(prev => prev ? {
          ...prev,
          uploaded: uploadedCount,
          errors: errorCount
        } : null);
      }

      setUploading(false);
      setProgress(100);

      if (errorCount === 0) {
        addLog(`🎉 SUCCESS! Uploaded all ${uploadedCount} items!`);
        setSuccess(true);
        if (onComplete) {
          onComplete();
        }
      } else {
        addLog(`⚠️  Uploaded ${uploadedCount} items with ${errorCount} errors`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      addLog(`💥 Fatal error: ${errorMessage}`);
      setProcessing(false);
      setUploading(false);
    }
  };

  const loadFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setJsonInput(text);
      setShowInput(true);
      setError(null);
      addLog(`📁 Loaded file: ${file.name}`);
    } catch (err) {
      setError(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-teal-50 rounded-lg">
            <FileJson className="h-6 w-6 text-[#0C6071]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl mb-2" style={{ color: '#0C6071' }}>
              Auto Process & Upload Menu
            </h2>
            <p className="text-gray-600 mb-4">
              Upload or paste your menu JSON file to automatically consolidate duplicates and upload to Supabase.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0C6071]" />
                <span>Intelligent duplicate detection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0C6071]" />
                <span>Automatic variant consolidation</span>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-[#0C6071]" />
                <span>Direct upload to database</span>
              </div>
            </div>

            {/* File Upload & Paste Area */}
            {!showInput && (
              <div className="mb-4 space-y-3">
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".json"
                      onChange={loadFromFile}
                      className="hidden"
                      id="json-file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => document.getElementById('json-file-upload')?.click()}
                    >
                      <FileUp className="h-4 w-4" />
                      Upload JSON File
                    </Button>
                  </label>
                  <Button
                    variant="outline"
                    onClick={() => setShowInput(true)}
                  >
                    Or Paste JSON
                  </Button>
                </div>
              </div>
            )}

            {/* JSON Input Textarea */}
            {showInput && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">
                    Paste your menu JSON here:
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowInput(false);
                      setJsonInput('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='[{"names":{"en":"Americano","tr":"Americano","ar":"امريكانو"},"price":120,"category_id":"cat-hot-coffee","tags":["Coffee","Hot"]}]'
                  className="font-mono text-xs h-48"
                />
                <p className="text-xs text-gray-500">
                  Paste the contents of <code className="bg-gray-200 px-1 rounded">piko_smart_upload.json</code>
                </p>
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Total Items</div>
                  <div className="text-2xl" style={{ color: '#0C6071' }}>
                    {stats.total}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Duplicates</div>
                  <div className="text-2xl text-orange-600">
                    {stats.duplicates}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Consolidated</div>
                  <div className="text-2xl text-green-600">
                    {stats.consolidated}
                  </div>
                </div>
                <div className="bg-teal-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Uploaded</div>
                  <div className="text-2xl" style={{ color: '#0C6071' }}>
                    {stats.uploaded}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Errors</div>
                  <div className="text-2xl text-red-600">
                    {stats.errors}
                  </div>
                </div>
              </div>
            )}

            {uploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Upload Progress</span>
                  <span className="text-sm" style={{ color: '#0C6071' }}>
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Menu successfully processed and uploaded!
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={processAndUpload}
              disabled={processing || uploading || !jsonInput.trim()}
              className="w-full"
              style={{ backgroundColor: '#0C6071' }}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading && <Upload className="mr-2 h-4 w-4" />}
              {processing ? 'Processing...' : uploading ? 'Uploading...' : 'Process & Upload Menu'}
            </Button>
          </div>
        </div>
      </Card>

      {logs.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3" style={{ color: '#0C6071' }}>Activity Log</h3>
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`${
                    log.includes('❌') || log.includes('💥')
                      ? 'text-red-400'
                      : log.includes('✅') || log.includes('🎉')
                      ? 'text-green-400'
                      : log.includes('⚠️')
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
