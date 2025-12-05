import { FastifyInstance } from 'fastify';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { ApiResponse } from '@sui-cli-web/shared';
import { handleRouteError } from '../utils/errorHandler';

interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isPackage?: boolean;
}

interface BrowseResponse {
  currentPath: string;
  parentPath: string | null;
  entries: DirectoryEntry[];
}

export async function filesystemRoutes(fastify: FastifyInstance) {
  // Browse directory
  fastify.get<{
    Querystring: { path?: string };
    Reply: ApiResponse<BrowseResponse>;
  }>('/filesystem/browse', async (request, reply) => {
    try {
      const { path: requestedPath } = request.query;

      // Default to home directory if no path provided
      let targetPath = requestedPath?.trim() || os.homedir();

      // Resolve to absolute path
      targetPath = path.resolve(targetPath);

      // Security: Prevent browsing outside reasonable directories
      const homeDir = os.homedir();
      const isInHome = targetPath.startsWith(homeDir);
      const isInTmp = targetPath.startsWith('/tmp');
      const isInOpt = targetPath.startsWith('/opt');
      const isInMnt = targetPath.startsWith('/mnt');

      if (!isInHome && !isInTmp && !isInOpt && !isInMnt) {
        // On Windows, allow browsing C:\Users or D:\, etc.
        const isWindowsDrive = /^[A-Za-z]:[/\\]/.test(targetPath);
        if (!isWindowsDrive) {
          reply.status(403);
          return {
            success: false,
            error: 'Access denied to this directory',
          };
        }
      }

      // Check if directory exists and is readable
      try {
        const stats = await fs.stat(targetPath);
        if (!stats.isDirectory()) {
          reply.status(400);
          return {
            success: false,
            error: 'Path is not a directory',
          };
        }
      } catch (error) {
        reply.status(404);
        return {
          success: false,
          error: 'Directory not found or not accessible',
        };
      }

      // Read directory contents
      const files = await fs.readdir(targetPath, { withFileTypes: true });

      // Filter and map entries
      const entries: DirectoryEntry[] = [];

      for (const file of files) {
        // Skip hidden files (starting with .)
        if (file.name.startsWith('.')) continue;

        const fullPath = path.join(targetPath, file.name);

        const entry: DirectoryEntry = {
          name: file.name,
          path: fullPath,
          isDirectory: file.isDirectory(),
        };

        // Check if directory is a Move package (contains Move.toml)
        if (file.isDirectory()) {
          try {
            const moveTomlPath = path.join(fullPath, 'Move.toml');
            await fs.access(moveTomlPath);
            entry.isPackage = true;
          } catch {
            entry.isPackage = false;
          }
        }

        entries.push(entry);
      }

      // Sort: directories first, then files, alphabetically
      entries.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      // Get parent directory
      const parentPath = path.dirname(targetPath);
      const isRoot = targetPath === parentPath;

      return {
        success: true,
        data: {
          currentPath: targetPath,
          parentPath: isRoot ? null : parentPath,
          entries,
        },
      };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Get suggested starting directories
  fastify.get<{
    Reply: ApiResponse<{ directories: Array<{ name: string; path: string }> }>;
  }>('/filesystem/suggested', async (request, reply) => {
    try {
      const suggestions: Array<{ name: string; path: string }> = [
        { name: 'Home', path: os.homedir() },
      ];

      // Add common directories if they exist
      const commonDirs = [
        { name: 'Documents', path: path.join(os.homedir(), 'Documents') },
        { name: 'Desktop', path: path.join(os.homedir(), 'Desktop') },
        { name: 'Projects', path: path.join(os.homedir(), 'Projects') },
        { name: 'Development', path: path.join(os.homedir(), 'Development') },
        { name: 'Code', path: path.join(os.homedir(), 'Code') },
      ];

      for (const dir of commonDirs) {
        try {
          await fs.access(dir.path);
          suggestions.push(dir);
        } catch {
          // Directory doesn't exist, skip
        }
      }

      return {
        success: true,
        data: { directories: suggestions },
      };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
