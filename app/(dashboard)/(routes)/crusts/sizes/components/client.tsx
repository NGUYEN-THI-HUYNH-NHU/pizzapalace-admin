"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { Column, columns } from "./columns";

interface ClientProps {
    data: Column[]
}

const SizesClient: React.FC<ClientProps> = ({
    data
}) => {
    const router = useRouter();

    return (
        <div>
            <div className="flex items-center justify-between" >
                <Heading
                    title={`Pizza Sizes (${data.length})`}
                    description="Manage pizza sizes for your store."
                />
                <Button onClick={() => router.push(`/crusts/sizes/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                </Button>
            </div>

            <Separator className="my-2" />

            <DataTable
                columns={columns}
                data={data}
                searchKeys={["name"]}
                searchPlaceholder="Tìm kiếm theo tên size..."
            />
        </div>
    );
};

export default SizesClient;