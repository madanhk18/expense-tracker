import { getCategories } from "@/lib/queries/categories";
import { CategoryManager } from "@/components/settings/category-manager";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/shared/glass-card";

export default async function CategoriesSettingsPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold tracking-tight">Categories</h1>
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Your categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} />
        </CardContent>
      </GlassCard>
    </div>
  );
}
