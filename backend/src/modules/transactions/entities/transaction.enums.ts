export enum TransactionType {
  INCOME = 'income',   // Пополнение от клиента
  EXPENSE = 'expense', // Списание на материалы/работы
}

export enum TransactionCategory {
  CLIENT_PAYMENT = 'client_payment',
  MATERIAL = 'material',
  TRANSPORT = 'transport',
  WORK = 'work',
  FEE = 'fee', // Гонорары
  OTHER = 'other',
}

export enum TransactionStatus {
  PENDING = 'pending',   // Создана, ждет утверждения бухгалтером/шефом
  APPROVED = 'approved', // Влияет на баланс
  REJECTED = 'rejected',
}