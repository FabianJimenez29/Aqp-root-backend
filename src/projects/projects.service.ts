import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new project. Only accessible by ADMIN.
   */
  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({ data: dto });
  }

  /**
   * Returns all projects ordered by creation date.
   */
  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Returns a single project by ID, including order count.
   */
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    return project;
  }

  /**
   * Updates a project.
   */
  async update(id: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deletes a project.
   */
  async delete(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    await this.prisma.project.delete({ where: { id } });
    return { message: 'Project deleted successfully' };
  }
}
