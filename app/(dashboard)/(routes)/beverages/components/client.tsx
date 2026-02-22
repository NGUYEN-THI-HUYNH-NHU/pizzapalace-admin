"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";
import { Column, columns } from "./columns";

interface BeveragesClientProps {
    data: Column[]
}

const BeveragesClient: React.FC<BeveragesClientProps> = ({
    data
}) => {
    const router = useRouter();

    return (
        <div>
            <div className="flex items-center justify-between" >
                <Heading
                    title={`Beverages (${data.length})`}
                    description="Manage beverages for your store."
                />
                <Button onClick={() => router.push(`/beverages/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                </Button>
            </div>

            <Separator className="my-2" />

            <DataTable
                columns={columns}
                data={data}
                searchKey="name"
                getRowClassName={(row) => row.isAvailable ? "" : "bg-red-50/80 dark:bg-red-950/20"}
            />
            <Heading
                title="API"
                description="API calls for beverages"
            />

            <Separator className="my-2" />

            <ApiList
                entityName="beverages"
                entityIdName="beverageId"
            />
        </div>
    );
};

export default BeveragesClient;