import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * Safely parses JSON with error handling
 * Returns null if parsing fails instead of throwing
 */
function safeJsonParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    console.error('Failed to parse JSON:', json.substring(0, 100));
    return null;
  }
}

// GET /api/analytics/dashboard - Get dashboard metrics
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.tenantId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch current period data
    const [
      activeListings,
      totalLeads,
      newLeadsThisMonth,
      newLeadsLastMonth,
      totalShowings,
      showingsThisMonth,
      closedDeals,
      pipelineLeads,
    ] = await Promise.all([
      // Active listings count
      prisma.property.count({
        where: {
          tenantId,
          status: 'FOR_SALE',
        },
      }),

      // Total leads
      prisma.lead.count({
        where: { tenantId },
      }),

      // New leads this month
      prisma.lead.count({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // New leads last month (for comparison)
      prisma.lead.count({
        where: {
          tenantId,
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),

      // Total showings this month
      prisma.showing.count({
        where: {
          tenantId,
          scheduledAt: { gte: thirtyDaysAgo },
        },
      }),

      // Showings this month
      prisma.showing.count({
        where: {
          tenantId,
          scheduledAt: { gte: thirtyDaysAgo },
          status: { in: ['COMPLETED', 'CONFIRMED', 'SCHEDULED'] },
        },
      }),

      // Closed deals
      prisma.lead.count({
        where: {
          tenantId,
          status: 'CLOSED',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Pipeline value (leads with offer_received status)
      prisma.lead.findMany({
        where: {
          tenantId,
          status: { in: ['SHOWING_SCHEDULED', 'OFFER_RECEIVED'] },
        },
        include: {
          property: {
            select: { price: true },
          },
        },
      }),
    ]);

    // Calculate pipeline value
    const pipelineValue = pipelineLeads.reduce((sum: number, lead: { property?: { price: number | null } | null }) => {
      return sum + (lead.property?.price ? Number(lead.property.price) : 0);
    }, 0);

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0;

    // Calculate lead change percentage
    const leadChange = newLeadsLastMonth > 0
      ? ((newLeadsThisMonth - newLeadsLastMonth) / newLeadsLastMonth) * 100
      : newLeadsThisMonth > 0 ? 100 : 0;

    // Get leads by source
    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    // Get pipeline breakdown
    const pipelineBreakdown = await prisma.lead.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    });

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get top leads by score
    const topLeads = await prisma.lead.findMany({
      where: {
        tenantId,
        status: { not: 'CLOSED' },
      },
      orderBy: { aiScore: 'desc' },
      take: 5,
      include: {
        property: {
          select: {
            address: true,
          },
        },
      },
    });

    // Get today's schedule
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysShowings = await prisma.showing.findMany({
      where: {
        tenantId,
        scheduledAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        property: {
          select: {
            address: true,
          },
        },
        lead: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({
      stats: {
        activeListings,
        totalLeads,
        newLeadsThisMonth,
        leadChange: leadChange.toFixed(1),
        showingsThisMonth,
        closedDeals,
        pipelineValue,
        conversionRate: conversionRate.toFixed(1),
      },
      leadsBySource: leadsBySource.map((item: { source: string; _count: number }) => ({
        source: item.source,
        count: item._count,
      })),
      pipelineBreakdown: pipelineBreakdown.map((item: { status: string; _count: number }) => ({
        status: item.status,
        count: item._count,
      })),
      recentActivity: recentActivity.map((activity: { id: string; action: string; entityType: string; entityId: string | null; user: { firstName: string; lastName: string }; createdAt: Date; details: string | null }) => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        user: `${activity.user.firstName} ${activity.user.lastName}`,
        createdAt: activity.createdAt,
        details: safeJsonParse(activity.details),
      })),
      topLeads: topLeads.map((lead: { id: string; firstName: string; lastName: string; email: string; phone: string | null; status: string; aiScore: number | null; property?: { address: string } | null }) => ({
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        score: lead.aiScore,
        property: lead.property?.address,
        status: lead.status,
      })),
      todaysShowings: todaysShowings.map((showing: { id: string; scheduledAt: Date; property: { address: string }; lead: { firstName: string; lastName: string }; status: string }) => ({
        id: showing.id,
        time: showing.scheduledAt,
        property: showing.property.address,
        lead: `${showing.lead.firstName} ${showing.lead.lastName}`,
        status: showing.status,
      })),
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
