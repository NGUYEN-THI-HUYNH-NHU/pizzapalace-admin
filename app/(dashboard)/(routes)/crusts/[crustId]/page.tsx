import { notFound } from "next/navigation";

import prismadb from "@/lib/prismadb";

import { CrustForm } from "./components/crust-form";

const CrustPage = async ({
    params
}: {
    params: Promise<{ crustId: string }>
}) => {
    const { crustId } = await params;

    const crust = crustId === "new"
        ? null
        : await prismadb.pizzaCrust.findUnique({
            where: {
                id: crustId
            },
        });

    const sizes = await prismadb.pizzaSize.findMany({});

    if (crustId !== "new" && !crust) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CrustForm initialData={crust} sizes={sizes} />
            </div>
        </div>
    );
};

export default CrustPage;