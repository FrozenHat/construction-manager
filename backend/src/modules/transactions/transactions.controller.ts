import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('projects/:projectId/transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @RequirePermission('finance.create')
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: User,
  ) {
    return this.txService.create(projectId, dto, user);
  }

  @RequirePermission('finance.view')
  @Get('balance')
  getBalance(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.txService.getProjectBalance(projectId, user);
  }

  @RequirePermission('finance.approve')
  @Patch(':id/approve')
  approve(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.txService.approve(id, user);
  }
}