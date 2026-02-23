import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";

import { Column } from "./components/columns";
import TagsClient from "./components/client";

const TagsPage = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const tags = await prismadb.pizzaTag.findMany({});

    const formattedTags: Column[] = tags.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        color: item.color
    }));

    return (
        <div className="flex-col ">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <TagsClient data={formattedTags} />
            </div>
        </div >
    );
};

export default TagsPage;