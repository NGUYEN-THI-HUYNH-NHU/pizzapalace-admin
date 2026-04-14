export const normalizeSlug = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

export const getReadableTextColor = (hexColor: string) => {
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