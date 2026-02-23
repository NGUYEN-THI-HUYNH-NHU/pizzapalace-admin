import { notFound } from "next/navigation";

import prismadb from "@/lib/prismadb";

import { TagForm } from "./components/tag-form";

const TagPage = async ({
    params
}: {
    params: Promise<{ tagId: string }>
}) => {
    const { tagId } = await params;

    const tag = tagId === "new"
        ? null
        : await prismadb.pizzaTag.findUnique({
            where: {
                id: tagId
            }
        });

    if (tagId !== "new" && !tag) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <TagForm initialData={tag} />
            </div>
        </div>
    );
};

export default TagPage;