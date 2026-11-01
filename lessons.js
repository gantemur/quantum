/** Original teaching material for the finite two-state experiment. */
                                   

                           
             
                
                   
                  
                
               
                                           
 

                                
                    
                   
                      
                     
                         
                        
                        
                                                                               
                        
                       
 

const lessons                                  = {
  mn: {
    mathTitle: 'Математик',
    mathHtml: `
      <p>Кубит нь хоёр хэмжээст төлөвийн огторгуйтай систем. Энд Паулийн матрицуудыг
      <span class="formula">σ = (σ<sub>x</sub>, σ<sub>y</sub>, σ<sub>z</sub>)</span>
      гэж тэмдэглэнэ. Төлөвийг нягтын матриц ба Блохын вектороор бичвэл
      <span class="formula">ρ = (I + r · σ)/2, |r| ≤ 1</span> болно.</p>
      <p>Бэлтгэх төлөвийн чиглэлийг θ, φ өнцгөөр, уртыг s-ээр өгнө:
      <span class="formula">r = s(sin θ cos φ, sin θ sin φ, cos θ)</span>.
      Цэвэр төлөвт s = 1, бүрэн холимог төлөвт s = 0. Цэвэр байдлын хэмжүүр нь
      <span class="formula">Tr(ρ²) = (1 + |r|²)/2</span>. Нягтын матрицын мөр 1,
      өөрийн утгууд нь <span class="formula">(1 ± |r|)/2</span> тул сөрөг биш байна.</p>
      <p>Цэвэр төлөвийг z сууринд
      <span class="formula">|ψ⟩ = e<sup>iγ</sup>[cos(θ/2)|0⟩ + e<sup>iφ</sup>sin(θ/2)|1⟩]</span>
      гэж бичиж болно. Харьцангуй фаз φ нь хэмжилтийн магадлалд нөлөөлнө.
      Ерөнхий фаз γ нь ρ болон бүх хэмжилтийн магадлалыг өөрчлөхгүй.
      Холимог төлөвийг ганц ийм вектороор бүрэн илэрхийлэх боломжгүй.</p>
      <p>Нэгж n чиглэлийн хэмжилтийг
      <span class="formula">P<sub>±</sub> = (I ± n · σ)/2</span> проекторууд тодорхойлно.
      Борны дүрмээр
      <span class="formula">p<sub>±</sub> = Tr(ρP<sub>±</sub>) = (1 ± r · n)/2</span>.
      Энд гаралтын ±1 нь n · σ-ийн өөрийн утга. Спин-½ системийн бодит спин
      <span class="formula">S<sub>n</sub> = ℏ(n · σ)/2</span> бол гаралт нь ±ℏ/2 байна.</p>
      <p>± гаралттай хэмжилтийн дараа Блохын вектор ±n болно.
      Нэг системийг дараалан хэмжихэд дараагийн магадлал өмнөх гаралтаас хамаарна.
      Харин ижил анхны төлөвтэй хуулбаруудыг тус тусад нь хэмжихэд туршилт бүр
      анхны бэлтгэлээс эхэлнэ. Магадлалын зураг нээх нь хэмжилт хийх үйлдэл биш.</p>
      <p>Тогтмол <span class="formula">H = h · σ</span> гамильтонианд, ℏ = 1 нэгжээр,
      <span class="formula">ρ(t) = U(t)ρ(0)U(t)†, U(t) = exp(−iHt)</span>.
      Блохын вектор h чиглэлийг тойрон 2|h|t өнцгөөр эргэнэ. Энд h-ийн нэгж нь
      энерги, t-ийн нэгж нь түүний урвуу бөгөөд |r| ба Tr(ρ²) хадгалагдана.</p>
      <p><span class="formula">H(λ) = Δσ<sub>x</sub> + λσ<sub>z</sub></span>
      бүлийн энерги нь <span class="formula">E<sub>±</sub>(λ) = ±√(Δ² + λ²)</span>.
      λ нь параметр болохоос хугацаа биш. Δ = λ = 0 үед хоёр энерги давхцана:
      хоёр хэмжээст бүх огторгуй нь өөрийн дэд огторгуй бөгөөд ганц онцгой
      өөрийн векторын чиглэл байхгүй.</p>`,
    methodTitle: 'Тооцооллын арга ба код',
    methodHtml: `
      <p>Энэ туршилт хоёр төлөвт загварыг шууд тооцоолно. Магадлалд Борны дүрэм,
      нягтын матрицад комплекс матрицын үйлдэл, спектрт аналитик хоёр өөрийн утгыг
      ашиглана. Эдгээр нь сонгосон хоёр төлөвт загварын хувьд яг томьёо боловч
      компьютер дээр хөвөгч таслалтай тоогоор үнэлэгдэнэ.</p>
      <p>Тогтмол гамильтонианы хугацааны хамаарлыг хоёр аргаар харьцуулж болно.
      <strong>Спектрийн арга</strong> нь U(t)-г байгуулж UρU†-г бодно.
      <strong>Блохын эргэлт</strong> нь r-ийг аналитик эргэлтийн томьёогоор олно.
      Хоёр арга ижил төлөв өгөх ёстой. Зургийн хугацааны цэгүүд нь харах дээжлэл
      бөгөөд эдгээр яг томьёонд интегралчлах алхмын алдаа үүсгэхгүй.</p>
      <p>Санамсаргүй хэмжилт нь тооцсон магадлалаас нэг гаралт сонгоно.
      Үр дүнг давтаж шалгахдаа төлөв, хэмжилтийн дараалал, туршилтын тоо,
      санамсаргүй тооны үүсгүүрийн эхлүүлэх тоог хамт тэмдэглэнэ.
      Олон удаагийн хэмжилтийн давтамж магадлалтай заавал яг тэнцэхгүй.</p>
      <p><a href="#method-code">Аргын кодын хэсгийг харах</a> холбоосоор бодит тооцоонд
      хэрэглэсэн функцийг уншина. Үр дүнтэй нь холбон томьёо, оролт, гаралт болон
      урьдчилан шалгасан нөхцөлийг ажиглаарай. Код харах нь тооцооллыг дахин
      ажиллуулахгүй.</p>`,
    exercisesTitle: 'Дасгалууд',
    exercises: [
      {
        id: 'E01',
        title: 'Харьцангуй фаз хэзээ ажиглагдах вэ?',
        question: 'Комплекс амплитуд ба спины суурийг мэддэг гэж үзье. z хэмжилтээр ялгагдахгүй хоёр цэвэр төлөвийг x хэмжилт ялгаж чадах уу?',
        steps: [
          'Эхлэх бэлтгэлийг тусад нь хэрэглэ. Цэвэр төлөв сонгож θ = 90°, φ = 0° болго. z ба x чиглэлийн + гаралтын магадлалыг урьдчилан таамагла.',
          'Магадлалуудыг тэмдэглээд φ = 90° төлөвийг бэлтгэ. θ ба төлөвийн уртыг өөрчлөхгүйгээр хоёр төлөвийн үр дүнг харьцуул.',
          'Зөвхөн амплитудын ерөнхий фаз γ-г өөрчил. Амплитуд, нягтын матриц, хэмжилтийн магадлалын аль нь өөрчлөгдсөнийг тайлбарла.',
          'Хоёр төлөвийн амплитуд, z/x магадлал, нормчлолыг хүснэгтээр өг. Суурийг өөрчилж дүрслэх ба төлөвт үйлдэл хийхийн ялгааг нэг өгүүлбэрээр бич.',
        ],
        check: 'Хоёр төлөвт pz(+) = 1/2. φ = 0° үед px(+) = 1, φ = 90° үед px(+) = 1/2. Ерөнхий фаз бүх хэмжилтийн магадлалыг хадгална.',
        hint: 'Цэвэр төлөвт rx = sin θ cos φ. Дараа нь px(+) = (1 + rx)/2 томьёог хэрэглэ. e^{iγ} үржигдэхүүн |ψ⟩⟨ψ|-д арилна.',
        preset: 'phase',
      },
      {
        id: 'E02',
        title: 'Хэмжилтийн дараалал',
        question: 'Проектор хэмжилтийн дараах төлөвийг ашиглан z → z болон z → x → z дарааллуудыг харьцуул. Хоёр дахь дарааллын сүүлчийн z гаралт яагаад өөр вэ?',
        steps: [
          '|0⟩ төлөвөөс эхэл. z → z ба z → x → z дараалал бүрийн боломжит гаралт, нөхцөлт магадлалыг эхлээд цаасан дээр зур.',
          'Дараалал бүрийг ижил анхны төлөвтэй 100 хуулбар дээр турш. Нэг хуулбарын дотор хэмжилтүүд дараалан хийгдэх ёстой.',
          'Тооцсон магадлал ба ажигласан тоог хүснэгтээр харьцуул. Эхлүүлэх тоо болон туршилтын тоог тэмдэглэ.',
          'Магадлалын зураг болон хадгалсан үр дүнг дахин хар. Шинэ хэмжилт хийгдээгүй, гаралтын тоо өөрчлөгдөөгүйг шалга.',
        ],
        check: 'z → z дарааллын сүүлчийн + гаралт магадлал 1-тэй. z → x → z дарааллын сүүлчийн + гаралт магадлал 1/2-тэй. Хоёр дахь дараалалд эхний z гаралт +, дараагийн хоёр гаралтын дөрвөн боломж тус бүр магадлал 1/4-тэй.',
        hint: 'Эхний z хэмжилт |0⟩-ийг хэвээр үлдээнэ. x хэмжилтийн аль ч гаралтын дараа z чиглэлийн хоёр гаралт адил магадлалтай.',
        preset: 'sequence',
      },
      {
        id: 'E03',
        title: 'Суперпозици ба холимог төлөв',
        question: 'Нягтын матрицыг ашигла. |0⟩ ба |1⟩-ийн тэнцүү холимгийг (|0⟩ + |1⟩)/√2 цэвэр төлөвөөс ямар хэмжилтээр ялгах вэ?',
        steps: [
          'Эхлээд θ = 90°, φ = 0°, урт 1 бүхий цэвэр төлөвийг бэлтгэ. z/x магадлал, нягтын матриц, Tr(ρ²)-г тэмдэглэ.',
          'Блохын векторын уртыг 0 болгож бүрэн холимог төлөвийг бэлтгэ. Ижил хэмжигдэхүүнүүдийг тэмдэглэ.',
          'Нягтын матрицыг z ба x сууринд харьцуул. Матрицын элементүүд өөрчлөгдсөн ч нэг физик хэмжилтийн таамаг өөрчлөгдөх ёсгүйг тайлбарла.',
          'Хоёр матрицын мөр, өөрийн утгууд, цэвэр байдлын хэмжүүрийг шалга. z чиглэлд ижил давтамж харагдах нь ижил төлөв гэдгийг батлах уу?',
        ],
        check: 'Хоёр төлөвт pz(+) = 1/2. Цэвэр төлөвт px(+) = 1 ба Tr(ρ²) = 1. Тэнцүү холимогт px(+) = 1/2 ба Tr(ρ²) = 1/2. Аль аль матрицын мөр 1, өөрийн утгууд сөрөг биш.',
        hint: 'z сууринд цэвэр төлөвийн матрицын дөрвөн элемент бүгд 1/2. Холимгийн матриц I/2 тул диагоналиас гаднах элементүүд 0 байна.',
        preset: 'mixture',
      },
    ],
    projectsTitle: 'Төсөл',
    project: {
      title: 'Гурван хэмжилтээр төлөвийг сэргээх',
      question: 'x, y, z чиглэлийн хэмжилтийн тооноос Блохын векторыг ойролцоогоор сэргээ. Энэ төсөлд нягтын матриц ба Бернуллийн туршилтын суурь ойлголт хэрэгтэй.',
      steps: [
        'Өөрийн сонгосон нэг цэвэр, нэг холимог төлөвийн θ, φ, уртыг тэмдэглэ. Хоёуланд нь тухайн төлөвийг өөрчлөхгүйгээр ижил бэлтгэлтэй хуулбаруудыг ашигла.',
        'Чиглэл тус бүрд 100 тусдаа хуулбарыг хэмж. r̂j = (Nj,+ − Nj,−)/100 томьёогоор гурван компонентыг ол.',
        'Бэлтгэсэн r болон хэмжилтээс олсон r̂-ийг хүснэгтээр харьцуул. Нягтын матрицыг ρ̂ = (I + r̂ · σ)/2 гэж байгуул. |r̂| нь 1-ээс их гарч болох эсэхийг хэлэлц.',
        'Өөр эхлүүлэх тоогоор нэг удаа давт. Нийт төсвийг 2 төлөв × 3 чиглэл × 100 хэмжилт × 2 давталт = 1200 хэмжилтээр хязгаарла.',
        'Нэг магадлалын зураг, компонентын алдааны хүснэгт, бэлтгэл ба эхлүүлэх тоонууд, санамсаргүй хэлбэлзлийн тайлбарыг хавсарга. Төлөвийн физик өөрчлөлт ба хязгаарлагдмал түүврийн алдааг ялга.',
      ],
      check: 'Тусдаа хуулбаруудын хэмжилтэд E[r̂j] = rj, Var(r̂j) = (1 − rj²)/N. Үүнийг компьютерийн аргаар хэмжсэн хэлбэлзэлтэй харьцуул. Хоёр давталт нь дисперсийг нарийн тогтооход хүрэлцэхгүй. Түүврээс |r̂| > 1 гарах нь боломжтой бөгөөд түүнийг тайлбаргүйгээр нормчилж болохгүй.',
    },
    glossaryTitle: 'Тэмдэглэгээ ба нэр томьёо',
    glossaryHtml: `
      <dl class="glossary">
        <dt>Төлөв (state)</dt><dd>Хэмжилтийн магадлалыг тогтоох ρ матриц буюу түүнтэй дүйх r вектор.</dd>
        <dt>Цэвэр / холимог (pure / mixed)</dt><dd>Цэвэр төлөвт |r| = 1; холимог төлөвт |r| &lt; 1.</dd>
        <dt>Суурь (basis)</dt><dd>Ижил төлөвийг бичих координатын сонголт. Суурь солих нь өөрөө физик эргэлт биш.</dd>
        <dt>Үүсгүүрийн эхлүүлэх тоо (seed)</dt><dd>Ижил үйлдлийн дарааллыг тооцоонд давтан гаргахад ашиглах тоо. Энэ нь физик хугацаа биш.</dd>
        <dt>Параметр λ / хугацаа t</dt><dd>λ нь тусдаа гамильтониануудыг сонгоно. t нь өгөгдсөн гамильтонианаар хувьсах хугацаа.</dd>
      </dl>`,
  },
  en: {
    mathTitle: 'Mathematics',
    mathHtml: `
      <p>A qubit has a two-dimensional state space. Write the Pauli matrices as
      <span class="formula">σ = (σ<sub>x</sub>, σ<sub>y</sub>, σ<sub>z</sub>)</span>.
      Its density matrix and Bloch vector are related by
      <span class="formula">ρ = (I + r · σ)/2, |r| ≤ 1</span>.</p>
      <p>The preparation angles θ, φ and length s specify
      <span class="formula">r = s(sin θ cos φ, sin θ sin φ, cos θ)</span>.
      A pure state has s = 1; the maximally mixed state has s = 0. Purity is
      <span class="formula">Tr(ρ²) = (1 + |r|²)/2</span>. The matrix has trace 1
      and nonnegative eigenvalues <span class="formula">(1 ± |r|)/2</span>.</p>
      <p>In the z basis, a pure state can be written as
      <span class="formula">|ψ⟩ = e<sup>iγ</sup>[cos(θ/2)|0⟩ + e<sup>iφ</sup>sin(θ/2)|1⟩]</span>.
      Relative phase φ can affect measurement probabilities. Global phase γ
      changes neither ρ nor any measurement probability. A mixed state cannot be
      fully represented by one such vector.</p>
      <p>Measurement along a unit vector n is defined by the projectors
      <span class="formula">P<sub>±</sub> = (I ± n · σ)/2</span>. The Born rule gives
      <span class="formula">p<sub>±</sub> = Tr(ρP<sub>±</sub>) = (1 ± r · n)/2</span>.
      The displayed outcomes ±1 are eigenvalues of n · σ. For physical spin
      <span class="formula">S<sub>n</sub> = ℏ(n · σ)/2</span>, the outcomes are ±ℏ/2.</p>
      <p>After outcome ±, the Bloch vector becomes ±n. Sequential measurements
      on one system therefore depend on earlier outcomes. Measurements on
      independently prepared copies begin again from the stated preparation
      for every trial. Opening a probability plot does not perform a measurement.</p>
      <p>For a fixed <span class="formula">H = h · σ</span>, in units ℏ = 1,
      <span class="formula">ρ(t) = U(t)ρ(0)U(t)†, U(t) = exp(−iHt)</span>.
      The Bloch vector rotates about h through angle 2|h|t. Components of h
      have energy units and t has inverse-energy units; |r| and Tr(ρ²) are conserved.</p>
      <p>The family <span class="formula">H(λ) = Δσ<sub>x</sub> + λσ<sub>z</sub></span>
      has energies <span class="formula">E<sub>±</sub>(λ) = ±√(Δ² + λ²)</span>.
      Here λ is a parameter, not time. At Δ = λ = 0 the energies coincide:
      the whole two-dimensional space is the eigenspace, with no distinguished
      individual eigenvector direction.</p>`,
    methodTitle: 'Method and code',
    methodHtml: `
      <p>This experiment calculates the finite two-state model directly. It uses
      the Born rule for probabilities, complex matrix operations for the density
      matrix, and analytic eigenvalues for the spectrum. These are exact formulas
      for the declared model, evaluated with floating-point arithmetic.</p>
      <p>Two methods can calculate fixed-Hamiltonian evolution.
      <strong>Spectral evolution</strong> constructs U(t) and evaluates UρU†.
      <strong>Bloch rotation</strong> evaluates an analytic vector rotation.
      They should agree. The plotted time points are viewing samples; these
      closed formulas introduce no integration-step error.</p>
      <p>A sampled measurement draws one outcome from the predicted probabilities.
      Record the preparation, measurement sequence, trial count, and generator
      seed to reproduce a calculation. Finite outcome frequencies need not equal
      the predicted probabilities exactly.</p>
      <p><a href="#method-code">Inspect the method's code fragment</a> to read
      the function used in the calculation. Relate its inputs, outputs, and
      preconditions to the formula and result. Opening code does not rerun
      the calculation.</p>`,
    exercisesTitle: 'Exercises',
    exercises: [
      {
        id: 'E01',
        title: 'Where relative phase becomes observable',
        question: 'Prerequisites: complex amplitudes and spin bases. Can an x measurement distinguish two pure states that a z measurement cannot distinguish?',
        steps: [
          'Apply the starting preparation explicitly. Set a pure state with θ = 90°, φ = 0°. Predict its + probabilities along z and x.',
          'Record the predictions, then prepare φ = 90°, keeping θ and the state length fixed. Compare the two states.',
          'Change only the displayed global phase γ. Explain which of the amplitudes, density matrix, and measurement probabilities change.',
          'Submit the two sets of amplitudes, z/x probabilities, and normalization checks. Explain the difference between a basis representation change and an operation on the state.',
        ],
        check: 'Both states have pz(+) = 1/2. At φ = 0°, px(+) = 1; at φ = 90°, px(+) = 1/2. Global phase preserves every measurement probability.',
        hint: 'For a pure state, rx = sin θ cos φ. Use px(+) = (1 + rx)/2. The factor e^{iγ} cancels from |ψ⟩⟨ψ|.',
        preset: 'phase',
      },
      {
        id: 'E02',
        title: 'A sequence of measurements',
        question: 'Use the post-measurement state to compare z → z and z → x → z. Why does the final z measurement behave differently?',
        steps: [
          'Start from |0⟩. Draw the possible outcomes and conditional probabilities for z → z and z → x → z before sampling.',
          'Run each sequence on 100 independently prepared copies. Measurements within a single copy must occur sequentially.',
          'Compare predicted probabilities and observed counts in a table. Record the seed and trial count.',
          'Reopen probability views and inspect retained results. Check that this creates no new event and changes no counts.',
        ],
        check: 'The final + probability is 1 for z → z and 1/2 for z → x → z. In the latter, the first z result is + and the four possibilities for the next two outcomes each have probability 1/4.',
        hint: 'The first z measurement leaves |0⟩ unchanged. After either x outcome, the two z outcomes have equal probability.',
        preset: 'sequence',
      },
      {
        id: 'E03',
        title: 'Superposition and mixture',
        question: 'Use density matrices to distinguish an equal mixture of |0⟩ and |1⟩ from the pure state (|0⟩ + |1⟩)/√2. Which measurement distinguishes them?',
        steps: [
          'Prepare θ = 90°, φ = 0°, length 1. Record z/x probabilities, the density matrix, and Tr(ρ²).',
          'Prepare length 0, the maximally mixed state. Record the same quantities.',
          'Compare the matrices in the z and x bases. Explain why a representation change preserves the prediction for the same physical measurement.',
          'Check the trace, eigenvalues, and purity of both matrices. Does agreement of z frequencies establish equality of states?',
        ],
        check: 'Both have pz(+) = 1/2. The pure state has px(+) = 1 and Tr(ρ²) = 1. The mixture has px(+) = 1/2 and Tr(ρ²) = 1/2. Both matrices have trace 1 and nonnegative eigenvalues.',
        hint: 'In the z basis, all four pure-state matrix entries are 1/2. The mixture is I/2, whose off-diagonal entries vanish.',
        preset: 'mixture',
      },
    ],
    projectsTitle: 'Project',
    project: {
      title: 'Reconstruct a state from three measurements',
      question: 'Estimate the Bloch vector from x, y, and z outcome counts. Prerequisites: density matrices and basic Bernoulli trials.',
      steps: [
        'Choose one pure and one mixed state. Record θ, φ, and length. Use independently prepared copies without changing the state between measurement directions.',
        'Measure 100 separate copies along each axis. Estimate each component by r̂j = (Nj,+ − Nj,−)/100.',
        'Compare the prepared r and estimated r̂ in a table. Construct ρ̂ = (I + r̂ · σ)/2. Discuss whether |r̂| can exceed 1.',
        'Repeat once with another seed. Bound the work at 2 states × 3 axes × 100 measurements × 2 repetitions = 1200 measurements.',
        'Submit one probability figure, a component-error table, the preparations and seeds, and an explanation of sampling fluctuations. Separate physical state changes from finite-sample error.',
      ],
      check: 'For independent copies, E[r̂j] = rj and Var(r̂j) = (1 − rj²)/N. Compare this prediction with the observed fluctuations; two repetitions do not determine the variance accurately. Finite samples can give |r̂| > 1. Do not silently normalize this estimate.',
    },
    glossaryTitle: 'Notation and terms',
    glossaryHtml: `
      <dl class="glossary">
        <dt>State / төлөв</dt><dd>The matrix ρ, or equivalently the vector r, that determines measurement probabilities.</dd>
        <dt>Pure / mixed — цэвэр / холимог</dt><dd>A pure state has |r| = 1; a mixed state has |r| &lt; 1.</dd>
        <dt>Basis / суурь</dt><dd>A coordinate choice for describing the same state. Changing basis is not itself a physical rotation.</dd>
        <dt>Seed / үүсгүүрийн эхлүүлэх тоо</dt><dd>A number used to reproduce the same computational sequence. It is not physical time.</dd>
        <dt>Parameter λ / time t</dt><dd>λ selects separate Hamiltonians. t describes evolution under a specified Hamiltonian.</dd>
      </dl>`,
  },
};

/** Returns authored content only. Opening it never applies a preset. */
export function lessonContent(lang          )                {
  return lessons[lang];
}
