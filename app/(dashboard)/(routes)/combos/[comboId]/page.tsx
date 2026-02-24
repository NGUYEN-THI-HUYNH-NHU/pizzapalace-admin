import { notFound } from "next/navigation";
import { Category } from "@prisma/client";

import prismadb from "@/lib/prismadb";

import { ComboForm } from "./components/combo-form";

const ComboPage = async ({
    params
}: {
    params: Promise<{ comboId: string }>
}) => {
    const { comboId } = await params;

    const combo = comboId === "new"
        ? null
        : await prismadb.product.findUnique({
            where: {
                id: comboId
            }
        });

    const [products, tags, pizzaSizes] = await Promise.all([
        prismadb.product.findMany({
            where: {
                category: {
                    in: [Category.PIZZA, Category.DRINK]
                },
                isAvailable: true
            }
        }),
        prismadb.pizzaTag.findMany({}),
        prismadb.pizzaSize.findMany({})
    ]);

    if (comboId !== "new" && !combo) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ComboForm
                    initialData={combo}
                    products={products}
                    tags={tags}
                    pizzaSizes={pizzaSizes}
                />
            </div>
        </div>
    );
}

export default ComboPage;