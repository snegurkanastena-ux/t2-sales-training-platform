export type Id = string;

export type Role = "seller" | "admin";

export interface Salon {
  id: Id;
  name: string;
  city: string;
  address: string;
  /** Денормализованный список id сотрудников; обновляется при CRUD сотрудников. */
  employeesIds: Id[];
}

export interface Employee {
  id: Id;
  fullName: string;
  role: Role;
  /** Основная ТТ для обратной совместимости. */
  salonId: Id;
  /** Все ТТ, где сотрудник работает. */
  salonIds: Id[];
  /** HSL hue [0..360) для аватара. */
  avatarHue: number;
  hiredAt: string; // ISO date
  /** Сотрудник добавлен через ручной ввод на экране входа. */
  isManual: boolean;
}

export type ProductCategory =
  | "sim"
  | "premium-number"
  | "smartphone"
  | "accessory"
  | "camera"
  | "wink"
  | "speaker"
  | "service";

export interface Product {
  id: Id;
  category: ProductCategory;
  name: string;
  audience: string;
  problem: string;
  plainExplanation: string;
  tags: string[];
  /** Готовые аргументы для продажи. */
  sellingArguments?: string[];
  /** Самые частые возражения по этому продукту. */
  commonObjections?: string[];
  /** Готовый ответ продавца на типовое возражение. */
  objectionResponse?: string;
}

export interface ModuleEntry {
  id: Id;
  slug: string;
  title: string;
  description: string;
  goal: string;
  outcomes: string[];
  example: string;
  xp: number;
  order: number;
}

export type AnswerKind = "weak" | "ok" | "best";

export interface ScenarioOption {
  id: Id;
  text: string;
  kind: AnswerKind;
  explanation: string;
}

export interface Scenario {
  id: Id;
  title: string;
  context: string;
  customerLine: string;
  options: ScenarioOption[];
  xpReward: number;
}

export interface Combo {
  id: Id;
  title: string;
  items: string[];
  audience: string;
  customerBenefit: string;
  sellerNote: string;
}

export interface TrainerAttempt {
  id: Id;
  employeeId: Id;
  scenarioId: Id;
  optionId: Id;
  kind: AnswerKind;
  xpEarned: number;
  attemptedAt: string;
}

export type ModuleStatus = "not_started" | "in_progress" | "completed";

export interface ModuleProgress {
  id: Id;
  employeeId: Id;
  moduleId: Id;
  status: ModuleStatus;
  updatedAt: string;
}

export interface Promotion {
  id: Id;
  title: string;
  description: string;
  /** ISO date */
  validFrom: string;
  /** ISO date */
  validTo: string;
  /** Какие продукты затрагивает. */
  productIds: Id[];
  /** Как правильно предложить акцию клиенту. */
  pitch: string;
  /** Готовые фразы продавца. */
  phrases: string[];
}

export interface SalesScript {
  id: Id;
  /** Ситуация клиента. */
  situation: string;
  /** Цель продавца в этой ситуации. */
  goal: string;
  /** Правильная фраза. */
  goodLine: string;
  /** Слабая фраза. */
  weakLine: string;
  /** Объяснение, почему правильная фраза лучше. */
  explanation: string;
}

export interface Objection {
  id: Id;
  customerObjection: string;
  badResponse: string;
  goodResponse: string;
  bestResponse: string;
  explanation: string;
}

export type LearningMaterialType = "article" | "checklist" | "tip" | "video" | "guide";

export interface LearningMaterial {
  id: Id;
  title: string;
  type: LearningMaterialType;
  description: string;
  body: string;
  productId?: Id | null;
  promotionId?: Id | null;
}

export type MissionTaskKind =
  | "sim"
  | "premium-number"
  | "installment"
  | "wearable"
  | "accessory"
  | "other";

export interface MissionTask {
  id: Id;
  kind: MissionTaskKind;
  title: string;
  target: number;
  xpReward: number;
}

export interface DailyMission {
  id: Id;
  title: string;
  description: string;
  date: string; // ISO date
  salonIds: Id[];
  tasks: MissionTask[];
  bonusXp: number;
}

export type SaleProofStatus = "pending" | "approved" | "rejected";

export interface SaleProof {
  id: Id;
  employeeId: Id;
  salonId: Id;
  missionId: Id;
  taskId: Id;
  kind: MissionTaskKind;
  quantity: number;
  amount: number;
  receiptLabel: string;
  receiptUrl?: string;
  comment: string;
  status: SaleProofStatus;
  xpEarned: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewerComment?: string;
}

export type RewardEventKind = "mission_task" | "mission_bonus";

export interface RewardEvent {
  id: Id;
  employeeId: Id;
  sourceId: Id;
  kind: RewardEventKind;
  xp: number;
  title: string;
  createdAt: string;
}

export interface DBShape {
  schemaVersion: number;
  salons: Salon[];
  employees: Employee[];
  products: Product[];
  modules: ModuleEntry[];
  scenarios: Scenario[];
  combos: Combo[];
  attempts: TrainerAttempt[];
  progress: ModuleProgress[];
  promotions: Promotion[];
  salesScripts: SalesScript[];
  objections: Objection[];
  learningMaterials: LearningMaterial[];
  dailyMissions: DailyMission[];
  saleProofs: SaleProof[];
  rewardEvents: RewardEvent[];
}
