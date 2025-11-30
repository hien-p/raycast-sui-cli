import { useState, useEffect, useCallback } from "react";
import { HistoryService, HistoryItem } from "../services/HistoryService";
import { showToast, Toast } from "@raycast/api";

export function useSuiHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const historyService = new HistoryService();

    const fetchData = useCallback(async () => {
        try {
            const [hist, favs] = await Promise.all([
                historyService.getHistory(),
                historyService.getFavorites(),
            ]);
            setHistory(hist);
            setFavorites(favs);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addToHistory = async (command: string) => {
        await historyService.addToHistory(command);
        await fetchData();
    };

    const toggleFavorite = async (command: string) => {
        await historyService.toggleFavorite(command);
        await fetchData();
        showToast({ style: Toast.Style.Success, title: "Updated favorites" });
    };

    return { history, favorites, isLoading, addToHistory, toggleFavorite };
}
