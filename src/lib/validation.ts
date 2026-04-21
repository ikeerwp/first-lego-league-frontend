export function isValidEmailAddress(value: string): boolean {
    if (!value) {
        return false;
    }

    for (const character of value) {
        if (character.trim() === "") {
            return false;
        }
    }

    const atIndex = value.indexOf("@");

    if (atIndex <= 0 || atIndex !== value.lastIndexOf("@") || atIndex === value.length - 1) {
        return false;
    }

    const local = value.slice(0, atIndex);
    const domain = value.slice(atIndex + 1);
    const firstDotIndex = domain.indexOf(".");

    if (
        !local ||
        !domain ||
        local.startsWith(".") ||
        local.endsWith(".") ||
        domain.startsWith(".") ||
        domain.endsWith(".")
    ) {
        return false;
    }

    if (firstDotIndex <= 0 || firstDotIndex === domain.length - 1) {
        return false;
    }

    return !local.includes("..") && !domain.includes("..");
}
