import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";

import { useAuth } from "@/auth/useAuth";
import SessionLoader from "@/components/session/SessionLoader";

type RequireAuthProps = {
  children: ReactElement;
};

export default function RequireAuth({ children }: RequireAuthProps): ReactElement {
  const location = useLocation();
  const { isAuthenticated, user, bootstrapSession, isBootstrapping } = useAuth();
  const [bootstrapAttempted, setBootstrapAttempted] = useState(false);
  const hasRecoverableUser = user !== null;
  const shouldShowBootstrapLoader = !hasRecoverableUser && (isBootstrapping || !bootstrapAttempted);

  useEffect(() => {
    if (isAuthenticated || hasRecoverableUser || bootstrapAttempted || isBootstrapping) {
      return;
    }
    let active = true;
    bootstrapSession().finally(() => {
      if (active) {
        setBootstrapAttempted(true);
      }
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated, hasRecoverableUser, bootstrapAttempted, isBootstrapping, bootstrapSession]);

  if (shouldShowBootstrapLoader) {
    return <SessionLoader />;
  }

  if (isAuthenticated || hasRecoverableUser) {
    return children;
  }

  return <Navigate to="/login" replace state={{ from: location }} />;
}
