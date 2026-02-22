"use client"

import { useSyncExternalStore } from "react";
import { ImagePlus, Trash } from "lucide-react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";

import { Button } from "@/components/ui/button";

interface ImageUploadProps {
    disabled?: boolean;
    onChange: (value: string) => void;
    onRemove: (value: string) => void;
    value: string[];
};

// Hàm helper để check xem đã ở phía client chưa
const subscribe = () => () => { };
const getSnapshot = () => true;
const getServerSnapshot = () => false;

const ImageUpload: React.FC<ImageUploadProps> = ({
    disabled,
    onChange,
    onRemove,
    value
}) => {
    const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const onUpload = (result: unknown) => {
        const info = (result as { info: { secure_url: string } }).info;

        if (info?.secure_url) {
            onChange(info.secure_url);
        }
    };

    if (!isMounted) {
        return null;
    }

    return (
        <div>
            <div className="mb-4 flex items-center gap-4">
                {value.map((url) => (
                    <div key={url} className="relative w-50 h-50 rounded-md overflow-hidden">
                        <div className="z-10 absolute top-2 right-2">
                            <Button type="button" onClick={() => onRemove(url)} variant="destructive" size="icon">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image
                            fill
                            className="object-cover"
                            alt="Image"
                            src={url}
                        />
                    </div>
                ))}
            </div>
            <CldUploadWidget onSuccess={onUpload} uploadPreset="akenswmi">
                {({ open }) => {
                    const onClick = () => {
                        open();
                    };

                    return (
                        <Button
                            type="button"
                            disabled={disabled}
                            variant="secondary"
                            onClick={onClick}
                        >
                            <ImagePlus className="h-4 w-4 mr-2" />
                            Upload an image
                        </Button>
                    );
                }}
            </CldUploadWidget>
        </div>
    )
};

export default ImageUpload;