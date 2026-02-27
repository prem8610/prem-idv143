import Float "mo:core/Float";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Nat32 "mo:core/Nat32";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type User = {
    id : Principal;
    name : Text;
    phone : Text;
    password : Text;
    role : Text;
    vehicleType : Text;
    locationLat : Float;
    locationLng : Float;
    rewardPoints : Nat;
    totalRides : Nat;
    moneySaved : Float;
  };

  module User {
    public func compare(user1 : User, user2 : User) : Order.Order {
      switch (Text.compare(user1.phone, user2.phone)) {
        case (#equal) { Text.compare(user1.role, user2.role) };
        case (order) { order };
      };
    };
  };

  type Ride = {
    id : Nat32;
    userId : Principal;
    driverId : ?Principal;
    vehicleType : Text;
    rideType : Text;
    pickupLat : Float;
    pickupLng : Float;
    dropLat : Float;
    dropLng : Float;
    fare : Float;
    status : Text;
    timestamp : Time.Time;
  };

  module Ride {
    public func compare(ride1 : Ride, ride2 : Ride) : Order.Order {
      Nat32.compare(ride1.id, ride2.id);
    };
  };

  type DemandArea = {
    id : Nat32;
    userId : Principal;
    lat : Float;
    lng : Float;
    demandLabel : Text;
    timestamp : Time.Time;
  };

  module DemandArea {
    public func compare(demandArea1 : DemandArea, demandArea2 : DemandArea) : Order.Order {
      Nat32.compare(demandArea1.id, demandArea2.id);
    };
  };

  type RewardInfo = {
    rewardPoints : Nat;
    totalRides : Nat;
    moneySaved : Float;
  };

  let users = Map.empty<Principal, User>();
  let rides = Map.empty<Nat32, Ride>();
  let demandAreas = Map.empty<Nat32, DemandArea>();

  var nextRideId = 1;
  var nextDemandAreaId = 1;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserInput = {
    name : Text;
    phone : Text;
    password : Text;
    role : Text;
    vehicleType : Text;
    locationLat : Float;
    locationLng : Float;
  };

  public type RideInput = {
    vehicleType : Text;
    rideType : Text;
    pickupLat : Float;
    pickupLng : Float;
    dropLat : Float;
    dropLng : Float;
  };

  public type DemandAreaInput = {
    lat : Float;
    lng : Float;
    demandLabel : Text;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    users.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?User {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : User) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  public shared ({ caller }) func registerUser(userInput : UserInput) : async () {
    switch (users.get(caller)) {
      case (null) {
        if (not Text.equal(userInput.role, "user") and not Text.equal(userInput.role, "driver")) {
          Runtime.trap("Invalid role");
        };
        users.add(
          caller,
          {
            id = caller;
            name = userInput.name;
            phone = userInput.phone;
            password = userInput.password;
            role = userInput.role;
            vehicleType = userInput.vehicleType;
            locationLat = userInput.locationLat;
            locationLng = userInput.locationLng;
            rewardPoints = 0;
            totalRides = 0;
            moneySaved = 0.0;
          },
        );
      };
      case (?_) { Runtime.trap("User already exists") };
    };
  };

  public shared ({ caller }) func login(phone : Text, password : Text) : async User {
    let foundUser = users.values().find(
      func(user) {
        Text.equal(user.phone, phone) and Text.equal(user.password, password);
      }
    );

    switch (foundUser) {
      case (?user) { user };
      case (null) { Runtime.trap("Invalid credentials") };
    };
  };

  public query ({ caller }) func getAllUsers() : async [User] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    users.values().toArray().sort();
  };

  public query ({ caller }) func getUserById(userId : Principal) : async User {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or be an admin");
    };
    switch (users.get(userId)) {
      case (?user) { user };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func updateDriverLocation(locationLat : Float, locationLng : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update location");
    };
    
    switch (users.get(caller)) {
      case (?user) {
        if (not Text.equal(user.role, "driver")) {
          Runtime.trap("Only drivers can update location");
        };
        users.add(
          caller,
          { user with locationLat; locationLng },
        );
      };
      case (null) { Runtime.trap("Driver not found") };
    };
  };

  public shared ({ caller }) func bookRide(rideInput : RideInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can book rides");
    };

    let user = switch (users.get(caller)) {
      case (?u) { u };
      case (null) { Runtime.trap("User not found") };
    };

    if (not Text.equal(user.role, "user")) {
      Runtime.trap("Only users can book rides");
    };

    let fare = calculateFare(rideInput.vehicleType, rideInput.rideType, calculateDistance(rideInput.pickupLat, rideInput.pickupLng, rideInput.dropLat, rideInput.dropLng), user.rewardPoints);

    let rideId = Nat32.fromNat(nextRideId);
    nextRideId += 1;

    let newRide : Ride = {
      id = rideId;
      userId = caller;
      driverId = null;
      vehicleType = rideInput.vehicleType;
      rideType = rideInput.rideType;
      pickupLat = rideInput.pickupLat;
      pickupLng = rideInput.pickupLng;
      dropLat = rideInput.dropLat;
      dropLng = rideInput.dropLng;
      fare;
      status = "pending";
      timestamp = Time.now();
    };

    rides.add(rideId, newRide);

    users.add(
      caller,
      {
        user with
        rewardPoints = user.rewardPoints + 5;
        totalRides = user.totalRides + 1;
      },
    );
  };

  public query ({ caller }) func getRidesByUser(userId : Principal) : async [Ride] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own rides or be an admin");
    };

    let userRides = List.empty<Ride>();
    for (ride in rides.values()) {
      if (ride.userId == userId) {
        userRides.add(ride);
      };
    };
    userRides.toArray().sort();
  };

  public shared ({ caller }) func updateRideStatus(rideId : Nat32, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update ride status");
    };

    switch (rides.get(rideId)) {
      case (?ride) {
        if (status != "pending" and status != "accepted" and status != "completed" and status != "cancelled") {
          Runtime.trap("Invalid status");
        };

        let isDriver = switch (ride.driverId) {
          case (?driverId) { driverId == caller };
          case (null) { false };
        };
        let isRideOwner = ride.userId == caller;
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);

        if (not (isDriver or isRideOwner or isAdmin)) {
          Runtime.trap("Unauthorized: Only the assigned driver, ride owner, or admin can update ride status");
        };

        rides.add(rideId, { ride with status });
      };
      case (null) { Runtime.trap("Ride not found") };
    };
  };

  public shared ({ caller }) func addDemandArea(demandAreaInput : DemandAreaInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add demand areas");
    };

    let user = switch (users.get(caller)) {
      case (?u) { u };
      case (null) { Runtime.trap("User not found") };
    };

    let demandAreaId = Nat32.fromNat(nextDemandAreaId);
    nextDemandAreaId += 1;

    let newDemandArea : DemandArea = {
      id = demandAreaId;
      userId = caller;
      lat = demandAreaInput.lat;
      lng = demandAreaInput.lng;
      demandLabel = demandAreaInput.demandLabel;
      timestamp = Time.now();
    };

    demandAreas.add(demandAreaId, newDemandArea);

    users.add(
      caller,
      { user with rewardPoints = user.rewardPoints + 10 },
    );
  };

  public query ({ caller }) func getAllDemandAreas() : async [DemandArea] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all demand areas");
    };
    demandAreas.values().toArray().sort();
  };

  public query ({ caller }) func getRewardInfo(userId : Principal) : async RewardInfo {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own reward info or be an admin");
    };

    let user = switch (users.get(userId)) {
      case (?u) { u };
      case (null) { Runtime.trap("User not found") };
    };
    {
      rewardPoints = user.rewardPoints;
      totalRides = user.totalRides;
      moneySaved = user.moneySaved;
    };
  };

  public query ({ caller }) func estimateFare(vehicleType : Text, rideType : Text, distanceKm : Float, userRewardPoints : Nat) : async Float {
    calculateFare(vehicleType, rideType, distanceKm, userRewardPoints);
  };

  func calculateFare(vehicleType : Text, rideType : Text, distanceKm : Float, userRewardPoints : Nat) : Float {
    let baseFare = switch (vehicleType) {
      case ("sedan") { 1.5 };
      case ("suv") { 2.0 };
      case ("motorcycle") { 1.0 };
      case (_) { 1.2 };
    };

    let rideTypeMultiplier = if (rideType == "child") {
      1.2;
    } else {
      1.0;
    };

    let distanceCost = switch (vehicleType) {
      case ("motorcycle") { distanceKm * 0.5 };
      case (_) { distanceKm };
    };

    let pointsDiscount = (userRewardPoints / 10).toFloat() * 0.05;
    let maxDiscount = if (pointsDiscount > 0.3) { 0.3 } else { pointsDiscount };
    let discountMultiplier = 1.0 - maxDiscount;

    let fare = (baseFare * distanceCost * rideTypeMultiplier) * discountMultiplier;

    if (fare < 0.5) { 0.5 } else { fare };
  };

  func calculateDistance(lat1 : Float, lng1 : Float, lat2 : Float, lng2 : Float) : Float {
    let r = 6371.0;

    let dLat = (lat2 - lat1) * Float.pi / 180.0;
    let dLng = (lng2 - lng1) * Float.pi / 180.0;

    let a = Float.sin(dLat / 2.0) * Float.sin(dLat / 2.0) +
            Float.cos(lat1 * Float.pi / 180.0) * Float.cos(lat2 * Float.pi / 180.0) *
            Float.sin(dLng / 2.0) * Float.sin(dLng / 2.0);

    let c = 2.0 * Float.arctan2(Float.sqrt(a), Float.sqrt(1.0 - a));
    r * c;
  };
};
