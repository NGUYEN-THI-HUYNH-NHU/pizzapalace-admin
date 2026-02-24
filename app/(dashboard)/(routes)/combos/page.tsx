import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";
import { Category } from "@prisma/client";

import { Column } from "./components/columns";
import CombosClient from "./components/client";

const CombosPage = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const combos = await prismadb.product.findMany({
        where: {
            category: Category.COMBO
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedCombos: Column[] = combos.map((item) => ({
        id: item.id,
        img: item.img,
        name: item.name,
        slug: item.slug,
        notes: item.comboDetails ? `${item.comboDetails.slots.length} slot(s)` : `0 slot`,
        basePrice: item.price,
        isNew: item.isNew,
        isBestSeller: item.isBestSeller,
        isAvailable: item.isAvailable,
    }));

    return (
        <div className="flex-col ">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CombosClient data={formattedCombos} />
            </div>
        </div>
    );
};

export default CombosPage;