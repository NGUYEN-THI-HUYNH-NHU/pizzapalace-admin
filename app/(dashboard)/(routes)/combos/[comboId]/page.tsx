import { notFound } from "next/navigation";

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

    if (comboId !== "new" && !combo) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ComboForm
                    initialData={combo}
                />
            </div>
        </div>
    );
}

export default ComboPage;