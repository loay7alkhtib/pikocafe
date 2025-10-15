import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Info,
  Brain,
  Target,
  Tag,
  DollarSign,
  Palette,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Category, Item } from '../../lib/supabase';
import { toast } from 'sonner';

interface CategorizationSettingsProps {
  categories: Category[];
  items: Item[];
  onSettingsUpdate: (settings: CategorizationSettings) => void;
}

export interface CategorizationSettings {
  // Algorithm weights
  weights: {
    nameSimilarity: number;
    tagMatching: number;
    priceRange: number;
    iconContext: number;
    categoryCharacteristics: number;
  };
  
  // Thresholds
  thresholds: {
    minConfidence: number;
    autoApplyThreshold: number;
    suggestAlternatives: number;
  };
  
  // Behavior settings
  behavior: {
    autoApplyHighConfidence: boolean;
    showReasoning: boolean;
    includeArchivedItems: boolean;
    learnFromCorrections: boolean;
  };
  
  // Custom rules
  customRules: Array<{
    id: string;
    name: string;
    condition: string;
    action: string;
    enabled: boolean;
  }>;
  
  // Keyword mappings
  keywordMappings: { [key: string]: string[] };
}

const defaultSettings: CategorizationSettings = {
  weights: {
    nameSimilarity: 0.4,
    tagMatching: 0.3,
    priceRange: 0.15,
    iconContext: 0.1,
    categoryCharacteristics: 0.05
  },
  thresholds: {
    minConfidence: 0.3,
    autoApplyThreshold: 0.9,
    suggestAlternatives: 0.4
  },
  behavior: {
    autoApplyHighConfidence: false,
    showReasoning: true,
    includeArchivedItems: false,
    learnFromCorrections: true
  },
  customRules: [],
  keywordMappings: {
    'hot': ['coffee', 'tea', 'hot', 'espresso', 'cappuccino', 'latte', 'americano', 'mocha'],
    'coffee': ['coffee', 'espresso', 'cappuccino', 'latte', 'americano', 'mocha', 'macchiato'],
    'tea': ['tea', 'chai', 'green tea', 'black tea', 'herbal'],
    'cold': ['cold', 'iced', 'smoothie', 'juice', 'soda', 'lemonade'],
    'juice': ['juice', 'fresh', 'orange', 'apple', 'grape'],
    'dessert': ['cake', 'pie', 'cookie', 'muffin', 'donut', 'ice cream', 'pudding', 'tart'],
    'cake': ['cake', 'cheesecake', 'chocolate cake', 'birthday'],
    'ice cream': ['ice cream', 'gelato', 'sorbet', 'frozen'],
    'sandwich': ['sandwich', 'burger', 'panini', 'wrap', 'sub', 'club'],
    'breakfast': ['pancake', 'waffle', 'toast', 'bagel', 'croissant', 'muffin'],
    'pastry': ['croissant', 'danish', 'scone', 'muffin', 'biscuit', 'roll']
  }
};

export default function CategorizationSettings({ categories, items, onSettingsUpdate }: CategorizationSettingsProps) {
  const [settings, setSettings] = useState<CategorizationSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'weights' | 'thresholds' | 'behavior' | 'rules' | 'keywords'>('weights');

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('categorization-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage and notify parent
  useEffect(() => {
    if (hasChanges) {
      localStorage.setItem('categorization-settings', JSON.stringify(settings));
      onSettingsUpdate(settings);
      setHasChanges(false);
    }
  }, [settings, hasChanges, onSettingsUpdate]);

  const updateSettings = (updates: Partial<CategorizationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateWeights = (key: keyof CategorizationSettings['weights'], value: number) => {
    updateSettings({
      weights: { ...settings.weights, [key]: value }
    });
  };

  const updateThresholds = (key: keyof CategorizationSettings['thresholds'], value: number) => {
    updateSettings({
      thresholds: { ...settings.thresholds, [key]: value }
    });
  };

  const updateBehavior = (key: keyof CategorizationSettings['behavior'], value: boolean) => {
    updateSettings({
      behavior: { ...settings.behavior, [key]: value }
    });
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.success('Settings reset to defaults');
  };

  const addCustomRule = () => {
    const newRule = {
      id: Date.now().toString(),
      name: 'New Rule',
      condition: '',
      action: '',
      enabled: true
    };
    
    updateSettings({
      customRules: [...settings.customRules, newRule]
    });
  };

  const updateCustomRule = (id: string, updates: Partial<CategorizationSettings['customRules'][0]>) => {
    updateSettings({
      customRules: settings.customRules.map(rule => 
        rule.id === id ? { ...rule, ...updates } : rule
      )
    });
  };

  const removeCustomRule = (id: string) => {
    updateSettings({
      customRules: settings.customRules.filter(rule => rule.id !== id)
    });
  };

  const addKeywordMapping = () => {
    const key = prompt('Enter keyword:');
    if (key && !settings.keywordMappings[key]) {
      updateSettings({
        keywordMappings: { ...settings.keywordMappings, [key]: [] }
      });
    }
  };

  const updateKeywordMapping = (key: string, values: string[]) => {
    updateSettings({
      keywordMappings: { ...settings.keywordMappings, [key]: values }
    });
  };

  const removeKeywordMapping = (key: string) => {
    const newMappings = { ...settings.keywordMappings };
    delete newMappings[key];
    updateSettings({ keywordMappings: newMappings });
  };

  const normalizeWeights = () => {
    const weights = settings.weights;
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (total !== 1) {
      const normalizedWeights = Object.keys(weights).reduce((acc, key) => {
        acc[key as keyof typeof weights] = weights[key as keyof typeof weights] / total;
        return acc;
      }, {} as typeof weights);
      
      updateSettings({ weights: normalizedWeights });
      toast.success('Weights normalized to sum to 1.0');
    }
  };

  const getWeightColor = (weight: number): string => {
    if (weight > 0.4) return 'text-green-600';
    if (weight > 0.2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Categorization Settings
          </h3>
          <p className="text-sm text-muted-foreground">
            Fine-tune the AI categorization algorithm
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          {hasChanges && (
            <Badge variant="secondary" className="gap-1">
              <Save className="w-3 h-3" />
              Unsaved
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {[
          { key: 'weights', label: 'Weights', icon: BarChart3 },
          { key: 'thresholds', label: 'Thresholds', icon: Target },
          { key: 'behavior', label: 'Behavior', icon: Brain },
          { key: 'rules', label: 'Rules', icon: Tag },
          { key: 'keywords', label: 'Keywords', icon: Palette }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={activeTab === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(key as any)}
            className="gap-2"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {activeTab === 'weights' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Algorithm Weights</h4>
                  <Button variant="outline" size="sm" onClick={normalizeWeights}>
                    Normalize
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Adjust how much each factor influences categorization decisions
                </p>
                
                <div className="space-y-4">
                  {[
                    { key: 'nameSimilarity', label: 'Name Similarity', icon: Tag, description: 'How similar item names are to category names' },
                    { key: 'tagMatching', label: 'Tag Matching', icon: Tag, description: 'How well item tags match category characteristics' },
                    { key: 'priceRange', label: 'Price Range', icon: DollarSign, description: 'Whether item price fits category price range' },
                    { key: 'iconContext', label: 'Icon Context', icon: Palette, description: 'How well item matches category icon meaning' },
                    { key: 'categoryCharacteristics', label: 'Category Characteristics', icon: BarChart3, description: 'How well item fits category patterns' }
                  ].map(({ key, label, icon: Icon, description }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <Label className="font-medium">{label}</Label>
                        </div>
                        <span className={`text-sm font-mono ${getWeightColor(settings.weights[key as keyof typeof settings.weights])}`}>
                          {(settings.weights[key as keyof typeof settings.weights] * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{description}</p>
                      <Slider
                        value={[settings.weights[key as keyof typeof settings.weights] * 100]}
                        onValueChange={([value]) => updateWeights(key as keyof typeof settings.weights, value / 100)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Confidence Thresholds</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Set minimum confidence levels for different actions
                </p>
                
                <div className="space-y-4">
                  {[
                    { key: 'minConfidence', label: 'Minimum Confidence', description: 'Minimum confidence to show suggestion' },
                    { key: 'autoApplyThreshold', label: 'Auto-Apply Threshold', description: 'Confidence level for automatic categorization' },
                    { key: 'suggestAlternatives', label: 'Alternative Suggestions', description: 'Show alternative categories above this confidence' }
                  ].map(({ key, label, description }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">{label}</Label>
                        <span className="text-sm font-mono text-blue-600">
                          {(settings.thresholds[key as keyof typeof settings.thresholds] * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{description}</p>
                      <Slider
                        value={[settings.thresholds[key as keyof typeof settings.thresholds] * 100]}
                        onValueChange={([value]) => updateThresholds(key as keyof typeof settings.thresholds, value / 100)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'behavior' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Behavior Settings</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure how the categorization system behaves
                </p>
                
                <div className="space-y-4">
                  {[
                    { key: 'autoApplyHighConfidence', label: 'Auto-Apply High Confidence', description: 'Automatically categorize items with very high confidence' },
                    { key: 'showReasoning', label: 'Show Reasoning', description: 'Display why items were categorized this way' },
                    { key: 'includeArchivedItems', label: 'Include Archived Items', description: 'Consider archived items in categorization analysis' },
                    { key: 'learnFromCorrections', label: 'Learn from Corrections', description: 'Improve algorithm based on manual corrections' }
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-medium">{label}</Label>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        checked={settings.behavior[key as keyof typeof settings.behavior]}
                        onCheckedChange={(checked) => updateBehavior(key as keyof typeof settings.behavior, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Custom Rules</h4>
                  <p className="text-sm text-muted-foreground">
                    Create custom categorization rules
                  </p>
                </div>
                <Button onClick={addCustomRule} size="sm">
                  Add Rule
                </Button>
              </div>
              
              {settings.customRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No custom rules defined</p>
                  <p className="text-sm">Add rules to override default categorization logic</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settings.customRules.map((rule) => (
                    <Card key={rule.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(enabled) => updateCustomRule(rule.id, { enabled })}
                            />
                            <Label className="font-medium">{rule.name}</Label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCustomRule(rule.id)}
                          >
                            Remove
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Rule Name</Label>
                            <Input
                              value={rule.name}
                              onChange={(e) => updateCustomRule(rule.id, { name: e.target.value })}
                              placeholder="e.g., All coffee items go to Hot Drinks"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm">Condition</Label>
                            <Textarea
                              value={rule.condition}
                              onChange={(e) => updateCustomRule(rule.id, { condition: e.target.value })}
                              placeholder="e.g., item.name.includes('coffee') || item.tags.includes('coffee')"
                              rows={2}
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm">Action</Label>
                            <Input
                              value={rule.action}
                              onChange={(e) => updateCustomRule(rule.id, { action: e.target.value })}
                              placeholder="e.g., assign to 'hot-drinks' category"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Keyword Mappings</h4>
                  <p className="text-sm text-muted-foreground">
                    Define relationships between keywords and categories
                  </p>
                </div>
                <Button onClick={addKeywordMapping} size="sm">
                  Add Mapping
                </Button>
              </div>
              
              <div className="space-y-4">
                {Object.entries(settings.keywordMappings).map(([keyword, mappings]) => (
                  <Card key={keyword}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium">{keyword}</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeKeywordMapping(keyword)}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Related terms (comma-separated)</Label>
                        <Input
                          value={mappings.join(', ')}
                          onChange={(e) => updateKeywordMapping(keyword, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          placeholder="coffee, espresso, latte, cappuccino"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
