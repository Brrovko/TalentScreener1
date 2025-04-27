import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRole } from "@shared/schema";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  requiredRoles?: UserRole[];
};

export function ProtectedRoute({
  path,
  component: Component,
  requiredRoles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        // Показываем загрузку, пока ожидаем информацию о пользователе
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        // Если пользователь не авторизован, перенаправляем на главную страницу (страницу входа)
        if (!user) {
          return <Redirect to="/" />;
        }

        // Если указаны требуемые роли и роль пользователя в них не входит
        if (requiredRoles && !requiredRoles.includes(user.role as UserRole)) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
              <h1 className="text-2xl font-bold mb-2">Доступ запрещен</h1>
              <p className="text-muted-foreground">
                У вас нет необходимых прав для доступа к этой странице.
              </p>
            </div>
          );
        }

        // Если пользователь авторизован и имеет необходимые права, отображаем компонент
        return <Component />;
      }}
    </Route>
  );
}