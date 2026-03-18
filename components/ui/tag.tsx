"use client";

import { Badge } from "./badge";

const getReadableTextColor = (hexColor: string) => {
    const sanitized = hexColor.replace("#", "");
    const normalized = sanitized.length === 3
        ? sanitized.split("").map((char) => `${char}${char}`).join("")
        : sanitized;

    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return "#ffffff";
    }

    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

    return brightness > 160 ? "#111111" : "#ffffff";
};

interface TagProps {
    name: string;
    color: string;
}

const Tag: React.FC<TagProps> = ({
    name,
    color
}) => {
    return (
        <Badge
            variant="outline"
            style={{
                backgroundColor: color,
                borderColor: color,
                color: getReadableTextColor(color)
            }}
        >
            {name}
        </Badge>
    );
}

export default Tag;