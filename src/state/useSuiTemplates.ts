import { useState, useEffect } from "react";
import { TemplateService, CommandTemplate } from "../services/TemplateService";

export function useSuiTemplates() {
  const [templates, setTemplates] = useState<CommandTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const templateService = new TemplateService();

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const data = await templateService.getTemplates();
        setTemplates(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  const getPlaceholders = (template: string) =>
    templateService.getPlaceholders(template);
  const fillTemplate = (template: string, values: Record<string, string>) =>
    templateService.fillTemplate(template, values);

  return { templates, isLoading, getPlaceholders, fillTemplate };
}
