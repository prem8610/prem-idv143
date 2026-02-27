import type { User } from "../backend.d";

const STORAGE_KEY = "rideRapidUser";

type SerializableUser = Omit<User, "id" | "rewardPoints" | "totalRides"> & {
  id: string;
  rewardPoints: string;
  totalRides: string;
};

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SerializableUser;
    // Convert back bigint fields
    return {
      ...parsed,
      id: parsed.id as unknown as User["id"],
      rewardPoints: BigInt(parsed.rewardPoints ?? 0),
      totalRides: BigInt(parsed.totalRides ?? 0),
    };
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  const serializable: SerializableUser = {
    ...user,
    id: String(user.id),
    rewardPoints: String(user.rewardPoints),
    totalRides: String(user.totalRides),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export function clearStoredUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isDriver(user: User | null): boolean {
  return user?.role === "driver";
}

export function isLoggedIn(user: User | null): boolean {
  return user !== null;
}
