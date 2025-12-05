import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating/updating a template
const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  subject: z.string().max(200).optional(),
  body: z.string().min(1, 'Template body is required').max(2000),
  type: z.enum(['EMAIL', 'SMS', 'CALL']),
  isDefault: z.boolean().optional().default(false),
});

// Validation schema for updating a template
const updateTemplateSchema = templateSchema.partial();

/**
 * GET /api/templates
 * Fetches all message templates for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'EMAIL' | 'SMS' | 'CALL' | null;

    const where: { userId: string; type?: 'EMAIL' | 'SMS' | 'CALL' } = {
      userId: session.userId,
    };

    if (type && ['EMAIL', 'SMS', 'CALL'].includes(type)) {
      where.type = type;
    }

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Creates a new message template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = templateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, subject, body: templateBody, type, isDefault } = validationResult.data;

    // If setting as default, unset other defaults of the same type
    if (isDefault) {
      await prisma.messageTemplate.updateMany({
        where: {
          userId: session.userId,
          type,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.messageTemplate.create({
      data: {
        userId: session.userId,
        name,
        subject,
        body: templateBody,
        type,
        isDefault,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/templates
 * Updates an existing template (requires id in body)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const validationResult = updateTemplateSchema.safeParse(updateData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const data = validationResult.data;

    // If setting as default, unset other defaults of the same type
    if (data.isDefault) {
      const typeToUse = data.type || existingTemplate.type;
      await prisma.messageTemplate.updateMany({
        where: {
          userId: session.userId,
          type: typeToUse,
          isDefault: true,
          NOT: { id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.messageTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates
 * Deletes a template (requires id in query params)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await prisma.messageTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
