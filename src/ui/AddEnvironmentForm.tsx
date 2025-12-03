import { Action, ActionPanel, Form, useNavigation } from "@raycast/api";
import { useState } from "react";
import { useSuiEnvironment } from "../state/useSuiEnvironment";

export function AddEnvironmentForm() {
  const { addEnv } = useSuiEnvironment();
  const { pop } = useNavigation();
  const [alias, setAlias] = useState("");
  const [rpc, setRpc] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!alias || !rpc) {
      return;
    }
    setIsLoading(true);
    try {
      await addEnv(alias, rpc);
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
          <Action.SubmitForm title="Add Environment" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="alias"
        title="Alias"
        placeholder="e.g. my-testnet"
        value={alias}
        onChange={setAlias}
      />
      <Form.TextField
        id="rpc"
        title="RPC URL"
        placeholder="e.g. https://fullnode.testnet.sui.io:443"
        value={rpc}
        onChange={setRpc}
      />
    </Form>
  );
}
