import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Get all available permissions in the system
   */
  async findAll() {
    return await this.prisma.permission.findMany({
      orderBy: [{ Subject: 'asc' }, { Action: 'asc' }],
    });
  }

  /**
   * Get grouped permissions (by Subject)
   */
  async findGrouped() {
    const permissions = await this.findAll();

    // Group by Subject
    const grouped = permissions.reduce(
      (acc, permission) => {
        const subject = permission.Subject;
        if (!acc[subject]) {
          acc[subject] = [];
        }
        acc[subject].push({
          PermissionID: permission.PermissionID,
          Action: permission.Action,
          Subject: permission.Subject,
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return grouped;
  }

  /**
   * Get a specific permission by ID
   */
  async findOne(id: number) {
    return await this.prisma.permission.findUnique({
      where: { PermissionID: id },
    });
  }
}
