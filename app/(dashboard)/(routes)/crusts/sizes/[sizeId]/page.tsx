import { notFound } from "next/navigation";

import prismadb from "@/lib/prismadb";

import { SizeForm } from "./components/size-form";

const SizePage = async ({
    params
}: {
    params: Promise<{ sizeId: string }>
}) => {
    const { sizeId } = await params;

    const size = sizeId === "new"
        ? null
        : await prismadb.pizzaSize.findUnique({
            where: {
                id: sizeId
            }
        });

    if (sizeId !== "new" && !size) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <SizeForm initialData={size} />
            </div>
        </div>
    );
};

export default SizePage;