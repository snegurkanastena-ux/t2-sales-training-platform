import { readDB } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  createCombo,
  createEmployee,
  createLearningMaterial,
  createModule,
  createObjection,
  createProduct,
  createPromotion,
  createSalesScript,
  createSalon,
  createScenario,
  deleteCombo,
  deleteEmployee,
  deleteLearningMaterial,
  deleteModule,
  deleteObjection,
  deleteProduct,
  deletePromotion,
  deleteSalesScript,
  deleteSalon,
  deleteScenario,
  resetPlatformAction,
  logoutAdminAction,
  reviewSaleProof,
} from "@/app/actions";
import { AdminTabs } from "@/app/_components/AdminTabs";
import { DeleteButton } from "@/app/_components/DeleteButton";
import { isAdminAuthenticated } from "@/lib/session";
import type { LearningMaterialType, ProductCategory } from "@/lib/types";

const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "sim", label: "SIM-карты и тарифы" },
  { value: "premium-number", label: "Золотые номера" },
  { value: "smartphone", label: "Смартфоны" },
  { value: "accessory", label: "Аксессуары" },
  { value: "camera", label: "Камеры" },
  { value: "wink", label: "Wink-приставки" },
  { value: "speaker", label: "Колонки SberBoom" },
  { value: "service", label: "Услуги и подписки" },
];

const MATERIAL_TYPES: { value: LearningMaterialType; label: string }[] = [
  { value: "article", label: "Статья" },
  { value: "checklist", label: "Чек-лист" },
  { value: "tip", label: "Совет" },
  { value: "video", label: "Видео" },
  { value: "guide", label: "Гайд" },
];

export default async function AdminPage() {
  const adminAuth = await isAdminAuthenticated();
  if (!adminAuth) {
    redirect("/login");
  }

  const db = await readDB();

  // ---------- Salons (ТТ) ----------
  const salonsTab = (
    <>
      <div className="admin-section">
        <h3>Добавить торговую точку</h3>
        <form action={createSalon} className="stack">
          <div className="form-row">
            <div className="field">
              <label htmlFor="salon-name">Название ТТ</label>
              <input id="salon-name" name="name" required placeholder="T2 ТЦ Парк Хаус" />
            </div>
            <div className="field">
              <label htmlFor="salon-city">Город</label>
              <input id="salon-city" name="city" required placeholder="Соликамск" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="salon-address">Адрес</label>
            <input id="salon-address" name="address" placeholder="ул. Северная, 55 (ТЦ Европа)" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h3>
          Торговые точки <span className="count">{db.salons.length}</span>
        </h3>
        <div className="stack">
          {db.salons.map((s) => {
            const employees = db.employees.filter((e) => e.salonIds.includes(s.id));
            const manualCount = employees.filter((e) => e.isManual).length;
            return (
              <div key={s.id} className="salon-block">
                <div className="row-between">
                  <div className="info">
                    <span className="name">{s.name}</span>
                    <span className="meta">
                      {s.city} · {s.address} · {employees.length} сотрудник
                      {employees.length === 1 ? "" : employees.length < 5 ? "а" : "ов"}
                      {manualCount > 0 && ` · ${manualCount} вручную`}
                    </span>
                  </div>
                  <DeleteButton
                    confirm={`Удалить ТТ «${s.name}»? Сотрудники переедут в другую ТТ.`}
                    action={async () => {
                      "use server";
                      await deleteSalon(s.id);
                    }}
                  />
                </div>
                {employees.length > 0 && (
                  <ul className="salon-employees">
                    {employees.map((e) => (
                      <li key={e.id}>
                        {e.fullName}
                        {e.isManual && (
                          <span className="tag" style={{ marginLeft: 8 }}>
                            вручную
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  // ---------- Employees ----------
  const employeesTab = (
    <>
      <div className="admin-section">
        <h3>Добавить сотрудника</h3>
        <form action={createEmployee} className="stack">
          <div className="form-row">
            <div className="field">
              <label htmlFor="emp-name">ФИО</label>
              <input id="emp-name" name="fullName" required placeholder="Иванов Иван Иванович" />
            </div>
            <div className="field">
              <label htmlFor="emp-salon">Торговые точки (можно несколько)</label>
              <select
                id="emp-salon"
                name="salonIds"
                multiple
                size={Math.min(6, db.salons.length || 4)}
                defaultValue={db.salons[0] ? [db.salons[0].id] : []}
                required
              >
                {db.salons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="field-hint">Удерживайте Ctrl/Cmd, чтобы выбрать несколько.</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="emp-role">Роль</label>
            <select id="emp-role" name="role" defaultValue="seller">
              <option value="seller">Продавец</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h3>
          Сотрудники <span className="count">{db.employees.length}</span>
        </h3>
        <div className="list-table">
          {db.employees.map((e) => {
            const salonNames = e.salonIds
              .map((id) => db.salons.find((s) => s.id === id)?.name)
              .filter(Boolean)
              .join(" · ");
            return (
              <div key={e.id} className="list-row">
                <div className="info">
                  <span className="name">
                    {e.fullName}
                    {e.isManual && (
                      <span className="tag tag-accent" style={{ marginLeft: 8 }}>
                        добавлен вручную
                      </span>
                    )}
                    {e.role === "admin" && (
                      <span className="tag" style={{ marginLeft: 8 }}>
                        admin
                      </span>
                    )}
                  </span>
                  <span className="meta">
                    {salonNames || "—"} · с {e.hiredAt}
                  </span>
                </div>
                <DeleteButton
                  confirm={`Удалить сотрудника «${e.fullName}» вместе с прогрессом?`}
                  action={async () => {
                    "use server";
                    await deleteEmployee(e.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  // ---------- Products ----------
  const productsTab = (
    <>
      <div className="admin-section">
        <h3>Добавить товар</h3>
        <form action={createProduct} className="stack">
          <div className="form-row">
            <div className="field">
              <label htmlFor="prod-name">Название</label>
              <input id="prod-name" name="name" required placeholder="Колонка SberBoom Mini" />
            </div>
            <div className="field">
              <label htmlFor="prod-cat">Категория</label>
              <select id="prod-cat" name="category" defaultValue="service">
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="prod-aud">Кому подходит</label>
            <textarea id="prod-aud" name="audience" placeholder="Семьи, которым важна …" />
          </div>
          <div className="field">
            <label htmlFor="prod-prob">Какую проблему решает</label>
            <textarea id="prod-prob" name="problem" placeholder="Жизненная задача клиента" />
          </div>
          <div className="field">
            <label htmlFor="prod-plain">Как объяснить простыми словами</label>
            <textarea id="prod-plain" name="plainExplanation" placeholder="Без характеристик, через пользу" />
          </div>
          <div className="field">
            <label htmlFor="prod-args">Аргументы для продажи (каждый — с новой строки)</label>
            <textarea
              id="prod-args"
              name="sellingArguments"
              placeholder={"Гибкие тарифы под профиль клиента\nПрозрачный остаток\nПакет с интернетом"}
            />
          </div>
          <div className="field">
            <label htmlFor="prod-objs">Частые возражения (каждое — с новой строки)</label>
            <textarea id="prod-objs" name="commonObjections" placeholder={"У вас связь хуже\nУ конкурентов дешевле"} />
          </div>
          <div className="field">
            <label htmlFor="prod-resp">Готовый ответ на возражение</label>
            <textarea id="prod-resp" name="objectionResponse" placeholder="Согласие → уточнение → польза" />
          </div>
          <div className="field">
            <label htmlFor="prod-tags">Теги (через запятую)</label>
            <input id="prod-tags" name="tags" placeholder="семья, безопасность" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h3>
          Товары <span className="count">{db.products.length}</span>
        </h3>
        <div className="list-table">
          {db.products.map((p) => (
            <div key={p.id} className="list-row">
              <div className="info">
                <span className="name">{p.name}</span>
                <span className="meta">
                  {PRODUCT_CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}
                  {p.tags.length > 0 && ` · ${p.tags.join(", ")}`}
                  {(p.sellingArguments?.length ?? 0) > 0 && ` · ${p.sellingArguments?.length ?? 0} аргумент(ов)`}
                </span>
              </div>
              <DeleteButton
                confirm={`Удалить товар «${p.name}»?`}
                action={async () => {
                  "use server";
                  await deleteProduct(p.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  // ---------- Promotions ----------
  const promotionsTab = (
    <>
      <div className="admin-section">
        <h3>Добавить акцию</h3>
        <form action={createPromotion} className="stack">
          <div className="field">
            <label htmlFor="promo-title">Название акции</label>
            <input id="promo-title" name="title" required placeholder="Семейный пакет: смартфон + защита −20%" />
          </div>
          <div className="field">
            <label htmlFor="promo-desc">Описание</label>
            <textarea id="promo-desc" name="description" placeholder="Что именно по акции и каковы условия" />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="promo-from">Действует с</label>
              <input id="promo-from" name="validFrom" type="date" />
            </div>
            <div className="field">
              <label htmlFor="promo-to">Действует до</label>
              <input id="promo-to" name="validTo" type="date" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="promo-products">К каким товарам относится</label>
            <select id="promo-products" name="productIds" multiple size={Math.min(6, db.products.length || 4)}>
              {db.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="field-hint">Удерживайте Ctrl/Cmd, чтобы выбрать несколько.</span>
          </div>
          <div className="field">
            <label htmlFor="promo-pitch">Как правильно предложить клиенту</label>
            <textarea id="promo-pitch" name="pitch" placeholder="Когда и как стоит её упомянуть в диалоге" />
          </div>
          <div className="field">
            <label htmlFor="promo-phrases">Фразы продавца (каждая — с новой строки)</label>
            <textarea id="promo-phrases" name="phrases" placeholder={"Сейчас как раз акция…\nСразу заберёте телефон в защите…"} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h3>
          Акции <span className="count">{db.promotions.length}</span>
        </h3>
        <div className="list-table">
          {db.promotions.map((p) => (
            <div key={p.id} className="list-row">
              <div className="info">
                <span className="name">{p.title}</span>
                <span className="meta">
                  {p.validFrom || "без даты"} — {p.validTo || "без даты"}
                  {p.productIds.length > 0 &&
                    ` · ${p.productIds
                      .map((id) => db.products.find((pr) => pr.id === id)?.name)
                      .filter(Boolean)
                      .join(", ")}`}
                </span>
              </div>
              <DeleteButton
                confirm={`Удалить акцию «${p.title}»?`}
                action={async () => {
                  "use server";
                  await deletePromotion(p.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  // ---------- Sales scripts ----------
  const scriptsTab = (
    <>
      <div className="admin-section">
        <h3>Добавить скрипт продаж</h3>
        <form action={createSalesScript} className="stack">
          <div className="field">
            <label htmlFor="scr-situation">Ситуация клиента</label>
            <textarea id="scr-situation" name="situation" required placeholder="Клиент только зашёл в салон…" />
          </div>
          <div className="field">
            <label htmlFor="scr-goal">Цель продавца</label>
            <textarea id="scr-goal" name="goal" placeholder="Снять напряжение, узнать причину визита" />
          </div>
          <div className="field">
            <label htmlFor="scr-good">Правильная фраза</label>
            <textarea id="scr-good" name="goodLine" required placeholder="Открытый вопрос, который удерживает диалог" />
          </div>
          <div className="field">
            <label htmlFor="scr-weak">Слабая фраза</label>
            <textarea id="scr-weak" name="weakLine" placeholder="«Чем вам помочь?»" />
          </div>
          <div className="field">
            <label htmlFor="scr-exp">Объяснение, почему правильная лучше</label>
            <textarea id="scr-exp" name="explanation" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h3>
          Скрипты продаж <span className="count">{db.salesScripts.length}</span>
        </h3>
        <div className="list-table">
          {db.salesScripts.map((s) => (
            <div key={s.id} className="list-row">
              <div className="info">
                <span className="name">{s.situation}</span>
                <span className="meta">{s.goodLine.slice(0, 110)}…</span>
              </div>
              <DeleteButton
                confirm="Удалить скрипт?"
                action={async () => {
                  "use server";
                  await deleteSalesScript(s.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  // ---------- Objections ----------
  const objectionsTab = (
    <>
      <div className="admin-section">
        <h3>Добавить возражение</h3>
        <form action={createObjection} className="stack">
          <div className="field">
            <label htmlFor="obj-customer">Возражение клиента</label>
            <input id="obj-customer" name="customerObjection" required placeholder="У вас слишком дорого" />
          </div>
          <div className="field">
            <label htmlFor="obj-bad">Плохой ответ</label>
            <textarea id="obj-bad" name="badResponse" placeholder="Что точно не нужно говорить" />
          </div>
          <div className="field">
            <label htmlFor="obj-good">Хороший ответ</label>
            <textarea id="obj-good" name="goodResponse" placeholder="Нормальный, но обезличенный ответ" />
          </div>
          <div className="field">
            <label htmlFor="obj-best">Лучший ответ</label>
            <textarea id="obj-best" name="bestResponse" required placeholder="Эмпатия + уточнение + польза" />
          </div>
          <div className="field">
            <label htmlFor="obj-exp">Объяснение, почему так лучше</label>
            <textarea id="obj-exp" name="explanation" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h3>
          Возражения <span className="count">{db.objections.length}</span>
        </h3>
        <div className="list-table">
          {db.objections.map((o) => (
            <div key={o.id} className="list-row">
              <div className="info">
                <span className="name">«{o.customerObjection}»</span>
                <span className="meta">{o.bestResponse.slice(0, 100)}…</span>
              </div>
              <DeleteButton
                confirm="Удалить возражение?"
                action={async () => {
                  "use server";
                  await deleteObjection(o.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  // ---------- Learning materials ----------
  const materialsTab = (
    <>
      <div className="admin-section">
        <h3>Добавить обучающий материал</h3>
        <form action={createLearningMaterial} className="stack">
          <div className="form-row">
            <div className="field">
              <label htmlFor="mat-title">Название</label>
              <input id="mat-title" name="title" required placeholder="Чек-лист идеальной консультации" />
            </div>
            <div className="field">
              <label htmlFor="mat-type">Тип материала</label>
              <select id="mat-type" name="type" defaultValue="article">
                {MATERIAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="mat-desc">Короткое описание</label>
            <textarea id="mat-desc" name="description" placeholder="Что внутри одной фразой" />
          </div>
          <div className="field">
            <label htmlFor="mat-body">Текст материала</label>
            <textarea id="mat-body" name="body" rows={6} placeholder="Основной текст. Можно использовать переносы строк." />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="mat-product">Связанный продукт</label>
              <select id="mat-product" name="productId" defaultValue="">
                <option value="">— не выбран —</option>
                {db.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="mat-promo">Связанная акция</label>
              <select id="mat-promo" name="promotionId" defaultValue="">
                <option value="">— не выбрана —</option>
                {db.promotions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h3>
          Обучающие материалы <span className="count">{db.learningMaterials.length}</span>
        </h3>
        <div className="list-table">
          {db.learningMaterials.map((m) => (
            <div key={m.id} className="list-row">
              <div className="info">
                <span className="name">{m.title}</span>
                <span className="meta">
                  {MATERIAL_TYPES.find((t) => t.value === m.type)?.label ?? m.type}
                  {m.productId && ` · продукт: ${db.products.find((p) => p.id === m.productId)?.name ?? "—"}`}
                  {m.promotionId && ` · акция: ${db.promotions.find((p) => p.id === m.promotionId)?.title ?? "—"}`}
                </span>
              </div>
              <DeleteButton
                confirm="Удалить материал?"
                action={async () => {
                  "use server";
                  await deleteLearningMaterial(m.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  // ---------- Modules / Scenarios / Combos (без значимых изменений) ----------
  const modulesTab = (
    <>
      <div className="admin-section">
        <h3>Добавить модуль</h3>
        <form action={createModule} className="stack">
          <div className="form-row">
            <div className="field">
              <label htmlFor="mod-title">Название</label>
              <input id="mod-title" name="title" required placeholder="Работа с возражениями" />
            </div>
            <div className="field">
              <label htmlFor="mod-xp">XP за модуль</label>
              <input id="mod-xp" name="xp" type="number" min={10} defaultValue={60} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="mod-desc">Короткое описание</label>
            <textarea id="mod-desc" name="description" placeholder="Что внутри модуля одной фразой" />
          </div>
          <div className="field">
            <label htmlFor="mod-goal">Цель</label>
            <textarea id="mod-goal" name="goal" placeholder="Что должно поменяться у продавца" />
          </div>
          <div className="field">
            <label htmlFor="mod-outcomes">Результаты — каждый с новой строки</label>
            <textarea id="mod-outcomes" name="outcomes" placeholder={"Понимаешь...\nМожешь объяснить...\nВидишь связь..."} />
          </div>
          <div className="field">
            <label htmlFor="mod-example">Пример результата</label>
            <textarea id="mod-example" name="example" placeholder="После модуля продавец делает X" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h3>
          Модули <span className="count">{db.modules.length}</span>
        </h3>
        <div className="list-table">
          {[...db.modules]
            .sort((a, b) => a.order - b.order)
            .map((m) => (
              <div key={m.id} className="list-row">
                <div className="info">
                  <span className="name">
                    {m.order}. {m.title}
                    <span className="xp-pill" style={{ marginLeft: 8 }}>
                      +{m.xp} XP
                    </span>
                  </span>
                  <span className="meta">{m.description}</span>
                </div>
                <DeleteButton
                  confirm={`Удалить модуль «${m.title}»?`}
                  action={async () => {
                    "use server";
                    await deleteModule(m.id);
                  }}
                />
              </div>
            ))}
        </div>
      </div>
    </>
  );

  const scenariosTab = (
    <>
      <div className="admin-section">
        <h3>Добавить сценарий тренажёра</h3>
        <form action={createScenario} className="stack">
          <div className="form-row">
            <div className="field">
              <label htmlFor="sc-title">Название сценария</label>
              <input id="sc-title" name="title" required placeholder="Камера для дачи" />
            </div>
            <div className="field">
              <label htmlFor="sc-xp">XP за лучший ответ</label>
              <input id="sc-xp" name="xpReward" type="number" min={5} defaultValue={25} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="sc-context">Контекст ситуации</label>
            <textarea id="sc-context" name="context" placeholder="Когда и почему клиент так говорит" />
          </div>
          <div className="field">
            <label htmlFor="sc-customer">Реплика клиента</label>
            <textarea id="sc-customer" name="customerLine" required placeholder="Мне больше ничего не нужно" />
          </div>
          <div className="field">
            <label htmlFor="sc-weak">Слабый ответ</label>
            <input id="sc-weak" name="weakText" required />
          </div>
          <div className="field">
            <label htmlFor="sc-weak-exp">Объяснение, почему слабо</label>
            <textarea id="sc-weak-exp" name="weakExplanation" />
          </div>
          <div className="field">
            <label htmlFor="sc-ok">Нормальный ответ</label>
            <input id="sc-ok" name="okText" required />
          </div>
          <div className="field">
            <label htmlFor="sc-ok-exp">Объяснение, почему норма</label>
            <textarea id="sc-ok-exp" name="okExplanation" />
          </div>
          <div className="field">
            <label htmlFor="sc-best">Лучший ответ</label>
            <input id="sc-best" name="bestText" required />
          </div>
          <div className="field">
            <label htmlFor="sc-best-exp">Объяснение, почему лучший</label>
            <textarea id="sc-best-exp" name="bestExplanation" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h3>
          Сценарии <span className="count">{db.scenarios.length}</span>
        </h3>
        <div className="list-table">
          {db.scenarios.map((s) => (
            <div key={s.id} className="list-row">
              <div className="info">
                <span className="name">{s.title}</span>
                <span className="meta">
                  «{s.customerLine}» · +{s.xpReward} XP
                </span>
              </div>
              <DeleteButton
                confirm={`Удалить сценарий «${s.title}»?`}
                action={async () => {
                  "use server";
                  await deleteScenario(s.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const combosTab = (
    <>
      <div className="admin-section">
        <h3>Добавить комбо</h3>
        <form action={createCombo} className="stack">
          <div className="field">
            <label htmlFor="combo-title">Название</label>
            <input id="combo-title" name="title" required placeholder="Смартфон + защита + настройка" />
          </div>
          <div className="field">
            <label htmlFor="combo-items">Что входит (через запятую)</label>
            <input id="combo-items" name="items" placeholder="Смартфон, SIM, чехол, стекло, перенос данных" />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="combo-aud">Кому</label>
              <input id="combo-aud" name="audience" placeholder="Меняет смартфон или покупает первый" />
            </div>
            <div className="field">
              <label htmlFor="combo-benefit">Польза клиенту</label>
              <input id="combo-benefit" name="customerBenefit" placeholder="Готовый телефон, защищённый…" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="combo-note">Почему легко предложить</label>
            <textarea id="combo-note" name="sellerNote" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Добавить
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h3>
          Комбо-связки <span className="count">{db.combos.length}</span>
        </h3>
        <div className="list-table">
          {db.combos.map((c) => (
            <div key={c.id} className="list-row">
              <div className="info">
                <span className="name">{c.title}</span>
                <span className="meta">{c.items.join(" · ")}</span>
              </div>
              <DeleteButton
                confirm={`Удалить комбо «${c.title}»?`}
                action={async () => {
                  "use server";
                  await deleteCombo(c.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const proofsTab = (
    <>
      <div className="admin-section">
        <h3>
          Проверка продаж <span className="count">{db.saleProofs.length}</span>
        </h3>
        <p className="muted" style={{ marginBottom: 18 }}>
          Принятые чеки начисляют XP продавцу, двигают миссию и попадают в общий рейтинг.
        </p>
        <div className="list-table">
          {[...db.saleProofs]
            .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
            .map((proof) => {
              const employee = db.employees.find((e) => e.id === proof.employeeId);
              const salon = db.salons.find((s) => s.id === proof.salonId);
              const mission = db.dailyMissions.find((m) => m.id === proof.missionId);
              const task = mission?.tasks.find((t) => t.id === proof.taskId);
              return (
                <div key={proof.id} className={`proof-admin proof-${proof.status}`}>
                  <div className="row-between">
                    <div className="info">
                      <span className="name">{employee?.fullName ?? "Сотрудник не найден"}</span>
                      <span className="meta">
                        {salon?.name ?? "ТТ не найдена"} · {task?.title ?? proof.kind} · {proof.quantity} шт. ·{" "}
                        {proof.amount ? `${proof.amount} ₽` : "без суммы"}
                      </span>
                    </div>
                    <span className={`status-pill status-${proof.status === "approved" ? "completed" : proof.status === "pending" ? "in_progress" : "not_started"}`}>
                      {proof.status === "pending" ? "На проверке" : proof.status === "approved" ? "Принято" : "Отклонено"}
                    </span>
                  </div>
                  {proof.comment && <p className="muted">{proof.comment}</p>}
                  <div className="row-flex">
                    {proof.receiptUrl ? (
                      <a href={proof.receiptUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                        Открыть чек
                      </a>
                    ) : (
                      <span className="tag">{proof.receiptLabel}</span>
                    )}
                    <span className="tag">XP: {proof.xpEarned}</span>
                    <span className="tag">{new Date(proof.submittedAt).toLocaleString("ru-RU")}</span>
                  </div>
                  {proof.status === "pending" ? (
                    <div className="proof-review-actions">
                      <form action={reviewSaleProof} className="review-form">
                        <input type="hidden" name="proofId" value={proof.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <input name="reviewerComment" placeholder="Комментарий проверяющего" />
                        <button type="submit" className="btn btn-primary btn-sm">
                          Принять
                        </button>
                      </form>
                      <form action={reviewSaleProof} className="review-form">
                        <input type="hidden" name="proofId" value={proof.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <input name="reviewerComment" placeholder="Причина отклонения" />
                        <button type="submit" className="btn btn-danger btn-sm">
                          Отклонить
                        </button>
                      </form>
                    </div>
                  ) : (
                    proof.reviewerComment && <p className="faint">Комментарий: {proof.reviewerComment}</p>
                  )}
                </div>
              );
            })}
          {db.saleProofs.length === 0 && <p className="muted">Пока нет отправленных чеков.</p>}
        </div>
      </div>
    </>
  );

  const dangerTab = (
    <div className="admin-section">
      <h3>Сбросить демо-данные</h3>
      <p className="muted" style={{ marginBottom: 18 }}>
        Полностью удаляет файл <code>data/db.json</code>, пересоздаёт его из начального набора и
        выполняет выход текущего пользователя из сессии.
      </p>
      <form action={resetPlatformAction}>
        <button type="submit" className="btn btn-danger">
          Сбросить и пересоздать
        </button>
      </form>
    </div>
  );

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Администрирование</span>
          <h2>Контент платформы</h2>
          <p>
            Здесь администратор управляет торговыми точками, сотрудниками, товарами, акциями,
            скриптами продаж, возражениями и обучающими материалами. Все изменения сразу появляются у
            сотрудников в разделе «Обучение».
          </p>
          <div className="row-flex" style={{ marginTop: 14 }}>
            <form action={logoutAdminAction}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Выйти из админ-панели
              </button>
            </form>
          </div>
        </div>

        <AdminTabs
          tabs={[
            { id: "salons", label: "Торговые точки", count: db.salons.length, content: salonsTab },
            { id: "employees", label: "Сотрудники", count: db.employees.length, content: employeesTab },
            { id: "products", label: "Товары", count: db.products.length, content: productsTab },
            { id: "promotions", label: "Акции", count: db.promotions.length, content: promotionsTab },
            { id: "scripts", label: "Скрипты продаж", count: db.salesScripts.length, content: scriptsTab },
            { id: "objections", label: "Возражения", count: db.objections.length, content: objectionsTab },
            { id: "materials", label: "Материалы", count: db.learningMaterials.length, content: materialsTab },
            { id: "modules", label: "Модули", count: db.modules.length, content: modulesTab },
            { id: "scenarios", label: "Тренажёр", count: db.scenarios.length, content: scenariosTab },
            { id: "combos", label: "Комбо", count: db.combos.length, content: combosTab },
            { id: "proofs", label: "Проверка продаж", count: db.saleProofs.filter((p) => p.status === "pending").length, content: proofsTab },
            { id: "danger", label: "Сервис", content: dangerTab },
          ]}
          initial="salons"
        />
      </div>
    </section>
  );
}
