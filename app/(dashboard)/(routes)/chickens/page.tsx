import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";
import { Category } from "@prisma/client";

import ChickensClient from "./components/client";
import { Column } from "./components/columns";

const ChickensPage = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const chickens = await prismadb.product.findMany({
        where: {
            category: Category.CHICKEN
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedChickens: Column[] = chickens.map((item) => ({
        id: item.id,
        img: item.img,
        name: item.name,
        slug: item.slug,
        price: item.price,
        tags: (item.tags ?? []).map((tag) => ({
            code: tag.code,
            name: tag.name,
            color: tag.color
        })),
        isNew: item.isNew,
        isBestSeller: item.isBestSeller,
        isAvailable: item.isAvailable,
    }));

    return (
        <div className="flex-col ">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ChickensClient data={formattedChickens} />
            </div>
        </div>
    );
};

export default ChickensPage;