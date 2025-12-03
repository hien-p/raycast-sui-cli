import { useState, useEffect } from "react";
import { CommunityService, TierInfo, CommunityStats } from "../services/CommunityService";
import { AddressService } from "../services/AddressService";
import { showToast, Toast } from "@raycast/api";

export function useCommunity() {
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [stats, setStats] = useState<CommunityStats>({ totalMembers: 0, isConfigured: false });
  const [isMember, setIsMember] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAddress, setActiveAddress] = useState<string | null>(null);

  const communityService = new CommunityService();
  const addressService = new AddressService();

  useEffect(() => {
    async function fetchData() {
      try {
        // Check server connection first
        const connected = await communityService.checkServerConnection();
        setIsServerConnected(connected);

        if (!connected) {
          setIsLoading(false);
          return;
        }

        // Get active address
        const address = await addressService.getActiveAddress();
        setActiveAddress(address);

        // Fetch community data in parallel
        const [statsData, membershipStatus, tierData] = await Promise.all([
          communityService.getCommunityStats().catch(() => ({ totalMembers: 0, isConfigured: false })),
          communityService.checkMembership(address).catch(() => false),
          communityService.getTierInfo(address).catch(() => null),
        ]);

        setStats(statsData);
        setIsMember(membershipStatus);
        setTierInfo(tierData);
      } catch (error) {
        console.error("Failed to load community data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const joinCommunity = async () => {
    try {
      const result = await communityService.joinCommunity();

      if (result.success) {
        setIsMember(true);
        showToast({
          style: Toast.Style.Success,
          title: "Welcome to the community!",
          message: result.txDigest ? `TX: ${result.txDigest.slice(0, 20)}...` : undefined,
        });

        // Refresh data
        if (activeAddress) {
          const [statsData, tierData] = await Promise.all([
            communityService.getCommunityStats().catch(() => stats),
            communityService.getTierInfo(activeAddress).catch(() => null),
          ]);
          setStats(statsData);
          setTierInfo(tierData);
        }

        return true;
      } else {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to join community",
          message: result.error,
        });
        return false;
      }
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to join community",
        message: String(error),
      });
      return false;
    }
  };

  const refreshTierInfo = async () => {
    if (!activeAddress || !isServerConnected) return;

    try {
      const tierData = await communityService.getTierInfo(activeAddress);
      setTierInfo(tierData);
      showToast({
        style: Toast.Style.Success,
        title: "Tier info refreshed",
      });
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to refresh tier info",
        message: String(error),
      });
    }
  };

  return {
    tierInfo,
    stats,
    isMember,
    isServerConnected,
    isLoading,
    activeAddress,
    joinCommunity,
    refreshTierInfo,
    communityService,
  };
}
