import { useState, useEffect, useCallback } from "react";
import { showToast, Toast } from "@raycast/api";
import {
  KeyService,
  KeyInfo,
  GeneratedKey,
  SignResult,
  KeyScheme,
  WordLength,
} from "../services/KeyService";

export function useSuiKeys() {
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const keyService = new KeyService();

  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyList = await keyService.listKeys();
      setKeys(keyList);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load keys",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const generateKey = async (
    scheme: KeyScheme = "ed25519",
    alias?: string,
    wordLength: WordLength = 12,
  ): Promise<GeneratedKey | null> => {
    try {
      showToast({ style: Toast.Style.Animated, title: "Generating key..." });
      const result = await keyService.generateKey(scheme, alias, wordLength);
      showToast({ style: Toast.Style.Success, title: "Key generated" });
      await loadKeys();
      return result;
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to generate key",
        message: String(error),
      });
      return null;
    }
  };

  const importKey = async (
    input: string,
    scheme: KeyScheme = "ed25519",
    alias?: string,
  ): Promise<string | null> => {
    try {
      showToast({ style: Toast.Style.Animated, title: "Importing key..." });
      const address = await keyService.importKey(input, scheme, alias);
      showToast({ style: Toast.Style.Success, title: "Key imported" });
      await loadKeys();
      return address;
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to import key",
        message: String(error),
      });
      return null;
    }
  };

  const exportKey = async (address: string): Promise<string | null> => {
    try {
      showToast({ style: Toast.Style.Animated, title: "Exporting key..." });
      const privateKey = await keyService.exportKey(address);
      showToast({
        style: Toast.Style.Success,
        title: "Key exported",
        message: "Private key copied - will clear in 30s",
      });
      return privateKey;
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to export key",
        message: String(error),
      });
      return null;
    }
  };

  const signData = async (
    address: string,
    data: string,
    intent: "TransactionData" | "PersonalMessage" = "TransactionData",
  ): Promise<SignResult | null> => {
    try {
      showToast({ style: Toast.Style.Animated, title: "Signing..." });
      const result = await keyService.signData(address, data, intent);
      showToast({ style: Toast.Style.Success, title: "Signed successfully" });
      return result;
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to sign",
        message: String(error),
      });
      return null;
    }
  };

  const updateAlias = async (
    oldAlias: string,
    newAlias?: string,
  ): Promise<boolean> => {
    try {
      await keyService.updateAlias(oldAlias, newAlias);
      showToast({ style: Toast.Style.Success, title: "Alias updated" });
      await loadKeys();
      return true;
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to update alias",
        message: String(error),
      });
      return false;
    }
  };

  const createMultiSig = async (
    publicKeys: string[],
    weights: number[],
    threshold: number,
  ): Promise<{ address: string; multiSigInfo: string } | null> => {
    try {
      showToast({
        style: Toast.Style.Animated,
        title: "Creating multi-sig address...",
      });
      const result = await keyService.createMultiSigAddress(
        publicKeys,
        weights,
        threshold,
      );
      showToast({
        style: Toast.Style.Success,
        title: "Multi-sig address created",
      });
      return result;
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to create multi-sig",
        message: String(error),
      });
      return null;
    }
  };

  return {
    keys,
    isLoading,
    loadKeys,
    generateKey,
    importKey,
    exportKey,
    signData,
    updateAlias,
    createMultiSig,
  };
}
