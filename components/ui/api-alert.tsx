"use client";

import { CopyIcon, Server } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// ApiAlert: Component hiển thị alert cho API endpoint với badge variant
interface ApiAlertProps {
    title: string,
    description: string,
    variant: "public" | "admin"
};

// Ánh xạ variant sang text hiển thị
// NonNullable loại bỏ undefined từ type
const textMap: Record<ApiAlertProps["variant"], string> = {
    public: "Public",
    admin: "Admin"
};

// Ánh xạ variant sang Badge style
const variantMap = {
    public: "secondary",
    admin: "destructive"
} as const;

export const ApiAlert: React.FC<ApiAlertProps> = ({
    title,
    description,
    variant = "public"
}) => {
    const onCopy = () => {
        navigator.clipboard.writeText(description);
        toast.success("API Route copied to the clipboard.");
    };

    return (
        <Alert className="my-3">
            <Server className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-x-2">
                {title}
                {/* Badge hiển thị "Public" hoặc "Admin" dựa vào variant */}
                <Badge variant={variantMap[variant]}>
                    {textMap[variant]}
                </Badge>
            </AlertTitle>
            <AlertDescription className="mt-4 flex items-center justify-between">
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                    {description}
                </code>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onCopy}
                >
                    <CopyIcon className="h-4 w-4" />
                </Button>
            </AlertDescription>
        </Alert >
    );
};