import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUserApi } from "@/services/api";
import { useAccessLevel, canAccess } from "@/hooks/useAccessLevel";
import type { LoginUserDto } from "@/services/api";

interface Props {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: Props) {
  const location = useLocation();
  const [user, setUser] = useState<LoginUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const level = useAccessLevel(user);

  useEffect(() => {
    getCurrentUserApi()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-400">
        <i className="fa-solid fa-circle-notch fa-spin text-2xl mr-2" />
        <span className="text-sm">Kiểm tra quyền truy cập...</span>
      </div>
    );
  }

  const path = location.pathname;
  if (!canAccess(path, level)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
