import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      usage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
      };
    };
    uptime: number;
  };
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now();
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      database: {
        status: 'down',
      },
      memory: {
        status: 'ok',
        usage: {
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          rss: 0,
        },
      },
      uptime: process.uptime(),
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    healthStatus.checks.database = {
      status: 'up',
      latency: dbLatency,
    };
  } catch (error) {
    healthStatus.status = 'unhealthy';
    healthStatus.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  healthStatus.checks.memory = {
    status: heapUsedPercent > 90 ? 'critical' : heapUsedPercent > 75 ? 'warning' : 'ok',
    usage: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
    },
  };

  if (healthStatus.checks.memory.status === 'critical') {
    healthStatus.status = 'degraded';
  }

  // Set overall status
  const responseStatus = healthStatus.status === 'healthy' ? 200 :
                         healthStatus.status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthStatus, {
    status: responseStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}
