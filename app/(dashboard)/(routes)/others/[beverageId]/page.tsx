import { notFound } from "next/navigation";

import prismadb from "@/lib/prismadb";
import { BeverageForm } from "./components/beverage-form";

const BeveragePage = async ({
    params
}: {
    params: Promise<{ beverageId: string }>
}) => {
    const { beverageId } = await params;

    const beverage = beverageId === "new"
        ? null
        : await prismadb.product.findUnique({
            where: {
                id: beverageId
            }
        });

    if (beverageId !== "new" && !beverage) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <BeverageForm initialData={beverage} />
            </div>
        </div>
    );
}

export default BeveragePage;