/*
  =====================================================
  MEDICost Pro v2.5 — 심평원 전체 수가 코드 기반 계산기
  =====================================================
  건강보험심사평가원의 수가 데이터를 기반으로 계산을 처리하는 스크립트입니다.
  검색 및 추가 인터페이스를 [검사], [시술], [수술] 3대 대분류 탭으로 구분하고,
  각 대분류 내에서 직접 선택(셀렉트 박스)과 자연어/의학 용어 검색이 동시에 가능하도록 제공합니다.
  "기타 처치, 주사, 마취 등"은 접이식 아코디언 버튼을 클릭하면 활성화되어 선택/검색이 가능해집니다.

  ★ 자료 기준: 2025년 1월 고시 기준 (환산지수 94.1원/점)
  ★ 초보자 교육용 상세 설명과 풍부한 한글 주석을 제공합니다.
*/

// =========================================================
// 1. 심평원 수가 데이터베이스 (DB 객체)
// =========================================================
const DB = {

    /* ---------------------------------------------------
       A. 병원 등급별 기본 세팅
       - 2025년 기준 환산지수: 의원 94.1원, 병원급 이상 82.2원
       - 종별 가산: 의원 15%, 병원 20%, 종합병원 25%, 상급종합 30%
       - 외래 본인부담: 의원 30%, 병원 40%, 종합 50%, 상급종합 60%
       - 입원 본인부담: 전 등급 20%
     --------------------------------------------------- */
    HOSPITAL_CLASS: {
        clinic: {
            name: "동네 의원",
            gasanRate: 1.15,
            outpatientRate: 0.30,
            inpatientRate: 0.20,
            baseConsult: 17000,
            erFee: 20000,
            roomStandard: 40000
        },
        hospital: {
            name: "일반 병원",
            gasanRate: 1.20,
            outpatientRate: 0.40,
            inpatientRate: 0.20,
            baseConsult: 19000,
            erFee: 50000,
            roomStandard: 55000
        },
        general_hospital: {
            name: "종합병원",
            gasanRate: 1.25,
            outpatientRate: 0.50,
            inpatientRate: 0.20,
            baseConsult: 21000,
            erFee: 70000,
            roomStandard: 75000
        },
        tertiary_hospital: {
            name: "대학병원 (상급종합)",
            gasanRate: 1.30,
            outpatientRate: 0.60,
            inpatientRate: 0.20,
            baseConsult: 23000,
            erFee: 90000,
            roomStandard: 100000
        }
    },

    // 상급병실(1~2인실) 비급여 1일 추가 차액
    ROOM_PREMIUM_ADD: 150000,

    /* ---------------------------------------------------
       B. 입원 시 일일 기본 부대비용 자동 산정 기준표
       - 실제 입원 시 별도 청구되는 주사/투약/처치/식대를
         소비자가 일일이 입력할 수 없으므로 자동 산정합니다.
     --------------------------------------------------- */
    INPATIENT_DAILY_EXTRAS: {
        injection_med: { name: "주사·수액·투약료", price: 25000, isBenefit: true },
        nursing_care: { name: "간호·기본처치료", price: 15000, isBenefit: true },
        meal: { name: "식대 (3식)", price: 13000, isBenefit: true }
    },

    /* ---------------------------------------------------
       C. 수술 시 마취 자동 추정 기준표
       - 수술 금액 규모에 따라 마취 종류와 비용을 자동 추정합니다.
     --------------------------------------------------- */
    ANESTHESIA_AUTO: [
        { maxPrice: 300000,   name: "국소마취 (자동추정)",           price: 30000,  isBenefit: true },
        { maxPrice: 1000000,  name: "의식하진정 마취 (자동추정)",    price: 50000,  isBenefit: true },
        { maxPrice: 2000000,  name: "부분마취(척추/경막외) (자동추정)", price: 120000, isBenefit: true },
        { maxPrice: 5000000,  name: "전신마취 1~2시간 (자동추정)",  price: 300000, isBenefit: true },
        { maxPrice: Infinity, name: "전신마취 2시간+ (자동추정)",   price: 450000, isBenefit: true }
    ],

    /* ---------------------------------------------------
       D. 실비보험 세대별 보장 비율 및 한도
     --------------------------------------------------- */
    INSURANCE_RATES: {
        gen1: { name: "1세대 (~2009.7)", benefitRate: 1.00, nonBenefitRate: 1.00 },
        gen2: { name: "2세대 (2009.8~2017.3)", benefitRate: 0.90, nonBenefitRate: 0.90 },
        gen3: { name: "3세대 (2017.4~2021.6)", benefitRate: 0.90, nonBenefitRate: 0.80 },
        gen4: { name: "4세대 (2021.7~현재)", benefitRate: 0.80, nonBenefitRate: 0.70 }
    },
    SANJEONG_SPECIAL_RATES: {
        cancer: { name: "중증 암 환자", rate: 0.05 },
        heart: { name: "심장질환 수술 환자", rate: 0.05 },
        cerebro: { name: "뇌혈관질환 수술 환자", rate: 0.05 },
        burn: { name: "중증 화상 환자", rate: 0.05 },
        rare: { name: "희귀질환자", rate: 0.10 },
        intractable: { name: "중증난치질환자", rate: 0.10 },
        dementia: { name: "중증치매 환자", rate: 0.10 },
        tuberculosis: { name: "결핵 산정특례 대상자", rate: 0.00 }
    },
    NON_BENEFIT_PUBLIC_PRICE_DATA: {
        reference: "국민건강보험 비급여 항목별 가격정보 공개 화면, 2026-05-23 확인",
        defaultRegion: "national",
        regions: {
            national: { name: "전국" }
        },
        items: {
            PR_RE04: {
                nhisCode: "MX1220000",
                nhisName: "도수치료",
                regionPrices: {
                    national: { median: 100000, min: 30000 }
                }
            },
            IM_MR05: {
                nhisCode: "HE5200000",
                nhisName: "슬관절 MRI 3차원",
                regionPrices: {
                    national: { median: 550000, min: 400000 }
                }
            },
            IM_MR06: {
                nhisCode: "HE5150000",
                nhisName: "견관절 MRI 3차원",
                regionPrices: {
                    national: { median: 550000, min: 400000 }
                }
            }
        }
    },
    OUTPATIENT_LIMIT: 250000,
    DATA_REFERENCE_DATE: "급여 수가: 2025년 1월 고시 기준 / 일부 비급여: 2026년 5월 23일 공식 공개 중앙값 확인"
};


// =========================================================
// 2. 상태 변수 (사용자가 추가한 항목 저장)
// =========================================================
let addedTests = [];
let addedSurgeries = [];
let addedProcedures = [];
let testIdCounter = 0;
let surgeryIdCounter = 0;
let procedureIdCounter = 0;

let activeTab = 'test'; // 현재 활성화된 카테고리 탭 (기본값: 검사)
let etcAccordionOpen = false; // 기타 처치 아코디언의 펼침 여부 상태
let resultRequested = false;

const EMERGENCY_SEVERITY_CODE_MAP = {
    mild: 'ER_LG01',
    moderate: 'ER_MD01',
    severe: 'ER_ST01'
};

const DATA_SOURCE_CONFIG = {
    apiBaseUrl: (typeof window !== 'undefined' && window.MEDICOST_API_BASE_URL) ? window.MEDICOST_API_BASE_URL : '',
    nonBenefitRegionPricesPath: '/api/nonbenefit/region-prices',
    nonBenefitCodeMapPath: '/api/nonbenefit/code-map'
};

const nonBenefitDataState = {
    prices: null,
    codeMap: null,
    sourceType: 'static',
    statusText: '정적 공개자료 기준'
};

const publicMedicalStatsState = {
    stats: (typeof window !== 'undefined' && window.MEDICAL_STATISTICS) ? window.MEDICAL_STATISTICS : null,
    sourceType: (typeof window !== 'undefined' && window.MEDICAL_STATISTICS) ? 'local-csv' : 'none'
};

const VISIT_TYPE_MAP = {
    outpatient: '외래',
    er: '외래',
    inpatient: '입원'
};

function getVisitTypeLabel(treatmentType) {
    return VISIT_TYPE_MAP[treatmentType] || '외래';
}

function normalizeDiseaseCodeInput(value) {
    return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')
        .replace(/\./g, '');
}

function getDiseaseStatistics(code, treatmentType) {
    const normalizedCode = normalizeDiseaseCodeInput(code);
    const stats = publicMedicalStatsState.stats;
    if (!normalizedCode || !stats || !stats.diseases) return null;

    const visitType = getVisitTypeLabel(treatmentType);
    const exact = stats.diseases[`${normalizedCode}|${visitType}`];
    if (exact) return { code: normalizedCode, visitType, stat: exact, matchType: 'exact' };

    const shortCode = normalizedCode.slice(0, 3);
    const prefix = Object.keys(stats.diseases).find(key => key.startsWith(`${shortCode}|`) && key.endsWith(`|${visitType}`));
    if (!prefix) return null;

    return { code: shortCode, visitType, stat: stats.diseases[prefix], matchType: 'prefix' };
}

function getActionStatistics(item, treatmentType) {
    const stats = publicMedicalStatsState.stats;
    const actionCode = item && (item.publicActionCode || item.actionCode || item.ediCode);
    if (!stats || !stats.actions || !actionCode) return null;

    const visitType = getVisitTypeLabel(treatmentType);
    const stat = stats.actions[`${actionCode}|${visitType}`];
    if (!stat || !stat.avgClaimPerUse) return null;

    return { actionCode, visitType, stat };
}

function applyPublicStatsToItem(item) {
    const treatmentType = document.querySelector('input[name="treatment_type"]:checked')?.value || 'outpatient';
    const actionStats = getActionStatistics(item, treatmentType);
    if (!actionStats) return { ...item };

    return {
        ...item,
        price: actionStats.stat.avgClaimPerUse,
        alreadyPricedByProvider: true,
        publicStatsSource: `2024 공공데이터 행위코드 ${actionStats.actionCode} ${actionStats.visitType} 평균`
    };
}

function getMedicalItemDatabase() {
    const publicFeeItems = (typeof window !== 'undefined' && window.PUBLIC_FEE_SCHEDULE_ITEMS && Array.isArray(window.PUBLIC_FEE_SCHEDULE_ITEMS.items))
        ? window.PUBLIC_FEE_SCHEDULE_ITEMS.items
        : [];
    return HIRA_DATABASE.concat(publicFeeItems);
}

function resolveProviderPrice(item) {
    const hospitalClass = document.querySelector('input[name="hospital_class"]:checked')?.value || 'hospital';
    if (hospitalClass === 'clinic' && item.clinicPrice) return item.clinicPrice;
    if (item.hospitalPrice) return item.hospitalPrice;
    return item.price;
}

function getBenefitChargeBase(item, hData) {
    const base = item.basePrice || 0;
    return item.alreadyPricedByProvider ? base : base * hData.gasanRate;
}


// =========================================================
// 3. 문서 로드 완료 시 초기화
// =========================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 폼 변경 이벤트 연동
    const form = document.getElementById('calculator-form');
    if (form) {
        form.addEventListener('change', handleCalculatorInputChange, true);
    }

    // 심평원 고시 자료 기준일 렌더링
    const dateEl = document.getElementById('data-reference-date');
    if (dateEl) dateEl.innerText = DB.DATA_REFERENCE_DATE;

    // 백엔드 API가 있으면 우선 사용하고, 없으면 정적 공개자료로 계산을 유지
    await initializeDataSources();

    // 비급여 지역별 공개자료가 있으면 지역 선택 목록을 자동 구성
    populateNonBenefitRegions();

    // 대분류 탭 초기화 및 바인딩
    switchTab('test');
    
    // 기타 처치 드롭다운 목록 채우기
    renderDirectSelectOptions('etc', 'etc');

    // 검색 이벤트 초기화 (대분류 검색창 및 기타 검색창 개별 등록)
    initSearchEvents();

    // 초기 결과 영역은 필수 조건 선택 전까지 잠근다.
    resetResultView();
    updateResultButtonState();
});


// =========================================================
// 4. UI 탭 및 아코디언 제어 함수
// =========================================================

/** 
 * 카테고리 탭 전환 처리 함수
 * @param {string} tabId - 전환할 탭 아이디 ('test', 'procedure_hira', 'surgery')
 */
function switchTab(tabId) {
    activeTab = tabId;
    
    // 탭 버튼 active 클래스 전환 적용
    document.querySelectorAll('.category-tabs .tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 직접 선택 셀렉트 박스의 옵션들을 현재 활성 탭에 맞춰서 갱신
    renderDirectSelectOptions('category', tabId);
    
    // 하단 추천 검색어 키워드 칩 목록 갱신
    renderRecommendChips(tabId);
    
    // 검색 입력값 및 검색 결과 목록 초기화
    const searchInput = document.getElementById('category-search-input');
    const btnClear = document.getElementById('btn-clear-category-search');
    const resultsList = document.getElementById('category-search-results');
    const btnRun = document.getElementById('btn-run-category-search');
    
    if (searchInput) searchInput.value = '';
    if (btnClear) btnClear.classList.add('hidden');
    if (btnRun) {
        btnRun.disabled = true;
        btnRun.classList.remove('active');
    }
    if (resultsList) {
        resultsList.innerHTML = '';
        resultsList.classList.add('hidden');
    }
}

function getRequiredCalculationSelections() {
    const hospitalClassEl = document.querySelector('input[name="hospital_class"]:checked');
    const treatmentTypeEl = document.querySelector('input[name="treatment_type"]:checked');
    const regionEl = document.getElementById('nonbenefit_region');

    return {
        hospitalClass: hospitalClassEl ? hospitalClassEl.value : '',
        treatmentType: treatmentTypeEl ? treatmentTypeEl.value : '',
        nonBenefitRegion: regionEl ? regionEl.value : ''
    };
}

function isCalculationReady() {
    const selections = getRequiredCalculationSelections();
    return Boolean(selections.hospitalClass && selections.treatmentType && selections.nonBenefitRegion);
}

function getMissingCalculationLabels() {
    const selections = getRequiredCalculationSelections();
    const missing = [];

    if (!selections.hospitalClass) missing.push('병원 등급');
    if (!selections.treatmentType) missing.push('진료 형태');
    if (!selections.nonBenefitRegion) missing.push('비급여 기준 지역');

    return missing;
}

function updateResultButtonState() {
    const btn = document.getElementById('btn-show-result');
    const message = document.getElementById('result-ready-message');
    const ready = isCalculationReady();

    if (btn) {
        btn.classList.toggle('needs-selection', !ready);
    }
    if (!message) return;

    if (ready) {
        message.classList.remove('warning');
        message.innerText = resultRequested
            ? '선택 조건 기준으로 결과를 계산했습니다. 조건을 바꾸면 다시 결과보기를 눌러주세요.'
            : '필수 조건이 모두 선택되었습니다. 결과보기를 눌러 예상 병원비를 계산하세요.';
    } else {
        message.classList.add('warning');
        message.innerText = `${getMissingCalculationLabels().join(', ')} 선택 후 결과를 조회할 수 있습니다.`;
    }
}

function resetResultView() {
    const finalCostEl = document.getElementById('display_final_cost');
    const totalCostEl = document.getElementById('display_total_cost');
    const refundCostEl = document.getElementById('display_refund_cost');
    const rangeEl = document.getElementById('display_cost_range');
    const tableBody = document.getElementById('cost-table-body');
    const comparisonBody = document.getElementById('comparison-table-body');
    const insuranceBox = document.getElementById('result_insurance_box');
    const drgNotice = document.getElementById('drg-notice');

    if (finalCostEl) finalCostEl.innerText = '0';
    if (totalCostEl) totalCostEl.innerText = '0';
    if (refundCostEl) refundCostEl.innerText = '0';
    if (rangeEl) rangeEl.innerText = '0원 ~ 0원';
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="3" class="empty-row">결과보기를 누르면 세부 산출 내역이 표시됩니다.</td></tr>';
    if (comparisonBody) comparisonBody.innerHTML = '<tr><td colspan="3" class="empty-row">필수 조건 선택 후 결과보기를 눌러주세요.</td></tr>';
    if (insuranceBox) insuranceBox.classList.add('hidden');
    if (drgNotice) drgNotice.classList.add('hidden');
}

function markResultStale() {
    resultRequested = false;
    resetResultView();
    updateResultButtonState();
}

function handleCalculatorInputChange() {
    markResultStale();
}

function requestCalculation() {
    updateResultButtonState();
    if (!isCalculationReady()) {
        const missingLabels = getMissingCalculationLabels();
        const message = `${missingLabels.join(', ')}을(를) 선택해야 결과를 조회할 수 있습니다.`;
        const messageEl = document.getElementById('result-ready-message');
        if (messageEl) {
            messageEl.classList.add('warning');
            messageEl.innerText = message;
        }
        alert(message);
        return;
    }

    resultRequested = true;
    calculate();
}

/**
 * 탭 또는 기타 처치 영역의 직접 선택 셀렉트 박스 옵션 동적 렌더링 함수
 * @param {string} target - 대상 구분 ('category': 대분류 탭, 'etc': 기타 처치)
 * @param {string} groupOrTab - 매핑될 그룹 코드 ('test', 'procedure_hira', 'surgery', 'etc')
 */
function renderDirectSelectOptions(target, groupOrTab) {
    const selectEl = target === 'category' 
        ? document.getElementById('category-direct-select')
        : document.getElementById('etc-direct-select');
        
    if (!selectEl) return;
    
    selectEl.innerHTML = '';
    
    // 기본 플레이스홀더 성격의 비활성 옵션 추가
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.text = target === 'category' ? '-- 추가할 항목 직접 선택 --' : '-- 기타 처치/주사/마취 직접 선택 --';
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    selectEl.appendChild(defaultOpt);
    
    // HIRA_DATABASE의 전체 수가 항목 중 해당 그룹에 매핑되는 항목 필터링
    const filtered = getMedicalItemDatabase().filter(item => getItemTypeGroup(item) === groupOrTab && !isEmergencyManagementItem(item));
    
    // 항목 명칭 기준 가나다 사전 순 정렬
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
    
    // 옵션 추가
    filtered.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.code;
        const benefitText = item.isBenefit ? '급여' : '비급여';
        opt.text = `[${benefitText}] ${item.name} (${formatNumber(item.price)}원)`;
        selectEl.appendChild(opt);
    });
}

/**
 * 직접선택 드롭다운 변경 감지 핸들러
 * @param {string} selectType - 변경이 감지된 셀렉트박스 구분 ('category' / 'etc')
 */
function handleDirectSelectChange(selectType) {
    const selectEl = selectType === 'category' 
        ? document.getElementById('category-direct-select')
        : document.getElementById('etc-direct-select');
        
    if (!selectEl || selectEl.value === '') return;
    
    const selectedCode = selectEl.value;
    // 선택된 수가 항목 DB에서 검색 후 추가
    const matchedItem = getMedicalItemDatabase().find(item => item.code === selectedCode);
    
    if (matchedItem) {
        sendSearchLog(matchedItem.name, 1);
        sendSearchClickLog(matchedItem.name, matchedItem);
        addHiraItem(matchedItem);
    }
    
    // 선택 완료 후 다시 플레이스홀더 기본 옵션으로 리셋
    selectEl.value = '';
}

/**
 * 활성 탭 카테고리에 상응하는 대표 인기 검색어 칩 목록 생성
 * @param {string} tabId - 활성화된 탭 아이디
 */
function renderRecommendChips(tabId) {
    const chipsListEl = document.getElementById('recommend-chips-list');
    if (!chipsListEl) return;
    
    chipsListEl.innerHTML = '';
    
    let keywords = [];
    if (tabId === 'test') {
        keywords = ['허리 MRI', '뇌 CT', '수면 위내시경', '복부 초음파', '심전도'];
    } else if (tabId === 'procedure_hira') {
        keywords = ['스케일링', '임플란트', '스텐트 시술', '쇄석술', '폐렴 입원'];
    } else if (tabId === 'surgery') {
        keywords = ['맹장 수술', '무릎 관절경', '허리디스크 수술', '백내장 수술', '제왕절개'];
    }
    
    keywords.forEach(kw => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'search-chip';
        btn.innerText = kw;
        btn.setAttribute('onclick', `searchByChip('${kw}')`);
        chipsListEl.appendChild(btn);
    });
}

/** 
 * 기타 처치, 주사, 마취 등 아코디언 토글 제어 
 */
function toggleEtcAccordion() {
    const trigger = document.querySelector('.etc-accordion-trigger');
    const body = document.getElementById('etc-accordion-body');
    
    etcAccordionOpen = !etcAccordionOpen;
    if (etcAccordionOpen) {
        body.classList.remove('hidden');
        trigger.classList.add('active');
    } else {
        body.classList.add('hidden');
        trigger.classList.remove('active');
    }
}

/**
 * 추가된 리스트 내에서 기타(etc) 탭에 해당하는 항목이 총 몇 개인지 파악해 배지를 갱신합니다.
 */
function updateEtcAddedBadge() {
    const badgeEl = document.getElementById('etc-added-badge');
    if (!badgeEl) return;
    
    let etcCount = 0;
    
    // addedTests에서 기타 항목 카운트
    addedTests.forEach(item => {
        const dbItem = getMedicalItemDatabase().find(db => db.code === item.type);
        if (dbItem && getItemTypeGroup(dbItem) === 'etc') etcCount += item.count;
    });
    
    // addedSurgeries에서 기타 항목 카운트
    addedSurgeries.forEach(item => {
        const dbItem = getMedicalItemDatabase().find(db => db.code === item.type);
        if (dbItem && getItemTypeGroup(dbItem) === 'etc') etcCount++;
    });
    
    // addedProcedures에서 기타 항목 카운트
    addedProcedures.forEach(item => {
        const dbItem = getMedicalItemDatabase().find(db => db.code === item.type);
        if (dbItem && getItemTypeGroup(dbItem) === 'etc') etcCount += item.count;
    });
    
    if (etcCount > 0) {
        badgeEl.innerText = `${etcCount}개 추가됨`;
        badgeEl.style.display = 'inline-block';
    } else {
        badgeEl.style.display = 'none';
    }
}

/** 진료 형태 변경 시 입원 세부 필드 토글 */
function toggleTreatmentDetails() {
    const treatmentTypeEl = document.querySelector('input[name="treatment_type"]:checked');
    const treatmentType = treatmentTypeEl ? treatmentTypeEl.value : '';
    const hospitalizationSection = document.getElementById('hospitalization_details');
    const emergencySection = document.getElementById('emergency_details');
    if (treatmentType === 'inpatient') {
        hospitalizationSection.classList.remove('hidden');
    } else {
        hospitalizationSection.classList.add('hidden');
    }

    if (treatmentType === 'er') {
        emergencySection.classList.remove('hidden');
    } else {
        emergencySection.classList.add('hidden');
    }
    calculate();
}

/** 실비보험 환급 토글 */
function toggleInsuranceSection() {
    const hasInsurance = document.getElementById('has_insurance').checked;
    const detailsSection = document.getElementById('insurance_details');
    const resultBox = document.getElementById('result_insurance_box');
    if (hasInsurance) {
        detailsSection.classList.remove('hidden');
        resultBox.classList.remove('hidden');
    } else {
        detailsSection.classList.add('hidden');
        resultBox.classList.add('hidden');
    }
    calculate();
}

/** 산정특례 토글 */
function toggleSanjeongSpecial() {
    const hasSanjeong = document.getElementById('has_sanjeong').checked;
    const detailsSection = document.getElementById('sanjeong_details');
    if (hasSanjeong) {
        detailsSection.classList.remove('hidden');
    } else {
        detailsSection.classList.add('hidden');
    }
    calculate();
}

/** 입원 일수 조절 버튼 */
function adjustDays(amount) {
    const input = document.getElementById('stay_days');
    if (!input) return;
    let val = parseInt(input.value, 10) || 1;
    val = Math.max(1, Math.min(90, val + amount));
    input.value = val;
    calculate();
}

/** 영수증 상세 명세서 아코디언 토글 */
function toggleAccordion() {
    const trigger = document.querySelector('.accordion-trigger');
    const content = document.getElementById('accordion-content');
    const icon = document.getElementById('accordion-icon');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        trigger.classList.add('active');
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        trigger.classList.remove('active');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

/** 금액 포맷 (1,000 단위 쉼표 추가) */
function formatNumber(num) {
    return Math.round(num).toLocaleString('ko-KR');
}

/** 선택된 산정특례 유형의 급여 본인부담률 정보 */
function getSanjeongSpecialInfo() {
    const hasSanjeong = document.getElementById('has_sanjeong').checked;
    if (!hasSanjeong) return null;

    const selectedType = document.getElementById('sanjeong_disease').value || 'cancer';
    return DB.SANJEONG_SPECIAL_RATES[selectedType] || DB.SANJEONG_SPECIAL_RATES.cancer;
}

function isEmergencyManagementItem(item) {
    return item && item.code && item.code.startsWith('ER_');
}

function getEmergencySeverityInfo() {
    const severity = document.getElementById('er_severity').value || 'mild';
    const code = EMERGENCY_SEVERITY_CODE_MAP[severity] || EMERGENCY_SEVERITY_CODE_MAP.mild;
    const item = getMedicalItemDatabase().find(dbItem => dbItem.code === code);
    return item || { code, name: '응급실 경증 진료 (응급의료 관리료 경증 환자)', price: 20000, isBenefit: true };
}

async function initializeDataSources() {
    loadStaticNonBenefitData();

    if (typeof fetch === 'function' && isHttpRuntime()) {
        await loadBackendNonBenefitData();
    }

    renderDataSourceStatus();
}

function loadStaticNonBenefitData() {
    if (typeof window === 'undefined') return;
    if (!window.NONBENEFIT_REGION_PRICES || !window.NONBENEFIT_CODE_MAP) return;
    if (!window.NONBENEFIT_REGION_PRICES.items) return;

    nonBenefitDataState.prices = window.NONBENEFIT_REGION_PRICES;
    nonBenefitDataState.codeMap = window.NONBENEFIT_CODE_MAP;
    nonBenefitDataState.sourceType = 'static';
    nonBenefitDataState.statusText = `정적 공개자료 사용 중 (${window.NONBENEFIT_REGION_PRICES.fetchedAt || '수집일 미상'} 기준)`;
}

async function loadBackendNonBenefitData() {
    const baseUrl = DATA_SOURCE_CONFIG.apiBaseUrl.replace(/\/$/, '');
    const pricesUrl = `${baseUrl}${DATA_SOURCE_CONFIG.nonBenefitRegionPricesPath}`;
    const codeMapUrl = `${baseUrl}${DATA_SOURCE_CONFIG.nonBenefitCodeMapPath}`;

    try {
        const [pricesResponse, codeMapResponse] = await Promise.all([
            fetch(pricesUrl, { cache: 'no-store' }),
            fetch(codeMapUrl, { cache: 'no-store' })
        ]);

        if (!pricesResponse.ok || !codeMapResponse.ok) return;

        const [prices, codeMap] = await Promise.all([
            pricesResponse.json(),
            codeMapResponse.json()
        ]);

        if (!prices || !prices.items || !codeMap) return;

        nonBenefitDataState.prices = prices;
        nonBenefitDataState.codeMap = codeMap;
        nonBenefitDataState.sourceType = 'backend';
        nonBenefitDataState.statusText = `백엔드 최신자료 사용 중 (${prices.fetchedAt || '갱신일 미상'} 기준)`;
    } catch (error) {
        // 백엔드가 아직 없거나 일시 실패해도 정적 자료로 계산을 계속한다.
    }
}

function isHttpRuntime() {
    if (typeof window === 'undefined') return false;
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

function renderDataSourceStatus() {
    const statusEl = document.getElementById('data-source-status');
    if (!statusEl) return;
    statusEl.textContent = nonBenefitDataState.statusText || '비급여 데이터 준비 중';
}

function getNonBenefitRegionData() {
    if (!nonBenefitDataState.prices || !nonBenefitDataState.codeMap) return null;
    if (!nonBenefitDataState.prices.items) return null;
    return {
        prices: nonBenefitDataState.prices,
        codeMap: nonBenefitDataState.codeMap,
        sourceType: nonBenefitDataState.sourceType
    };
}

function collectExternalNonBenefitRegions() {
    const externalData = getNonBenefitRegionData();
    if (!externalData) return {};

    return Object.values(externalData.prices.items).reduce((regions, publicItem) => {
        Object.entries(publicItem.regions || {}).forEach(([code, region]) => {
            if (!regions[code]) regions[code] = { name: region.name || code };
        });
        return regions;
    }, {});
}

function populateNonBenefitRegions() {
    const regionEl = document.getElementById('nonbenefit_region');
    if (!regionEl) return;

    const externalRegions = collectExternalNonBenefitRegions();
    const hasExternalRegions = Object.keys(externalRegions).length > 0;
    const regions = hasExternalRegions ? externalRegions : DB.NON_BENEFIT_PUBLIC_PRICE_DATA.regions;
    const regionEntries = Object.entries(regions).sort(([a], [b]) => a.localeCompare(b, 'ko'));

    const options = ['<option value="" selected>-- 비급여 가격 기준 지역 선택 --</option>'];
    options.push(...regionEntries.map(([code, region]) => {
        return `<option value="${code}">${region.name}</option>`;
    }));
    regionEl.innerHTML = options.join('');

    regionEl.addEventListener('change', () => {
        setStoredNonBenefitRegion(regionEl.value);
    });
}

function getStoredNonBenefitRegion() {
    try {
        return localStorage.getItem('nonbenefit_region');
    } catch (error) {
        return null;
    }
}

function setStoredNonBenefitRegion(regionCode) {
    try {
        localStorage.setItem('nonbenefit_region', regionCode);
    } catch (error) {
        // 로컬 파일 실행 환경에서 저장소가 막혀도 계산은 계속 진행한다.
    }
}

function getSelectedNonBenefitRegion() {
    const externalRegions = collectExternalNonBenefitRegions();
    const hasExternalRegions = Object.keys(externalRegions).length > 0;
    const regions = hasExternalRegions ? externalRegions : DB.NON_BENEFIT_PUBLIC_PRICE_DATA.regions;
    const defaultRegion = hasExternalRegions && regions['11'] ? '11' : DB.NON_BENEFIT_PUBLIC_PRICE_DATA.defaultRegion;
    const regionEl = document.getElementById('nonbenefit_region');
    const selected = regionEl ? regionEl.value : defaultRegion;
    return regions[selected] ? selected : defaultRegion;
}

function getExternalPublicNonBenefitPriceInfo(item) {
    const externalData = getNonBenefitRegionData();
    if (!externalData) return null;

    const mapping = externalData.codeMap[item.type];
    if (!mapping || !mapping.publicCode) return null;

    const publicItem = externalData.prices.items[mapping.publicCode];
    if (!publicItem) return null;

    const selectedRegion = getSelectedNonBenefitRegion();
    const regions = publicItem.regions || {};
    const regionPrice = regions[selectedRegion];
    if (!regionPrice) return null;

    const metric = Number.isFinite(regionPrice.median) ? 'median' : (Number.isFinite(regionPrice.avg) ? 'avg' : null);
    if (!metric) return null;

    return {
        price: regionPrice[metric],
        min: regionPrice.min,
        max: regionPrice.max,
        avg: regionPrice.avg,
        median: regionPrice.median,
        metric,
        metricLabel: metric === 'median' ? '중앙값' : '평균값',
        regionName: regionPrice.name || selectedRegion,
        nhisCode: mapping.publicCode,
        nhisName: mapping.publicName || publicItem.name,
        effectiveFrom: publicItem.effectiveFrom,
        reference: `${externalData.prices.source || '비급여 공개자료'} (${externalData.prices.fetchedAt || '수집일 미상'} 수집)`
    };
}

function getFallbackPublicNonBenefitPriceInfo(item) {
    const publicItem = DB.NON_BENEFIT_PUBLIC_PRICE_DATA.items[item.type];
    if (!publicItem) return null;

    const selectedRegion = getSelectedNonBenefitRegion();
    const regionPrice = publicItem.regionPrices[selectedRegion] || publicItem.regionPrices[DB.NON_BENEFIT_PUBLIC_PRICE_DATA.defaultRegion];
    if (!regionPrice || !regionPrice.median) return null;

    const fallbackRegion = DB.NON_BENEFIT_PUBLIC_PRICE_DATA.regions[selectedRegion] || DB.NON_BENEFIT_PUBLIC_PRICE_DATA.regions[DB.NON_BENEFIT_PUBLIC_PRICE_DATA.defaultRegion];
    return {
        price: regionPrice.median,
        min: regionPrice.min,
        metric: 'median',
        metricLabel: '중앙값',
        regionName: fallbackRegion.name,
        nhisCode: publicItem.nhisCode,
        nhisName: publicItem.nhisName,
        reference: DB.NON_BENEFIT_PUBLIC_PRICE_DATA.reference
    };
}

function getPublicNonBenefitPriceInfo(item) {
    if (!item || item.isBenefit) return null;
    return getExternalPublicNonBenefitPriceInfo(item) || getFallbackPublicNonBenefitPriceInfo(item);
}

function getNonBenefitBasePrice(item) {
    const publicPriceInfo = getPublicNonBenefitPriceInfo(item);
    if (!publicPriceInfo) {
        return {
            price: item.basePrice,
            labelSuffix: "",
            publicPriceInfo: null
        };
    }

    return {
        price: publicPriceInfo.price,
        labelSuffix: ` [${publicPriceInfo.regionName} 기준 공개 ${publicPriceInfo.metricLabel} · ${publicPriceInfo.nhisCode}]`,
        publicPriceInfo
    };
}


// =========================================================
// 5. 오타 보정 및 한글 초성 실시간 검색 엔진
// =========================================================

/**
 * 한글 음절 및 단독 자모를 2벌식 키보드 기준 영어 알파벳 글쇠 나열 문자열로 변환합니다.
 * 이를 통해 "허리 mri" -> "gjfl mri", "ㅅ 네ㅑㅜㄷ" -> "t spine" 과 같은 한영 자판 매칭이 완벽히 가능해집니다.
 */
function convertToEnglishKeys(text) {
    if (!text) return '';
    
    const choKeys = ['r', 'R', 's', 'e', 'E', 'f', 'a', 'q', 'Q', 't', 'T', 'd', 'w', 'W', 'c', 'z', 'x', 'v', 'g'];
    const jungKeys = ['k', 'o', 'i', 'O', 'j', 'p', 'u', 'P', 'h', 'hk', 'ho', 'hl', 'y', 'n', 'nj', 'np', 'nl', 'm', 'ml', 'l'];
    const jongKeys = ['', 'r', 'R', 'rt', 's', 'sw', 'sg', 'e', 'f', 'fr', 'fa', 'fq', 'ft', 'fx', 'fv', 'fg', 'a', 'q', 'qt', 't', 'T', 'd', 'w', 'c', 'z', 'x', 'v', 'g'];
    
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        
        // 1. 일반 한글 음절 분리 처리 (가 ~ 힣)
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const originCode = code - 0xAC00;
            const cho = Math.floor(originCode / 588);
            const jung = Math.floor((originCode % 588) / 28);
            const jong = originCode % 28;
            
            result += choKeys[cho] + jungKeys[jung] + jongKeys[jong];
        } 
        // 2. 단독 한글 자모 자판 매핑 처리 (호환 자모 영역)
        else if (code >= 0x3130 && code <= 0x318F) {
            const char = text.charAt(i);
            const singleJaMoMap = {
                'ㄱ':'r', 'ㄲ':'R', 'ㄳ':'rt', 'ㄴ':'s', 'ㄵ':'sw', 'ㄶ':'sg', 'ㄷ':'e', 'ㄸ':'E', 'ㄹ':'f', 'ㄺ':'fr', 
                'ㄻ':'fa', 'ㄼ':'fq', 'ㄽ':'ft', 'ㄾ':'fx', 'ㄿ':'fv', 'ㅀ':'fg', 'ㅁ':'a', 'ㅂ':'q', 'ㅃ':'Q', 'ㅄ':'qt', 
                'ㅅ':'t', 'ㅆ':'T', 'ㅇ':'d', 'ㅈ':'w', 'ㅉ':'W', 'ㅊ':'c', 'ㅋ':'z', 'ㅌ':'x', 'ㅍ':'v', 'ㅎ':'g',
                'ㅏ':'k', 'ㅐ':'o', 'ㅑ':'i', 'ㅒ':'O', 'ㅓ':'j', 'ㅔ':'p', 'ㅕ':'u', 'ㅖ':'P', 'ㅗ':'h', 'ㅘ':'hk', 
                'ㅙ':'ho', 'ㅚ':'hl', 'ㅛ':'y', 'ㅜ':'n', 'ㅝ':'nj', 'ㅞ':'np', 'ㅟ':'nl', 'ㅡ':'m', 'ㅢ':'ml', 'ㅣ':'l'
            };
            result += singleJaMoMap[char] || char;
        } 
        // 3. 영문, 기호 등은 소문자로 변환하여 일치시킴
        else {
            result += text.charAt(i).toLowerCase();
        }
    }
    
    return result;
}

/** 한글 텍스트에서 초성만 추출합니다. (초성 검색 지원용) */
function getChosung(text) {
    const choList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const choIndex = Math.floor((code - 0xAC00) / 588);
            result += choList[choIndex];
        } else if (code >= 0x3131 && code <= 0x314E) {
            result += text.charAt(i);
        } else {
            result += text.charAt(i).toLowerCase();
        }
    }
    return result;
}

/** 입력 검색어가 한글 초성으로만 이루어져 있는지 판별합니다. */
function isChosungOnly(text) {
    const chosungRegex = /^[ㄱ-ㅎ\s]+$/;
    return chosungRegex.test(text);
}

/**
 * 검색 쿼리어가 대상 항목의 명칭이나 키워드와 매칭되는지 다각도로 비교합니다.
 * (한글 초성 매칭, 한영 키보드 오타 교정, 띄어쓰기 생략 검색 완벽 보장)
 */
function isMatch(query, item) {
    const cleanQuery = query.replace(/\s+/g, '').toLowerCase();
    if (!cleanQuery) return false;

    // 매칭 대상: 공식 명칭, 카테고리 태그명, DB 지정 일상어 keywords 목록
    const targets = [item.name, item.category, ...(item.keywords || [])];
    
    // 1단계: 초성 자음만 입력했을 시 초성 일치 대조
    if (isChosungOnly(cleanQuery)) {
        for (const target of targets) {
            const cleanTarget = target.replace(/\s+/g, '').toLowerCase();
            const chosungTarget = getChosung(cleanTarget);
            if (chosungTarget.includes(cleanQuery)) return true;
        }
    }
    
    // 2단계: 양방향 영어 자판 키 코드 일치 대조 (한영 변환 오타 방지 핵심)
    const englishQuery = convertToEnglishKeys(cleanQuery);
    for (const target of targets) {
        const cleanTarget = target.replace(/\s+/g, '').toLowerCase();
        const englishTarget = convertToEnglishKeys(cleanTarget);
        if (englishTarget.includes(englishQuery) || cleanTarget.includes(cleanQuery)) return true;
    }
    
    return false;
}

/** 통합 검색창 이벤트 처리 초기화 및 리스너 등록 */
function initSearchEvents() {
    // A. 대분류 탭 검색창 리스너 바인딩
    const categorySearchInput = document.getElementById('category-search-input');
    const categoryResultsList = document.getElementById('category-search-results');
    const btnClearCategory = document.getElementById('btn-clear-category-search');
    const btnRunCategory = document.getElementById('btn-run-category-search');
    
    if (categorySearchInput && categoryResultsList) {
        categorySearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            updateSearchControlState(categorySearchInput, btnClearCategory, btnRunCategory);
            categoryResultsList.innerHTML = '';
            categoryResultsList.classList.add('hidden');
        });

        categorySearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeSearchFromInput(categorySearchInput, activeTab);
            }
        });
        
        if (btnClearCategory) {
            btnClearCategory.addEventListener('click', (e) => {
                e.stopPropagation();
                categorySearchInput.value = '';
                updateSearchControlState(categorySearchInput, btnClearCategory, btnRunCategory);
                categoryResultsList.innerHTML = '';
                categoryResultsList.classList.add('hidden');
                categorySearchInput.focus();
            });
        }

        if (btnRunCategory) {
            btnRunCategory.addEventListener('click', (e) => {
                e.stopPropagation();
                executeSearchFromInput(categorySearchInput, activeTab);
            });
        }
        
    }

    // B. 기타 처치 검색창 리스너 바인딩
    const etcSearchInput = document.getElementById('etc-search-input');
    const etcResultsList = document.getElementById('etc-search-results');
    const btnClearEtc = document.getElementById('btn-clear-etc-search');
    const btnRunEtc = document.getElementById('btn-run-etc-search');
    
    if (etcSearchInput && etcResultsList) {
        etcSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            updateSearchControlState(etcSearchInput, btnClearEtc, btnRunEtc);
            etcResultsList.innerHTML = '';
            etcResultsList.classList.add('hidden');
        });

        etcSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeSearchFromInput(etcSearchInput, 'etc');
            }
        });
        
        if (btnClearEtc) {
            btnClearEtc.addEventListener('click', (e) => {
                e.stopPropagation();
                etcSearchInput.value = '';
                updateSearchControlState(etcSearchInput, btnClearEtc, btnRunEtc);
                etcResultsList.innerHTML = '';
                etcResultsList.classList.add('hidden');
                etcSearchInput.focus();
            });
        }

        if (btnRunEtc) {
            btnRunEtc.addEventListener('click', (e) => {
                e.stopPropagation();
                executeSearchFromInput(etcSearchInput, 'etc');
            });
        }
        
    }
    
    // C. 드롭다운 바깥 영역 클릭 시 검색창 드롭다운 레이어 닫기
    document.addEventListener('click', (e) => {
        if (categorySearchInput && categoryResultsList && !categorySearchInput.contains(e.target) && !categoryResultsList.contains(e.target)) {
            categorySearchInput.blur();
        }
        if (etcSearchInput && etcResultsList && !etcSearchInput.contains(e.target) && !etcResultsList.contains(e.target)) {
            etcSearchInput.blur();
        }
    });
}

function updateSearchControlState(searchInput, clearButton, runButton) {
    const hasQuery = Boolean(searchInput && searchInput.value.trim().length > 0);

    if (clearButton) {
        clearButton.classList.toggle('hidden', !hasQuery);
    }

    if (runButton) {
        runButton.disabled = !hasQuery;
        runButton.classList.toggle('active', hasQuery);
    }
}

function executeSearchFromInput(searchInput, targetGroup) {
    if (!searchInput) return;

    const query = searchInput.value.trim();
    if (!query) {
        searchInput.focus();
        return;
    }

    performSearch(query, targetGroup, { logSearch: true });
    searchInput.focus();
    const textLength = searchInput.value.length;
    searchInput.setSelectionRange(textLength, textLength);
}

async function sendSearchLog(query, resultCount) {
    if (!query || query.trim().length < 2 || typeof fetch !== 'function') return;

    try {
        await fetch('/api/search-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                resultCount,
                path: window.location.pathname
            }),
            keepalive: true
        });
    } catch (error) {
        // 검색 로그 저장 실패는 사용자 검색 흐름을 막지 않는다.
    }
}

async function sendSearchClickLog(searchQuery, item) {
    if (!searchQuery || !item || typeof fetch !== 'function') return;

    try {
        await fetch('/api/search-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                searchQuery,
                clickedItemId: item.code || item.type || '',
                clickedItemName: item.name || '',
                path: window.location.pathname
            }),
            keepalive: true
        });
    } catch (error) {
        // 클릭 로그 저장 실패는 항목 추가 흐름을 막지 않는다.
    }
}

function compactSelectedItems(items) {
    return items.map(item => ({
        code: item.type,
        name: item.typeName,
        category: item.categoryName || item.category,
        count: item.count || 1,
        basePrice: item.basePrice,
        isBenefit: item.isBenefit
    }));
}

async function sendCalculationLog(payload) {
    if (!payload || typeof fetch !== 'function') return;

    try {
        await fetch('/api/calculation-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...payload,
                path: window.location.pathname
            }),
            keepalive: true
        });
    } catch (error) {
        // 계산 로그 저장 실패는 결과 표시를 막지 않는다.
    }
}

/** 
 * 검색 실행 후 결과 목록 렌더링
 * @param {string} query - 검색어
 * @param {string} targetGroup - 검색 대상 탭/분류 ('test', 'procedure_hira', 'surgery', 'etc')
 */
function performSearch(query, targetGroup, options = {}) {
    const resultsList = targetGroup === 'etc' 
        ? document.getElementById('etc-search-results')
        : document.getElementById('category-search-results');
        
    if (!resultsList) return;
    
    // 1단계: 전체 DB에서 문자열 매칭
    let matched = getMedicalItemDatabase().filter(item => isMatch(query, item) && !isEmergencyManagementItem(item));
    
    // 2단계: 타겟 그룹에 속하는지 탭 필터링
    matched = matched.filter(item => getItemTypeGroup(item) === targetGroup);

    if (options.logSearch) {
        sendSearchLog(query, matched.length);
    }
    
    resultsList.innerHTML = '';
    
    // 매칭 결과가 없을 때
    if (matched.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-search-results';
        emptyDiv.innerHTML = `
            <i data-lucide="search"></i>
            <p>'<strong>${query}</strong>'에 매칭되는 항목이 없습니다.</p>
            <span style="font-size:0.75rem; color:var(--text-muted);">부위나 오타를 확인하거나, 다른 대분류 탭을 선택해 보세요.</span>
        `;
        resultsList.appendChild(emptyDiv);
    } 
    // 매칭 결과가 있을 때 최대 15개 렌더링
    else {
        const limitResults = matched.slice(0, 15);
        limitResults.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'search-result-item';
            
            // 배지에 띄워줄 한글 카테고리 매핑
            const groupLabels = {
                test: '검사',
                procedure_hira: '시술',
                surgery: '수술',
                etc: '기타'
            };
            const itemGroup = getItemTypeGroup(item);
            
            const categoryBadge = `<span class="badge badge-benefit" style="padding: 0.15rem 0.35rem; font-size: 0.68rem; margin-right: 0.4rem;">${groupLabels[itemGroup] || itemGroup}</span>`;
            const benefitBadge = item.isBenefit 
                ? '<span class="badge badge-benefit" style="font-size: 0.65rem;">급여</span>' 
                : '<span class="badge badge-non-benefit" style="font-size: 0.65rem;">비급여</span>';
            const drgBadge = item.isDRG ? '<span class="badge badge-drg">DRG</span>' : '';
            
            const keywordSnippet = item.keywords ? item.keywords.slice(0, 4).join(', ') : '';
            
            btn.innerHTML = `
                <div class="search-result-info">
                    <span class="search-result-name">${categoryBadge}${item.name}${drgBadge}</span>
                    <span class="search-result-keywords">동의어: ${keywordSnippet}</span>
                </div>
                <div class="search-result-meta">
                    <span class="search-result-price">${formatNumber(item.price)}원</span>
                    ${benefitBadge}
                    <span class="btn-result-add"><i data-lucide="plus" style="width:12px; height:12px;"></i> 추가</span>
                </div>
            `;
            
            // 검색 결과 항목 선택(클릭) 이벤트
            btn.addEventListener('click', () => {
                sendSearchClickLog(query, item);
                addHiraItem(item);
                
                // 입력창 및 결과 목록 클리어
                const searchInput = targetGroup === 'etc' 
                    ? document.getElementById('etc-search-input')
                    : document.getElementById('category-search-input');
                    
                const btnClear = targetGroup === 'etc'
                    ? document.getElementById('btn-clear-etc-search')
                    : document.getElementById('btn-clear-category-search');

                const btnRun = targetGroup === 'etc'
                    ? document.getElementById('btn-run-etc-search')
                    : document.getElementById('btn-run-category-search');
                    
                if (searchInput) searchInput.value = '';
                if (searchInput) updateSearchControlState(searchInput, btnClear, btnRun);
                resultsList.innerHTML = '';
                resultsList.classList.add('hidden');
                if (searchInput) searchInput.focus();
            });
            
            resultsList.appendChild(btn);
        });
    }
    
    resultsList.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** 
 * 추천 검색어 칩 클릭 시 즉시 탭 내부 검색창에 입력 후 검색 실행 
 * @param {string} keyword - 검색할 단어
 */
function searchByChip(keyword) {
    const searchInput = document.getElementById('category-search-input');
    if (!searchInput) return;
    
    searchInput.value = keyword;
    
    const btnClear = document.getElementById('btn-clear-category-search');
    if (btnClear) btnClear.classList.remove('hidden');
    const btnRun = document.getElementById('btn-run-category-search');
    updateSearchControlState(searchInput, btnClear, btnRun);
    
    performSearch(keyword, activeTab, { logSearch: true });
    searchInput.focus();
}

/**
 * 심평원 데이터베이스의 각 수가 항목을 사용자가 직관적으로 인지할 수 있는 
 * [검사], [시술], [수술], [기타] 4대 대분류 탭/영역으로 분류하는 헬퍼 함수입니다.
 */
function getItemTypeGroup(item) {
    if (item.group) return item.group;

    // 1. 검사 (imaging, specimen, functional, endoscopy 카테고리 전체)
    if (['imaging', 'specimen', 'functional', 'endoscopy'].includes(item.category)) {
        return 'test';
    }
    
    // 2. 기타 처치, 주사, 마취 등 (type이 anesthesia, injection, rehab, korean_med 이거나 응급실 ER_ 코드, 단순 소독/깁스 등)
    if (
        item.type === 'anesthesia' || 
        item.type === 'injection' || 
        item.type === 'rehab' || 
        item.type === 'korean_med' ||
        item.code.startsWith('ER_') ||
        (item.category === 'procedure' && ['PR_TR03', 'PR_TR08'].includes(item.code))
    ) {
        return 'etc';
    }
    
    // 3. 시술 (수가 코드 중 색전술, 스텐트, 쇄석술, 스케일링, 임플란트, 단순 봉합 및 입원 패키지 등)
    if (
        ['SU_HN03', 'SU_TH06', 'SU_UR02', 'SU_DE01', 'SU_DE05', 'PR_TR01', 'PK_PN01'].includes(item.code)
    ) {
        return 'procedure_hira';
    }
    
    // 4. 수술 (나머지 surgery 카테고리)
    if (item.category === 'surgery') {
        return 'surgery';
    }
    
    return 'etc'; // 예외 방지 기본값
}

/** 실시간 검색된 심평원 수가 아이템을 기존 계산기 데이터 구조에 분기 추가 */
function addHiraItem(item) {
    item = applyPublicStatsToItem(item);

    const categoryNames = {
        imaging: '영상검사',
        specimen: '검체검사',
        functional: '기능검사',
        endoscopy: '내시경',
        surgery: '수술/시술',
        procedure: '처치/치료'
    };

    // 1. 수술 분류에 속하는 행위
    if (item.category === 'surgery') {
        if (addedSurgeries.some(s => s.type === item.code || s.typeName === item.name)) {
            alert("이미 등록된 수술/시술 항목입니다.");
            return;
        }
        surgeryIdCounter++;
        addedSurgeries.push({
            id: surgeryIdCounter,
            category: 'hira_added',
            categoryName: '수술/시술',
            type: item.code,
            typeName: item.name,
            basePrice: resolveProviderPrice(item),
            publicStatsSource: item.publicStatsSource || '',
            publicFeeScheduleSource: item.publicFeeScheduleSource || '',
            alreadyPricedByProvider: Boolean(item.alreadyPricedByProvider),
            isBenefit: item.isBenefit,
            isDRG: item.isDRG || false
        });
    } 
    // 2. 처치/치료/마취 분류에 속하는 행위
    else if (item.category === 'procedure') {
        const existing = addedProcedures.find(p => p.type === item.code || p.typeName === item.name);
        if (existing) {
            existing.count++; // 이미 존재하면 횟수 누적
        } else {
            procedureIdCounter++;
            addedProcedures.push({
                id: procedureIdCounter,
                category: 'hira_added',
                categoryName: '처치/치료',
                type: item.code,
                typeName: item.name,
                count: 1,
                basePrice: resolveProviderPrice(item),
                publicStatsSource: item.publicStatsSource || '',
                publicFeeScheduleSource: item.publicFeeScheduleSource || '',
                alreadyPricedByProvider: Boolean(item.alreadyPricedByProvider),
                isBenefit: item.isBenefit
            });
        }
    } 
    // 3. 검사류 분류 (영상, 검체, 기능, 내시경)
    else {
        const existing = addedTests.find(t => t.type === item.code || t.typeName === item.name);
        if (existing) {
            existing.count++; // 이미 존재하면 횟수 누적
        } else {
            testIdCounter++;
            addedTests.push({
                id: testIdCounter,
                category: item.category,
                categoryName: categoryNames[item.category] || '검사',
                type: item.code,
                typeName: item.name,
                area: 'std',
                areaName: '정밀진단',
                count: 1,
                basePrice: resolveProviderPrice(item),
                publicStatsSource: item.publicStatsSource || '',
                publicFeeScheduleSource: item.publicFeeScheduleSource || '',
                alreadyPricedByProvider: Boolean(item.alreadyPricedByProvider),
                isBenefit: item.isBenefit
            });
        }
    }

    renderAddedItems();
    updateEtcAddedBadge();
    markResultStale();
}


// =========================================================
// 6. 추가된 수가 항목 칩 통합 렌더링
// =========================================================

/** 추가된 모든 검사, 수술, 처치 항목을 #added_items_unified_list에 단일 칩 카드로 렌더링 */
function renderAddedItems() {
    const unifiedList = document.getElementById('added_items_unified_list');
    if (!unifiedList) return;

    unifiedList.innerHTML = '';

    const totalCount = addedTests.length + addedSurgeries.length + addedProcedures.length;

    if (totalCount === 0) {
        unifiedList.innerHTML = '<p class="empty-list-text">등록된 치료 및 검사 항목이 없습니다. 대분류를 선택하여 드롭다운으로 추가하거나 검색해 주세요.</p>';
        return;
    }

    // A. 검사 항목 칩 렌더링
    addedTests.forEach(item => {
        const div = document.createElement('div');
        div.className = 'added-item';
        const benefitTag = item.isBenefit 
            ? '<span class="badge badge-benefit">급여</span>' 
            : '<span class="badge badge-non-benefit">비급여</span>';
        
        div.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.typeName}</span>
                <span class="item-meta">${item.categoryName} · ${item.count}회 · ${benefitTag}${item.publicStatsSource ? ` · ${item.publicStatsSource}` : ''}${item.publicFeeScheduleSource ? ` · ${item.publicFeeScheduleSource}` : ''}</span>
            </div>
            <button type="button" class="btn-remove" onclick="removeTestItem(${item.id})" title="제거">
                <i data-lucide="x"></i>
            </button>
        `;
        unifiedList.appendChild(div);
    });

    // B. 수술 항목 칩 렌더링
    addedSurgeries.forEach(item => {
        const div = document.createElement('div');
        div.className = 'added-item';
        const benefitTag = item.isBenefit 
            ? '<span class="badge badge-benefit">급여</span>' 
            : '<span class="badge badge-non-benefit">비급여</span>';
        const drgBadge = item.isDRG ? ' <span class="badge badge-drg">DRG</span>' : '';
        
        // UI 표시용 분류 뱃지
        const dbItem = getMedicalItemDatabase().find(db => db.code === item.type);
        const groupName = dbItem && getItemTypeGroup(dbItem) === 'procedure_hira' ? '시술' : '수술';

        div.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.typeName}${drgBadge}</span>
                <span class="item-meta">${groupName} · ${benefitTag}${item.publicStatsSource ? ` · ${item.publicStatsSource}` : ''}${item.publicFeeScheduleSource ? ` · ${item.publicFeeScheduleSource}` : ''}</span>
            </div>
            <button type="button" class="btn-remove" onclick="removeSurgeryItem(${item.id})" title="제거">
                <i data-lucide="x"></i>
            </button>
        `;
        unifiedList.appendChild(div);
    });

    // C. 처치 항목 칩 렌더링
    addedProcedures.forEach(item => {
        const div = document.createElement('div');
        div.className = 'added-item';
        const benefitTag = item.isBenefit 
            ? '<span class="badge badge-benefit">급여</span>' 
            : '<span class="badge badge-non-benefit">비급여</span>';
        
        // UI 표시용 분류 뱃지
        const dbItem = getMedicalItemDatabase().find(db => db.code === item.type);
        let groupName = '처치/치료';
        if (dbItem) {
            const group = getItemTypeGroup(dbItem);
            if (group === 'procedure_hira') groupName = '시술';
            else if (group === 'etc') groupName = '기타 처치';
        }

        div.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.typeName}</span>
                <span class="item-meta">${groupName} · ${item.count}회 · ${benefitTag}${item.publicStatsSource ? ` · ${item.publicStatsSource}` : ''}${item.publicFeeScheduleSource ? ` · ${item.publicFeeScheduleSource}` : ''}</span>
            </div>
            <button type="button" class="btn-remove" onclick="removeProcedureItem(${item.id})" title="제거">
                <i data-lucide="x"></i>
            </button>
        `;
        unifiedList.appendChild(div);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** 검사 제거 */
function removeTestItem(id) {
    addedTests = addedTests.filter(i => i.id !== id);
    renderAddedItems();
    updateEtcAddedBadge();
    markResultStale();
}

/** 수술 제거 */
function removeSurgeryItem(id) {
    addedSurgeries = addedSurgeries.filter(i => i.id !== id);
    renderAddedItems();
    updateEtcAddedBadge();
    markResultStale();
}

/** 처치 제거 */
function removeProcedureItem(id) {
    addedProcedures = addedProcedures.filter(i => i.id !== id);
    renderAddedItems();
    updateEtcAddedBadge();
    markResultStale();
}


// =========================================================
// 7. 종별 병원 규모 실시간 모의 계산 시뮬레이터 (동작 동일 보장)
// =========================================================

/**
 * 특정 병원 규모(targetClass)에 대한 최종 환자 예상 실부담금을 모의 계산(시뮬레이션)합니다.
 * 본 함수는 calculate() 내부의 실제 계산 공식과 100% 동일하게 움직이며, 비교 테이블 출력을 위해 사용됩니다.
 */
function simulateCostForClass(targetClass) {
    const hData = DB.HOSPITAL_CLASS[targetClass];
    const treatmentType = document.querySelector('input[name="treatment_type"]:checked').value;
    const isInpatient = (treatmentType === 'inpatient');

    const roomType = document.getElementById('room_type').value;
    const stayDays = isInpatient ? (parseInt(document.getElementById('stay_days').value, 10) || 1) : 0;

    const hasInsurance = document.getElementById('has_insurance').checked;
    const insuranceGen = document.getElementById('insurance_generation').value;

    const sanjeongInfo = getSanjeongSpecialInfo();

    let patientBenefitRate = isInpatient ? hData.inpatientRate : hData.outpatientRate;
    if (sanjeongInfo) patientBenefitRate = sanjeongInfo.rate;

    let patientTotalPay = 0;
    let refundEligibleBenefit = 0;
    let refundEligibleNonBenefit = 0;
    let premiumRoomCharge = 0;

    // A. 진료 기본 비용
    let basePrice = hData.baseConsult;
    let erSeverityInfo = null;
    if (treatmentType === 'er') {
        erSeverityInfo = getEmergencySeverityInfo();
        basePrice = hData.baseConsult + erSeverityInfo.price;
    }
    const basePatientPay = basePrice * patientBenefitRate;
    patientTotalPay += basePatientPay;
    refundEligibleBenefit += basePatientPay;

    // B. 입원비 및 입원 부대 비용
    if (isInpatient && stayDays > 0) {
        const stdRoomCost = hData.roomStandard * stayDays;
        const stdRoomPay = stdRoomCost * patientBenefitRate;
        patientTotalPay += stdRoomPay;
        refundEligibleBenefit += stdRoomPay;

        if (roomType === 'premium') {
            premiumRoomCharge = DB.ROOM_PREMIUM_ADD * stayDays;
            patientTotalPay += premiumRoomCharge;
        }

        for (const key in DB.INPATIENT_DAILY_EXTRAS) {
            const extra = DB.INPATIENT_DAILY_EXTRAS[key];
            const extraPay = extra.price * stayDays * patientBenefitRate;
            patientTotalPay += extraPay;
            refundEligibleBenefit += extraPay;
        }
    }

    // C. 검사 항목 연산
    if (addedTests.length > 0) {
        const benefitTests = addedTests.filter(t => t.isBenefit);
        const nonBenefitTests = addedTests.filter(t => !t.isBenefit);

        const benefitTestsSorted = [...benefitTests].sort((a, b) => b.basePrice - a.basePrice);
        benefitTestsSorted.forEach((test, idx) => {
            const discountFactor = (idx === 0) ? 1.0 : 0.5;
            const finalPrice = getBenefitChargeBase(test, hData) * discountFactor;
            const patientPay = finalPrice * patientBenefitRate * test.count;
            patientTotalPay += patientPay;
            refundEligibleBenefit += patientPay;
        });

        nonBenefitTests.forEach(test => {
            const priceInfo = getNonBenefitBasePrice(test);
            const patientPay = priceInfo.price * test.count;
            patientTotalPay += patientPay;
            refundEligibleNonBenefit += patientPay;
        });
    }

    // D. 수술 항목 연산
    if (addedSurgeries.length > 0) {
        const addedSurgeriesSorted = [...addedSurgeries].sort((a, b) => b.basePrice - a.basePrice);
        addedSurgeriesSorted.forEach((surg, idx) => {
            if (surg.isBenefit) {
                const discountFactor = (idx === 0) ? 1.0 : 0.5;
                const finalPrice = getBenefitChargeBase(surg, hData) * discountFactor;
                let rate = patientBenefitRate;
                if (surg.type === 'c_section' || surg.type === 'SU_OB01') rate = 0; // 제왕절개 0%
                const patientPay = finalPrice * rate;
                patientTotalPay += patientPay;
                refundEligibleBenefit += patientPay;
            } else {
                const priceInfo = getNonBenefitBasePrice(surg);
                const patientPay = priceInfo.price;
                patientTotalPay += patientPay;
                refundEligibleNonBenefit += patientPay;
            }
        });

        const hasManualAnesthesia = addedProcedures.some(p => p.category === 'anesthesia' || p.type.startsWith('PR_AN'));
        if (!hasManualAnesthesia) {
            const maxSurgPrice = addedSurgeriesSorted[0].basePrice;
            const autoAnesthesia = DB.ANESTHESIA_AUTO.find(rule => maxSurgPrice <= rule.maxPrice);
            if (autoAnesthesia) {
                const anesthPay = autoAnesthesia.price * hData.gasanRate * patientBenefitRate;
                patientTotalPay += anesthPay;
                refundEligibleBenefit += anesthPay;
            }
        }
    }

    // E. 추가 처치/치료 연산
    if (addedProcedures.length > 0) {
        addedProcedures.forEach(proc => {
            if (proc.isBenefit) {
                const finalPrice = getBenefitChargeBase(proc, hData);
                const patientPay = finalPrice * patientBenefitRate * proc.count;
                patientTotalPay += patientPay;
                refundEligibleBenefit += patientPay;
            } else {
                const priceInfo = getNonBenefitBasePrice(proc);
                const patientPay = priceInfo.price * proc.count;
                patientTotalPay += patientPay;
                refundEligibleNonBenefit += patientPay;
            }
        });
    }

    // F. 실비보험 환급액 산출
    let refundTotal = 0;
    if (hasInsurance) {
        const insData = DB.INSURANCE_RATES[insuranceGen];
        if (isInpatient) {
            const benefitRefund = refundEligibleBenefit * insData.benefitRate;
            const nonBenefitRefund = refundEligibleNonBenefit * insData.nonBenefitRate;
            const roomLimit = Math.min((DB.ROOM_PREMIUM_ADD * 0.5), 100000);
            const roomRefund = (roomType === 'premium') ? roomLimit * stayDays : 0;
            refundTotal = benefitRefund + nonBenefitRefund + roomRefund;
        } else {
            const eligibleSum = (refundEligibleBenefit * insData.benefitRate) + (refundEligibleNonBenefit * insData.nonBenefitRate);
            refundTotal = Math.min(eligibleSum, DB.OUTPATIENT_LIMIT);
        }
        if (refundTotal > patientTotalPay) refundTotal = patientTotalPay;
    }

    const finalPatientPay = patientTotalPay - refundTotal;
    const minRange = Math.round(finalPatientPay * 0.85);
    const maxRange = Math.round(finalPatientPay * 1.15);

    return {
        finalCost: finalPatientPay,
        minRange,
        maxRange,
        benefitRatePercentage: Math.round(patientBenefitRate * 100)
    };
}

/** 병원 규모별 실시간 실부담금 비교 테이블 렌더링 */
function renderComparisonTable(currentClass) {
    const tableBody = document.getElementById('comparison-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const classes = ['clinic', 'hospital', 'general_hospital', 'tertiary_hospital'];
    
    classes.forEach(cls => {
        const result = simulateCostForClass(cls);
        const tr = document.createElement('tr');
        if (cls === currentClass) {
            tr.className = 'active-class';
        }
        
        const name = DB.HOSPITAL_CLASS[cls].name;
        tr.innerHTML = `
            <td>${name} ${cls === currentClass ? ' (선택됨)' : ''}</td>
            <td>본인부담 ${result.benefitRatePercentage}%</td>
            <td class="text-right">${formatNumber(result.minRange)}원 ~ ${formatNumber(result.maxRange)}원</td>
        `;
        tableBody.appendChild(tr);
    });
}


// =========================================================
// 8. 핵심 계산 엔진 (종별가산, 본인부담금, 실비 환급 계산 및 명세서 렌더링)
// =========================================================
function calculate() {
    updateResultButtonState();
    if (!resultRequested || !isCalculationReady()) {
        resetResultView();
        return null;
    }

    // [1] 입력 폼 요소 값 획득 및 맵핑
    const hospitalClass = document.querySelector('input[name="hospital_class"]:checked').value;
    const treatmentType = document.querySelector('input[name="treatment_type"]:checked').value;
    const hData = DB.HOSPITAL_CLASS[hospitalClass];
    const isInpatient = (treatmentType === 'inpatient');

    const roomType = document.getElementById('room_type').value;
    const stayDays = isInpatient ? (parseInt(document.getElementById('stay_days').value, 10) || 1) : 0;

    const hasInsurance = document.getElementById('has_insurance').checked;
    const insuranceGen = document.getElementById('insurance_generation').value;

    // 산정특례 적용 여부 감지
    const sanjeongInfo = getSanjeongSpecialInfo();

    // 기본 건강보험 환자 본인부담 비율 적용
    let patientBenefitRate = isInpatient ? hData.inpatientRate : hData.outpatientRate;
    if (sanjeongInfo) patientBenefitRate = sanjeongInfo.rate;

    // 제왕절개 분만 수술 여부 감지 (2025년부터 법 개정으로 급여 본인부담금 0% 적용)
    const hasCsection = addedSurgeries.some(s => s.type === 'c_section' || s.type === 'SU_OB01');

    // 계산용 로컬 변수 초기화
    let patientTotalPay = 0;           // 환자가 최종 병원에 납부해야 할 수납 금액 총합
    let refundEligibleBenefit = 0;     // 실비보험 환급 대상 급여액
    let refundEligibleNonBenefit = 0;  // 실비보험 환급 대상 비급여액
    let premiumRoomCharge = 0;         // 상급병실 비급여 차액
    const breakdown = [];              // 명세서 상세 내역 리스트
    let hasDRG = false;                // 포괄수가제 대상 여부 플래그

    // ──────────────────────────────────────────
    // A. 진료 기본 비용 (기본진찰료 or 응급의료 관리료)
    // ──────────────────────────────────────────
    let basePrice = hData.baseConsult;
    let baseLabel = "일반 진찰료 (기본 진료비)";
    let erSeverityInfo = null;
    if (treatmentType === 'er') {
        erSeverityInfo = getEmergencySeverityInfo();
        basePrice = hData.baseConsult + erSeverityInfo.price;
        baseLabel = `응급실 진료비 (${erSeverityInfo.name})`;
    }
    const basePatientPay = basePrice * patientBenefitRate;
    patientTotalPay += basePatientPay;
    refundEligibleBenefit += basePatientPay;
    breakdown.push({ name: `${hData.name} - ${baseLabel}`, type: "benefit", price: basePatientPay });

    const diseaseCodeInput = document.getElementById('disease_code_input')?.value || '';
    const diseaseStats = getDiseaseStatistics(diseaseCodeInput, treatmentType);
    const hasSpecificSelectedItems = addedTests.length + addedSurgeries.length + addedProcedures.length > 0;
    if (diseaseStats && !hasSpecificSelectedItems) {
        const diseaseAverageTotal = diseaseStats.stat.avgTotalPerCase || diseaseStats.stat.avgTotalPerPatient || 0;
        const diseasePatientPay = Math.max(0, (diseaseAverageTotal * patientBenefitRate) - basePatientPay);
        if (diseasePatientPay > 0) {
            patientTotalPay += diseasePatientPay;
            refundEligibleBenefit += diseasePatientPay;
            breakdown.push({
                name: `상병코드 ${diseaseStats.code} ${diseaseStats.visitType} 평균 진료비 반영(2024 공공데이터)`,
                type: "benefit",
                price: diseasePatientPay
            });
        }
    }

    // ──────────────────────────────────────────
    // B. 입원비 및 입원 부대 부대비용 자동 산정
    // ──────────────────────────────────────────
    if (isInpatient && stayDays > 0) {
        // B-1. 기본 입원실료 (급여 적용)
        const stdRoomCost = hData.roomStandard * stayDays;
        const stdRoomPay = stdRoomCost * patientBenefitRate;
        patientTotalPay += stdRoomPay;
        refundEligibleBenefit += stdRoomPay;
        breakdown.push({ name: `기본 입원실료 (${stayDays}박)`, type: "benefit", price: stdRoomPay });

        // B-2. 상급병실료 차액 (비급여 100% 본인 부담)
        if (roomType === 'premium') {
            premiumRoomCharge = DB.ROOM_PREMIUM_ADD * stayDays;
            patientTotalPay += premiumRoomCharge;
            breakdown.push({ name: `상급병실(1~2인실) 차액 비급여 (${stayDays}박)`, type: "non-benefit", price: premiumRoomCharge });
        }

        // B-3. 입원 시 주사/처치/식대 자동 추정 산정 (사용자 피로도 경감용 기본세팅)
        for (const key in DB.INPATIENT_DAILY_EXTRAS) {
            const extra = DB.INPATIENT_DAILY_EXTRAS[key];
            const extraPay = extra.price * stayDays * patientBenefitRate;
            patientTotalPay += extraPay;
            refundEligibleBenefit += extraPay;
            // 아코디언 명세서에만 렌더링하기 위한 플래그 추가
            breakdown.push({ name: `[자동산정] ${extra.name} (${stayDays}일)`, type: "benefit", price: extraPay, isAuto: true });
        }
    }

    // ──────────────────────────────────────────
    // C. 검사 항목 연산 (다부위 동시 촬영/검사 시 50% 감산 규칙 반영)
    // ──────────────────────────────────────────
    if (addedTests.length > 0) {
        const benefitTests = addedTests.filter(t => t.isBenefit);
        const nonBenefitTests = addedTests.filter(t => !t.isBenefit);

        // 급여 검사 항목은 단가 기준 내림차순 정렬 후, 두 번째 항목부터 50% 감산
        benefitTests.sort((a, b) => b.basePrice - a.basePrice);
        benefitTests.forEach((test, idx) => {
            const discountFactor = (idx === 0) ? 1.0 : 0.5; // 주검사 100%, 부검사 50%
            const finalPrice = getBenefitChargeBase(test, hData) * discountFactor;
            const patientPay = finalPrice * patientBenefitRate * test.count;
            patientTotalPay += patientPay;
            refundEligibleBenefit += patientPay;
            let label = `${test.typeName} (${test.count}회)`;
            if (idx > 0) label += " [다부위 검사 감산 50%]";
            breakdown.push({ name: label, type: "benefit", price: patientPay });
        });

        // 비급여 검사는 수가 전액 환자 부담
        nonBenefitTests.forEach(test => {
            const priceInfo = getNonBenefitBasePrice(test);
            const patientPay = priceInfo.price * test.count;
            patientTotalPay += patientPay;
            refundEligibleNonBenefit += patientPay;
            breakdown.push({ name: `${test.typeName}${priceInfo.labelSuffix} (${test.count}회)`, type: "non-benefit", price: patientPay });
        });
    }

    // ──────────────────────────────────────────
    // D. 수술 항목 연산 (동시 수술 시 주수술 100%, 부수술 50% 감산 적용)
    // ──────────────────────────────────────────
    if (addedSurgeries.length > 0) {
        // 단가 기준 내림차순 정렬
        addedSurgeries.sort((a, b) => b.basePrice - a.basePrice);
        addedSurgeries.forEach((surg, idx) => {
            if (surg.isDRG) hasDRG = true; // 7대 질병군 포괄수가제 경고 활성화

            if (surg.isBenefit) {
                const discountFactor = (idx === 0) ? 1.0 : 0.5; // 주수술 100%, 부수술 50%
                const finalPrice = getBenefitChargeBase(surg, hData) * discountFactor;
                let rate = patientBenefitRate;
                
                // 제왕절개 분만 수술일 경우 본인부담금 면제 (0%)
                if (surg.type === 'c_section' || surg.type === 'SU_OB01') rate = 0;
                
                const patientPay = finalPrice * rate;
                patientTotalPay += patientPay;
                refundEligibleBenefit += patientPay;
                let label = surg.typeName;
                if (idx > 0) label += " [동시 수술 감산 50%]";
                if (surg.type === 'c_section' || surg.type === 'SU_OB01') label += " [산모 본인부담 0% 면제]";
                breakdown.push({ name: label, type: "benefit", price: patientPay });
            } else {
                // 비급여 수술
                const priceInfo = getNonBenefitBasePrice(surg);
                const patientPay = priceInfo.price;
                patientTotalPay += patientPay;
                refundEligibleNonBenefit += patientPay;
                breakdown.push({ name: `${surg.typeName}${priceInfo.labelSuffix}`, type: "non-benefit", price: patientPay });
            }
        });

        // D-2. 마취비 자동 산정 (수술 시 마취가 필수 동반되나 사용자가 직접 마취를 지정하지 않은 경우)
        const hasManualAnesthesia = addedProcedures.some(p => p.category === 'anesthesia' || p.type.startsWith('PR_AN'));
        if (!hasManualAnesthesia) {
            const maxSurgPrice = addedSurgeries[0].basePrice; // 최고가 주수술 기준
            const autoAnesthesia = DB.ANESTHESIA_AUTO.find(rule => maxSurgPrice <= rule.maxPrice);
            if (autoAnesthesia) {
                const anesthPay = autoAnesthesia.price * hData.gasanRate * patientBenefitRate;
                patientTotalPay += anesthPay;
                refundEligibleBenefit += anesthPay;
                // 명세서에만 표시하는 자동 산정 플래그 추가
                breakdown.push({ name: `[자동산정] ${autoAnesthesia.name}`, type: "benefit", price: anesthPay, isAuto: true });
            }
        }
    }

    // ──────────────────────────────────────────
    // E. 추가 처치/치료 연산 (수동으로 직접 넣은 처치, 재활 등)
    // ──────────────────────────────────────────
    if (addedProcedures.length > 0) {
        addedProcedures.forEach(proc => {
            if (proc.isBenefit) {
                const finalPrice = getBenefitChargeBase(proc, hData);
                const patientPay = finalPrice * patientBenefitRate * proc.count;
                patientTotalPay += patientPay;
                refundEligibleBenefit += patientPay;
                breakdown.push({ name: `${proc.typeName} (${proc.count}회)`, type: "benefit", price: patientPay });
            } else {
                const priceInfo = getNonBenefitBasePrice(proc);
                const patientPay = priceInfo.price * proc.count;
                patientTotalPay += patientPay;
                refundEligibleNonBenefit += patientPay;
                breakdown.push({ name: `${proc.typeName}${priceInfo.labelSuffix} (${proc.count}회)`, type: "non-benefit", price: patientPay });
            }
        });
    }

    // ──────────────────────────────────────────
    // F. 실비보험(실손보험) 가입 세대별 환급액 산출
    // ──────────────────────────────────────────
    let refundTotal = 0;
    if (hasInsurance) {
        const insData = DB.INSURANCE_RATES[insuranceGen];
        
        // F-1. 입원 치료 실비 적용 (급여/비급여 각각 비례 환급 + 상급병실 차액 한도 보장)
        if (isInpatient) {
            const benefitRefund = refundEligibleBenefit * insData.benefitRate;
            const nonBenefitRefund = refundEligibleNonBenefit * insData.nonBenefitRate;
            // 상급병실 차액 보장: 차액의 50%를 일당 최대 10만 원 한도로 보장
            const roomLimit = Math.min((DB.ROOM_PREMIUM_ADD * 0.5), 100000);
            const roomRefund = (roomType === 'premium') ? roomLimit * stayDays : 0;
            refundTotal = benefitRefund + nonBenefitRefund + roomRefund;
        } 
        // F-2. 통원(외래) 치료 실비 적용 (하루 외래 한도 25만 원 상한 규정 적용)
        else {
            const eligibleSum = (refundEligibleBenefit * insData.benefitRate) + (refundEligibleNonBenefit * insData.nonBenefitRate);
            refundTotal = Math.min(eligibleSum, DB.OUTPATIENT_LIMIT);
        }
        // 환급액은 환자 실부담금을 초과할 수 없음
        if (refundTotal > patientTotalPay) refundTotal = patientTotalPay;
    }

    // 환자 실부담금 산정 및 예상 가격 변차 범위 (신뢰구간 ±15%)
    const finalPatientPay = patientTotalPay - refundTotal;
    const minRange = Math.round(finalPatientPay * 0.85);
    const maxRange = Math.round(finalPatientPay * 1.15);

    // ──────────────────────────────────────────
    // G. 화면(UI) 최종 값 매핑 렌더링
    // ──────────────────────────────────────────
    document.getElementById('display_total_cost').innerText = formatNumber(patientTotalPay);
    document.getElementById('display_refund_cost').innerText = formatNumber(refundTotal);
    document.getElementById('display_final_cost').innerText = formatNumber(finalPatientPay);
    document.getElementById('display_cost_range').innerText = `${formatNumber(minRange)}원 ~ ${formatNumber(maxRange)}원`;

    // DRG 포괄수가제 대상 수술 포함 시 경고 메시지 출력 토글
    const drgNotice = document.getElementById('drg-notice');
    if (drgNotice) {
        if (hasDRG) {
            drgNotice.classList.remove('hidden');
        } else {
            drgNotice.classList.add('hidden');
        }
    }

    // 세부 산출 내역 명세서 테이블 동적 빌드
    const tableBody = document.getElementById('cost-table-body');
    tableBody.innerHTML = '';
    
    if (breakdown.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="padding:1.5rem; color:var(--text-muted); text-align:center;">등록된 치료 및 검사 내역이 없습니다.</td></tr>';
    } else {
        breakdown.forEach(item => {
            const row = document.createElement('tr');
            const badge = item.type === "benefit"
                ? '<span class="badge badge-benefit">급여</span>'
                : '<span class="badge badge-non-benefit">비급여</span>';
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${badge}</td>
                <td class="text-right">${formatNumber(item.price)}원</td>`;
            tableBody.appendChild(row);
        });

        // 실비 환급을 받았을 경우 환급 차감 라인 추가
        if (hasInsurance && refundTotal > 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="color:var(--success);font-weight:700;">실비보험 예상 환급 차감액</td>
                <td><span class="badge badge-benefit" style="background:rgba(16,185,129,0.1);color:var(--success);border-color:rgba(16,185,129,0.2);">환급</span></td>
                <td class="text-right" style="color:var(--success);font-weight:700;">-${formatNumber(refundTotal)}원</td>`;
            tableBody.appendChild(row);
        }
    }

    // 실시간 종별 병원 규모 비교 테이블 렌더링 호출
    renderComparisonTable(hospitalClass);
    updateResultButtonState();

    sendCalculationLog({
        hospitalClass,
        treatmentType,
        nonBenefitRegion: getSelectedNonBenefitRegion(),
        roomType,
        stayDays,
        hasInsurance,
        insuranceGeneration: insuranceGen,
        hasSanjeong: Boolean(sanjeongInfo),
        sanjeongDisease: document.getElementById('sanjeong_disease')?.value || '',
        diseaseCode: normalizeDiseaseCodeInput(document.getElementById('disease_code_input')?.value || ''),
        selectedTests: compactSelectedItems(addedTests),
        selectedSurgeries: compactSelectedItems(addedSurgeries),
        selectedProcedures: compactSelectedItems(addedProcedures),
        finalCost: finalPatientPay,
        totalCost: patientTotalPay,
        refundCost: refundTotal
    });
}
