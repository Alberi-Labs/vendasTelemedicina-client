import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoaded) {
      if (!user) {
        router.push("/login");
      } else if (!allowedRoles.includes(user.role)) {
        router.push("/unauthorized");
      }
    }
  }, [user, isAuthLoaded, allowedRoles, router]);

  if (!isAuthLoaded || !user || !allowedRoles.includes(user.role)) {
    return null; 
  }

  return <>{children}</>;
};

export default ProtectedRoute;
