import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";

import { Column as SizeColumn } from "./sizes/components/columns";
import { Column as CrustColumn } from "./components/columns";
import SizesClient from "./sizes/components/client";
import CrustsClient from "./components/client";

const CrustsPage = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const sizes = await prismadb.pizzaSize.findMany({});

    const formattedSizes: SizeColumn[] = sizes.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
    }));

    const crusts = await prismadb.pizzaCrust.findMany({});

    const formattedCrusts: CrustColumn[] = crusts.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        availableSizes: item.availableSizes,
        isAvailable: item.isAvailable,
    }));

    return (
        <div className="flex-col ">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <SizesClient data={formattedSizes} />
            </div>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CrustsClient data={formattedCrusts} />
            </div>
        </div >
    );
};

export default CrustsPage;