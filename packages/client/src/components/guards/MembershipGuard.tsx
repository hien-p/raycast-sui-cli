/**
 * Membership Guard Component
 * Locks features for members only with beautiful upgrade prompt
 */
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lock,
  Crown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useNavigate } from 'react-router-dom';

interface MembershipGuardProps {
  children: ReactNode;
  featureName: string;
  requiredTier?: number; // Optional: specific tier required
}

export function MembershipGuard({ children, featureName, requiredTier = 0 }: MembershipGuardProps) {
  const { isCommunityMember, tierInfo } = useAppStore();
  const navigate = useNavigate();

  // Check if user meets requirements
  const hasAccess = isCommunityMember && (requiredTier === 0 || (tierInfo && tierInfo.level >= requiredTier));

  // If user has access, show the feature with a premium badge
  if (hasAccess) {
    return (
      <div className="space-y-3">
        {/* Premium Member Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
            <Crown className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                ✨ <strong>Member-Only Feature</strong> - You have access!
              </span>
              <Badge
                variant="outline"
                className="bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900"
              >
                <Crown className="w-3 h-3 mr-1" />
                {tierInfo?.name || 'Member'}
              </Badge>
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* The actual feature */}
        {children}
      </div>
    );
  }

  // If user doesn't have access, show upgrade prompt
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Locked Feature Preview (Blurred) */}
      <div className="relative">
        <div className="pointer-events-none blur-sm opacity-30">
          {children}
        </div>

        {/* Lock Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <div className="p-4 bg-card/90 border-2 border-primary/30 rounded-full shadow-2xl">
              <Lock className="w-12 h-12 text-primary" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Upgrade Prompt Card */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 via-card to-purple-500/5 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Crown className="w-6 h-6 text-yellow-500" />
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Member-Only Feature
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feature Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  🔒 {featureName} is a Premium Feature
                </p>
                <p className="text-sm text-muted-foreground">
                  Join our community to unlock advanced debugging tools and exclusive features
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              What You'll Get as a Member:
            </h3>

            <div className="grid gap-2">
              <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Advanced Transaction Inspector</p>
                  <p className="text-xs text-muted-foreground">
                    Debug transactions with visual execution flow, gas optimization tips, and more
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Priority Support</p>
                  <p className="text-xs text-muted-foreground">
                    Get help faster and access to exclusive developer resources
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Early Access Features</p>
                  <p className="text-xs text-muted-foreground">
                    Be the first to try new tools and capabilities
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Community Badge</p>
                  <p className="text-xs text-muted-foreground">
                    Show your support and get recognized in the community
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <motion.button
              onClick={() => navigate('/membership')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Become a Member
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="sm:w-auto px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Go Back
            </motion.button>
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">Membership is on-chain!</strong> Pay once with SUI,
                own forever. Your membership is an NFT stored in your wallet.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-xs text-muted-foreground">Members</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-xs text-muted-foreground">On-Chain</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Forever</div>
              <div className="text-xs text-muted-foreground">Ownership</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Optional: Compact version for smaller areas
export function MembershipBadge({ className = '' }: { className?: string }) {
  const { isCommunityMember, tierInfo } = useAppStore();

  if (!isCommunityMember) return null;

  return (
    <Badge
      variant="outline"
      className={`bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900 ${className}`}
    >
      <Crown className="w-3 h-3 mr-1" />
      {tierInfo?.name || 'Member'}
    </Badge>
  );
}
