import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { insertUserSchema, UserRole, USER_ROLES } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  UserCog, 
  UserPlus, 
  Edit, 
  Ban, 
  CheckCircle,
  AlertCircle,
  Trash,
  RotateCw,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  company: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  testCompletions: z.boolean().default(true),
  newCandidates: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type SecurityFormValues = z.infer<typeof securityFormSchema>;
type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

const Settings = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "Admin User",
      email: "admin@example.com",
      company: "Example Corp",
    },
  });

  // Security form
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notifications form
  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      testCompletions: true,
      newCandidates: true,
      marketingEmails: false,
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const onSecuritySubmit = (data: SecurityFormValues) => {
    toast({
      title: "Password changed",
      description: "Your password has been changed successfully.",
    });
    securityForm.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const onNotificationsSubmit = (data: NotificationsFormValues) => {
    toast({
      title: "Notification preferences updated",
      description: "Your notification preferences have been updated.",
    });
  };

  // Define a user creation form schema
  const userFormSchema = z.object({
    username: z.string().min(3, { message: "Username must be at least 3 characters." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    role: z.enum(["admin", "recruiter", "interviewer"]),
    active: z.boolean().default(true),
  });

  type UserFormValues = z.infer<typeof userFormSchema>;

  // User form
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "recruiter",
      active: true,
    },
  });

  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Пользователь создан",
        description: "Новый пользователь успешно создан",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      userForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при создании пользователя",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<UserFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Пользователь обновлен",
        description: "Пользователь успешно обновлен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при обновлении пользователя",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number, newPassword: string }) => {
      const res = await apiRequest("POST", `/api/users/${id}/reset-password`, { newPassword });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Пароль сброшен",
        description: "Пароль пользователя успешно сброшен",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при сбросе пароля",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle user form submission
  const onUserFormSubmit = async (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  // Toggle user active state
  const toggleUserActiveState = (userId: number, isActive: boolean) => {
    updateUserMutation.mutate({
      id: userId,
      data: { active: !isActive }
    });
  };

  // Update user role
  const updateUserRole = (userId: number, role: UserRole) => {
    updateUserMutation.mutate({
      id: userId,
      data: { role }
    });
  };

  // Reset user password
  const resetUserPassword = (userId: number) => {
    const newPassword = window.prompt("Enter new password (minimum 8 characters):");
    if (newPassword && newPassword.length >= 8) {
      resetPasswordMutation.mutate({ id: userId, newPassword });
    } else if (newPassword) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
    }
  };

  // Get display name for role
  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: "Администратор",
      recruiter: "Рекрутер",
      interviewer: "Интервьюер"
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  // Get color for role badge
  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin":
        return "destructive";
      case "recruiter":
        return "default";
      case "interviewer":
        return "secondary";
      default:
        return "outline";
    }
  };

  // State for the new user dialog
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-800 mb-6">{t('common.settings')}</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4 mb-8">
          <TabsTrigger value="profile">{t('settings.profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="users">
            <div className="flex items-center">
              <UserCog className="mr-2 h-4 w-4" />
              <span>Пользователи</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be displayed on test invitations sent to candidates.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Save Changes</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Update your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormDescription>
                          Password must be at least 8 characters long.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={securityForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Change Password</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                  <FormField
                    control={notificationsForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive email notifications about system events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationsForm.control}
                    name="testCompletions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Test Completions</FormLabel>
                          <FormDescription>
                            Get notified when a candidate completes a test
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationsForm.control}
                    name="newCandidates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">New Candidates</FormLabel>
                          <FormDescription>
                            Get notified when new candidates register
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationsForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Marketing Emails</FormLabel>
                          <FormDescription>
                            Receive marketing emails about new features and updates
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Save Preferences</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <UserCog className="mr-2 h-6 w-6" />
                  <span>Управление пользователями</span>
                </CardTitle>
                <CardDescription>
                  Создание и управление пользователями системы
                </CardDescription>
              </div>
              <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Добавить пользователя</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Создание нового пользователя</DialogTitle>
                    <DialogDescription>
                      Заполните форму, чтобы создать нового пользователя системы. 
                      После создания пользователь сможет войти с указанными учетными данными.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(onUserFormSubmit)} className="space-y-4">
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Имя пользователя</FormLabel>
                            <FormControl>
                              <Input placeholder="user1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Минимум 8 символов
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Полное имя</FormLabel>
                            <FormControl>
                              <Input placeholder="Иван Иванов" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="user@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Роль</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите роль" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {USER_ROLES.map(role => (
                                  <SelectItem key={role} value={role}>
                                    {getRoleDisplayName(role)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Определяет права доступа пользователя
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Активен</FormLabel>
                              <FormDescription>
                                Пользователь может входить в систему
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button 
                      onClick={userForm.handleSubmit(onUserFormSubmit)}
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? "Создание..." : "Создать пользователя"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          <div className="flex justify-center">
                            <RotateCw className="h-6 w-6 animate-spin" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          Пользователи не найдены
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center mr-3 text-primary-700 font-medium">
                                {user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-medium">{user.fullName}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.active ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                <span>Активен</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Ban className="h-4 w-4 text-red-500 mr-1" />
                                <span>Заблокирован</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Select
                                defaultValue={user.role}
                                onValueChange={(value) => updateUserRole(user.id, value as UserRole)}
                                disabled={updateUserMutation.isPending}
                              >
                                <SelectTrigger className="w-32">
                                  <div className="flex items-center">
                                    <Shield className="h-4 w-4 mr-1" />
                                    <span>Роль</span>
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {USER_ROLES.map(role => (
                                    <SelectItem key={role} value={role}>
                                      {getRoleDisplayName(role)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => resetUserPassword(user.id)}
                                disabled={resetPasswordMutation.isPending}
                              >
                                <RotateCw className="h-4 w-4 mr-1" />
                                <span>Сброс пароля</span>
                              </Button>
                              
                              <Button 
                                variant={user.active ? "destructive" : "default"} 
                                size="sm"
                                onClick={() => toggleUserActiveState(user.id, user.active)}
                                disabled={updateUserMutation.isPending}
                              >
                                {user.active ? (
                                  <>
                                    <Ban className="h-4 w-4 mr-1" />
                                    <span>Блокировать</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    <span>Активировать</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
