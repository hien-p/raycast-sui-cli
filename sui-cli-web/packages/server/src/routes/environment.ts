import { FastifyInstance } from 'fastify';
import { EnvironmentService } from '../services/EnvironmentService';
import type { ApiResponse, SuiEnvironment } from '@sui-cli-web/shared';

const environmentService = new EnvironmentService();

export async function environmentRoutes(fastify: FastifyInstance) {
  // Get all environments
  fastify.get<{ Reply: ApiResponse<SuiEnvironment[]> }>('/environments', async (request, reply) => {
    try {
      const environments = await environmentService.getEnvironments();
      return { success: true, data: environments };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Get active environment
  fastify.get<{ Reply: ApiResponse<{ alias: string | null }> }>('/environments/active', async (request, reply) => {
    try {
      const alias = await environmentService.getActiveEnvironment();
      return { success: true, data: { alias } };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Switch environment
  fastify.post<{
    Body: { alias: string };
    Reply: ApiResponse<void>;
  }>('/environments/switch', async (request, reply) => {
    try {
      const { alias } = request.body;
      await environmentService.switchEnvironment(alias);
      return { success: true };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Add new environment
  fastify.post<{
    Body: { alias: string; rpc: string; ws?: string };
    Reply: ApiResponse<void>;
  }>('/environments', async (request, reply) => {
    try {
      const { alias, rpc, ws } = request.body;
      await environmentService.addEnvironment(alias, rpc, ws);
      return { success: true };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Remove environment
  fastify.delete<{
    Params: { alias: string };
    Reply: ApiResponse<void>;
  }>('/environments/:alias', async (request, reply) => {
    try {
      const { alias } = request.params;
      await environmentService.removeEnvironment(alias);
      return { success: true };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });
}
