import { LocalStorage } from "@raycast/api";

export interface HistoryItem {
    command: string;
    timestamp: number;
}

export class HistoryService {
    private static readonly HISTORY_KEY = "sui_cli_history";
    private static readonly FAVORITES_KEY = "sui_cli_favorites";
    private static readonly MAX_HISTORY = 50;

    public async addToHistory(command: string): Promise<void> {
        const history = await this.getHistory();
        const newItem: HistoryItem = { command, timestamp: Date.now() };

        // Remove duplicates and keep latest
        const filtered = history.filter((item) => item.command !== command);
        filtered.unshift(newItem);

        const limited = filtered.slice(0, HistoryService.MAX_HISTORY);
        await LocalStorage.setItem(HistoryService.HISTORY_KEY, JSON.stringify(limited));
    }

    public async getHistory(): Promise<HistoryItem[]> {
        const data = await LocalStorage.getItem<string>(HistoryService.HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    }

    public async clearHistory(): Promise<void> {
        await LocalStorage.removeItem(HistoryService.HISTORY_KEY);
    }

    public async toggleFavorite(command: string): Promise<void> {
        const favorites = await this.getFavorites();
        if (favorites.includes(command)) {
            await LocalStorage.setItem(HistoryService.FAVORITES_KEY, JSON.stringify(favorites.filter((c) => c !== command)));
        } else {
            favorites.push(command);
            await LocalStorage.setItem(HistoryService.FAVORITES_KEY, JSON.stringify(favorites));
        }
    }

    public async getFavorites(): Promise<string[]> {
        const data = await LocalStorage.getItem<string>(HistoryService.FAVORITES_KEY);
        return data ? JSON.parse(data) : [];
    }

    public async isFavorite(command: string): Promise<boolean> {
        const favorites = await this.getFavorites();
        return favorites.includes(command);
    }
}
