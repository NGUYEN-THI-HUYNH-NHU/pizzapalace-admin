import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";
import { Category } from "@prisma/client";

import AppetizersClient from "./components/client";
import { Column } from "./components/columns";

const AppetizersPage = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const appetizers = await prismadb.product.findMany({
        where: {
            category: Category.APPETIZER
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedAppetizers: Column[] = appetizers.map((item) => ({
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
                <AppetizersClient data={formattedAppetizers} />
            </div>
        </div>
    );
};

export default AppetizersPage;