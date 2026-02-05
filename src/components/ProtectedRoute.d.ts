import React from 'react';
interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'staff')[];
}
declare const ProtectedRoute: React.FC<ProtectedRouteProps>;
export default ProtectedRoute;
