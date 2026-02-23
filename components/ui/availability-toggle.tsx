import { Button } from "@/components/ui/button"
import axios from "axios"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface AvailabilityToggleProps {
    id: string,
    isAvailable: boolean,
    entityName: string
}

const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
    id,
    isAvailable,
    entityName
}) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const onToggle = async () => {
        try {
            setLoading(true);
            await axios.patch(`/api/${entityName}/${id}`, {
                isAvailable: !isAvailable
            });

            toast.success("Availability updated.");
            router.refresh();
        } catch {
            toast.error("Failed to update availability.")
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={onToggle}
            className="w-12 h-6 justify-start px-1"
        >
            <span
                className={`h-4 w-4 rounded-full transition-transform ${isAvailable
                    ? "translate-x-6 bg-green-600"
                    : "translate-x-0 bg-slate-400"
                    }`}
            />
        </Button>
    );
}

export default AvailabilityToggle;