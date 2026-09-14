import { getCategories } from "@/lib/queries/categories";
import { CategoryManager } from "@/components/settings/category-manager";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Panel } from "@/components/shared/panel";
import { PageHeader } from "@/components/shared/page-header";

export default async function CategoriesSettingsPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Categories" description="Add your own or use the defaults." />
      <Panel>
        <CardHeader>
          <CardTitle className="text-base">Your categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} />
        </CardContent>
      </Panel>
    </div>
  );
}
