export function getInitials(name) {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export const AVATAR_COLORS = ["#2d5be3","#7c3aed","#c7254e","#e07b00","#1a7a4a","#1565c0","#558b2f","#c2185b"];

export function avatarColor(str) {
    let h = 0; for (let c of str) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[h];
}