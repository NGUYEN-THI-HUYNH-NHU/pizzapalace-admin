"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";
import { Column, columns } from "./columns";

interface CrustsClientProps {
    data: Column[]
}

const CrustsClient: React.FC<CrustsClientProps> = ({
    data
}) => {
    const router = useRouter();

    return (
        <div>
            <div className="flex items-center justify-between" >
                <Heading
                    title={`Pizza Crusts (${data.length})`}
                    description="Quản lý đế bánh pizza cho cửa hàng của bạn."
                />
                <Button onClick={() => router.push(`/crusts/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                </Button>
            </div>

            <Separator className="my-2" />

            <DataTable
                columns={columns}
                data={data}
                searchKeys={["name"]}
                searchPlaceholder="Tìm kiếm theo tên đế..."
                getRowClassName={(row) => row.isAvailable ? "" : "bg-red-50/60 dark:bg-red-950/20"}
            />

            <Heading
                title="API"
                description="API calls for crusts"
            />

            <Separator className="my-2" />

            <ApiList
                entityName="crusts"
                entityIdName="crustId"
            />
        </div>
    );
};

export default CrustsClient;