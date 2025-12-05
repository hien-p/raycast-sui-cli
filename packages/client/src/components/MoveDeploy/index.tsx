import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Building2,
  TestTube2,
  Upload,
  Package,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Code,
  FileCode,
  Rocket,
  FolderOpen,
  Clock,
  Sparkles,
  PlayCircle,
  ChevronRight,
  Trash2,
  Zap,
  ChevronDown,
  Loader2,
  Circle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { WorkflowPipelineIndicator } from '@/components/ui/workflow-pipeline';
import { Badge } from '@/components/ui/badge';
import { FileBrowser } from './FileBrowser';
import { TerminalErrorDisplay } from './TerminalErrorDisplay';
import { TerminalSuccessDisplay } from './TerminalSuccessDisplay';
import { TerminalBuildOutput } from './TerminalBuildOutput';
import { TerminalTestOutput } from './TerminalTestOutput';
import {
  buildMovePackage,
  testMovePackage,
  publishPackage,
  upgradePackage,
  inspectPackage,
  callPackageFunction,
  analyzeParameters,
  type AnalyzedParameter,
} from '@/api/client';
import { ParameterInputField } from '@/components/ParameterInputField';
import { useAppStore } from '@/stores/useAppStore';

interface PublishResult {
  success: boolean;
  packageId?: string;
  digest?: string;
  createdObjects?: any[];
  error?: string;
}

interface RecentProject {
  path: string;
  name: string;
  lastUsed: number;
  upgradeCap?: string;
}

type WorkflowStep = 'build' | 'test' | 'publish' | 'idle';

interface ModuleFunction {
  name: string;
  visibility: string;
  parameters: Array<{ name: string; type: string }>;
  typeParameters: string[];
  returnTypes: string[];
  signature: string;
}

interface PackageModule {
  name: string;
  functions: ModuleFunction[];
}

export function MoveDeploy() {
  const [packagePath, setPackagePath] = useState('');
  const [gasBudget, setGasBudget] = useState('100000000');
  const [upgradeCapId, setUpgradeCapId] = useState('');
  const [testFilter, setTestFilter] = useState('');
  const [skipDeps, setSkipDeps] = useState(false);

  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [saveUpgradeCap, setSaveUpgradeCap] = useState(true);

  const [currentStep, setCurrentStep] = useState<WorkflowStep>('idle');
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [isOneClickRunning, setIsOneClickRunning] = useState(false);

  const [building, setBuilding] = useState(false);
  const [testing, setTesting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const [buildOutput, setBuildOutput] = useState<string>('');
  const [testOutput, setTestOutput] = useState<string>('');
  const [testPassed, setTestPassed] = useState(0);
  const [testFailed, setTestFailed] = useState(0);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);

  // Contract Interaction State
  const [targetPackageId, setTargetPackageId] = useState('');
  const [packageModules, setPackageModules] = useState<PackageModule[]>([]);
  const [loadingFunctions, setLoadingFunctions] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedFunction, setSelectedFunction] = useState<ModuleFunction | null>(null);
  const [selectedModuleName, setSelectedModuleName] = useState('');
  const [functionArgs, setFunctionArgs] = useState<string[]>([]);
  const [functionTypeArgs, setFunctionTypeArgs] = useState<string[]>([]);
  const [callResult, setCallResult] = useState<any>(null);
  const [calling, setCalling] = useState(false);
  const [analyzedParams, setAnalyzedParams] = useState<AnalyzedParameter[]>([]);
  const [analyzingParams, setAnalyzingParams] = useState(false);

  // Get active address from store for parameter analysis
  const addresses = useAppStore((state) => state.addresses);
  const activeAddress = addresses.find((a) => a.isActive)?.address || null;

  // Load recent projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sui-recent-projects');
    if (saved) {
      try {
        setRecentProjects(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent projects:', e);
      }
    }
  }, []);

  // Save to recent projects
  const addToRecent = (path: string, upgradeCap?: string) => {
    const projectName = path.split('/').pop() || path;
    const newProject: RecentProject = {
      path,
      name: projectName,
      lastUsed: Date.now(),
      upgradeCap,
    };

    const updated = [
      newProject,
      ...recentProjects.filter((p) => p.path !== path).slice(0, 4),
    ];

    setRecentProjects(updated);
    localStorage.setItem('sui-recent-projects', JSON.stringify(updated));
  };

  // Remove from recent projects
  const removeFromRecent = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentProjects.filter((p) => p.path !== path);
    setRecentProjects(updated);
    localStorage.setItem('sui-recent-projects', JSON.stringify(updated));
    toast.success('Removed from recent projects');
  };

  // Use recent project
  const useRecentProject = (project: RecentProject) => {
    setPackagePath(project.path);
    if (project.upgradeCap) {
      setUpgradeCapId(project.upgradeCap);
    }
    toast.success(`Loaded: ${project.name}`);
  };

  // Validate package path
  const isValidPath = packagePath.trim().length > 0;

  // Build package
  const handleBuild = async () => {
    if (!packagePath.trim()) {
      toast.error('Please select a package path');
      return;
    }

    setBuilding(true);
    setBuildOutput('');
    setCurrentStep('build');
    setWorkflowProgress(33);

    try {
      const data = await buildMovePackage(packagePath.trim());
      setBuildOutput(data.output);
      toast.success('Build successful!');
      setWorkflowProgress(100);
      addToRecent(packagePath.trim());
      return true;
    } catch (error: any) {
      const msg = error.message || String(error);
      setBuildOutput(msg);
      toast.error('Build failed: ' + msg);
      setWorkflowProgress(0);
      return false;
    } finally {
      setBuilding(false);
      setCurrentStep('idle');
    }
  };

  // Run tests
  const handleTest = async () => {
    if (!packagePath.trim()) {
      toast.error('Please select a package path');
      return;
    }

    setTesting(true);
    setTestOutput('');
    setCurrentStep('test');
    setWorkflowProgress(33);

    try {
      const data = await testMovePackage(packagePath.trim(), testFilter.trim() || undefined);
      setTestOutput(data.output);
      setTestPassed(data.passed);
      setTestFailed(data.failed);

      if (data.failed === 0) {
        toast.success(`All ${data.passed} test(s) passed!`);
        setWorkflowProgress(100);
        return true;
      } else {
        toast.error(`${data.failed} test(s) failed`);
        setWorkflowProgress(66);
        return false;
      }
    } catch (error: any) {
      const msg = error.message || String(error);
      setTestOutput(msg);
      setTestPassed(0);
      setTestFailed(1);
      toast.error('Test failed: ' + msg);
      setWorkflowProgress(0);
      return false;
    } finally {
      setTesting(false);
      setCurrentStep('idle');
    }
  };

  // Publish package
  const handlePublish = async () => {
    if (!packagePath.trim()) {
      toast.error('Please select a package path');
      return;
    }

    setPublishing(true);
    setPublishResult(null);
    setCurrentStep('publish');
    setWorkflowProgress(33);

    try {
      const data = await publishPackage(packagePath.trim(), gasBudget, skipDeps);
      setPublishResult({
        success: true,
        packageId: data.packageId,
        digest: data.digest,
        createdObjects: data.createdObjects,
      });
      toast.success('Package published successfully!');
      setWorkflowProgress(100);

      // Auto-save UpgradeCap if enabled
      if (saveUpgradeCap && data.createdObjects) {
        const upgradeCap = data.createdObjects.find((obj: any) =>
          obj.type?.includes('UpgradeCap')
        );
        if (upgradeCap?.objectId) {
          setUpgradeCapId(upgradeCap.objectId);
          addToRecent(packagePath.trim(), upgradeCap.objectId);
          toast.success('UpgradeCap saved for future upgrades');
        }
      }
      return true;
    } catch (error: any) {
      const msg = error.message || String(error);
      setPublishResult({ success: false, error: msg });
      toast.error('Publish failed: ' + msg);
      setWorkflowProgress(0);
      return false;
    } finally {
      setPublishing(false);
      setCurrentStep('idle');
    }
  };

  // Upgrade package
  const handleUpgrade = async () => {
    if (!packagePath.trim()) {
      toast.error('Please select a package path');
      return;
    }
    if (!upgradeCapId.trim()) {
      toast.error('Please enter an upgrade capability ID');
      return;
    }

    setUpgrading(true);
    setPublishResult(null);
    setCurrentStep('publish');
    setWorkflowProgress(33);

    try {
      const data = await upgradePackage(packagePath.trim(), upgradeCapId.trim(), gasBudget);
      setPublishResult({
        success: true,
        packageId: data.packageId,
        digest: data.digest,
      });
      toast.success('Package upgraded successfully!');
      setWorkflowProgress(100);
      addToRecent(packagePath.trim(), upgradeCapId.trim());
      return true;
    } catch (error: any) {
      const msg = error.message || String(error);
      setPublishResult({ success: false, error: msg });
      toast.error('Upgrade failed: ' + msg);
      setWorkflowProgress(0);
      return false;
    } finally {
      setUpgrading(false);
      setCurrentStep('idle');
    }
  };

  // One-click workflow: Build → Test → Publish
  const handleOneClickWorkflow = async () => {
    if (!packagePath.trim()) {
      toast.error('Please select a package path');
      return;
    }

    setIsOneClickRunning(true);

    // Step 1: Build
    toast('Step 1/3: Building...', { icon: '🔨' });
    const buildSuccess = await handleBuild();
    if (!buildSuccess) {
      setIsOneClickRunning(false);
      return;
    }

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Step 2: Test
    toast('Step 2/3: Testing...', { icon: '🧪' });
    const testSuccess = await handleTest();
    if (!testSuccess) {
      setIsOneClickRunning(false);
      toast.error('Tests failed. Fix errors before publishing.');
      return;
    }

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Step 3: Publish
    toast('Step 3/3: Publishing...', { icon: '🚀' });
    const publishSuccess = await handlePublish();

    setIsOneClickRunning(false);

    if (publishSuccess) {
      toast.success('Complete workflow finished successfully!');
    }
  };

  // Load package functions for interaction
  const handleLoadPackage = async () => {
    if (!targetPackageId.trim()) {
      toast.error('Please enter a package ID');
      return;
    }

    setLoadingFunctions(true);
    setPackageModules([]);
    setSelectedFunction(null);
    setCallResult(null);

    try {
      const data = await inspectPackage(targetPackageId.trim());
      setPackageModules(data.modules);
      toast.success(`Loaded ${data.modules.length} module(s)`);
      // Remember last package ID
      localStorage.setItem('sui-last-package-id', targetPackageId.trim());
    } catch (error: any) {
      toast.error(error.message || String(error));
    } finally {
      setLoadingFunctions(false);
    }
  };

  // Toggle module expansion
  const toggleModule = (moduleName: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleName)) {
      newExpanded.delete(moduleName);
    } else {
      newExpanded.add(moduleName);
    }
    setExpandedModules(newExpanded);
  };

  // Select function to call and analyze parameters
  const handleSelectFunction = async (func: ModuleFunction, moduleName: string) => {
    setSelectedFunction(func);
    setSelectedModuleName(moduleName);
    setCallResult(null);
    setAnalyzedParams([]);

    // Initialize args array based on parameter count
    const filteredParams = func.parameters.filter((p) => p.name !== 'ctx' && p.name !== '_ctx');
    const argsCount = filteredParams.length;
    setFunctionArgs(new Array(argsCount).fill(''));
    setFunctionTypeArgs(new Array(func.typeParameters.length).fill(''));

    // Analyze parameters if we have an active address
    if (activeAddress && argsCount > 0) {
      setAnalyzingParams(true);
      try {
        const result = await analyzeParameters(
          targetPackageId.trim(),
          moduleName,
          func.name,
          activeAddress
        );
        setAnalyzedParams(result.parameters);

        // Auto-fill values from analyzed parameters
        const newArgs = [...new Array(argsCount).fill('')];
        result.parameters.forEach((param, idx) => {
          if (param.autoFilled) {
            newArgs[idx] = param.autoFilled.value;
          }
        });
        setFunctionArgs(newArgs);
      } catch (error) {
        console.error('Failed to analyze parameters:', error);
        // Continue without analysis - user can still enter manually
      } finally {
        setAnalyzingParams(false);
      }
    }
  };

  // Refresh parameter suggestions
  const handleRefreshSuggestions = async () => {
    if (!selectedFunction || !selectedModuleName || !activeAddress) return;

    setAnalyzingParams(true);
    try {
      const result = await analyzeParameters(
        targetPackageId.trim(),
        selectedModuleName,
        selectedFunction.name,
        activeAddress
      );
      setAnalyzedParams(result.parameters);
    } catch (error) {
      console.error('Failed to refresh suggestions:', error);
      toast.error('Failed to refresh suggestions');
    } finally {
      setAnalyzingParams(false);
    }
  };

  // Call contract function
  const handleCallFunction = async () => {
    if (!selectedFunction || !selectedModuleName) {
      toast.error('Please select a function to call');
      return;
    }

    setCalling(true);
    setCallResult(null);

    try {
      const data = await callPackageFunction(
        targetPackageId.trim(),
        selectedModuleName,
        selectedFunction.name,
        functionArgs.filter((arg) => arg.trim()),
        functionTypeArgs.filter((t) => t.trim()),
        gasBudget
      );
      setCallResult(data);
      toast.success('Function called successfully!');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      setCallResult({ error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setCalling(false);
    }
  };

  // Auto-fill package ID from publish result
  useEffect(() => {
    if (publishResult?.success && publishResult.packageId) {
      setTargetPackageId(publishResult.packageId);
    }
  }, [publishResult]);

  // Load last used package ID on mount
  useEffect(() => {
    const lastPackageId = localStorage.getItem('sui-last-package-id');
    if (lastPackageId && !targetPackageId) {
      setTargetPackageId(lastPackageId);
    }
  }, []);

  const isAnyLoading = building || testing || publishing || upgrading || isOneClickRunning;

  return (
    <>
      {/* Content */}
      <div className="relative z-10 p-4 sm:p-6">
        <div className="relative max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 space-y-2"
          >
            <h1 className="text-3xl font-bold text-green-400 flex items-center gap-3 font-mono">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              >
                <Package className="w-8 h-8 text-green-400" style={{ filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.6))' }} />
              </motion.div>
              Move Development Studio
            </h1>
            <p className="text-green-300/80 font-mono text-sm">
              &gt; Complete workflow for building, testing, and deploying Move smart contracts
            </p>
          </motion.div>

          {/* Workflow Pipeline Indicator */}
          {(isAnyLoading || buildOutput || testOutput || publishResult) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <WorkflowPipelineIndicator
                currentStep={currentStep}
                completedSteps={
                  new Set([
                    buildOutput && !buildOutput.includes('error') ? 'build' : '',
                    testOutput && testOutput.includes('Passed') ? 'test' : '',
                    publishResult?.success ? 'publish' : '',
                  ].filter(Boolean))
                }
                failedSteps={
                  new Set([
                    buildOutput && buildOutput.includes('error') ? 'build' : '',
                    testOutput && testOutput.includes('Failed') && !testOutput.includes('Failed: 0') ? 'test' : '',
                    publishResult && !publishResult.success ? 'publish' : '',
                  ].filter(Boolean))
                }
                progress={workflowProgress}
              />
            </motion.div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Package Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* Recent Projects */}
            <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors shadow-lg shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-green-400 font-mono">
                  <Clock className="w-4 h-4 text-green-500" />
                  Recent Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="w-8 h-8 text-green-500/50 mx-auto mb-2" />
                    <p className="text-xs text-green-500/50 font-mono">
                      No recent projects yet
                    </p>
                  </div>
                ) : (
                  recentProjects.map((project) => (
                    <motion.div
                      key={project.path}
                      onClick={() => useRecentProject(project)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-black/40 hover:bg-green-500/10 border border-green-500/20 hover:border-green-500/40 cursor-pointer group transition-all"
                    >
                      <FolderOpen className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-green-400 truncate font-mono">
                          {project.name}
                        </div>
                        <div className="text-xs text-green-500/60 truncate font-mono">
                          {new Date(project.lastUsed).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => removeFromRecent(project.path, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Project Templates */}
            <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors shadow-lg shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-green-400 font-mono">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  Starter Templates
                </CardTitle>
                <CardDescription className="text-xs text-green-500/60 font-mono">
                  Quick start with common patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-green-500/50 mx-auto mb-3" />
                  <p className="text-sm text-green-500/70 font-mono">
                    Stay tuned!
                  </p>
                  <p className="text-xs text-green-500/50 mt-1 font-mono">
                    Templates coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.3 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Package Configuration */}
            <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors shadow-lg shadow-green-500/10 relative overflow-hidden">
              {/* Accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500/50" />

              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400 font-mono">
                  <FileCode className="w-5 h-5 text-green-500" />
                  Package Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Package Path */}
                <div className="space-y-2">
                  <Label htmlFor="package-path" className="text-sm font-medium flex items-center gap-2 text-green-400 font-mono">
                    Package Path <span className="text-red-400">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <input
                      id="package-path"
                      type="text"
                      value={packagePath}
                      onChange={(e) => setPackagePath(e.target.value)}
                      placeholder="/path/to/your/move/package"
                      className="flex-1 px-4 py-3 bg-black/50 border border-green-500/30 rounded-lg text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all text-sm font-mono"
                      disabled={isAnyLoading}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowBrowser(true)}
                      disabled={isAnyLoading}
                      className="px-4 py-3 bg-green-500/20 border-2 border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
                      title="Browse for Move package"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <p className="text-xs text-green-500/50 flex items-center gap-1.5 font-mono">
                    <AlertCircle className="w-3 h-3" />
                    Absolute path to your Move package directory (containing Move.toml)
                  </p>
                </div>

                <Separator className="bg-green-500/20" />

                {/* Gas Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gas-budget" className="text-sm font-medium text-green-400 font-mono">
                      Gas Budget
                    </Label>
                    <input
                      id="gas-budget"
                      type="text"
                      value={gasBudget}
                      onChange={(e) => setGasBudget(e.target.value)}
                      placeholder="100000000"
                      className="w-full px-4 py-3 bg-black/50 border border-green-500/30 rounded-lg text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all text-sm font-mono"
                      disabled={isAnyLoading}
                    />
                    <p className="text-xs text-green-500/50 font-mono">
                      In MIST (0.1 SUI = 100000000 MIST)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-green-400 font-mono">Options</Label>
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="save-upgrade-cap"
                          checked={saveUpgradeCap}
                          onChange={(e) => setSaveUpgradeCap(e.target.checked)}
                          disabled={isAnyLoading}
                          className="w-4 h-4 text-green-500 bg-black/50 border-green-500/50 rounded focus:ring-2 focus:ring-green-500/50 cursor-pointer"
                        />
                        <label htmlFor="save-upgrade-cap" className="text-sm text-green-400 cursor-pointer select-none font-mono">
                          Auto-save UpgradeCap
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="skipDeps"
                          checked={skipDeps}
                          onChange={(e) => setSkipDeps(e.target.checked)}
                          disabled={isAnyLoading}
                          className="w-4 h-4 text-green-500 bg-black/50 border-green-500/50 rounded focus:ring-2 focus:ring-green-500/50 cursor-pointer"
                        />
                        <label htmlFor="skipDeps" className="text-sm text-green-400 cursor-pointer select-none font-mono">
                          Skip dependency verification
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* One-Click Workflow */}
            <Card className="bg-black/40 backdrop-blur-md border-green-500/50 hover:border-green-500 transition-colors shadow-lg shadow-green-500/20 relative overflow-hidden">
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-green-400 font-mono">
                  <PlayCircle className="w-5 h-5 text-green-500" />
                  One-Click Workflow
                </CardTitle>
                <CardDescription className="text-green-500/60 font-mono text-sm">
                  Automatically build, test, and publish your package
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <motion.button
                  onClick={handleOneClickWorkflow}
                  disabled={!isValidPath || isAnyLoading}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group w-full px-6 py-4 bg-green-500/20 border-2 border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 font-medium shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 overflow-hidden font-mono"
                >
                  <span className="relative flex items-center gap-3">
                    {isOneClickRunning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Running Complete Workflow...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" />
                        Build → Test → Publish
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </motion.button>
                <p className="text-xs text-green-500/60 text-center mt-3 flex items-center justify-center gap-1.5 font-mono">
                  <Zap className="w-3 h-3 text-green-500" />
                  Recommended for production deployment
                </p>
              </CardContent>
            </Card>

            {/* Main Workflow Tabs */}
            <Tabs defaultValue="develop" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-black/30 border border-green-500/30">
                <TabsTrigger value="develop" className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-green-500/60 hover:text-green-400 font-mono data-[state=active]:border-b-2 data-[state=active]:border-green-500">
                  <Code className="w-4 h-4" />
                  <span className="hidden sm:inline">Develop</span>
                </TabsTrigger>
                <TabsTrigger value="deploy" className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-green-500/60 hover:text-green-400 font-mono data-[state=active]:border-b-2 data-[state=active]:border-green-500">
                  <Rocket className="w-4 h-4" />
                  <span className="hidden sm:inline">Deploy</span>
                </TabsTrigger>
                <TabsTrigger value="upgrade" className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-green-500/60 hover:text-green-400 font-mono data-[state=active]:border-b-2 data-[state=active]:border-green-500">
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Upgrade</span>
                </TabsTrigger>
                <TabsTrigger value="interact" className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-green-500/60 hover:text-green-400 font-mono data-[state=active]:border-b-2 data-[state=active]:border-green-500">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Interact</span>
                </TabsTrigger>
              </TabsList>

              {/* Develop Tab */}
              <TabsContent value="develop" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Build Card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors h-full relative overflow-hidden shadow-lg shadow-green-500/10">
                      {/* Status indicator bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                        building ? 'bg-green-500 animate-pulse' :
                        buildOutput && !buildOutput.includes('error') ? 'bg-green-500' :
                        buildOutput && buildOutput.includes('error') ? 'bg-red-500' :
                        'bg-green-500/20'
                      }`} />

                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-green-400 font-mono">
                          <Building2 className="w-5 h-5 text-green-500" />
                          Build Package
                          {buildOutput && !building && (
                            <Badge className={buildOutput.includes('error') ?
                              'bg-red-500/20 text-red-400 border-red-500/30 font-mono' :
                              'bg-green-500/20 text-green-400 border-green-500/30 font-mono'
                            }>
                              {buildOutput.includes('error') ? (
                                <><XCircle className="w-3 h-3 mr-1" />Failed</>
                              ) : (
                                <><CheckCircle2 className="w-3 h-3 mr-1" />Success</>
                              )}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <motion.button
                          onClick={handleBuild}
                          disabled={!isValidPath || building || isAnyLoading}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative group w-full px-4 py-3 bg-green-500/20 border-2 border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium text-sm shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 overflow-hidden font-mono"
                        >
                          <span className="relative flex items-center gap-2">
                            {building ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Building...
                              </>
                            ) : (
                              <>
                                <Building2 className="w-4 h-4" />
                                Build Package
                              </>
                            )}
                          </span>
                        </motion.button>

                        {/* Loading skeleton */}
                        <AnimatePresence mode="wait">
                          {building && !buildOutput && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                                <span className="text-sm text-green-400 font-mono">Compiling Move code...</span>
                              </div>
                              <Skeleton className="h-3 w-full bg-green-500/20" />
                              <Skeleton className="h-3 w-3/4 bg-green-500/10" />
                              <Skeleton className="h-3 w-1/2 bg-green-500/5" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Terminal output */}
                        <AnimatePresence mode="wait">
                          {buildOutput && (
                            <TerminalBuildOutput
                              output={buildOutput}
                              isError={buildOutput.includes('error') || buildOutput.includes('Error')}
                            />
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Test Card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors h-full relative overflow-hidden shadow-lg shadow-green-500/10">
                      {/* Status indicator bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                        testing ? 'bg-green-500 animate-pulse' :
                        testOutput && testOutput.includes('Failed: 0') ? 'bg-green-500' :
                        testOutput && testOutput.includes('Failed') ? 'bg-red-500' :
                        'bg-green-500/20'
                      }`} />

                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-green-400 font-mono">
                          <TestTube2 className="w-5 h-5 text-green-500" />
                          Run Tests
                          {testOutput && !testing && (
                            <Badge className={testOutput.includes('Failed: 0') ?
                              'bg-green-500/20 text-green-400 border-green-500/30 font-mono' :
                              'bg-red-500/20 text-red-400 border-red-500/30 font-mono'
                            }>
                              {testOutput.includes('Failed: 0') ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" />Passed</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" />Failed</>
                              )}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={testFilter}
                            onChange={(e) => setTestFilter(e.target.value)}
                            placeholder="Filter tests by name..."
                            disabled={isAnyLoading}
                            className="w-full px-3 py-2 bg-black/50 border border-green-500/30 rounded-lg text-sm text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-mono"
                          />
                        </div>

                        <motion.button
                          onClick={handleTest}
                          disabled={!isValidPath || testing || isAnyLoading}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative group w-full px-4 py-3 bg-green-500/20 border-2 border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium text-sm shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 overflow-hidden font-mono"
                        >
                          <span className="relative flex items-center gap-2">
                            {testing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <TestTube2 className="w-4 h-4" />
                                Run Tests
                              </>
                            )}
                          </span>
                        </motion.button>

                        {/* Loading skeleton */}
                        <AnimatePresence mode="wait">
                          {testing && !testOutput && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                                <span className="text-sm text-green-400 font-mono">Running test suite...</span>
                              </div>
                              <Skeleton className="h-3 w-full bg-green-500/20" />
                              <Skeleton className="h-3 w-3/4 bg-green-500/10" />
                              <Skeleton className="h-3 w-1/2 bg-green-500/5" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Terminal output */}
                        <AnimatePresence mode="wait">
                          {testOutput && (
                            <TerminalTestOutput
                              output={testOutput}
                              passed={testPassed}
                              failed={testFailed}
                            />
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Development Tips */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Alert className="border-green-500/30 bg-green-500/10 backdrop-blur-md">
                    <Lightbulb className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-xs text-green-300/80 font-mono">
                      <strong className="text-green-400">Pro Tip:</strong> Always build before testing. Use the One-Click Workflow for the complete process.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              </TabsContent>

              {/* Deploy Tab */}
              <TabsContent value="deploy" className="space-y-4 mt-4">
                <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors shadow-lg shadow-green-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400 font-mono">
                      <Upload className="w-5 h-5 text-green-500" />
                      Publish Package
                    </CardTitle>
                    <CardDescription className="text-green-500/60 font-mono text-sm">Deploy your Move package to the blockchain</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.button
                      onClick={handlePublish}
                      disabled={!isValidPath || publishing || isAnyLoading}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-4 bg-green-500/20 border-2 border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 font-mono"
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Publishing to Blockchain...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Publish Package
                        </>
                      )}
                    </motion.button>

                    {/* Loading state */}
                    <AnimatePresence mode="wait">
                      {publishing && !publishResult && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-green-400 animate-spin flex-shrink-0" />
                            <span className="text-sm text-green-400 font-mono">Publishing to blockchain...</span>
                          </div>
                          <div className="space-y-2 pl-8">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-xs text-green-300/80 font-mono">Compiling Move code...</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                              <span className="text-xs text-green-400 font-mono">Generating transaction...</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Circle className="w-4 h-4 text-green-500/30" />
                              <span className="text-xs text-green-500/50 font-mono">Waiting for confirmation...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Publish Result */}
                <AnimatePresence mode="wait">
                  {publishResult && (
                    <>
                      {publishResult.success ? (
                        <TerminalSuccessDisplay
                          title="PACKAGE PUBLISHED"
                          command="sui client publish --gas-budget 100000000"
                          rawOutput={(publishResult as any).output}
                          fields={[
                            ...(publishResult.packageId ? [{
                              label: 'PACKAGE_ID',
                              value: publishResult.packageId,
                              copyable: true
                            }] : []),
                            ...(publishResult.digest ? [{
                              label: 'TX_DIGEST',
                              value: publishResult.digest,
                              copyable: true
                            }] : []),
                            ...(publishResult.createdObjects || []).map((obj: any) => ({
                              label: obj.type?.includes('UpgradeCap') ? 'UPGRADE_CAP' :
                                     obj.type?.includes('Package') ? 'PACKAGE_OBJECT' : 'CREATED_OBJECT',
                              value: obj.objectId || 'N/A',
                              copyable: true
                            }))
                          ]}
                        />
                      ) : (
                        <TerminalErrorDisplay
                          title="PUBLISH FAILED"
                          error={publishResult.error || 'Unknown error occurred'}
                          onRetry={handlePublish}
                          suggestions={[
                            'Check your gas budget is sufficient',
                            'Verify wallet has enough SUI balance',
                            'Ensure package builds successfully first',
                            'Check network connection to blockchain'
                          ]}
                        />
                      )}
                    </>
                  )}
                </AnimatePresence>

                {/* Deploy Tips */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Alert className="border-green-500/30 bg-green-500/10 backdrop-blur-md">
                    <AlertCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-xs text-green-300/80 font-mono">
                      <strong className="text-green-400">Before Publishing:</strong> Ensure your package builds and all tests pass. UpgradeCap will be auto-saved if enabled.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              </TabsContent>

              {/* Upgrade Tab */}
              <TabsContent value="upgrade" className="space-y-4 mt-4">
                <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors shadow-lg shadow-green-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400 font-mono">
                      <RefreshCw className="w-5 h-5 text-green-500" />
                      Upgrade Package
                    </CardTitle>
                    <CardDescription className="text-green-500/60 font-mono text-sm">
                      Upgrade an existing on-chain package using UpgradeCap
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="upgrade-cap" className="text-sm font-medium flex items-center gap-2 text-green-400 font-mono">
                        UpgradeCap Object ID <span className="text-red-400">*</span>
                      </Label>
                      <input
                        id="upgrade-cap"
                        type="text"
                        value={upgradeCapId}
                        onChange={(e) => setUpgradeCapId(e.target.value)}
                        placeholder="0x... (auto-filled from recent projects)"
                        disabled={isAnyLoading}
                        className="w-full px-4 py-3 bg-black/50 border border-green-500/30 rounded-lg text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-mono text-sm"
                      />
                      <p className="text-xs text-green-500/50 flex items-center gap-1.5 font-mono">
                        <AlertCircle className="w-3 h-3" />
                        The UpgradeCap object ID from your initial package publish
                      </p>
                    </div>

                    <motion.button
                      onClick={handleUpgrade}
                      disabled={!isValidPath || !upgradeCapId.trim() || upgrading || isAnyLoading}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-4 bg-green-500/20 border-2 border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 font-mono"
                    >
                      {upgrading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Upgrading Package...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          Upgrade Package
                        </>
                      )}
                    </motion.button>

                    {/* Loading state */}
                    <AnimatePresence mode="wait">
                      {upgrading && !publishResult && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-green-400 animate-spin flex-shrink-0" />
                            <span className="text-sm text-green-400 font-mono">Upgrading package...</span>
                          </div>
                          <Skeleton className="h-3 w-full bg-green-500/20" />
                          <Skeleton className="h-3 w-3/4 bg-green-500/10" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Upgrade Tips */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Alert className="border-green-500/30 bg-green-500/10 backdrop-blur-md">
                    <AlertCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-xs text-green-300/80 font-mono">
                      <strong className="text-green-400">Upgrade Requirements:</strong> You must own the UpgradeCap, build your updated package first, and ensure compatibility with existing on-chain state.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              </TabsContent>

              {/* Interact Tab */}
              <TabsContent value="interact" className="space-y-4 mt-4">
                {/* Package Loader */}
                <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors shadow-lg shadow-green-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400 font-mono">
                      <Package className="w-5 h-5 text-green-500" />
                      Load Package
                    </CardTitle>
                    <CardDescription className="text-green-500/60 font-mono text-sm">
                      Enter a deployed package ID to inspect and call its functions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={targetPackageId}
                        onChange={(e) => setTargetPackageId(e.target.value)}
                        placeholder="0x... (auto-filled from publish or last used)"
                        className="flex-1 px-4 py-3 bg-black/50 border border-green-500/30 rounded-lg text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-mono text-sm"
                        disabled={loadingFunctions}
                      />
                      <motion.button
                        onClick={handleLoadPackage}
                        disabled={!targetPackageId.trim() || loadingFunctions}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-3 bg-green-500/20 border-2 border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium text-sm whitespace-nowrap shadow-lg shadow-green-500/20 font-mono"
                      >
                        {loadingFunctions ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4" />
                            Load Package
                          </>
                        )}
                      </motion.button>
                    </div>

                    <AnimatePresence mode="wait">
                      {loadingFunctions && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-2"
                        >
                          <Skeleton className="h-4 w-full bg-green-500/20" />
                          <Skeleton className="h-4 w-3/4 bg-green-500/10" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {packageModules.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Alert className="border-green-500/30 bg-green-500/10 backdrop-blur-md">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <AlertDescription className="text-xs text-green-300/80 font-mono">
                            <strong className="text-green-400">Package loaded!</strong> Found {packageModules.length} module(s). Select a function below to call it.
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* Function List */}
                {packageModules.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-black/40 backdrop-blur-md border-green-500/30 hover:border-green-500/50 transition-colors shadow-lg shadow-green-500/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-400 font-mono">
                          <FileCode className="w-5 h-5 text-green-500" />
                          Available Functions
                        </CardTitle>
                        <CardDescription className="text-green-500/60 font-mono text-sm">
                          Click a function to select it and fill in parameters
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                        {packageModules.map((module) => (
                          <div key={module.name} className="border border-green-500/30 rounded-lg overflow-hidden">
                            {/* Module Header */}
                            <motion.button
                              onClick={() => toggleModule(module.name)}
                              whileHover={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                              className="w-full px-4 py-3 bg-black/30 hover:bg-green-500/10 transition-colors flex items-center justify-between text-sm font-medium"
                            >
                              <span className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-mono">{module.name}</span>
                                <Badge className="bg-green-500/20 text-green-400 text-xs border-green-500/30 font-mono">
                                  {module.functions.length}
                                </Badge>
                              </span>
                              <motion.div
                                animate={{ rotate: expandedModules.has(module.name) ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-4 h-4 text-green-400" />
                              </motion.div>
                            </motion.button>

                            {/* Functions */}
                            <AnimatePresence>
                              {expandedModules.has(module.name) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="divide-y divide-green-500/20 overflow-hidden"
                                >
                                  {module.functions.map((func) => {
                                    const isEntry = func.visibility === 'public' || func.visibility === 'entry';
                                    const isSelected =
                                      selectedFunction?.name === func.name &&
                                      selectedModuleName === module.name;

                                    return (
                                      <motion.button
                                        key={func.name}
                                        onClick={() => handleSelectFunction(func, module.name)}
                                        whileHover={{ x: 4 }}
                                        className={`w-full px-4 py-3 text-left hover:bg-green-500/10 transition-all ${
                                          isSelected ? 'bg-green-500/10 border-l-2 border-green-500' : ''
                                        }`}
                                      >
                                        <div className="flex items-start gap-2">
                                          <Zap
                                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                              isEntry ? 'text-green-400' : 'text-green-500/50'
                                            }`}
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-medium text-sm text-green-400 font-mono">{func.name}</span>
                                              <Badge
                                                className={`text-xs font-mono ${
                                                  isEntry
                                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                    : 'bg-green-500/10 text-green-500/60 border-green-500/20'
                                                }`}
                                              >
                                                {func.visibility}
                                              </Badge>
                                            </div>
                                            <code className="text-xs text-green-500/70 break-all font-mono">
                                              {func.signature}
                                            </code>
                                          </div>
                                        </div>
                                      </motion.button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Function Call Form */}
                {selectedFunction && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                  >
                    <Card className="bg-black/40 backdrop-blur-md border-green-500/50 shadow-lg shadow-green-500/20 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-green-500/50" />

                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-400 font-mono">
                          <PlayCircle className="w-5 h-5 text-green-500" />
                          Call Function: {selectedFunction.name}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs text-green-500/60">
                          {selectedModuleName}::{selectedFunction.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Type Arguments */}
                        {selectedFunction.typeParameters.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-green-400 font-mono">
                              Type Arguments ({selectedFunction.typeParameters.length})
                            </Label>
                            <div className="space-y-2">
                              {selectedFunction.typeParameters.map((typeParam, idx) => (
                                <input
                                  key={idx}
                                  type="text"
                                  value={functionTypeArgs[idx] || ''}
                                  onChange={(e) => {
                                    const newTypeArgs = [...functionTypeArgs];
                                    newTypeArgs[idx] = e.target.value;
                                    setFunctionTypeArgs(newTypeArgs);
                                  }}
                                  placeholder={`Type for ${typeParam} (e.g., 0x2::sui::SUI)`}
                                  className="w-full px-4 py-3 bg-black/50 border border-green-500/30 rounded-lg text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-mono text-sm"
                                />
                              ))}
                            </div>
                            <p className="text-xs text-green-500/50 font-mono">
                              Provide full type paths for generic parameters
                            </p>
                          </div>
                        )}

                        {/* Function Parameters - Enhanced with ParameterInputField */}
                        {selectedFunction.parameters.filter((p) => p.name !== 'ctx' && p.name !== '_ctx')
                          .length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium text-green-400 font-mono">Parameters</Label>
                              {analyzingParams && (
                                <span className="flex items-center gap-1.5 text-xs text-green-500/60">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Analyzing...
                                </span>
                              )}
                            </div>
                            <div className="space-y-4">
                              {selectedFunction.parameters
                                .filter((p) => p.name !== 'ctx' && p.name !== '_ctx')
                                .map((param, idx) => {
                                  // Check if we have analyzed data for this parameter
                                  const analyzedParam = analyzedParams[idx];

                                  if (analyzedParam) {
                                    // Use enhanced ParameterInputField
                                    return (
                                      <div key={idx} className="p-3 bg-black/30 border border-green-500/20 rounded-lg">
                                        <ParameterInputField
                                          parameter={analyzedParam}
                                          value={functionArgs[idx] || ''}
                                          onChange={(value) => {
                                            const newArgs = [...functionArgs];
                                            newArgs[idx] = value;
                                            setFunctionArgs(newArgs);
                                          }}
                                          onRefreshSuggestions={handleRefreshSuggestions}
                                          isLoading={analyzingParams}
                                          disabled={calling}
                                        />
                                      </div>
                                    );
                                  }

                                  // Fallback to simple input if no analysis available
                                  return (
                                    <div key={idx} className="space-y-1">
                                      <Label className="text-xs text-green-500/70 font-mono">
                                        {param.name}: {param.type}
                                      </Label>
                                      <input
                                        type="text"
                                        value={functionArgs[idx] || ''}
                                        onChange={(e) => {
                                          const newArgs = [...functionArgs];
                                          newArgs[idx] = e.target.value;
                                          setFunctionArgs(newArgs);
                                        }}
                                        placeholder={`Enter ${param.type} value`}
                                        disabled={calling}
                                        className="w-full px-4 py-3 bg-black/50 border border-green-500/30 rounded-lg text-green-400 placeholder:text-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all text-sm font-mono disabled:opacity-50"
                                      />
                                    </div>
                                  );
                                })}
                            </div>
                            {!activeAddress && (
                              <p className="text-xs text-yellow-500/70 font-mono">
                                Connect wallet to get parameter suggestions
                              </p>
                            )}
                          </div>
                        )}

                        {/* Call Button */}
                        <motion.button
                          onClick={handleCallFunction}
                          disabled={calling}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative group w-full px-6 py-4 bg-green-500/20 border-2 border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 overflow-hidden font-mono"
                        >
                          <span className="relative flex items-center gap-2">
                            {calling ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Calling Function...
                              </>
                            ) : (
                              <>
                                <Zap className="w-5 h-5" />
                                Call Function
                              </>
                            )}
                          </span>
                        </motion.button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Transaction Result */}
                <AnimatePresence mode="wait">
                  {callResult && (
                    <>
                      {callResult.error ? (
                        <TerminalErrorDisplay
                          title="FUNCTION CALL FAILED"
                          error={callResult.error}
                          onRetry={handleCallFunction}
                          suggestions={[
                            'Check function parameters are correct',
                            'Verify type arguments match the function signature',
                            'Ensure you have sufficient gas',
                            'Confirm the function is callable (entry/public)'
                          ]}
                        />
                      ) : (
                        <TerminalSuccessDisplay
                          title="FUNCTION EXECUTED"
                          command={`sui client call --package ${targetPackageId} --module ${selectedModuleName} --function ${selectedFunction?.name}`}
                          fields={[
                            ...(callResult.digest ? [{
                              label: 'TX_DIGEST',
                              value: callResult.digest,
                              copyable: true
                            }] : []),
                            ...(callResult.gasUsed ? [{
                              label: 'GAS_USED',
                              value: `${callResult.gasUsed} MIST`,
                              copyable: false
                            }] : [])
                          ]}
                          message="Function executed successfully"
                        />
                      )}
                    </>
                  )}
                </AnimatePresence>

                {/* Interaction Tips */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Alert className="border-green-500/30 bg-green-500/10 backdrop-blur-md">
                    <Lightbulb className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-xs text-green-300/80 font-mono">
                      <strong className="text-green-400">Tips:</strong> Package ID is auto-filled from your publish results. Only entry/public functions can be called directly. Type arguments use full paths like <code className="bg-black/50 px-1 py-0.5 rounded text-green-400">0x2::sui::SUI</code>.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
        </div>
      </div>

      {/* File Browser Modal */}
      <AnimatePresence>
        {showBrowser && (
          <FileBrowser
            onSelect={(path) => {
              setPackagePath(path);
              toast.success(`Selected: ${path.split('/').pop()}`);
            }}
            onClose={() => setShowBrowser(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
