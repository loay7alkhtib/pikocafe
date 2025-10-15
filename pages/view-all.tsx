import { memo } from 'react';
import { useRouter } from 'next/router';
import NavBar from '../src/components/NavBar';
import ViewAllItems from '../src/components/ViewAllItems';
import { useLang } from '../src/lib/LangContext';
import { useData } from '../src/lib/DataContext';
import { dirFor } from '../src/lib/i18n';

const ViewAll = memo(function ViewAll() {
  const router = useRouter();
  const { lang } = useLang();
  const { categories, items, loading } = useData();

  const handleCategorySelect = (categoryId: string) => {
    router.push(`/category/${categoryId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-spin">🥐</div>
          <p className="text-muted-foreground">Loading all items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir={dirFor(lang)}>
      <NavBar showAccountIcon={false} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ViewAllItems 
          categories={categories}
          items={items}
          onCategorySelect={handleCategorySelect}
        />
      </main>
    </div>
  );
});

export default ViewAll;
