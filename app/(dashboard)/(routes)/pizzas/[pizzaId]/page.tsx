import { notFound } from "next/navigation";

import prismadb from "@/lib/prismadb";

import { PizzaForm } from "./components/pizza-form";

const PizzaPage = async ({
    params
}: {
    params: Promise<{ pizzaId: string }>
}) => {
    const { pizzaId } = await params;

    const pizza = pizzaId === "new"
        ? null
        : await prismadb.product.findUnique({
            where: {
                id: pizzaId
            }
        });

    const sizes = await prismadb.pizzaSize.findMany({});

    const crusts = await prismadb.pizzaCrust.findMany({});

    const tags = await prismadb.pizzaTag.findMany({});

    if (pizzaId !== "new" && !pizza) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <PizzaForm
                    initialData={pizza}
                    sizes={sizes}
                    crusts={crusts}
                    tags={tags}
                />
            </div>
        </div>
    );
}

export default PizzaPage;