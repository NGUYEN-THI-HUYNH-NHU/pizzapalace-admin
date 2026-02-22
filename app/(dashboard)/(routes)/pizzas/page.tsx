import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";
import { Category } from "@prisma/client";

import { Column } from "./components/columns";
import PizzasClient from "./components/client";

const PizzasPage = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const pizzas = await prismadb.product.findMany({
        where: {
            category: Category.PIZZA
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedPizzas: Column[] = pizzas.map((item) => ({
        id: item.id,
        img: item.img,
        name: item.name,
        slug: item.slug,
        basePrice: item.pizzaDetails?.variants?.length
            ? Math.min(...item.pizzaDetails.variants.map((variant) => variant.price))
            : item.price,
        sizesCount: item.pizzaDetails?.sizes?.length ?? 0,
        crustsCount: item.pizzaDetails?.crusts?.length ?? 0,
        variantsCount: item.pizzaDetails?.variants?.length ?? 0,
        isNew: item.isNew,
        isBestSeller: item.isBestSeller,
        isAvailable: item.isAvailable,
    }));

    return (
        <div className="flex-col ">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <PizzasClient data={formattedPizzas} />
            </div>
        </div>
    );
};

export default PizzasPage;