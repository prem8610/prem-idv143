import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { getStoredUser } from "./store/authStore";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DriverSignupPage from "./pages/DriverSignupPage";
import DashboardPage from "./pages/DashboardPage";
import BookRidePage from "./pages/BookRidePage";
import MapPage from "./pages/MapPage";
import DriverDashboardPage from "./pages/DriverDashboardPage";
import DriverMapPage from "./pages/DriverMapPage";
import MyRidesPage from "./pages/MyRidesPage";

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  ),
});

// Public routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <LoginPage isDriver={false} />,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
});

const driverLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/login",
  component: () => <LoginPage isDriver={true} />,
});

const driverSignupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/signup",
  component: DriverSignupPage,
});

// Protected layout route
const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

// User protected routes
const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const bookRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/book",
  component: BookRidePage,
});

const mapRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/map",
  component: MapPage,
});

const ridesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/rides",
  component: MyRidesPage,
});

// Driver protected routes
const driverDashboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/driver/dashboard",
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) throw redirect({ to: "/driver/login" });
    if (user.role !== "driver") throw redirect({ to: "/dashboard" });
  },
  component: DriverDashboardPage,
});

const driverRequestsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/driver/requests",
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) throw redirect({ to: "/driver/login" });
    if (user.role !== "driver") throw redirect({ to: "/dashboard" });
  },
  component: DriverDashboardPage,
});

const driverMapRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/driver/map",
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) throw redirect({ to: "/driver/login" });
    if (user.role !== "driver") throw redirect({ to: "/dashboard" });
  },
  component: DriverMapPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  driverLoginRoute,
  driverSignupRoute,
  protectedLayoutRoute.addChildren([
    dashboardRoute,
    bookRoute,
    mapRoute,
    ridesRoute,
    driverDashboardRoute,
    driverRequestsRoute,
    driverMapRoute,
  ]),
]);

// Re-export router type for use in App.tsx
export type RouteTree = typeof routeTree;
