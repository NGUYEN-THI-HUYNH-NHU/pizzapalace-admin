import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";
import { Category } from "@prisma/client";

import { Column } from "./components/columns";
import BeveragesClient from "./components/client";

const BeveragesPage = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const beverages = await prismadb.product.findMany({
        where: {
            category: Category.DRINK
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedBeverages: Column[] = beverages.map((item) => ({
        id: item.id,
        img: item.img,
        name: item.name,
        slug: item.slug,
        price: item.price,
        isNew: item.isNew,
        isBestSeller: item.isBestSeller,
        isAvailable: item.isAvailable,
    }));

    return (
        <div className="flex-col ">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <BeveragesClient data={formattedBeverages} />
            </div>
        </div>
    );
};

export default BeveragesPage;