import { useState, useEffect } from "react";
import { CommandService, SuiCommand } from "../services/CommandService";
import { showToast, Toast } from "@raycast/api";

export function useSuiCommands() {
  const [commands, setCommands] = useState<SuiCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const commandService = new CommandService();

  useEffect(() => {
    async function fetchCommands() {
      try {
        const cmds = commandService.getAvailableCommands();
        setCommands(cmds);
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load commands",
          message: String(error),
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchCommands();
  }, []);

  const executeCommand = async (command: string) => {
    try {
      showToast({ style: Toast.Style.Animated, title: "Executing..." });
      const result = await commandService.executeCommand(command);
      showToast({ style: Toast.Style.Success, title: "Success" });
      return result;
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Execution failed",
        message: String(error),
      });
      throw error;
    }
  };

  return { commands, isLoading, executeCommand };
}
