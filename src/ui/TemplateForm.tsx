import { Action, ActionPanel, Form, useNavigation } from "@raycast/api";
import React, { useState } from "react";
import { CommandTemplate } from "../services/TemplateService";
import { useSuiTemplates } from "../state/useSuiTemplates";
import { useSuiCommands } from "../state/useSuiCommands";
import { useSuiHistory } from "../state/useSuiHistory";

export function TemplateForm({ template }: { template: CommandTemplate }) {
  const { getPlaceholders, fillTemplate } = useSuiTemplates();
  const { executeCommand } = useSuiCommands();
  const { addToHistory } = useSuiHistory();
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const placeholders = getPlaceholders(template.template);

  const handleSubmit = async (values: Record<string, string>) => {
    setIsLoading(true);
    try {
      const command = fillTemplate(template.template, values);
      await addToHistory(command);
      await executeCommand(command);
      pop();
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Execute Command" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      {placeholders.map((placeholder) => (
        <Form.TextField
          key={placeholder}
          id={placeholder}
          title={placeholder}
          placeholder={`Enter ${placeholder}`}
        />
      ))}
    </Form>
  );
}
