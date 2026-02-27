import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RideInput {
    dropLat: number;
    dropLng: number;
    vehicleType: string;
    pickupLat: number;
    pickupLng: number;
    rideType: string;
}
export type Time = bigint;
export interface Ride {
    id: number;
    status: string;
    dropLat: number;
    dropLng: number;
    driverId?: Principal;
    vehicleType: string;
    userId: Principal;
    fare: number;
    pickupLat: number;
    pickupLng: number;
    timestamp: Time;
    rideType: string;
}
export interface RewardInfo {
    rewardPoints: bigint;
    moneySaved: number;
    totalRides: bigint;
}
export interface User {
    id: Principal;
    locationLat: number;
    locationLng: number;
    vehicleType: string;
    password: string;
    name: string;
    role: string;
    rewardPoints: bigint;
    moneySaved: number;
    phone: string;
    totalRides: bigint;
}
export interface UserInput {
    locationLat: number;
    locationLng: number;
    vehicleType: string;
    password: string;
    name: string;
    role: string;
    phone: string;
}
export interface DemandAreaInput {
    lat: number;
    lng: number;
    demandLabel: string;
}
export interface DemandArea {
    id: number;
    lat: number;
    lng: number;
    userId: Principal;
    demandLabel: string;
    timestamp: Time;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDemandArea(demandAreaInput: DemandAreaInput): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bookRide(rideInput: RideInput): Promise<void>;
    estimateFare(vehicleType: string, rideType: string, distanceKm: number, userRewardPoints: bigint): Promise<number>;
    getAllDemandAreas(): Promise<Array<DemandArea>>;
    getAllUsers(): Promise<Array<User>>;
    getCallerUserProfile(): Promise<User | null>;
    getCallerUserRole(): Promise<UserRole>;
    getRewardInfo(userId: Principal): Promise<RewardInfo>;
    getRidesByUser(userId: Principal): Promise<Array<Ride>>;
    getUserById(userId: Principal): Promise<User>;
    getUserProfile(user: Principal): Promise<User | null>;
    isCallerAdmin(): Promise<boolean>;
    login(phone: string, password: string): Promise<User>;
    registerUser(userInput: UserInput): Promise<void>;
    saveCallerUserProfile(profile: User): Promise<void>;
    updateDriverLocation(locationLat: number, locationLng: number): Promise<void>;
    updateRideStatus(rideId: number, status: string): Promise<void>;
}
