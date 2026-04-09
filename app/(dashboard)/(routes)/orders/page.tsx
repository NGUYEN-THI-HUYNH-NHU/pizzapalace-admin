import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import OrdersClient from "./components/client";

const OrdersPage = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <OrdersClient />
            </div>
        </div>
    );
}

export default OrdersPage;