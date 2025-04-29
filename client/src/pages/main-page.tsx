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
  Lock 
} from "lucide-react";
import useCursorDispersion from "@/hooks/useCursorDispersion";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Имя пользователя обязательно" }),
  password: z.string().min(1, { message: "Пароль обязателен" }),
});

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { loginMutation, logoutMutation, user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Если пользователь успешно вошел в систему и логин был только что выполнен
  useEffect(() => {
    if (user && !logoutMutation.isPending && loginMutation.isSuccess) {
      setLocation("/dashboard");
    }
  }, [user, loginMutation.isSuccess, setLocation]);

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

  useCursorDispersion();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative group">
        {/* Canvas для эффекта дисперсии курсора */}
        <canvas id="cursor-effect" className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />
        <div className="max-w-6xl w-full relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-primary-700 mb-4 drop-shadow-lg">
              Платформа оценки профессиональных навыков
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Современная платформа для оценки навыков кандидатов и управления процессом подбора персонала
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Основные преимущества платформы */}
            <div className="col-span-2 bg-white p-8 rounded-2xl shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="bg-primary-50 p-2 rounded-xl mb-6 md:mb-0 md:col-span-2 flex flex-col items-center">
                </div>
                <div className="bg-primary-50 p-6 rounded-xl">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                      <ClipboardList className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-primary-800">Тесты</h3>
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
              <div className="flex flex-col items-center mt-8">
                <a href="mailto:info@skillchecker.tech" className="text-slate-700 text-sm hover:underline">
                  info@skillchecker.tech
                </a>
              </div>
            </div>

            {/* Форма входа */}
            <div className="bg-white p-8 rounded-2xl shadow-md">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-primary-800 flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-primary" />
                  Вход в систему
                </h2>
                <p className="text-sm text-slate-600 mt-2">
                  Войдите в свой аккаунт для доступа ко всем функциям платформы
                </p>
              </div>

              {user ? (
                // Пользователь авторизован - показываем информацию и кнопку выхода
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      <p className="text-base text-slate-700 mb-1">{user.fullName}</p>
                      <p className="text-xs text-slate-400 mb-4">
                        {user.role === 'admin' ? 'Администратор' : 
                         user.role === 'recruiter' ? 'Рекрутер' : 
                         user.role === 'interviewer' ? 'Интервьюер' : user.role}
                      </p>
                      
                      <div className="flex flex-col gap-3 mt-4">
                        <Button 
                          onClick={() => setLocation("/dashboard")}
                          className="w-full"
                        >
                          Перейти к панели управления
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => logoutMutation.mutate()}
                          disabled={logoutMutation.isPending}
                          className="w-full flex items-center gap-1"
                        >
                          <Lock className="h-4 w-4" />
                          Выйти
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Пользователь не авторизован - показываем форму входа
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
              )}

              <div className="mt-6 text-sm text-slate-600">
                <p>Для получения учетных данных обратитесь к администратору системы</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="w-full text-center py-6 bg-white/70 border-t border-slate-200 text-slate-500 text-sm shadow-footer">
        <div>
          &copy; {new Date().getFullYear()} Skillchecker. Все права защищены.
        </div>
      </footer>
    </div>
  );
};

export default AuthPage;