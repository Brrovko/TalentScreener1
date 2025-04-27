import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ClipboardList, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Имя пользователя обязательно" }),
  password: z.string().min(1, { message: "Пароль обязателен" }),
});

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { loginMutation, user } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Перенаправить на главную, если пользователь уже вошел в систему
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full space-y-8 flex h-[600px] shadow-lg rounded-xl overflow-hidden">
        {/* Left column - Login/Register form */}
        <div className="w-full md:w-1/2 bg-white p-8 flex flex-col justify-center">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Система тестирования кандидатов
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Войдите в свой аккаунт для доступа
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 mb-6">
              <TabsTrigger value="login">Вход в систему</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя пользователя</FormLabel>
                        <FormControl>
                          <Input placeholder="admin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пароль</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Вход..." : "Войти"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column - Hero section */}
        <div className="hidden md:block md:w-1/2 bg-primary text-primary-foreground p-8 flex flex-col justify-center">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <ClipboardList size={32} />
              <h3 className="text-xl font-bold">Управление тестированием</h3>
            </div>
            <p>
              Создавайте разнообразные тесты, назначайте их кандидатам и следите за результатами в реальном времени.
            </p>

            <div className="flex items-center space-x-3">
              <ShieldCheck size={32} />
              <h3 className="text-xl font-bold">Ролевая модель</h3>
            </div>
            <p>
              В системе предусмотрены роли с различными правами доступа:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Администратор</strong> - полный доступ к системе</li>
              <li><strong>Рекрутер</strong> - создание и управление тестами и кандидатами</li>
              <li><strong>Интервьювер</strong> - просмотр и оценка результатов</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;