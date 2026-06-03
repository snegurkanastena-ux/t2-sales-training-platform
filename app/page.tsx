import Link from "next/link";
import { readDB } from "@/lib/db";
import { getPlatformStats } from "@/lib/analytics";
import { getCurrentEmployee } from "@/lib/session";
import { LoginCard } from "./_components/LoginCard";
import { PilotCTA } from "./_components/PilotCTA";
import { CountUp } from "./_components/CountUp";
import { VoiceTabs } from "./_components/VoiceTabs";
import { MascotGuide } from "./_components/MascotGuide";

export default async function HomePage() {
  const db = await readDB();
  const stats = await getPlatformStats();
  const current = await getCurrentEmployee();
  const cities = Array.from(new Set(db.salons.map((s) => s.city)));
  const sellersCount = db.employees.filter((e) => e.role === "seller").length;
  const possibleCompletions = db.modules.length * db.employees.length;

  const benefitsCards = [
    { icon: "◎", title: "Лучше понимать продукты", text: "За что отвечает каждый продукт T2 и как он закрывает реальную задачу клиента." },
    { icon: "◈", title: "Увереннее говорить с клиентом", text: "Готовые формулы пользы вместо сухих характеристик и заученных скриптов." },
    { icon: "▲", title: "Легче предлагать допродажи", text: "Аксессуары и услуги встают в диалог логично — как забота, а не давление." },
    { icon: "✦", title: "Меньше бояться возражений", text: "Шесть базовых возражений и три безопасных способа на каждое." },
    { icon: "◆", title: "Собирать комплексные продажи", text: "Готовые комбо под типовые сценарии — ребёнок, бизнес, дача, новый клиент." },
    { icon: "◐", title: "Видеть пользу, а не характеристики", text: "Каждый продукт — это решение жизненной задачи, а не строка в плане." },
  ];

  const businessImpact = [
    { title: "Рост среднего чека", text: "Продавец собирает комплект, а не одну позицию — чек растёт без давления на клиента." },
    { title: "Больше дополнительных продуктов", text: "Аксессуары, подписки, услуги перестают быть «навязыванием» и становятся частью консультации." },
    { title: "Быстрее адаптация новичков", text: "Маршрут на 30 дней доводит новичка до уровня середнячка без длинных тренингов." },
    { title: "Единый стандарт консультации", text: "Все салоны работают по одной логике — клиент получает одинаковый опыт в любом городе." },
    { title: "Меньше формального обучения", text: "Учёба встроена в смену: 5 минут утром на тренажёре эффективнее часового тренинга раз в квартал." },
    { title: "Выше вовлечённость продавцов", text: "XP, уровни и рейтинг создают здоровую конкуренцию и видимый рост." },
  ];

  const gamification = [
    { title: "Уровни продавца", text: "От Новичка до Чемпиона салона — рост виден на дашборде." },
    { title: "Баллы за обучение", text: "XP за каждый модуль и лучший ответ в тренажёре." },
    { title: "Бейджи", text: "«Продаёт через пользу», «Эталонный диалог», «Полный курс»." },
    { title: "Ежедневные задания", text: "Микро-тренировки по 5 минут — заходишь в смену в тонусе." },
    { title: "Рейтинг продавцов", text: "Прозрачное место в салоне, городе и компании." },
    { title: "Рейтинг салонов", text: "Здоровая конкуренция между точками и регионами." },
    { title: "Прогресс прохождения", text: "Виден маршрут на 30 дней с галочками и следующими шагами." },
  ];

  const journey = [
    {
      n: "01",
      title: "Вход и калибровка",
      text:
        "Продавец выбирает свою ТТ и ФИО. Платформа определяет уровень: новичок, середнячок или чемпион — и подбирает стартовые модули.",
    },
    {
      n: "02",
      title: "Любовь к продукту",
      text:
        "За 30 минут разбираем все 8 категорий продуктов T2 — не характеристики, а реальные задачи клиента. Без зубрёжки.",
    },
    {
      n: "03",
      title: "Тренажёр диалогов",
      text:
        "Сценарии живых клиентов: лучший ответ +25 XP, нормальный +10, слабый — без штрафа, но с разбором почему.",
    },
    {
      n: "04",
      title: "Возражения и комбо",
      text:
        "Шесть базовых возражений × три безопасных ответа. Готовые комбо под типичные сценарии: семья, бизнес, дача, новый клиент.",
    },
    {
      n: "05",
      title: "Смена с подсказками",
      text:
        "Утром — 5 минут на тренажёре. На смене — подсказки по продуктам и акциям прямо в платформе. Прогресс копится автоматически.",
    },
  ];

  return (
    <>
      {/* HERO */}
      <section className="hero hero-immersive hero-drift">
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">Внутренняя платформа · Академия продаж T2</span>
            <h1 className="hero-title">
              Учим продавцов <span className="accent">любить продукт</span>,
              <br />
              понимать клиента и продавать <span className="accent">через&nbsp;пользу</span>
            </h1>
            <p className="hero-sub">
              Не лекции — практика, сценарии реальных клиентов и тренажёр диалогов. Платформа
              знает каждого сотрудника, помнит его прогресс и подсказывает следующий шаг.
            </p>
            <div className="hero-actions">
              {current ? (
                <Link href="/learn#trainer" className="btn btn-primary">
                  Продолжить обучение
                </Link>
              ) : (
                <Link href="/login" className="btn btn-primary">
                  Начать обучение
                </Link>
              )}
              <Link href="/learn#modules" className="btn btn-ghost">
                Посмотреть модули
              </Link>
            </div>
            <div className="hero-floating-badges" aria-label="Игровые механики платформы">
              <span>+45 XP за чек</span>
              <span>Миссия дня</span>
              <span>Топ недели</span>
            </div>
            <ul className="hero-bullets">
              <li>Обучение через практику</li>
              <li>Сценарии реальных клиентов</li>
              <li>Тренажёр продаж</li>
              <li>Рост уверенности продавца</li>
            </ul>
          </div>

          {current ? (
            <aside className="hero-card" aria-label="Превью тренажёра диалогов">
              <div className="row">
                <span className="badge">Тренажёр диалогов</span>
                <span className="chip">Лучший ответ +25 XP</span>
              </div>
              <div className="quote">
                <strong>Клиент:</strong> «Мне больше ничего не нужно, спасибо.»
              </div>
              <div className="answers">
                <div className="answer">
                  Может, всё-таки возьмёте чехол?
                  <span className="tag">слабо</span>
                </div>
                <div className="answer">
                  У нас есть стекло и чехол, они защитят телефон.
                  <span className="tag">норма</span>
                </div>
                <div className="answer best">
                  Понимаю. Покажу защиту, которая реально спасает экран при падении…
                  <span className="tag">лучший</span>
                </div>
              </div>
            </aside>
          ) : (
            <LoginCard salons={db.salons} employees={db.employees.filter((e) => !e.isManual)} />
          )}
        </div>
      </section>

      <MascotGuide />

      {/* ЗАЧЕМ ЭТО ПРОДАВЦУ */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Зачем это продавцу</span>
            <h2>Не план, а понимание — и продажа становится естественной</h2>
            <p>
              Платформа меняет внутреннюю позицию: продавец перестаёт «закрывать план» и начинает
              видеть, как продукт встраивается в жизнь клиента.
            </p>
          </div>

          <div className="grid grid-3 reveal" style={{ marginBottom: 48 }}>
            {benefitsCards.map((b) => (
              <article key={b.title} className="card card-hover card-glow">
                <span className="icon-pill">{b.icon}</span>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </article>
            ))}
          </div>

          <div className="metrics reveal">
            <div className="metric">
              <div className="label">Уверенность в продукте</div>
              <div className="value">
                +<CountUp value={27} />%
              </div>
              <div className="desc">Целевой показатель пилота — самооценка продавца после 30 дней.</div>
            </div>
            <div className="metric">
              <div className="label">Комплексные продажи</div>
              <div className="value">
                +<CountUp value={18} />%
              </div>
              <div className="desc">Целевой рост доли чеков с двумя и более позициями.</div>
            </div>
            <div className="metric">
              <div className="label">Страх возражений</div>
              <div className="value">
                −<CountUp value={35} />%
              </div>
              <div className="desc">Снижение по результатам опроса до и после прохождения модуля.</div>
            </div>
          </div>
        </div>
      </section>

      {/* КАК РАСТЁТ ПРОДАВЕЦ */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Маршрут</span>
            <h2>Как растёт продавец на платформе</h2>
            <p>
              Пять шагов, которые проходит каждый сотрудник — от входа в платформу до уверенной
              работы с клиентом без подсказок.
            </p>
          </div>
          <div className="journey">
            {journey.map((step) => (
              <article key={step.n} className="journey-card reveal">
                <span className="journey-num" aria-hidden="true">
                  {step.n}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ПЛАТФОРМА В ЦИФРАХ */}
      <section className="section section-tight">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Платформа в цифрах</span>
            <h2>Реальное состояние пилота — данные с этой инсталляции</h2>
            <p>
              Цифры обновляются в реальном времени по мере того, как продавцы проходят модули и
              отрабатывают сценарии в тренажёре.
            </p>
          </div>
          <div className="stat-grid reveal">
            <div className="stat-tile">
              <div className="label">Салонов</div>
              <div className="value">
                <CountUp value={stats.totals.salons} />
              </div>
              <div className="delta">
                по {cities.length} город{cities.length === 1 ? "у" : cities.length < 5 ? "ам" : "ам"}: {cities.join(", ")}
              </div>
            </div>
            <div className="stat-tile">
              <div className="label">Продавцов</div>
              <div className="value">
                <CountUp value={sellersCount} />
              </div>
              <div className="delta">учатся прямо сейчас</div>
            </div>
            <div className="stat-tile">
              <div className="label">Попыток в тренажёре</div>
              <div className="value">
                <CountUp value={stats.totals.attempts} />
              </div>
              <div className="delta">{stats.totals.bestAnswers} лучших ответов</div>
            </div>
            <div className="stat-tile">
              <div className="label">Завершённых модулей</div>
              <div className="value">
                <CountUp value={stats.totals.completedModules} />
              </div>
              <div className="delta">из {possibleCompletions} возможных</div>
            </div>
          </div>
          <div className="row-flex" style={{ marginTop: 24, justifyContent: "center" }}>
            <Link href="/stats" className="btn btn-ghost">
              Посмотреть аналитику →
            </Link>
          </div>
        </div>
      </section>

      {/* ПРОДУКТЫ */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Продукты</span>
            <h2>Что продаём — и как это объяснить клиенту языком пользы</h2>
            <p>
              Каталог редактируется в разделе администрирования. Каждый продукт — это не
              характеристики, а конкретное решение задачи клиента.
            </p>
          </div>
          <div className="grid grid-3 reveal">
            {db.products.slice(0, 6).map((p) => (
              <article key={p.id} className="card card-hover card-glow product-card">
                <div className="head">
                  <h3>{p.name}</h3>
                </div>
                <p>{p.plainExplanation}</p>
                <div className="tag-row">
                  {p.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="row-flex" style={{ marginTop: 28, justifyContent: "center" }}>
            <Link href="/learn#products" className="btn btn-ghost">
              Все продукты в обучении →
            </Link>
          </div>
        </div>
      </section>

      {/* ГОЛОС ПИЛОТА */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Голос пилота</span>
            <h2>Что говорят те, кто уже работает на платформе</h2>
            <p>
              Цитаты сгруппированы по ролям — продавцы, управляющие, HR и тренеры. Чтобы каждый
              увидел, что меняется именно для него.
            </p>
          </div>
          <div className="reveal">
            <VoiceTabs />
          </div>
        </div>
      </section>

      {/* ГЕЙМИФИКАЦИЯ */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Геймификация</span>
            <h2>Видимый рост — а не «ещё один курс в почте»</h2>
            <p>
              XP, уровни и бейджи дают продавцу обратную связь каждый день, а руководству — реальные
              цифры о вовлечённости.
            </p>
          </div>
          <div className="grid grid-4 reveal">
            {gamification.map((g) => (
              <article key={g.title} className="card card-hover">
                <h3>{g.title}</h3>
                <p>{g.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* БИЗНЕС-ЭФФЕКТ */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Бизнес-эффект</span>
            <h2>Что получает компания за пределами обучения</h2>
            <p>
              Не «тренинг ради тренинга», а инструмент, который двигает ключевые метрики розницы.
            </p>
          </div>
          <div className="grid grid-3 reveal">
            {businessImpact.map((b) => (
              <article key={b.title} className="card card-hover card-glow">
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ФИНАЛ — ТРОЙНОЙ CTA */}
      <section className="section section-tight">
        <div className="container">
          <div className="cta-final cta-drift reveal">
            <h2>
              Продавец продаёт лучше, когда сам <span className="accent">понимает ценность</span>{" "}
              продукта.
            </h2>
            <p className="cta-lead">
              Выберите, как удобнее зайти в платформу — как сотрудник, как руководитель или сразу с
              презентацией пилота для команды.
            </p>
            <div className="triple-cta">
              <article className="triple-card">
                <span className="triple-eyebrow">Сотруднику</span>
                <h3>Войти как продавец</h3>
                <p>Выбрать ТТ и ФИО, пройти первый модуль, попробовать тренажёр диалогов.</p>
                <Link
                  href={current ? "/learn" : "/login"}
                  className="btn btn-primary btn-block"
                >
                  {current ? "Перейти к обучению" : "Войти"} →
                </Link>
              </article>
              <article className="triple-card triple-card-accent">
                <span className="triple-eyebrow">Руководителю</span>
                <h3>Открыть аналитику</h3>
                <p>Дашборды по салонам, продавцам и попыткам в тренажёре. Прогресс пилота — за минуту.</p>
                <Link href="/stats" className="btn btn-primary btn-block">
                  Посмотреть аналитику →
                </Link>
              </article>
              <article className="triple-card">
                <span className="triple-eyebrow">Презентация</span>
                <h3>Запустить пилот</h3>
                <p>Готовая демо-история для встречи с руководством — со всеми экранами и сценариями.</p>
                <PilotCTA buttonClassName="btn-block" label="Запустить пилот →" />
              </article>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
