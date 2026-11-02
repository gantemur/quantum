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

const contextual                                                             = {
  mn: {
    time: {
      ...lessons.mn,
      mathHtml: `
        <p>Энэ туршилтын өгөгдөл нь анхны төлөв
        <span class="formula">ρ₀ = (I + r₀ · σ)/2</span> болон тогтмол
        <span class="formula">H = h · σ</span> гамильтониан. ℏ = 1 үед
        <span class="formula">ρ(t) = U(t)ρ₀U(t)†</span>,
        <span class="formula">U(t) = cos(|h|t)I − i sin(|h|t) ĥ · σ</span>.
        h = 0 бол U = I.</p>
        <p>Блохын векторын h-тэй параллель хэсэг тогтмол, перпендикуляр хэсэг
        2|h| өнцгийн давтамжаар эргэнэ. Иймээс |r|, Tr(ρ²),
        <span class="formula">⟨H⟩ = h · r</span> хадгалагдана.
        <span class="formula">[H,ρ₀] = 0</span> үед нягтын матриц бүхэлдээ
        тогтмол. Энэ нь h-тэй параллель цэвэр эсвэл холимог төлөвт биелнэ;
        бүрэн холимог төлөв ямар ч тогтмол H-д өөрчлөгдөхгүй.</p>
        <p><span class="formula">H = σ<sub>z</sub>/2</span> ба
        <span class="formula">r₀ = (1,0,0)</span> гэж авбал
        <span class="formula">r(t) = (cos t, sin t, 0)</span>.
        z суурийн хоёр энергийн магадлал тогтмол боловч харьцангуй фазын
        өөрчлөлтөөс
        <span class="formula">p<sub>x</sub>(+) = (1 + cos t)/2</span> болно.
        Энэ бол энергийн хоёр бүрэлдэхүүний интерференц.</p>
        <p>Өөрийн цэвэр төлөвийн Шрёдингерийн дүрслэл дэх вектор ерөнхий фаз
        хуримтлуулж болно. Гэхдээ нягтын матриц болон бүх хэмжилтийн магадлал
        тогтмол байна. Амплитудын самбар сонгосон ерөнхий фазын конвенцыг
        хэрэглэдэг; бүхэлдээ хуримтлагдсан ерөнхий фазыг хэмжиж байгаа хэрэг биш.</p>
        <p>Үүсгэсэн түүхийг t координатаар шинжилнэ. Харах t-ийг сонгох нь
        анхны бэлтгэлийг эргүүлэх эсвэл дахин хэмжих үйлдэл биш. Шинэ r₀ эсвэл
        H хэрэглэхдээ шинэ үр дүн үүсгэнэ.</p>`,
      methodHtml: `
        <p><strong>Спектрийн арга</strong> U(t)-г байгуулж Uρ₀U†-г тооцоолно.
        <strong>Блохын эргэлт</strong> нь ижил төлөвийг векторын аналитик
        эргэлтээр олно. Энэ хоёр арга нэг тогтмол хоёр төлөвт загварыг бодож
        байгаа тул ялгаа нь зөвхөн тоон үнэлэлтийн алдааны түвшинд байх ёстой.</p>
        <p>Энд хугацааны интегралчлалын алхам байхгүй. Түүхийн дээжлэл болон
        дэлгэцийн нягтрал нь дүрслэлийн хязгаар бөгөөд удаан интервалд олон
        эргэлтийг бүгдийг нь ялгаж харах боломжгүй байж болно. Хугацааны
        интервалыг багасгаж, сонгосон цэгийн бодит t утгыг шалга.</p>
        <p><a href="#method-code">Спектрийн шинэчлэл эсвэл эргэлтийн кодыг харах</a>
        холбоосоор томьёог бодит хэрэгжүүлэлттэй тулга. Аргыг өөрчлөх нь шинэ
        физик хууль сонгож байгаа хэрэг биш; ижил өгөгдөлд хоёр тооцоог харьцуул.</p>`,
      exercises: [
        {
          id: 'T01',
          title: 'Фазын өөрчлөлтөөс ажиглагдах хэлбэлзэл',
          question: 'Унитар хувьсал ба Паулийн хэмжилтийг ашигла. Энергийн магадлал тогтмол байхад x чиглэлийн магадлал яагаад хэлбэлздэг вэ?',
          steps: [
            '|+x⟩ бэлтгэл, h = (0,0,0.5), 0 ≤ t ≤ 2π эхлэх тохиргоог хэрэглэ. r болон x/z хэмжилтийн магадлалыг урьдчилан бич.',
            'Спектрийн аргаар түүх үүсгэ. t = 0, π/2, π, 2π орчмын бодит дээжийн хугацаа ба r утгуудыг тэмдэглэ.',
            'Энергийн z сууринд магадлал тогтмол болохыг, харин x чиглэлд магадлал хэлбэлзэхийг харьцуул. Энэ өөрчлөлтийг харьцангуй фазаар тайлбарла.',
            'Ижил r₀, H, хугацааны интервалд Блохын эргэлтийн аргаар дахин тооцоол. Нэг зураг болон гурван цэгийн гар тооцооны харьцуулалтыг өг.',
          ],
          check: 'r(t) = (cos t, sin t, 0), px(+) = (1 + cos t)/2, pz(+) = 1/2. Хоёр аргаар ижил r гарна. Норм ба цэвэр байдал 1, дундаж энерги 0 хэвээр.',
          hint: '|+x⟩ нь z суурийн хоёр энергийн төлөвийн тэнцүү суперпозици. Энергийн ялгаа 1 тул харьцангуй фаз t өнцгөөр өөрчлөгдөнө.',
          preset: 'time-precession',
        },
        {
          id: 'T02',
          title: 'Анхны төлөв гамильтонианы чиглэлтэй ямар холбоотой вэ?',
          question: 'Өөрийн төлөвийн ажиглагдах хэмжигдэхүүнүүд яагаад тогтмол байдаг вэ? Анхны төлөвийг хэвээр үлдээгээд H-ийн чиглэлийг өөрчилбөл юу болох вэ?',
          steps: [
            '|+z⟩ бэлтгэл, H = σz/2, 0 ≤ t ≤ 2π эхлэх тохиргоог хэрэглэ. Нягтын матриц болон x/y/z магадлалын түүхийг таамагла.',
            'Түүх үүсгээд r₀ нь гамильтонианы тэнхлэгтэй параллель үед тогтмол үлдэхийг шалга.',
            'Анхны |+z⟩ бэлтгэлийг хадгалж, H = σx/2 болгоод шинэ түүх үүсгэ. rz(t) болон y чиглэлийн эргэлтийн тэмдгийг шалга.',
            'Блохын урт 0 бүхий бүрэн холимог төлөвөөр хоёр гамильтонианыг турш. Яагаад энэ нь цэвэр өөрийн төлөв биш боловч стационар болохыг тайлбарла.',
          ],
          check: 'H = σz/2 үед r = (0,0,1) тогтмол. H = σx/2 үед r = (0,−sin t,cos t). Бүрэн холимог төлөвт r = 0, Tr(ρ²) = 1/2 бөгөөд ямар ч тогтмол H-д өөрчлөгдөхгүй.',
          hint: 'ρ̇ = −i[H,ρ]. Коммутатор 0 бол ρ тогтмол. Блохын дүрслэлд ṙ = 2h × r тул x тэнхлэгийг тойрон +z-ээс эхлэх эргэлт −y чиглэлд орно.',
          preset: 'time-stationary',
        },
      ],
      project: {
        title: 'Бэлтгэл ба гамильтонианы чиглэлийг салгаж харьцуулах',
        question: 'Гурван бэлтгэл, хоёр тогтмол гамильтонианаар стационар байдал, интерференц, аргын тохирлыг нэг хүснэгтэд нэгтгэ.',
        steps: [
          '|+x⟩, |+z⟩, бүрэн холимог төлөв гэсэн гурван бэлтгэл бүрийг H = σz/2 ба H = σx/2-той хослуул. Нийт зургаан физик тохиргооноос аль нь стационар болохыг урьдчилан ангил.',
          'Бүгдэд 0 ≤ t ≤ 2π интервалыг хэрэглэ. Гурван Блохын компонент, x/z магадлал, Tr(ρ²), ⟨H⟩-ийг тэмдэглэ.',
          'Тохиргоо бүрийг спектрийн болон Блохын эргэлтийн аргаар бод. Зургаан тохиргоо, хоёр арга буюу нийт 12 тооцоогоор ажлыг хязгаарла.',
          'Хоёр төлөөлөх зураг, стационар/эргэлтийн хүснэгт, нэг гар тооцооны лавлах утга болон тоон/дүрслэлийн хязгаарын тайлбарыг өг. Сонгогчийг хөдөлгөх нь түүхийн оролтыг өөрчилдөггүйг шалга.',
        ],
        check: 'Бэлтгэл гамильтониантай коммутатив бол бүх ажиглагдах хэмжигдэхүүн тогтмол. Үлдсэн цэвэр төлөвүүдэд өнцгийн давтамж 1. Бүх зургаан тохиргоонд |r|, Tr(ρ²), ⟨H⟩ хадгалагдана.',
      },
      glossaryHtml: `
        <dl class="glossary">
          <dt>Анхны төлөв ρ₀ (initial state)</dt><dd>Үүсгэсэн түүхийн эхлэх бэлтгэл. Харах хугацааны сонгогч үүнийг өөрчлөхгүй.</dd>
          <dt>Гамильтонианы тэнхлэг h (Hamiltonian axis)</dt><dd>Блохын эргэлтийн чиглэлийг тогтооно; өнцгийн давтамж 2|h|.</dd>
          <dt>Стационар төлөв (stationary state)</dt><dd>[H,ρ] = 0 тул нягтын матриц ба ажиглагдах хэмжигдэхүүнүүд хугацаанаас үл хамаарна.</dd>
          <dt>Интерференц (interference)</dt><dd>Энергийн бүрэлдэхүүнүүдийн харьцангуй фаз өөрчлөгдөхөөс бусад суурийн магадлалд гарах өөрчлөлт.</dd>
        </dl>`,
    },
    family: {
      ...lessons.mn,
      mathHtml: `
        <p>Энэ нь хугацааны хувьсал бус, параметртэй гамильтониануудын бүл:
        <span class="formula">H(λ) = Δσ<sub>x</sub> + λσ<sub>z</sub></span>.
        λ бүрд тусдаа өөрийн утгын бодлого бодно. Энерги нь
        <span class="formula">E<sub>±</sub> = ±√(Δ² + λ²)</span>,
        завсар нь <span class="formula">E<sub>+</sub> − E<sub>−</sub> = 2√(Δ² + λ²)</span>.</p>
        <p>Δ ≠ 0 бол энергиуд огтлолцохгүй; хамгийн бага завсар λ = 0-д
        2|Δ| байна. Давхцалгүй үед энергийн проекторуудын Блохын вектор
        <span class="formula">r<sub>±</sub> = ±(Δ,0,λ)/√(Δ² + λ²)</span>.
        Төлөвийн найрлагыг өөрийн векторын дурын ерөнхий фаз бус, энэ проектор
        эсвэл хэмжилтийн магадлалаар харьцуулж болно.</p>
        <p>Δ = 0 үед эрэмбэлсэн энергиуд ±|λ| болно. Доод энергийн төлөв
        λ-ийн хоёр талд өөр өөр z төлөвтэй. λ = 0-д H = 0 бөгөөд бүх хоёр
        хэмжээст огторгуй нь энерги 0-ийн өөрийн дэд огторгуй. Бүх дэд
        огторгуйн проектор I тодорхой боловч доод/дээд гэж ялгасан ганц төлөвийн
        чиглэл онцгойлон сонгогдохгүй. Энерги 0 гэдэг нь төлөвийн вектор 0
        гэсэн үг биш.</p>
        <p>λ сонгогч нь эдгээр статик бодлогыг шинжлэхэд хэрэглэгдэнэ.
        Физик явц болгохын тулд λ(t) хуваарь, анхны төлөв, хугацааны хувьслын
        тооцоо хэрэгтэй. Доод энергийн төлөвүүдийг дараалуулан үзэх нь
        бэлтгэсэн систем доод түвшинд үлдэнэ гэдгийг батлахгүй.</p>`,
      methodHtml: `
        <p>Энергиуд болон давхцалгүй үеийн проекторуудыг хоёр хэмжээст
        аналитик томьёогоор λ цэг бүрд тооцоолно. Хуваарь нь параметрийн
        дээжлэл; хугацааны алхам эсвэл адиабат ойролцоолол биш.</p>
        <p>Δ-ийг өөрчилсний дараа шинэ бүл үүсгэ. Харьцуулалтад ижил энергийн
        ба λ-ийн масштабыг хэрэглэ. Доод/дээд нь энергиэр эрэмбэлсэн шошго
        тул давхцлыг дайрахад ижил суурийн векторыг дагах албагүй.</p>
        <p><a href="#method-code">Спектрийн кодын хэсгийг харах</a> холбоосоор
        энергийн томьёо болон давхцлын тусгай тохиолдлыг шалга. Δ = λ = 0 үед
        код өөрийн чиглэл зохиохгүй; харгалзах төлөвийн үзүүлэлт байхгүйг
        самбар илэрхийлнэ.</p>`,
      exercises: [
        {
          id: 'F01',
          title: 'Огтлолцохгүй энергиудын завсар',
          question: 'Δ ≠ 0 үед энергийн хамгийн бага завсар болон доод төлөвийн найрлагыг аналитик томьёогоор урьдчилан ол.',
          steps: [
            'Δ = 0.6 эхлэх тохиргоог хэрэглэ. λ = −3, 0, +3 цэгүүдэд E± болон доод төлөвийн rx, rz-ийг таамагла.',
            'Доод салбарыг сонгоод спектр, Блохын вектор, нягтын матрицыг холбон шинжил. λ = 0 үед ямар x төлөв байгааг шалга.',
            'Δ = 0.3 болгоод шинэ спектр үүсгэ. Хамгийн бага завсар хэрхэн өөрчлөгдсөнийг ижил масштабаар харьцуул.',
            'Хоёр спектр эсвэл тоон хүснэгт, λ = 0-ийн төлөвийн матриц, хамгийн бага завсрын гар тооцоог өг.',
          ],
          check: 'Хамгийн бага завсар нь Δ = 0.6 үед 1.2, Δ = 0.3 үед 0.6. Эерэг Δ ба λ = 0 үед доод төлөв |−x⟩, дээд төлөв |+x⟩ байна.',
          hint: 'λ² хамгийн багадаа 0. Доод төлөвийн r нь h = (Δ,0,λ)-ийн эсрэг чиглэлтэй.',
          preset: 'family-avoided',
        },
        {
          id: 'F02',
          title: 'Давхцал дээр юу тодорхой үлдэх вэ?',
          question: 'Δ = 0 үед энергиуд огтлолцоно. Доод салбарын төлөв ба нэг тогтмол z суурийн төлөвийг дагах нь ижил үү?',
          steps: [
            'Δ = 0 эхлэх тохиргоог хэрэглэ. λ < 0, λ = 0, λ > 0 гэсэн гурван тохиолдолд доод энерги ба төлөвийг урьдчилан бич.',
            'λ = −0.6, 0, +0.6 цэгүүдэд спектр болон төлөвийн самбарыг хар. Тэг дээр өөрийн чиглэл өгөөгүйг тайлбарла; энергийн утгууд тодорхой хэвээр эсэхийг шалга.',
            'Тогтмол |+z⟩ төлөвийн энерги λ болохыг тооцоод эрэмбэлсэн доод энерги −|λ|-тай харьцуул.',
            'λ сонгогчийг хөдөлгөхөд физик шилжилтийн магадлал тооцогдохгүйг тайлбарла. Жинхэнэ хугацааны туршилтад нэмж өгөх гурван төрлийн өгөгдлийг нэрлэ.',
          ],
          check: 'Доод төлөв λ < 0 үед |+z⟩, λ > 0 үед |−z⟩. λ = 0-д хоёр энерги 0 боловч ганц доод/дээд өөрийн чиглэл тогтоогдоогүй. λ(t), анхны төлөв, хугацааны хувьслын тооцоо нь статик сканаас тусдаа.',
          hint: 'H = λσz-ийн хоёр суурийн энерги λ ба −λ. Энергиэр эрэмбэлэхэд доод шошго тэгийн хоёр талд өөр суурийн төлөвт шилжинэ.',
          preset: 'family-crossing',
        },
      ],
      project: {
        title: 'Энергийн шошго ба төлөвийн найрлага',
        question: 'Гурван Δ утгаар энергийн завсар ба доод төлөвийн өөрчлөлтийг харьцуул. Статик спектрээс ямар физик дүгнэлт хийж болохыг хязгаарла.',
        steps: [
          'Δ = 0.6, 0.2, 0 гэсэн гурван бүл үүсгэ. Бүгдэд λ = −3, −0.3, 0, 0.3, 3 цэгүүдийг хэрэглэ.',
          'Нийт 15 цэгт E−, E+, завсар, доод төлөвийн rx ба rz-ийг тэмдэглэ. Давхцлын ганц төлөвийн утгуудыг 0 гэж бөглөхгүй; тодорхой сонголтгүй гэж тэмдэглэ.',
          'Δ > 0 үед төлөв тасралтгүй өөрчлөгдөхийг, Δ = 0 үед доод салбарын хоёр талын хязгаар өөр болохыг тайлбарла. Нэг спектрийн зураг, нэг төлөвийн найрлагын хүснэгт өг.',
          'Аналитик томьёогоор дор хаяж гурван цэгийг шалга. Энэ судалгаанд физик хугацааны хуваарь болон анхны динамик төлөв байгаагүй тул шилжилтийн магадлалын дүгнэлт хийгээгүйгээ тодорхой бич.',
        ],
        check: 'Бүх цэгт E+ + E− = 0. Δ > 0 үед доод төлөвийн |r| = 1, хамгийн бага завсар 2Δ. Δ = λ = 0-д бүх өөрийн дэд огторгуй тодорхой, харин ганц салааны чиглэл онцгойлон сонгогдоогүй.',
      },
      glossaryHtml: `
        <dl class="glossary">
          <dt>Параметрийн бүл (parameter family)</dt><dd>λ бүрд тусдаа статик бодлого. λ нь хугацаа биш.</dd>
          <dt>Энергийн завсар (energy gap)</dt><dd>Дээд ба доод өөрийн утгын ялгаа E+ − E−.</dd>
          <dt>Проектор (projector)</dt><dd>Тухайн дэд огторгуй руу проекцлох P² = P = P† матриц. Нэг цэвэр төлөвт P = |ψ⟩⟨ψ| бөгөөд ерөнхий фазаас үл хамаарна.</dd>
          <dt>Давхцал (degeneracy)</dt><dd>Нэг өөрийн утгад олон хэмжээст дэд огторгуй харгалзах. Түүн дотор ганц вектор өөрөө ялгарахгүй.</dd>
        </dl>`,
    },
  },
  en: {
    time: {
      ...lessons.en,
      mathHtml: `
        <p>The inputs are an initial state
        <span class="formula">ρ₀ = (I + r₀ · σ)/2</span> and a fixed Hamiltonian
        <span class="formula">H = h · σ</span>. With ℏ = 1,
        <span class="formula">ρ(t) = U(t)ρ₀U(t)†</span>, where
        <span class="formula">U(t) = cos(|h|t)I − i sin(|h|t) ĥ · σ</span>.
        At h = 0, U = I.</p>
        <p>The Bloch component parallel to h stays fixed; its perpendicular
        component rotates with angular frequency 2|h|. Thus |r|, Tr(ρ²), and
        <span class="formula">⟨H⟩ = h · r</span> are conserved.
        When <span class="formula">[H,ρ₀] = 0</span>, the whole density matrix
        stays fixed. This includes pure or mixed states parallel to h; the
        maximally mixed state stays fixed for every constant H.</p>
        <p>For <span class="formula">H = σ<sub>z</sub>/2</span> and
        <span class="formula">r₀ = (1,0,0)</span>, we have
        <span class="formula">r(t) = (cos t, sin t, 0)</span>.
        The probabilities of the two z-basis energies are fixed, but their
        changing relative phase gives
        <span class="formula">p<sub>x</sub>(+) = (1 + cos t)/2</span>.
        This is interference between energy components.</p>
        <p>A pure energy eigenket may accumulate a global phase in the
        Schrödinger picture, while its density matrix and every measurement
        probability stay fixed. The amplitude inspector uses a chosen global
        phase convention; it does not measure an accumulated overall phase.</p>
        <p>Inspect a generated history using its t coordinate. Selecting t
        neither rotates the live preparation nor repeats a measurement. Generate
        a new result to investigate a different r₀ or Hamiltonian.</p>`,
      methodHtml: `
        <p><strong>Spectral evolution</strong> constructs U(t) and evaluates
        Uρ₀U†. <strong>Bloch rotation</strong> calculates the same state using an
        analytic vector rotation. Both solve the same fixed two-state model;
        their differences should be at numerical evaluation-error levels.</p>
        <p>There is no time-integration step. Sampling a history and drawing it
        on a finite screen introduce display limits. Many oscillations over a
        long interval may not be visually resolved; shorten the interval and
        check the actual time of selected samples.</p>
        <p><a href="#method-code">Inspect the spectral or rotation fragment</a>
        to connect the formula with the executing code. Changing this method
        does not select a different physical law: compare the calculations
        using identical inputs.</p>`,
      exercises: [
        {
          id: 'T01',
          title: 'From relative phase to observable oscillation',
          question: 'Use unitary evolution and Pauli measurements. Why can the x probability oscillate while energy probabilities remain fixed?',
          steps: [
            'Apply the |+x⟩ preparation, h = (0,0,0.5), and interval 0 ≤ t ≤ 2π. Predict r and the x/z probabilities.',
            'Generate a spectral-evolution history. Record actual sample times and r near t = 0, π/2, π, and 2π.',
            'Compare constant z-basis energy probabilities with oscillating x probabilities. Explain the difference through relative phase.',
            'Recalculate using Bloch rotation with identical r₀, H, and interval. Submit one figure and three hand-checked values.',
          ],
          check: 'r(t) = (cos t, sin t, 0), px(+) = (1 + cos t)/2, and pz(+) = 1/2. Both methods give the same r. Norm and purity remain 1, and mean energy remains 0.',
          hint: '|+x⟩ is an equal superposition of the two z-basis energies. Their energy difference is 1, so their relative phase changes through angle t.',
          preset: 'time-precession',
        },
        {
          id: 'T02',
          title: 'Initial state versus Hamiltonian direction',
          question: 'Why do an eigenstate’s observables stay fixed? What happens if the initial state stays fixed while the Hamiltonian direction changes?',
          steps: [
            'Apply the |+z⟩ preparation with H = σz/2 and interval 0 ≤ t ≤ 2π. Predict the density matrix and x/y/z probabilities.',
            'Generate a history and verify stationarity when r₀ is parallel to the Hamiltonian axis.',
            'Keep the initial |+z⟩ state, change H to σx/2, and generate a new history. Check rz(t) and the sign of the y rotation.',
            'Try both Hamiltonians with length 0, the maximally mixed state. Explain why this state is stationary even though it is not a pure eigenstate.',
          ],
          check: 'For H = σz/2, r = (0,0,1) stays fixed. For H = σx/2, r = (0,−sin t,cos t). The maximally mixed state has r = 0 and Tr(ρ²) = 1/2, fixed under every constant H.',
          hint: 'ρ̇ = −i[H,ρ], so a zero commutator gives a stationary density matrix. Equivalently, ṙ = 2h × r: rotation about +x from +z initially points toward −y.',
          preset: 'time-stationary',
        },
      ],
      project: {
        title: 'Separate preparation from Hamiltonian direction',
        question: 'Use three preparations and two fixed Hamiltonians to compare stationarity, interference, and agreement between methods.',
        steps: [
          'Pair each of |+x⟩, |+z⟩, and the maximally mixed state with H = σz/2 and H = σx/2. Predict which of these six physical configurations are stationary.',
          'Use 0 ≤ t ≤ 2π throughout. Record the three Bloch components, x/z probabilities, Tr(ρ²), and ⟨H⟩.',
          'Calculate each configuration with spectral evolution and Bloch rotation. Bound the work at six configurations and two methods: 12 calculations.',
          'Submit two representative figures, a stationary/rotating classification, one analytic reference, and numerical/display limitations. Check that moving the cursor preserves the history’s input.',
        ],
        check: 'A preparation commuting with H has stationary observables. The remaining pure preparations rotate with angular frequency 1. All six configurations conserve |r|, Tr(ρ²), and ⟨H⟩.',
      },
      glossaryHtml: `
        <dl class="glossary">
          <dt>Initial state ρ₀ / анхны төлөв</dt><dd>The preparation captured by a generated history. Moving its viewing cursor does not change it.</dd>
          <dt>Hamiltonian axis h / гамильтонианы тэнхлэг</dt><dd>Sets the Bloch rotation axis; the angular frequency is 2|h|.</dd>
          <dt>Stationary state / стационар төлөв</dt><dd>A density matrix commuting with H, with time-independent observable predictions.</dd>
          <dt>Interference / интерференц</dt><dd>Changing relative phases between energy components can change probabilities in other bases.</dd>
        </dl>`,
    },
    family: {
      ...lessons.en,
      mathHtml: `
        <p>This experiment studies a parameter family,
        <span class="formula">H(λ) = Δσ<sub>x</sub> + λσ<sub>z</sub></span>,
        rather than a time evolution. Each λ defines a separate eigenproblem.
        Its energies are <span class="formula">E<sub>±</sub> = ±√(Δ² + λ²)</span>,
        with gap <span class="formula">E<sub>+</sub> − E<sub>−</sub> = 2√(Δ² + λ²)</span>.</p>
        <p>For Δ ≠ 0 the energies avoid crossing; their minimum gap is 2|Δ|
        at λ = 0. Away from degeneracy, the eigenprojectors have Bloch vectors
        <span class="formula">r<sub>±</sub> = ±(Δ,0,λ)/√(Δ² + λ²)</span>.
        Compare state composition through these projectors or probabilities,
        which are independent of arbitrary eigenvector global phases.</p>
        <p>For Δ = 0, the ordered energies are ±|λ|. The lower-energy state
        has different z character on opposite sides of zero. At λ = 0, H = 0
        and the entire two-dimensional space is the zero-energy eigenspace.
        Its projector I is defined, but no individual lower/upper direction
        is distinguished. Zero energy does not mean a zero state vector.</p>
        <p>The λ cursor inspects these static problems. A physical passage
        requires a schedule λ(t), an initial state, and time-dependent
        propagation. Browsing lower-energy eigenstates does not establish
        that a prepared system follows the lower level.</p>`,
      methodHtml: `
        <p>Analytic two-dimensional formulas give the energies and, away from
        degeneracy, their projectors at each λ point. This is parameter
        sampling, not time stepping or an adiabatic approximation.</p>
        <p>Generate a new family after changing Δ. Compare results with the
        same energy and λ scales. Lower/upper labels follow ordered energies,
        so they need not follow one fixed basis vector across a crossing.</p>
        <p><a href="#method-code">Inspect the spectrum fragment</a> to check
        the energy formula and the degenerate case. At Δ = λ = 0 the code
        supplies no invented eigenaxis; affected state inspectors explain
        that an individual state has not been selected.</p>`,
      exercises: [
        {
          id: 'F01',
          title: 'The gap at an avoided crossing',
          question: 'Predict the minimum energy gap and lower-state composition for Δ ≠ 0 using the analytic formulas.',
          steps: [
            'Apply Δ = 0.6. Predict E± and the lower state’s rx, rz at λ = −3, 0, +3.',
            'Select the lower branch and link the spectrum, Bloch vector, and density matrix. Identify the x state at λ = 0.',
            'Set Δ = 0.3 and generate another spectrum. Compare the minimum gaps on the same scales.',
            'Submit two spectra or a numerical table, the λ = 0 state matrix, and a hand derivation of the minimum gap.',
          ],
          check: 'The minimum gaps are 1.2 at Δ = 0.6 and 0.6 at Δ = 0.3. For positive Δ and λ = 0, the lower state is |−x⟩ and the upper is |+x⟩.',
          hint: 'λ² is minimized at zero. The lower Bloch vector points opposite h = (Δ,0,λ).',
          preset: 'family-avoided',
        },
        {
          id: 'F02',
          title: 'What remains defined at degeneracy?',
          question: 'At Δ = 0 the energies cross. Is following the lower branch the same as following one fixed z-basis state?',
          steps: [
            'Apply Δ = 0. Predict the lower energy and state for λ < 0, λ = 0, and λ > 0.',
            'Inspect λ = −0.6, 0, +0.6. Explain why the state inspector supplies no selected eigenaxis at zero, and check that the energies remain defined.',
            'Calculate the fixed |+z⟩ state’s energy λ and compare it with the ordered lower energy −|λ|.',
            'Explain why moving the λ cursor computes no physical transition probability. Name three additional ingredients needed for an actual time experiment.',
          ],
          check: 'The lower state is |+z⟩ for λ < 0 and |−z⟩ for λ > 0. At zero both energies are 0, but no individual lower/upper direction is distinguished. A schedule λ(t), an initial state, and time-dependent propagation are separate from the scan.',
          hint: 'The fixed z-basis energies of H = λσz are λ and −λ. Ordering them transfers the lower label between basis states on opposite sides of zero.',
          preset: 'family-crossing',
        },
      ],
      project: {
        title: 'Energy labels and state composition',
        question: 'Compare gaps and lower-state composition for three couplings. State what physical conclusions the static spectra do and do not supply.',
        steps: [
          'Generate Δ = 0.6, 0.2, and 0. Use λ = −3, −0.3, 0, 0.3, 3 for each family.',
          'At these 15 points, record E−, E+, the gap, and lower-state rx, rz. Mark the individual state as unselected at degeneracy instead of filling its quantities with zeros.',
          'Explain continuous state change for Δ > 0 and the distinct one-sided limits at Δ = 0. Submit one spectrum figure and a state-composition table.',
          'Check at least three points analytically. Explicitly state that no physical transition probability was determined, because this study specified neither a time schedule nor an initial dynamical state.',
        ],
        check: 'E+ + E− = 0 throughout. For Δ > 0 the lower state has |r| = 1 and minimum gap 2Δ. At Δ = λ = 0 the whole eigenspace is defined, while an individual branch direction is not distinguished.',
      },
      glossaryHtml: `
        <dl class="glossary">
          <dt>Parameter family / параметрийн бүл</dt><dd>A separate static problem for each λ; λ is not time.</dd>
          <dt>Energy gap / энергийн завсар</dt><dd>The difference E+ − E− between ordered eigenvalues.</dd>
          <dt>Projector / проектор</dt><dd>A matrix P² = P = P† selecting a subspace. For one pure state, P = |ψ⟩⟨ψ| is independent of global phase.</dd>
          <dt>Degeneracy / давхцал</dt><dd>A multidimensional eigenspace for one eigenvalue, without a distinguished individual vector inside it.</dd>
        </dl>`,
    },
  },
};

/** Returns authored content only. Opening it never applies a preset. */
export function lessonContent(lang          , mode                  = 'state')                {
  return mode === 'state' ? lessons[lang] : contextual[lang][mode];
}
