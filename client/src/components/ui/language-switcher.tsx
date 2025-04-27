import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setOpen(false);
  };

  const currentLanguage = i18n.language;
  
  const languages = [
    { code: "ru", name: t("languages.ru") },
    { code: "en", name: t("languages.en") }
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">
            {languages.find(lang => lang.code === currentLanguage)?.name || ""}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem 
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className="flex items-center gap-2"
          >
            {language.name}
            {language.code === currentLanguage && (
              <Check className="h-4 w-4 ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;