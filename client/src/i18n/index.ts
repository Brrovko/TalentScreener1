import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Импортируем переводы напрямую
const ruTranslation = {
  common: {
    dashboard: "Панель управления",
    tests: "Тесты",
    candidates: "Кандидаты",
    settings: "Настройки",
    admin: "Администратор",
    hr_manager: "HR менеджер",
    loading: "Загрузка...",
    filter: "Фильтр",
    no_data: "Нет данных",
    no_filter_results: "Нет результатов по вашему фильтру",
    actions: "Действия",
    edit: "Редактировать",
    delete: "Удалить",
    save: "Сохранить",
    cancel: "Отмена",
    success: "Успех",
    error: "Ошибка",
    app_name: "Система оценки кандидатов"
  },
  dashboard: {
    recent_activity: "Недавняя активность",
    statistics: "Статистика",
    total_tests: "Всего тестов",
    active_tests: "Активные тесты",
    total_candidates: "Всего кандидатов",
    pending_sessions: "Ожидающие сессии",
    completed_sessions: "Завершенные сессии",
    view_all: "Посмотреть все"
  },
  candidates: {
    name: "Имя",
    email: "Email",
    position: "Должность",
    status: "Статус",
    no_position: "Нет должности",
    assign_test: "Назначить тест",
    no_tests: "Нет тестов",
    test_results: "Результаты теста",
    test_name: "Название теста",
    score: "Счёт",
    pass: "Сдан",
    fail: "Не сдан",
    in_progress: "В процессе",
    pending: "Ожидает",
    completed: "Завершено",
    passed: "Сдано",
    failed: "Не сдано",
    mixed_results: "Смешанные результаты",
    add_candidate: "Добавить кандидата",
    edit_candidate: "Редактировать кандидата"
  },
  tests: {
    test_name: "Название теста",
    category: "Категория",
    questions: "Вопросы",
    status: "Статус",
    active: "Активен",
    archived: "Архивирован",
    create_test: "Создать тест",
    edit_test: "Редактировать тест",
    description: "Описание",
    time_limit: "Ограничение по времени",
    minutes: "минут",
    passing_score: "Проходной балл",
    assign_to_candidate: "Назначить кандидату",
    expires_at: "Истекает",
    question_count: "Количество вопросов",
    manage_questions: "Управление вопросами",
    add_question: "Добавить вопрос",
    edit_question: "Редактировать вопрос",
    no_questions: "Нет вопросов. Добавьте вопросы для этого теста."
  },
  question_types: {
    single_choice: "Один вариант",
    multiple_choice: "Несколько вариантов",
    true_false: "Верно/Неверно",
    short_answer: "Короткий ответ",
    essay: "Эссе"
  },
  settings: {
    profile: "Профиль",
    security: "Безопасность",
    notifications: "Уведомления",
    language: "Язык",
    select_language: "Выберите язык",
    dark_mode: "Темный режим",
    save_changes: "Сохранить изменения"
  },
  languages: {
    ru: "Русский",
    en: "Английский"
  }
};

const enTranslation = {
  common: {
    dashboard: "Dashboard",
    tests: "Tests",
    candidates: "Candidates",
    settings: "Settings",
    admin: "Admin",
    hr_manager: "HR Manager",
    loading: "Loading...",
    filter: "Filter",
    no_data: "No data",
    no_filter_results: "No results match your filter criteria",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    success: "Success",
    error: "Error",
    app_name: "Candidate Assessment System"
  },
  dashboard: {
    recent_activity: "Recent Activity",
    statistics: "Statistics",
    total_tests: "Total Tests",
    active_tests: "Active Tests",
    total_candidates: "Total Candidates",
    pending_sessions: "Pending Sessions",
    completed_sessions: "Completed Sessions",
    view_all: "View All"
  },
  candidates: {
    name: "Name",
    email: "Email",
    position: "Position",
    status: "Status",
    no_position: "No position",
    assign_test: "Assign Test",
    no_tests: "No tests",
    test_results: "Test Results",
    test_name: "Test Name",
    score: "Score",
    pass: "Pass",
    fail: "Fail",
    in_progress: "In Progress",
    pending: "Pending",
    completed: "Completed",
    passed: "Passed",
    failed: "Failed",
    mixed_results: "Mixed Results",
    add_candidate: "Add Candidate",
    edit_candidate: "Edit Candidate"
  },
  tests: {
    test_name: "Test Name",
    category: "Category",
    questions: "Questions",
    status: "Status",
    active: "Active",
    archived: "Archived",
    create_test: "Create Test",
    edit_test: "Edit Test",
    description: "Description",
    time_limit: "Time Limit",
    minutes: "minutes",
    passing_score: "Passing Score",
    assign_to_candidate: "Assign to Candidate",
    expires_at: "Expires At",
    question_count: "Question Count",
    manage_questions: "Manage Questions",
    add_question: "Add Question",
    edit_question: "Edit Question",
    no_questions: "No questions. Add questions for this test."
  },
  question_types: {
    single_choice: "Single Choice",
    multiple_choice: "Multiple Choice",
    true_false: "True/False",
    short_answer: "Short Answer",
    essay: "Essay"
  },
  settings: {
    profile: "Profile",
    security: "Security",
    notifications: "Notifications",
    language: "Language",
    select_language: "Select Language",
    dark_mode: "Dark Mode",
    save_changes: "Save Changes"
  },
  languages: {
    ru: "Russian",
    en: "English"
  }
};

// Языковые ресурсы
const resources = {
  ru: {
    translation: ruTranslation
  },
  en: {
    translation: enTranslation
  }
};

// Инициализация i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ru", // Язык по умолчанию
    fallbackLng: "ru", // Запасной язык
    interpolation: {
      escapeValue: false // Разрешаем React сам обрабатывать эскейпинг
    }
  });

export default i18n;