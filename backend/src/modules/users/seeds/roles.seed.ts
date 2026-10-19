export interface RoleSeed {
  code: string;
  name: string;
  description: string;
  permissions: string[];
}

export const ROLES_SEED: RoleSeed[] = [
  {
    code: 'chief',
    name: 'Шеф',
    description: 'Глава компании, полный доступ ко всему',
    permissions: ['*'], // звёздочка = все права
  },
  {
    code: 'admin',
    name: 'Администратор системы',
    description: 'Технический администратор, полный доступ',
    permissions: ['*'],
  },
  {
    code: 'manager',
    name: 'Ответственный менеджер по проекту',
    description: 'Управляет этапами, задачами, документацией',
    permissions: [
      'project.view', 'project.update',
      'stage.view', 'stage.create', 'stage.update',
      'task.view', 'task.create', 'task.update', 'task.assign', 'task.cancel',
      'material.request', 'material.view',
      'finance.view',
      'document.view', 'document.upload',
      'user.view',
    ],
  },
  {
    code: 'buyer',
    name: 'Закупщик',
    description: 'Отвечает за поставки материалов',
    permissions: [
      'project.view',
      'stage.view',
      'task.view',
      'material.view', 'material.purchase',
      'finance.create',
      'document.view', 'document.upload',
    ],
  },
  {
    code: 'accountant',
    name: 'Бухгалтер / Финансист',
    description: 'Управляет финансами и документами по транзакциям',
    permissions: [
      'project.view',
      'stage.view',
      'task.view',
      'finance.view', 'finance.create', 'finance.approve', 'finance.delete',
      'document.view', 'document.upload',
    ],
  },
  {
    code: 'supervisor',
    name: 'Технический надзор',
    description: 'Принимает задачи и этапы, отчитывается перед клиентом',
    permissions: [
      'project.view',
      'stage.view', 'stage.approve',
      'task.view', 'task.review',
      'document.view', 'document.upload',
    ],
  },
  {
    code: 'client',
    name: 'Клиент',
    description: 'Заказчик, утверждает задачи, ограниченный доступ к финансам',
    permissions: [
      'project.view',
      'stage.view',
      'task.view',
      'document.view',
      'finance.view', // ограниченный — реализуем позже на уровне ABAC
    ],
  },
    {
    code: 'contractor',
    name: 'Исполнитель (маляр, плиточник и т.д.)',
    description: 'Выполняет задачи, указывает свою стоимость',
    permissions: [
      'project.view', // <-- ДОБАВИТЬ
      'stage.view',   // <-- ДОБАВИТЬ (нужно для загрузки этапов)
      'task.view', 
      'task.update',
    ],
  },
];