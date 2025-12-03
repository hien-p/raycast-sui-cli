import { Action, ActionPanel, List, Detail, Icon, Color, useNavigation } from "@raycast/api";
import React from "react";
import { useCommunity } from "../state/useCommunity";

export function CommunityView() {
  const {
    tierInfo,
    stats,
    isMember,
    isServerConnected,
    isLoading,
    activeAddress,
    joinCommunity,
    refreshTierInfo,
    communityService,
  } = useCommunity();

  const { push } = useNavigation();

  // Server not running
  if (!isLoading && !isServerConnected) {
    return (
      <Detail
        markdown={`# 🌐 Sui CLI Web Not Running

Please start the Sui CLI Web server first:

\`\`\`bash
cd sui-cli-web
npx sui-cli-web
\`\`\`

The server should be running on **http://localhost:3001**

## What is Sui CLI Web?

Sui CLI Web provides a web interface for Sui CLI and includes community features:
- 💧 Tier system (Droplet → Wave → Tsunami → Ocean)
- 🎯 Progress tracking and achievements
- 🎴 NFT membership cards (coming soon)
- 🏆 Leaderboard and governance
`}
        actions={
          <ActionPanel>
            <Action.OpenInBrowser
              title="Open Sui CLI Web GitHub"
              url="https://github.com/your-repo/sui-cli-web"
            />
          </ActionPanel>
        }
      />
    );
  }

  // Member view with tier info
  if (isMember && tierInfo) {
    const benefits = communityService.getTierBenefits(tierInfo.level);
    const hints = communityService.getNextTierHints(tierInfo.level);

    const getTierColor = (level: number): Color => {
      switch (level) {
        case 0: return Color.Blue;
        case 1: return Color.Green;
        case 2: return Color.Purple;
        case 3: return Color.Yellow;
        default: return Color.SecondaryText;
      }
    };

    const getTierIcon = (level: number): string => {
      switch (level) {
        case 0: return "💧";
        case 1: return "🌊";
        case 2: return "🌀";
        case 3: return "🌊";
        default: return "💧";
      }
    };

    const markdown = `# ${getTierIcon(tierInfo.level)} ${tierInfo.name} Tier

**${tierInfo.description}**

---

## 📊 Your Stats

- **Transactions:** ${tierInfo.txCount}
- **Contracts Deployed:** ${tierInfo.hasDeployedContract ? '✅ Yes' : '❌ No'}
- **Address:** \`${activeAddress}\`

${tierInfo.progress.nextTier ? `
---

## 🎯 Progress to ${tierInfo.progress.nextTier}

${'█'.repeat(Math.floor(tierInfo.progress.percentage / 5))}${'░'.repeat(20 - Math.floor(tierInfo.progress.percentage / 5))} **${Math.round(tierInfo.progress.percentage)}%**

**${tierInfo.txCount} / ${tierInfo.progress.required}** transactions

` : '## 🏆 Maximum Tier Reached!'}

---

## ✅ What You Have Unlocked

${benefits.map(b => `- ${b}`).join('\n')}

${tierInfo.progress.nextTier ? `
---

## 💡 What's Next

${hints.map(h => `- ${h}`).join('\n')}
` : ''}

---

## 🌐 Community Stats

- **Total Members:** ${stats.totalMembers.toLocaleString()}
- **Your Tier Rank:** Top ${tierInfo.level === 0 ? '100' : tierInfo.level === 1 ? '20' : tierInfo.level === 2 ? '5' : '1'}%
`;

    return (
      <Detail
        isLoading={isLoading}
        markdown={markdown}
        metadata={
          <Detail.Metadata>
            <Detail.Metadata.Label
              title="Tier"
              text={tierInfo.name}
              icon={{ source: Icon.Star, tintColor: getTierColor(tierInfo.level) }}
            />
            <Detail.Metadata.Label
              title="Level"
              text={`${tierInfo.level}`}
            />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Label
              title="Transactions"
              text={`${tierInfo.txCount}`}
            />
            <Detail.Metadata.Label
              title="Contracts"
              text={tierInfo.hasDeployedContract ? "Yes" : "No"}
            />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Label
              title="Progress"
              text={`${Math.round(tierInfo.progress.percentage)}%`}
            />
            {tierInfo.progress.nextTier && (
              <Detail.Metadata.Label
                title="Next Tier"
                text={tierInfo.progress.nextTier}
              />
            )}
          </Detail.Metadata>
        }
        actions={
          <ActionPanel>
            <Action
              title="Refresh Tier Info"
              icon={Icon.ArrowClockwise}
              onAction={refreshTierInfo}
            />
            <Action.OpenInBrowser
              title="Open Sui CLI Web"
              url="http://localhost:3001"
            />
          </ActionPanel>
        }
      />
    );
  }

  // Non-member view
  const markdown = `# 💧 Join Sui CLI Web Community

**${stats.totalMembers.toLocaleString()} builders** have already joined!

---

## 🎯 What You'll Get

### 💧 Instant Access
- Full access to all features
- Droplet badge on your profile
- Counted in community stats

### 🌊 Tier Progression System
Earn higher tiers as you build:

- **💧 Droplet** - Join community (you are here)
- **🌊 Wave** - 25 transactions OR 3 contracts (top 15-20%)
- **🌀 Tsunami** - 100 transactions OR 10 contracts (top 3-5%)
- **🌊 Ocean** - 500 transactions + peer review (top 1%, 50 max)

### 🎴 Coming Soon: NFT Cards
- Unique member card NFT
- Evolves with your tier
- Showcases your journey in Sui ecosystem

---

## ⚠️ Requirements

- **Gas:** ~0.001 SUI (use Faucet first)
- **Network:** Testnet/Devnet tokens required
- **Address:** ${activeAddress ? `\`${activeAddress}\`` : 'Loading...'}

---

## 🔒 Privacy First

We only record your address (public) and join time. No tracking of activities or balances.
`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            title="Join Community"
            icon={Icon.Plus}
            onAction={joinCommunity}
          />
          <Action.OpenInBrowser
            title="Open Sui CLI Web"
            url="http://localhost:3001"
          />
        </ActionPanel>
      }
    />
  );
}
