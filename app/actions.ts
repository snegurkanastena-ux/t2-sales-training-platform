"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";
import { genId, mutate, resetDB, readDB } from "@/lib/db";
import {
  clearAdminAuthenticated,
  clearCurrentEmployee,
  setAdminAuthenticated,
  setCurrentEmployee,
} from "@/lib/session";
import type {
  AnswerKind,
  Combo,
  Employee,
  LearningMaterial,
  LearningMaterialType,
  MissionTaskKind,
  ModuleEntry,
  ModuleStatus,
  Objection,
  Product,
  ProductCategory,
  Promotion,
  Role,
  SaleProof,
  SalesScript,
  Scenario,
  ScenarioOption,
} from "@/lib/types";

function asString(value: FormDataEntryValue | null, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  return fallback;
}

function asNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(asString(value));
  return Number.isFinite(n) ? n : fallback;
}

function asLines(value: FormDataEntryValue | null): string[] {
  return asString(value)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function asCsv(value: FormDataEntryValue | null): string[] {
  return asString(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function xpForKind(kind: AnswerKind, scenarioReward: number): number {
  if (kind === "best") return scenarioReward;
  if (kind === "ok") return Math.round(scenarioReward * 0.4);
  return 0;
}

const TASK_KIND_LABEL: Record<MissionTaskKind, string> = {
  sim: "SIM",
  "premium-number": "Золотой номер",
  installment: "Рассрочка",
  wearable: "Носимая электроника",
  accessory: "Аксессуар",
  other: "Другая продажа",
};

async function saveReceiptFile(file: FormDataEntryValue | null, proofId: string): Promise<{ label: string; url?: string }> {
  if (!(file instanceof File) || file.size === 0) return { label: "Чек не прикреплен" };
  const ext = path.extname(file.name).replace(/[^a-z0-9.]/gi, "").slice(0, 10) || ".jpg";
  const safeName = `${proofId}${ext}`;
  const dir = path.join(process.cwd(), "public", "receipts");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));
  return { label: file.name, url: `/receipts/${safeName}` };
}

function approvedQuantityForTask(proofs: SaleProof[], employeeId: string, missionId: string, taskId: string): number {
  return proofs
    .filter((p) => p.employeeId === employeeId && p.missionId === missionId && p.taskId === taskId && p.status === "approved")
    .reduce((sum, p) => sum + p.quantity, 0);
}

const ADMIN_FULL_NAME = "Анастасия Мельникова";

// ============================================================
// Аутентификация (выбор сотрудника)
// ============================================================

export async function loginEmployeeAction(input: { employeeId: string }): Promise<void> {
  const db = await readDB();
  const exists = db.employees.find((e) => e.id === input.employeeId);
  if (!exists) return;
  await setCurrentEmployee(exists.id, exists.salonIds[0] ?? exists.salonId);
  revalidatePath("/", "layout");
  redirect("/learn");
}

export async function loginEmployeeWithSalonAction(input: {
  employeeId: string;
  salonId: string;
}): Promise<void> {
  const db = await readDB();
  const exists = db.employees.find((e) => e.id === input.employeeId);
  if (!exists) return;
  if (!exists.salonIds.includes(input.salonId)) return;
  await setCurrentEmployee(exists.id, input.salonId);
  revalidatePath("/", "layout");
  redirect("/learn");
}

export async function loginEmployeeManualAction(input: {
  salonId: string;
  fullName: string;
}): Promise<void> {
  const fullName = input.fullName.trim();
  if (!fullName) return;
  const newId = genId("emp-manual");
  await mutate((db) => {
    const salon = db.salons.find((s) => s.id === input.salonId);
    if (!salon) return db;
    const employee: Employee = {
      id: newId,
      fullName,
      role: "seller",
      salonId: salon.id,
      salonIds: [salon.id],
      avatarHue: hashHue(fullName),
      hiredAt: new Date().toISOString().slice(0, 10),
      isManual: true,
    };
    db.employees.push(employee);
    salon.employeesIds = [...salon.employeesIds, employee.id];
    return db;
  });
  await setCurrentEmployee(newId, input.salonId);
  revalidatePath("/", "layout");
  redirect("/learn");
}

export async function logoutEmployeeAction(): Promise<void> {
  await clearCurrentEmployee();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function loginAdminAction(input: {
  fullName: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const fullName = input.fullName.trim();
  const password = input.password.trim();
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!expectedPassword) {
    return { ok: false, error: "Пароль администратора не настроен" };
  }
  if (fullName !== ADMIN_FULL_NAME || password !== expectedPassword) {
    return { ok: false, error: "Неверное имя или пароль" };
  }
  await setAdminAuthenticated(true);
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function logoutAdminAction(): Promise<void> {
  await clearAdminAuthenticated();
  revalidatePath("/", "layout");
  redirect("/login");
}

// ============================================================
// Тренажёр и прогресс модулей
// ============================================================

export async function recordTrainerAttempt(input: {
  employeeId: string;
  scenarioId: string;
  optionId: string;
}): Promise<{ ok: true; xpEarned: number; kind: AnswerKind } | { ok: false; error: string }> {
  let result: { ok: true; xpEarned: number; kind: AnswerKind } | { ok: false; error: string } = {
    ok: false,
    error: "Не удалось сохранить попытку",
  };

  await mutate((db) => {
    const scenario = db.scenarios.find((s) => s.id === input.scenarioId);
    const option = scenario?.options.find((o) => o.id === input.optionId);
    const employee = db.employees.find((e) => e.id === input.employeeId);
    if (!scenario || !option || !employee) {
      result = { ok: false, error: "Сценарий или сотрудник не найден" };
      return db;
    }
    const xpEarned = xpForKind(option.kind, scenario.xpReward);
    db.attempts.push({
      id: genId("att"),
      employeeId: employee.id,
      scenarioId: scenario.id,
      optionId: option.id,
      kind: option.kind,
      xpEarned,
      attemptedAt: new Date().toISOString(),
    });
    result = { ok: true, xpEarned, kind: option.kind };
    return db;
  });

  revalidatePath("/learn");
  revalidatePath("/stats", "layout");
  return result;
}

export async function setModuleStatus(input: {
  employeeId: string;
  moduleId: string;
  status: ModuleStatus;
}): Promise<void> {
  await mutate((db) => {
    const idx = db.progress.findIndex(
      (p) => p.employeeId === input.employeeId && p.moduleId === input.moduleId
    );
    if (idx === -1) {
      db.progress.push({
        id: genId("pr"),
        employeeId: input.employeeId,
        moduleId: input.moduleId,
        status: input.status,
        updatedAt: new Date().toISOString(),
      });
    } else {
      db.progress[idx] = {
        ...db.progress[idx],
        status: input.status,
        updatedAt: new Date().toISOString(),
      };
    }
    return db;
  });
  revalidatePath("/learn");
  revalidatePath("/stats", "layout");
}

// ============================================================
// CRUD: Сотрудники
// ============================================================

export async function submitSaleProof(formData: FormData): Promise<void> {
  const employeeId = asString(formData.get("employeeId"));
  const salonId = asString(formData.get("salonId"));
  const missionId = asString(formData.get("missionId"));
  const taskId = asString(formData.get("taskId"));
  const quantity = Math.max(1, asNumber(formData.get("quantity"), 1));
  const amount = Math.max(0, asNumber(formData.get("amount"), 0));
  const comment = asString(formData.get("comment"));
  if (!employeeId || !salonId || !missionId || !taskId) return;

  const proofId = genId("proof");
  const receipt = await saveReceiptFile(formData.get("receipt"), proofId);

  await mutate((db) => {
    const employee = db.employees.find((e) => e.id === employeeId);
    const mission = db.dailyMissions.find((m) => m.id === missionId);
    const task = mission?.tasks.find((t) => t.id === taskId);
    if (!employee || !mission || !task || !employee.salonIds.includes(salonId)) return db;
    db.saleProofs.push({
      id: proofId,
      employeeId,
      salonId,
      missionId,
      taskId,
      kind: task.kind,
      quantity,
      amount,
      receiptLabel: receipt.label,
      receiptUrl: receipt.url,
      comment,
      status: "pending",
      xpEarned: 0,
      submittedAt: new Date().toISOString(),
    });
    return db;
  });

  revalidatePath("/learn");
  revalidatePath("/admin");
  revalidatePath("/stats", "layout");
}

export async function reviewSaleProof(formData: FormData): Promise<void> {
  const proofId = asString(formData.get("proofId"));
  const decision = asString(formData.get("decision"));
  const reviewerComment = asString(formData.get("reviewerComment"));
  if (!proofId || !["approved", "rejected"].includes(decision)) return;

  await mutate((db) => {
    const idx = db.saleProofs.findIndex((p) => p.id === proofId);
    if (idx === -1) return db;
    const proof = db.saleProofs[idx];
    if (proof.status !== "pending") return db;
    const mission = db.dailyMissions.find((m) => m.id === proof.missionId);
    const task = mission?.tasks.find((t) => t.id === proof.taskId);
    if (!mission || !task) return db;

    const approved = decision === "approved";
    const xpEarned = approved ? task.xpReward * proof.quantity : 0;
    db.saleProofs[idx] = {
      ...proof,
      status: approved ? "approved" : "rejected",
      xpEarned,
      reviewedAt: new Date().toISOString(),
      reviewerComment,
    };

    if (approved) {
      db.rewardEvents.push({
        id: genId("reward"),
        employeeId: proof.employeeId,
        sourceId: proof.id,
        kind: "mission_task",
        xp: xpEarned,
        title: `${TASK_KIND_LABEL[task.kind]}: ${task.title}`,
        createdAt: new Date().toISOString(),
      });

      const missionCompleted = mission.tasks.every((item) => {
        const approvedQty = approvedQuantityForTask(db.saleProofs, proof.employeeId, mission.id, item.id);
        return approvedQty >= item.target;
      });
      const bonusAlreadyGiven = db.rewardEvents.some(
        (event) => event.employeeId === proof.employeeId && event.kind === "mission_bonus" && event.sourceId === mission.id
      );
      if (missionCompleted && !bonusAlreadyGiven && mission.bonusXp > 0) {
        db.rewardEvents.push({
          id: genId("reward"),
          employeeId: proof.employeeId,
          sourceId: mission.id,
          kind: "mission_bonus",
          xp: mission.bonusXp,
          title: `Миссия выполнена: ${mission.title}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return db;
  });

  revalidatePath("/learn");
  revalidatePath("/admin");
  revalidatePath("/stats", "layout");
}

export async function createEmployee(formData: FormData): Promise<void> {
  const fullName = asString(formData.get("fullName"));
  const salonIds = formData
    .getAll("salonIds")
    .map((v) => asString(v))
    .filter(Boolean);
  const salonId = salonIds[0] ?? asString(formData.get("salonId"));
  const role = (asString(formData.get("role"), "seller") as Role) || "seller";
  if (!fullName || !salonId) return;
  await mutate((db) => {
    const uniqueSalonIds = Array.from(new Set(salonIds.length > 0 ? salonIds : [salonId]));
    const validSalonIds = uniqueSalonIds.filter((id) => db.salons.some((s) => s.id === id));
    if (validSalonIds.length === 0) return db;
    const employee: Employee = {
      id: genId("emp"),
      fullName,
      salonId: validSalonIds[0],
      salonIds: validSalonIds,
      role,
      avatarHue: hashHue(fullName),
      hiredAt: new Date().toISOString().slice(0, 10),
      isManual: false,
    };
    db.employees.push(employee);
    db.salons = db.salons.map((s) =>
      validSalonIds.includes(s.id) ? { ...s, employeesIds: Array.from(new Set([...s.employeesIds, employee.id])) } : s
    );
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/stats", "layout");
  revalidatePath("/login");
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  await mutate((db) => {
    db.employees = db.employees.filter((e) => e.id !== employeeId);
    db.attempts = db.attempts.filter((a) => a.employeeId !== employeeId);
    db.progress = db.progress.filter((p) => p.employeeId !== employeeId);
    db.salons = db.salons.map((s) => ({
      ...s,
      employeesIds: s.employeesIds.filter((id) => id !== employeeId),
    }));
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/stats", "layout");
  revalidatePath("/login");
}

// ============================================================
// CRUD: Салоны (ТТ)
// ============================================================

export async function createSalon(formData: FormData): Promise<void> {
  const name = asString(formData.get("name"));
  const city = asString(formData.get("city"));
  const address = asString(formData.get("address"));
  if (!name || !city) return;
  await mutate((db) => {
    db.salons.push({ id: genId("salon"), name, city, address, employeesIds: [] });
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/stats", "layout");
  revalidatePath("/login");
}

export async function deleteSalon(salonId: string): Promise<void> {
  await mutate((db) => {
    const fallback = db.salons.find((s) => s.id !== salonId);
    if (!fallback) return db; // нельзя удалить последний
    const movedIds = db.employees
      .filter((e) => e.salonIds.includes(salonId))
      .map((e) => e.id);
    db.employees = db.employees.map((e) => {
      if (!e.salonIds.includes(salonId)) return e;
      const nextSalonIds = e.salonIds.filter((id) => id !== salonId);
      if (nextSalonIds.length === 0) nextSalonIds.push(fallback.id);
      return { ...e, salonIds: nextSalonIds, salonId: nextSalonIds[0] };
    });
    fallback.employeesIds = Array.from(new Set([...fallback.employeesIds, ...movedIds]));
    db.salons = db.salons.filter((s) => s.id !== salonId);
    db.salons = db.salons.map((s) => ({
      ...s,
      employeesIds: s.employeesIds.filter((id) => db.employees.some((e) => e.id === id && e.salonIds.includes(s.id))),
    }));
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/stats", "layout");
  revalidatePath("/login");
}

// ============================================================
// CRUD: Модули
// ============================================================

export async function createModule(formData: FormData): Promise<void> {
  const title = asString(formData.get("title"));
  const description = asString(formData.get("description"));
  const goal = asString(formData.get("goal"));
  const example = asString(formData.get("example"));
  const xp = asNumber(formData.get("xp"), 50);
  const outcomes = asLines(formData.get("outcomes"));
  if (!title) return;
  await mutate((db) => {
    const slugBase =
      title
        .toLowerCase()
        .replace(/[^a-z0-9а-я]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32) || "module";
    const order = (db.modules[db.modules.length - 1]?.order ?? 0) + 1;
    const item: ModuleEntry = {
      id: genId("mod"),
      slug: `${slugBase}-${order}`,
      title,
      description,
      goal,
      example,
      xp,
      outcomes,
      order,
    };
    db.modules.push(item);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

export async function deleteModule(moduleId: string): Promise<void> {
  await mutate((db) => {
    db.modules = db.modules.filter((m) => m.id !== moduleId);
    db.progress = db.progress.filter((p) => p.moduleId !== moduleId);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

// ============================================================
// CRUD: Продукты
// ============================================================

export async function createProduct(formData: FormData): Promise<void> {
  const name = asString(formData.get("name"));
  const category = (asString(formData.get("category"), "service") as ProductCategory) || "service";
  const audience = asString(formData.get("audience"));
  const problem = asString(formData.get("problem"));
  const plainExplanation = asString(formData.get("plainExplanation"));
  const tags = asCsv(formData.get("tags"));
  const sellingArguments = asLines(formData.get("sellingArguments"));
  const commonObjections = asLines(formData.get("commonObjections"));
  const objectionResponse = asString(formData.get("objectionResponse"));
  if (!name) return;
  await mutate((db) => {
    const item: Product = {
      id: genId("prod"),
      category,
      name,
      audience,
      problem,
      plainExplanation,
      tags,
      sellingArguments,
      commonObjections,
      objectionResponse,
    };
    db.products.push(item);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

export async function deleteProduct(productId: string): Promise<void> {
  await mutate((db) => {
    db.products = db.products.filter((p) => p.id !== productId);
    db.promotions = db.promotions.map((pr) => ({
      ...pr,
      productIds: pr.productIds.filter((id) => id !== productId),
    }));
    db.learningMaterials = db.learningMaterials.map((m) =>
      m.productId === productId ? { ...m, productId: null } : m
    );
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

// ============================================================
// CRUD: Сценарии тренажёра
// ============================================================

export async function createScenario(formData: FormData): Promise<void> {
  const title = asString(formData.get("title"));
  const context = asString(formData.get("context"));
  const customerLine = asString(formData.get("customerLine"));
  const xpReward = asNumber(formData.get("xpReward"), 25);
  const weakText = asString(formData.get("weakText"));
  const weakExplanation = asString(formData.get("weakExplanation"));
  const okText = asString(formData.get("okText"));
  const okExplanation = asString(formData.get("okExplanation"));
  const bestText = asString(formData.get("bestText"));
  const bestExplanation = asString(formData.get("bestExplanation"));
  if (!title || !customerLine || !weakText || !okText || !bestText) return;
  await mutate((db) => {
    const id = genId("sc");
    const options: ScenarioOption[] = [
      { id: `${id}-w`, kind: "weak", text: weakText, explanation: weakExplanation },
      { id: `${id}-o`, kind: "ok", text: okText, explanation: okExplanation },
      { id: `${id}-b`, kind: "best", text: bestText, explanation: bestExplanation },
    ];
    const scenario: Scenario = { id, title, context, customerLine, xpReward, options };
    db.scenarios.push(scenario);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

export async function deleteScenario(scenarioId: string): Promise<void> {
  await mutate((db) => {
    db.scenarios = db.scenarios.filter((s) => s.id !== scenarioId);
    db.attempts = db.attempts.filter((a) => a.scenarioId !== scenarioId);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

// ============================================================
// CRUD: Комбо
// ============================================================

export async function createCombo(formData: FormData): Promise<void> {
  const title = asString(formData.get("title"));
  const audience = asString(formData.get("audience"));
  const customerBenefit = asString(formData.get("customerBenefit"));
  const sellerNote = asString(formData.get("sellerNote"));
  const items = asCsv(formData.get("items"));
  if (!title) return;
  await mutate((db) => {
    const item: Combo = {
      id: genId("combo"),
      title,
      audience,
      customerBenefit,
      sellerNote,
      items,
    };
    db.combos.push(item);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

export async function deleteCombo(comboId: string): Promise<void> {
  await mutate((db) => {
    db.combos = db.combos.filter((c) => c.id !== comboId);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

// ============================================================
// CRUD: Акции
// ============================================================

export async function createPromotion(formData: FormData): Promise<void> {
  const title = asString(formData.get("title"));
  const description = asString(formData.get("description"));
  const validFrom = asString(formData.get("validFrom"));
  const validTo = asString(formData.get("validTo"));
  const productIds = formData.getAll("productIds").map((v) => String(v)).filter(Boolean);
  const pitch = asString(formData.get("pitch"));
  const phrases = asLines(formData.get("phrases"));
  if (!title) return;
  await mutate((db) => {
    const item: Promotion = {
      id: genId("promo"),
      title,
      description,
      validFrom,
      validTo,
      productIds,
      pitch,
      phrases,
    };
    db.promotions.push(item);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

export async function deletePromotion(promotionId: string): Promise<void> {
  await mutate((db) => {
    db.promotions = db.promotions.filter((p) => p.id !== promotionId);
    db.learningMaterials = db.learningMaterials.map((m) =>
      m.promotionId === promotionId ? { ...m, promotionId: null } : m
    );
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

// ============================================================
// CRUD: Скрипты продаж
// ============================================================

export async function createSalesScript(formData: FormData): Promise<void> {
  const situation = asString(formData.get("situation"));
  const goal = asString(formData.get("goal"));
  const goodLine = asString(formData.get("goodLine"));
  const weakLine = asString(formData.get("weakLine"));
  const explanation = asString(formData.get("explanation"));
  if (!situation || !goodLine) return;
  await mutate((db) => {
    const item: SalesScript = {
      id: genId("scr"),
      situation,
      goal,
      goodLine,
      weakLine,
      explanation,
    };
    db.salesScripts.push(item);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

export async function deleteSalesScript(id: string): Promise<void> {
  await mutate((db) => {
    db.salesScripts = db.salesScripts.filter((s) => s.id !== id);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

// ============================================================
// CRUD: Возражения
// ============================================================

export async function createObjection(formData: FormData): Promise<void> {
  const customerObjection = asString(formData.get("customerObjection"));
  const badResponse = asString(formData.get("badResponse"));
  const goodResponse = asString(formData.get("goodResponse"));
  const bestResponse = asString(formData.get("bestResponse"));
  const explanation = asString(formData.get("explanation"));
  if (!customerObjection || !bestResponse) return;
  await mutate((db) => {
    const item: Objection = {
      id: genId("obj"),
      customerObjection,
      badResponse,
      goodResponse,
      bestResponse,
      explanation,
    };
    db.objections.push(item);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

export async function deleteObjection(id: string): Promise<void> {
  await mutate((db) => {
    db.objections = db.objections.filter((o) => o.id !== id);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

// ============================================================
// CRUD: Обучающие материалы
// ============================================================

export async function createLearningMaterial(formData: FormData): Promise<void> {
  const title = asString(formData.get("title"));
  const type = (asString(formData.get("type"), "article") as LearningMaterialType) || "article";
  const description = asString(formData.get("description"));
  const body = asString(formData.get("body"));
  const productIdRaw = asString(formData.get("productId"));
  const promotionIdRaw = asString(formData.get("promotionId"));
  if (!title) return;
  await mutate((db) => {
    const item: LearningMaterial = {
      id: genId("mat"),
      title,
      type,
      description,
      body,
      productId: productIdRaw ? productIdRaw : null,
      promotionId: promotionIdRaw ? promotionIdRaw : null,
    };
    db.learningMaterials.push(item);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

export async function deleteLearningMaterial(id: string): Promise<void> {
  await mutate((db) => {
    db.learningMaterials = db.learningMaterials.filter((m) => m.id !== id);
    return db;
  });
  revalidatePath("/admin");
  revalidatePath("/learn");
}

// ============================================================
// Сервис
// ============================================================

export async function resetPlatformAction(): Promise<void> {
  await resetDB();
  await clearCurrentEmployee();
  revalidatePath("/", "layout");
}
