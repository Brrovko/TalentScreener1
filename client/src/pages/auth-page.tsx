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
import { 
  ClipboardList, 
  ShieldCheck, 
  BarChart, 
  Users, 
  CheckCircle, 
  Lock 
} from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Имя пользователя обязательно" }),
  password: z.string().min(1, { message: "Пароль обязателен" }),
});

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { loginMutation, user } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Перенаправить на дашборд, если пользователь уже вошел в систему
    if (user) {
      setLocation("/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-primary-700 mb-4">
            Система профессионального тестирования
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Современная платформа для оценки навыков кандидатов и управления процессом подбора персонала
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основные преимущества платформы */}
          <div className="col-span-2 bg-white p-8 rounded-2xl shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-primary-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-800">Гибкие тесты</h3>
                </div>
                <p className="text-slate-700">
                  Создавайте тесты с различными типами вопросов, устанавливайте времянные ограничения и критерии прохождения
                </p>
              </div>

              <div className="bg-primary-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                    <BarChart className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-800">Аналитика</h3>
                </div>
                <p className="text-slate-700">
                  Детальная статистика по результатам тестирования и визуализация данных для эффективного принятия решений
                </p>
              </div>

              <div className="bg-primary-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-800">Управление кандидатами</h3>
                </div>
                <p className="text-slate-700">
                  Ведение базы кандидатов, отслеживание истории тестирований и управление доступом к тестам
                </p>
              </div>

              <div className="bg-primary-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-800">Ролевая модель</h3>
                </div>
                <p className="text-slate-700">
                  Разграничение прав доступа между администраторами, рекрутерами и интервьюерами для эффективного разделения обязанностей
                </p>
              </div>
            </div>
          </div>

          {/* Форма входа */}
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary" />
                Вход в систему
              </h2>
              <p className="text-slate-600 mt-2">
                Войдите в свой аккаунт для доступа ко всем функциям платформы
              </p>
            </div>

            <Card className="border-primary/20">
              <CardContent className="pt-6">
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
                      {loginMutation.isPending ? "Вход..." : "Войти в систему"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="mt-6 text-center text-sm text-slate-600">
              <p>Для получения учетных данных обратитесь к администратору системы</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;