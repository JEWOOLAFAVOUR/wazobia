import type { Avatar } from "@/game/character/wardrobe";
import { DEFAULT_AVATAR } from "@/game/character/wardrobe";

const KEY = "wazobia-avatar-v1";

/** Persist the finished avatar so /enter can spawn it. Creator calls saveAvatar. */
export function saveAvatar(avatar: Avatar): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(avatar));
  } catch {
    /* private mode — /enter falls back to default */
  }
}

export function loadAvatar(): Avatar {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return DEFAULT_AVATAR;
    const parsed = JSON.parse(raw) as Partial<Avatar>;
    return { ...DEFAULT_AVATAR, ...parsed };
  } catch {
    return DEFAULT_AVATAR;
  }
}
