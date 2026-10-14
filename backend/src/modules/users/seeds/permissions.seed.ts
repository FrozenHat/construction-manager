export interface PermissionSeed {
  code: string;
  description: string;
}

export const PERMISSIONS_SEED: PermissionSeed[] = [
  // --- Пользователи ---
  { code: 'user.view', description: 'Просмотр пользователей' },
  { code: 'user.create', description: 'Создание пользователей' },
  { code: 'user.update', description: 'Редактирование пользователей' },
  { code: 'user.delete', description: 'Удаление пользователей' },
  { code: 'user.assign_role', description: 'Назначение ролей' },

  // --- Проект ---
  { code: 'project.view', description: 'Просмотр проекта' },
  { code: 'project.create', description: 'Создание проекта' },
  { code: 'project.update', description: 'Редактирование проекта' },
  { code: 'project.delete', description: 'Удаление проекта' },

  // --- Этапы ---
  { code: 'stage.view', description: 'Просмотр этапов' },
  { code: 'stage.create', description: 'Создание этапов' },
  { code: 'stage.update', description: 'Редактирование этапов' },
  { code: 'stage.approve', description: 'Утверждение этапов' },
  { code: 'stage.delete', description: 'Удаление этапов' },

  // --- Задачи ---
  { code: 'task.view', description: 'Просмотр задач' },
  { code: 'task.create', description: 'Создание задач' },
  { code: 'task.update', description: 'Редактирование задач' },
  { code: 'task.approve', description: 'Утверждение задач' },
  { code: 'task.assign', description: 'Назначение исполнителей' },
  { code: 'task.review', description: 'Приёмка задач (Технадзор)' },
  { code: 'task.cancel', description: 'Отмена задач' },
  { code: 'task.delete', description: 'Удаление задач' },

  // --- Материалы ---
  { code: 'material.request', description: 'Заявка на закупку' },
  { code: 'material.purchase', description: 'Закупка материалов' },
  { code: 'material.view', description: 'Просмотр заявок' },

  // --- Финансы ---
  { code: 'finance.view', description: 'Просмотр баланса и транзакций' },
  { code: 'finance.create', description: 'Создание транзакций' },
  { code: 'finance.approve', description: 'Утверждение транзакций' },
  { code: 'finance.delete', description: 'Удаление транзакций' },

  // --- Документы ---
  { code: 'document.view', description: 'Просмотр документов' },
  { code: 'document.upload', description: 'Загрузка документов' },
  { code: 'document.delete', description: 'Удаление документов' },

  // --- Уведомления ---
  { code: 'notification.manage', description: 'Управление правилами уведомлений' },

  // --- Аудит ---
  { code: 'audit.view', description: 'Просмотр журнала аудита' },
];