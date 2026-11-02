import type { Language } from './lessons.ts';

export type BoxExperiment = 'state' | 'time';
export type BoxExercisePreset = 'stationary' | 'interference' | 'localized';

export interface BoxExercise {
  id: string;
  title: string;
  question: string;
  steps: string[];
  check: string;
  hint: string;
  preset: BoxExercisePreset;
}

export interface BoxLessonContent {
  mathTitle: string;
  mathHtml: string;
  methodTitle: string;
  methodHtml: string;
  exercisesTitle: string;
  exercises: BoxExercise[];
  projectsTitle: string;
  project: { title: string; question: string; steps: string[]; check: string };
  glossaryTitle: string;
  glossaryHtml: string;
}

const content: Record<Language, BoxLessonContent> = {
  mn: {
    mathTitle: 'Математик',
    mathHtml: `
      <p>m масстай бөөм <span class="formula">0 ≤ x ≤ L</span> завсарт хөдөлнө.
      Доторх потенциал 0, захууд дээр нэвтэршгүй хана байна. Долгион функц
      <span class="formula">ψ(0) = ψ(L) = 0</span> нөхцөлийг хангана. Энд ℏ = 1.</p>
      <p>Энергийн өөрийн функц ба өөрийн утга нь
      <span class="formula">φ<sub>n</sub>(x) = √(2/L) sin(nπx/L)</span>,
      <span class="formula">E<sub>n</sub> = π²n²/(2mL²)</span>, n = 1, 2, … .
      Эдгээр функц ортонормаль тул эхний N гишүүнээр бэлтгэсэн төлөвийг
      <span class="formula">ψ<sub>N</sub>(x,0) = Σ<sub>n=1</sub><sup>N</sup> c<sub>n</sub>φ<sub>n</sub>(x)</span>,
      <span class="formula">Σ|c<sub>n</sub>|² = 1</span> гэж бичнэ.</p>
      <p>Тогтмол гамильтонианаар хувьсахад коэффициент бүрийн фаз өөрчлөгдөнө:
      <span class="formula">c<sub>n</sub>(t) = c<sub>n</sub>(0)e<sup>−iEₙt</sup></span>.
      Иймээс энергийн магадлал <span class="formula">p<sub>n</sub> = |c<sub>n</sub>|²</span>
      болон дундаж энерги <span class="formula">⟨H⟩ = Σp<sub>n</sub>E<sub>n</sub></span>
      хадгалагдана. Нэг өөрийн төлөвийн комплекс долгион функц хугацаанаас
      хамаарах боловч түүний магадлалын нягт |ψ|² өөрчлөгдөхгүй.</p>
      <p>Байрлалын магадлал нь нягтын интеграл:
      <span class="formula">P(a ≤ x ≤ b) = ∫<sub>a</sub><sup>b</sup>|ψ(x)|² dx</span>.
      Тухайлбал зүүн хагасын магадлал нь 0-оос L/2 хүртэлх интеграл.
      Дундаж ба дисперсийг
      <span class="formula">⟨x⟩ = ∫x|ψ|² dx</span>,
      <span class="formula">Var(x) = ⟨x²⟩ − ⟨x⟩²</span> гэж олно.
      ψ-ийн нэгж L<sup>−1/2</sup>, |ψ|²-ийн нэгж L<sup>−1</sup>;
      нягтын нэг цэг дэх утга нь тухайн цэг дээр байх магадлал биш.</p>
      <p>Энерги хэмжихэд E<sub>n</sub> гаралт p<sub>n</sub> магадлалтай гарч,
      хэмжилтийн дараах төлөв φ<sub>n</sub> болно — ерөнхий фаз нь хэмжилтэд
      нөлөөлөхгүй. Ижил бэлтгэлтэй хуулбар бүрийг нэг удаа хэмжих нь нэг системийг
      дараалан хэмжихээс ялгаатай. Энд байрлалын нягтыг харуулна; байрлалын
      хэмжилтийн дараах төлөв болон импульсийн хэмжилтийг загварчлаагүй.</p>`,
    methodTitle: 'Тооцооллын арга ба код',
    methodHtml: `
      <p><strong>Төгсгөлөг спектрийн задаргаа.</strong> Синусын эхний N функцийг
      ашиглан төлөв байгуулж, энерги бүрийн фазын үржигдэхүүнийг шууд тооцоолно.
      Энэ нь бэлтгэсэн төгсгөлөг задаргааны хувьд хугацааны интегралчлалын
      алхмын алдаагүй арга. Хөвөгч таслалын алдаа, орхисон гишүүд, зургийн
      орон зай/хугацааны дээжлэл тусдаа асуудал хэвээр үлдэнэ.</p>
      <p><strong>Нэг зорилтот функцийг өөр өөр N-ээр ойролцоолох.</strong>
      Локалчлах бэлтгэлд <span class="formula">y = x/L</span> гэж тавиад
      <span class="formula">g(y) = y(1−y) exp[−(y−0.25)²/(2·0.1²)]</span>
      хэлбэрийг нормчилж хэрэглэнэ. G = g/‖g‖ гэвэл орон зайн нормчилсон
      зорилт нь <span class="formula">χ(x) = G(x/L)/√L</span>.
      <span class="formula">a<sub>n</sub> = ⟨φ<sub>n</sub>,χ⟩</span> коэффициентуудыг
      интегралчилж олно. N гишүүнд хадгалагдсан квадрат норм нь
      <span class="formula">η<sub>N</sub> = Σ<sub>n≤N</sub>|a<sub>n</sub>|²</span>.
      Бэлтгэх төлөвийг <span class="formula">c<sub>n</sub> = a<sub>n</sub>/√η<sub>N</sub></span>
      гэж дахин нормчилно.</p>
      <p>η<sub>N</sub> нь зорилтот функцийг хэр сайн багтаасныг хэмжинэ.
      Харин зүүн хагасын магадлал нь нормчилсон бэлтгэлийн орон зайн тархалтыг
      хэмжинэ. Эдгээр нь өөр хэмжигдэхүүн. N-ийг ихэсгэхэд зорилтот функц болон
      L, m-ийг хэвээр байлгаж харьцуул. Коэффициентуудыг гараар засвал шинэ
      бэлтгэл хийж байгаа тул өмнөх зорилтын оношилгоог шууд хэрэглэж болохгүй.</p>
      <p><a href="#method-code">Аргын кодын хэсгийг харах</a> холбоосоор фазын
      шинэчлэл, задаргаа эсвэл холбогдох тооцооны бодит кодыг уншина.
      Өөрчилсөн тохиргоогоор шинэ үр дүнг илээр үүсгэнэ. Хугацааны сонгогч,
      самбар, код болон дасгалыг харах нь өөрөө шинэ хэмжилт хийхгүй.</p>`,
    exercisesTitle: 'Дасгалууд',
    exercises: [
      {
        id: 'E04',
        title: 'Юу нь стационар вэ?',
        question: 'Энергийн өөрийн төлөв ба унитар хувьслыг мэддэг гэж үзье. Нэг өөрийн төлөв болон хоёр төлөвийн суперпозицийн аль хэмжигдэхүүнүүд хугацаанаас хамаарах вэ?',
        steps: [
          'L = m = 1 гэж ав. Эхлээд үндсэн төлөв c₁ = 1-ийг бэлтгэ. Re ψ, Im ψ, |ψ|², энергийн магадлал, ⟨x⟩, ⟨H⟩-ийн аль нь өөрчлөгдөхийг таамаглаад хугацааны үр дүн үүсгэ.',
          'Дараа нь c₁ = c₂ = 1/√2, бусад коэффициент 0 төлөвийг бэлтгэ. Өмнөх зураг эсвэл өгөгдлийг хадгалж, шинэ төлөвөөр хугацааны үр дүнг дахин үүсгэ.',
          'Харьцангуй фазын өнцгийн давтамж ω = E₂ − E₁, үе T = 2π/ω-г ол. t = 0, T/4, T/2, T орчмын нягт болон ⟨x⟩-ийг харьцуул. Сонгосон цэгүүдийн бодит хугацааг тэмдэглэ.',
          'c₂ = i/√2 болгож харьцангуй фазыг өөрчил. Энергийн магадлалыг өөрчлөхгүйгээр нягт ба дундаж байрлалын түүх хэрхэн өөрчлөгдсөнийг тайлбарла.',
          'Дундаж байрлалын түүх, дор хаяж хоёр нягтын зураг, энергийн хүснэгтийг хадгал. Комплекс долгион функц хугацаанаас хамаарах нь нягт заавал өөрчлөгдөнө гэсэн үг үү?',
        ],
        check: 'Нэг өөрийн төлөвт |ψ|² ба ⟨x⟩ = L/2 тогтмол. Хоёр тэнцүү бодит коэффициентод ⟨x⟩ = L/2 − [16L/(9π²)]cos[(E₂−E₁)t]. L = m = 1 үед T = 4/(3π). Хоёр тохиолдолд норм, энергийн магадлал, дундаж энерги хадгалагдана.',
        hint: 'Нягтыг задлахад φ₁φ₂ cos[(E₂−E₁)t] гэсэн интерференцийн гишүүн гарна. Бодит синусын функцуудын ⟨φ₁,xφ₂⟩ матрицын элемент −16L/(9π²).',
        preset: 'interference',
      },
      {
        id: 'E05',
        title: 'Зүүн хэсэгт локалчлагдсан төлөв',
        question: 'Ортогональ задаргааг ашигла. Нэг тогтмол зорилтот функцийг N = 4, 8, 16 гишүүнээр ойролцоолоход норм, хэлбэр, зүүн хагасын магадлал хэрхэн өөрчлөгдөх вэ?',
        steps: [
          'L = m = 1-ийг тогтоогоод локалчлах бэлтгэлийг хэрэглэ. Аргын тайлбар дахь g(y) хэлбэр болон түүний өргөнийг бүх харьцуулалтад хэвээр байлга.',
          'N = 4, 8, 16 тус бүрд энэ зорилтыг дахин проекцолж шинэ бэлтгэл үүсгэ. Коэффициентуудыг нэг N-ээс нөгөөд зүгээр таслах эсвэл гараар өөрчлөхгүй.',
          'Бэлтгэсэн төлөвийн норм, хадгалагдсан квадрат норм ηN, зүүн хагасын магадлал, ⟨x⟩, Var(x), ⟨H⟩-г хүснэгтэд оруул.',
          't = 0 үеийн нягтын зургуудыг ижил x/L тэнхлэгээр харьцуул. Нэг коэффициентын эсвэл нягтын бага зөрүү нь энергийн бага зөрүүг заавал батлах уу?',
          'Тохиргоог JSON, тоон хүснэгтийг CSV, хэрэгтэй зургуудыг SVG хэлбэрээр хадгал. N-ийг өөрчлөх, бэлтгэлийн коэффициентыг өөрчлөх хоёрын ялгааг тайлбарла.',
        ],
        check: 'Дахин нормчилсон бэлтгэл бүрт Σ|cₙ|² = 1. Яг проекцын ηN нь N өсөхөд буурахгүй, 1-ээс ихгүй. Гэхдээ ηN нь зүүн хагасын магадлалтай тэнцүү биш; зүүн хагасын магадлалын нэг чигийн өөрчлөлтийг шаардахгүй.',
        hint: 'Проекцын коэффициентыг aₙ, бэлтгэлийн коэффициентыг cₙ гэж тусад нь бод. Энергийн нийлбэрт өндөр гишүүд Eₙ ∝ n² жинтэй ордог.',
        preset: 'localized',
      },
    ],
    projectsTitle: 'Төсөл',
    project: {
      title: 'Нэг систем, гурван бэлтгэл',
      question: 'Үндсэн төлөв, хоёр гишүүний интерференц, локалчлагдсан төлөвийг ижил хайрцагт харьцуул. Бэлтгэл, хугацааны хамаарал, хязгаарласан задаргааны нөлөөг ялга.',
      steps: [
        'L = m = 1-ийг тогтоо. Үндсэн төлөв болон тэнцүү бодит c₁, c₂ төлөвт энерги, дундаж байрлал, давтамжийн гар тооцооны лавлах утгуудыг гарга.',
        'Хоёр төлөвийн норм ба энергийн хадгалалтыг шалгаж, нэг үеийн дундаж байрлалын түүхийг харьцуул. Хугацааны түүх нь үр дүн; зураг сонгох нь шинэ бэлтгэл биш.',
        'Ижил локалчлах зорилтод N = 4, 8, 16 харьцуулалтыг хий. ηN, зүүн хагасын магадлал, ⟨H⟩-ийг E05-ын хүснэгтэд нэгтгэ.',
          'Төлөв байгуулах туршилтад хоёр гишүүний төлөвийг дахин бэлтгээд энергийн хэмжилтийг 200 тусдаа хуулбар дээр нэг удаа турш. Урьдчилсан магадлал 1/2, 1/2-той тоонуудыг харьцуул; эхлүүлэх тоог тэмдэглэ.',
          'Ажлыг таван өөр бэлтгэлийн тохиргоо, энергийн нэг багц хэмжилтээр хязгаарла. Тохиргоо, CSV хүснэгт, хоёр эсвэл гурван SVG зураг, лавлах томьёо болон үлдсэн алдааны тайлбарыг өг.',
      ],
      check: 'Үндсэн төлөвт E₁ = π²/2, ⟨x⟩ = 1/2, Var(x) = 1/12 − 1/(2π²). Хоёр тэнцүү гишүүний дундаж энерги 5π²/4. Энерги хэмжсэний дараа ганц өөрийн төлөв үлдэхийг, харин тусдаа хуулбаруудын багц хэмжилт анхны бэлтгэлийг хэрэглэснийг ялга.',
    },
    glossaryTitle: 'Тэмдэглэгээ ба нэр томьёо',
    glossaryHtml: `
      <dl class="glossary">
        <dt>Өөрийн төлөв (eigenstate)</dt><dd>Гамильтонианы Hφ<sub>n</sub> = E<sub>n</sub>φ<sub>n</sub> тэгшитгэлийг хангах төлөв.</dd>
        <dt>Модын тоо N (cutoff)</dt><dd>Хадгалсан синусын функцийн тоо. Энэ нь зургийн пиксел эсвэл хугацааны алхмын тоо биш.</dd>
        <dt>Магадлалын нягт (probability density)</dt><dd>|ψ|²-ийг завсраар интегралчлахад тэр завсарт байх магадлал гарна.</dd>
        <dt>Хадгалагдсан квадрат норм η<sub>N</sub> (retained weight)</dt><dd>Нормчилсон зорилтот функцийн N хэмжээст проекцын квадрат норм. Бэлтгэл дараа нь тусад нь нормчлогдоно.</dd>
        <dt>Стационар нягт (stationary density)</dt><dd>Хугацаанаас хамаарахгүй |ψ|². Комплекс долгион функц өөрөө фазын өөрчлөлттэй байж болно.</dd>
      </dl>`,
  },
  en: {
    mathTitle: 'Mathematics',
    mathHtml: `
      <p>A particle of mass m moves in <span class="formula">0 ≤ x ≤ L</span>.
      The potential is zero inside and the walls are impenetrable. The boundary
      conditions are <span class="formula">ψ(0) = ψ(L) = 0</span>. Here ℏ = 1.</p>
      <p>The energy eigenfunctions and eigenvalues are
      <span class="formula">φ<sub>n</sub>(x) = √(2/L) sin(nπx/L)</span>,
      <span class="formula">E<sub>n</sub> = π²n²/(2mL²)</span>, n = 1, 2, … .
      Their orthonormality gives the finite preparation
      <span class="formula">ψ<sub>N</sub>(x,0) = Σ<sub>n=1</sub><sup>N</sup> c<sub>n</sub>φ<sub>n</sub>(x)</span>,
      with <span class="formula">Σ|c<sub>n</sub>|² = 1</span>.</p>
      <p>Under the fixed Hamiltonian, each coefficient acquires a phase:
      <span class="formula">c<sub>n</sub>(t) = c<sub>n</sub>(0)e<sup>−iEₙt</sup></span>.
      The energy probabilities <span class="formula">p<sub>n</sub> = |c<sub>n</sub>|²</span>
      and mean energy <span class="formula">⟨H⟩ = Σp<sub>n</sub>E<sub>n</sub></span>
      are conserved. A single eigenstate has a time-dependent complex
      wavefunction but a stationary probability density |ψ|².</p>
      <p>Position probability is the integral of the density:
      <span class="formula">P(a ≤ x ≤ b) = ∫<sub>a</sub><sup>b</sup>|ψ(x)|² dx</span>.
      The left-half probability integrates from 0 to L/2. Position moments give
      <span class="formula">⟨x⟩ = ∫x|ψ|² dx</span> and
      <span class="formula">Var(x) = ⟨x²⟩ − ⟨x⟩²</span>.
      The units of ψ and |ψ|² are L<sup>−1/2</sup> and L<sup>−1</sup>;
      a density value at a point is not the probability of that exact point.</p>
      <p>An energy measurement returns E<sub>n</sub> with probability p<sub>n</sub>
      and leaves φ<sub>n</sub>, up to an irrelevant global phase. Measuring each
      independently prepared copy once differs from measuring one system
      successively. This experiment displays position density; it does not
      implement position-measurement state updates or momentum measurements.</p>`,
    methodTitle: 'Method and code',
    methodHtml: `
      <p><strong>Finite spectral expansion.</strong> Construct the preparation
      from the first N sine functions and evaluate each energy phase directly.
      This introduces no time-integration-step error for the prepared finite
      expansion. Floating-point error, omitted modes, and the spatial/temporal
      sampling of figures remain separate considerations.</p>
      <p><strong>One target, several cutoffs.</strong> The localized preset uses
      <span class="formula">y = x/L</span> and the fixed shape
      <span class="formula">g(y) = y(1−y) exp[−(y−0.25)²/(2·0.1²)]</span>.
      With G = g/‖g‖, the normalized spatial target is
      <span class="formula">χ(x) = G(x/L)/√L</span>. Compute the projection coefficients
      <span class="formula">a<sub>n</sub> = ⟨φ<sub>n</sub>,χ⟩</span> by integration.
      Its retained squared norm is
      <span class="formula">η<sub>N</sub> = Σ<sub>n≤N</sub>|a<sub>n</sub>|²</span>.
      The prepared state is normalized separately using
      <span class="formula">c<sub>n</sub> = a<sub>n</sub>/√η<sub>N</sub></span>.</p>
      <p>η<sub>N</sub> measures how much of the target lies in the retained space.
      Left-half probability measures the normalized preparation's spatial
      distribution. They are different quantities. Keep the target, L, and m
      fixed when comparing N. Editing coefficients by hand creates a different
      preparation, so the earlier target diagnostic cannot simply be reused.</p>
      <p><a href="#method-code">Inspect the method's code fragment</a> to read
      the actual phase update, reconstruction, or related computation. Generate
      a new result explicitly after changing its inputs. Selecting a retained
      time, opening a panel, or reading code and exercises does not sample
      a new measurement.</p>`,
    exercisesTitle: 'Exercises',
    exercises: [
      {
        id: 'E04',
        title: 'What is stationary?',
        question: 'Prerequisites: energy eigenstates and unitary evolution. Which quantities change in time for one eigenstate and for a two-state superposition?',
        steps: [
          'Set L = m = 1. Prepare the ground state c₁ = 1. Predict the behaviour of Re ψ, Im ψ, |ψ|², energy probabilities, ⟨x⟩, and ⟨H⟩, then generate a time result.',
          'Prepare c₁ = c₂ = 1/√2 with all other coefficients zero. Save the earlier figure or data and generate a new trajectory for this preparation.',
          'Derive the relative-phase angular frequency ω = E₂ − E₁ and period T = 2π/ω. Compare density and ⟨x⟩ near t = 0, T/4, T/2, and T, recording the actual selected sample times.',
          'Change the relative phase by setting c₂ = i/√2. Explain how density and mean-position histories change while energy probabilities remain fixed.',
          'Save a mean-position history, at least two density figures, and an energy table. Does a time-dependent complex wavefunction imply a time-dependent probability density?',
        ],
        check: 'A single eigenstate has fixed |ψ|² and ⟨x⟩ = L/2. For equal real coefficients, ⟨x⟩ = L/2 − [16L/(9π²)]cos[(E₂−E₁)t]. With L = m = 1, T = 4/(3π). Norm, energy probabilities, and mean energy are conserved in both cases.',
        hint: 'Expanding the density gives an interference term φ₁φ₂ cos[(E₂−E₁)t]. For these real sine functions, the matrix element ⟨φ₁,xφ₂⟩ is −16L/(9π²).',
        preset: 'interference',
      },
      {
        id: 'E05',
        title: 'Constructing a localized state',
        question: 'Prerequisite: orthogonal expansions. How do normalization, shape, and left-half probability change when one fixed target is projected onto N = 4, 8, and 16 modes?',
        steps: [
          'Fix L = m = 1 and apply the localized preset. Keep the target shape g(y) and its width from the method explanation unchanged throughout.',
          'At each N = 4, 8, 16, project the same target again to generate the preparation. Do not merely trim coefficients from another cutoff or edit them by hand.',
          'Tabulate the prepared-state norm, retained squared norm ηN, left-half probability, ⟨x⟩, Var(x), and ⟨H⟩.',
          'Compare the t = 0 density figures on the same x/L scale. Does a small coefficient or density difference necessarily establish a small energy error?',
          'Save setups as JSON, numerical tables as CSV, and relevant figures as SVG. Explain the difference between changing the admissible cutoff and changing preparation coefficients.',
        ],
        check: 'Every normalized preparation satisfies Σ|cₙ|² = 1. Exact-projection ηN is nondecreasing with N and at most 1. It is not the left-half probability; that probability need not change monotonically.',
        hint: 'Keep projection coefficients aₙ distinct from prepared coefficients cₙ. High-mode contributions to the energy carry the growing weight Eₙ ∝ n².',
        preset: 'localized',
      },
    ],
    projectsTitle: 'Project',
    project: {
      title: 'One system, three preparations',
      question: 'Compare a ground state, two-mode interference, and localization in the same box. Separate preparation choices, physical-time dependence, and finite-expansion effects.',
      steps: [
        'Fix L = m = 1. Derive hand-checkable energies, mean positions, and frequencies for the ground state and the equal real c₁, c₂ preparation.',
        'Check norm and energy conservation and compare mean-position histories over one interference period. A time history is a result; selecting its plot does not prepare a new state.',
        'For the fixed localized target, compare N = 4, 8, 16. Combine ηN, left-half probability, and ⟨H⟩ in the E05 table.',
          'In the state-construction experiment, prepare the two-mode state again and make one batch of 200 energy measurements on independent copies. Compare counts with probabilities 1/2, 1/2 and record the seed.',
          'Limit the work to five distinct preparation settings and one energy-measurement batch. Submit setups, CSV tables, two or three SVG figures, reference formulas, and an account of remaining errors.',
      ],
      check: 'The ground state has E₁ = π²/2, ⟨x⟩ = 1/2, and Var(x) = 1/12 − 1/(2π²). The equal two-mode mean energy is 5π²/4. Distinguish the eigenstate left after an individual energy measurement from the shared initial preparation used by independent-copy trials.',
    },
    glossaryTitle: 'Notation and terms',
    glossaryHtml: `
      <dl class="glossary">
        <dt>Eigenstate / өөрийн төлөв</dt><dd>A state satisfying Hφ<sub>n</sub> = E<sub>n</sub>φ<sub>n</sub>.</dd>
        <dt>Cutoff N / модын тоо</dt><dd>The number of retained sine functions, not a pixel count or a time-step count.</dd>
        <dt>Probability density / магадлалын нягт</dt><dd>Integrating |ψ|² over an interval gives its position probability.</dd>
        <dt>Retained weight η<sub>N</sub> / хадгалагдсан квадрат норм</dt><dd>The squared norm of the normalized target's projection onto N modes. The preparation is normalized separately.</dd>
        <dt>Stationary density / стационар нягт</dt><dd>Time-independent |ψ|², even when the complex wavefunction acquires a phase.</dd>
      </dl>`,
  },
};

const context: Record<Language, Record<BoxExperiment, string>> = {
  mn: {
    state: '<p><strong>Энэ туршилтад:</strong> коэффициентуудыг сонгож төлөв бэлтгэнэ. Нягт, энергийн магадлал, дундаж хэмжигдэхүүнүүдийг харьцуулж, хүсвэл энергийн хэмжилтийг ил үйлдлээр хийнэ.</p>',
    time: '<p><strong>Энэ туршилтад:</strong> нэг бэлтгэлээс хугацааны үр дүн үүсгэнэ. Хадгалсан t утгыг сонгох нь тэр үр дүнгийн огтлолыг харуулах бөгөөд анхны бэлтгэлд шинэ үйлдэл хийхгүй.</p>',
  },
  en: {
    state: '<p><strong>In this experiment:</strong> choose coefficients and prepare a state. Compare its density, energy probabilities, and moments; an energy measurement is a separate explicit action.</p>',
    time: '<p><strong>In this experiment:</strong> generate a time result from one preparation. Selecting a retained t displays a slice of that result and does not perform a new operation on the input preparation.</p>',
  },
};

/** Authored content only: selecting an activity never applies its preset. */
export function boxLessonContent(lang: Language, experiment: BoxExperiment): BoxLessonContent {
  const base = content[lang];
  const primary = experiment === 'state' ? 'E05' : 'E04';
  return {
    ...base,
    mathHtml: context[lang][experiment] + base.mathHtml,
    exercises: [...base.exercises].sort((a, b) => Number(b.id === primary) - Number(a.id === primary)),
  };
}
