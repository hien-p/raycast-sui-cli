import { useState, useEffect } from "react";
import { EnvironmentService } from "../services/EnvironmentService";
import { showToast, Toast } from "@raycast/api";

export function useSuiEnvironment() {
  const [activeEnv, setActiveEnv] = useState<string | null>(null);
  const [envs, setEnvs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const envService = new EnvironmentService();

  useEffect(() => {
    async function fetchData() {
      try {
        const [current, all] = await Promise.all([
          envService.getActiveEnvironment(),
          envService.getEnvironments(),
        ]);
        setActiveEnv(current);
        setEnvs(all);
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load environment data",
          message: String(error),
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const switchEnv = async (env: string) => {
    try {
      await envService.switchEnvironment(env);
      setActiveEnv(env);
      showToast({ style: Toast.Style.Success, title: `Switched to ${env}` });
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to switch environment",
        message: String(error),
      });
    }
  };

  const addEnv = async (alias: string, rpc: string) => {
    try {
      await envService.addEnvironment(alias, rpc);
      setEnvs([...envs, alias]);
      showToast({
        style: Toast.Style.Success,
        title: `Added environment ${alias}`,
      });
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to add environment",
        message: String(error),
      });
      throw error;
    }
  };

  const removeEnv = async (alias: string) => {
    try {
      await envService.removeEnvironment(alias);
      setEnvs(envs.filter((e) => e !== alias));
      showToast({
        style: Toast.Style.Success,
        title: `Removed environment ${alias}`,
      });
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to remove environment",
        message: String(error),
      });
      throw error;
    }
  };

  return { activeEnv, envs, isLoading, switchEnv, addEnv, removeEnv };
}
