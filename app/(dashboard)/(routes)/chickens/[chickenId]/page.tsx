import { notFound } from "next/navigation";

import prismadb from "@/lib/prismadb";
import { ChickenForm } from "./components/chicken-form";
const ChickenPage = async ({
    params
}: {
    params: Promise<{ chickenId: string }>
}) => {
    const { chickenId } = await params;

    const chicken = chickenId === "new"
        ? null
        : await prismadb.product.findUnique({
            where: {
                id: chickenId
            }
        });

    const tags = await prismadb.pizzaTag.findMany({});

    if (chickenId !== "new" && !chicken) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ChickenForm
                    initialData={chicken}
                    tags={tags}
                />
            </div>
        </div>
    );
}

export default ChickenPage;