import { categoriesForUi } from "@/services/communication-service";
import { CommunicationEditor } from "@/features/communications/communication-editor";
import { PageHeader } from "@/components/layout/page-header";

export default async function NewCommunicationPage() {
  const categories = await categoriesForUi();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Novo comunicado" />
      <CommunicationEditor categories={categories} />
    </div>
  );
}
