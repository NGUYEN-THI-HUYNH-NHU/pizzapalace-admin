import { notFound } from "next/navigation";

import prismadb from "@/lib/prismadb";
import { AppetizerForm } from "./components/appetizer-form";

const AppetizerPage = async ({
    params
}: {
    params: Promise<{ appetizerId: string }>
}) => {
    const { appetizerId } = await params;

    const appetizer = appetizerId === "new"
        ? null
        : await prismadb.product.findUnique({
            where: {
                id: appetizerId
            }
        });

    const tags = await prismadb.pizzaTag.findMany({});

    if (appetizerId !== "new" && !appetizer) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <AppetizerForm initialData={appetizer} tags={tags} />
            </div>
        </div>
    );
}

export default AppetizerPage;