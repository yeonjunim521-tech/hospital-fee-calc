/**
 * =========================================================
 * MEDICost Pro v2.5 — 심평원 수가 데이터베이스 (hira_codes.js)
 * =========================================================
 * 
 * 일반 사용자가 "허리 mri", "허리 ㅡ갸", "맹장염"과 같이 일상적인 용어 및 
 * 오타, 초성으로 검색해도 알맞은 심평원 수가 항목을 찾을 수 있도록 
 * 동의어(keywords) 태그가 대폭 강화된 약 350개 이상의 핵심 다빈도 검사·시술·수술 데이터베이스입니다.
 * 
 * [데이터 구조 규격]
 * - code: 심평원 가상/실제 코드 관리 번호
 * - category: 대분류 (imaging / specimen / functional / endoscopy / surgery / procedure)
 * - type: 중분류 (xray, ct, mri, urology, abdominal, anesthesia, rehab 등)
 * - name: 공식 명칭 (의료진/심평원 공식 표기법)
 * - price: 2025년 기준 환산지수가 반영된 급여 총수가 또는 비급여 기준액 (가산 전 금액)
 * - isBenefit: 급여 여부 (true: 건강보험 적용, false: 비급여 환자 100% 부담)
 * - isDRG: 포괄수가제 대상 여부 (수술 중 7대 질병군 관련)
 * - keywords: 일반인이 검색창에 칠 법한 일상어, 신체 부위, 초성, 오타 및 유사 단어 모음 (검색 태그)
 */

const HIRA_DATABASE = [
    // ==========================================
    // 1. 영상검사 (category: "imaging")
    // ==========================================
    // --- X-ray ---
    { 
        code: "IM_XR01", 
        category: "imaging", 
        type: "xray", 
        name: "흉부 X-ray (Chest PA)", 
        price: 15000, 
        isBenefit: true, 
        keywords: ["가슴 엑스레이", "가슴 사진", "폐 엑스레이", "폐 사진", "폐렴", "결핵", "기침", "감기", "바스트", "엑스레이", "ㅎㅂ x-ray", "gqnd x-ray", "흉부단순촬영", "흉부 엑스선", "흉부 촬영", "흉부 엑스레이", "흉부 x선", "chest pa", "chest x-ray", "폐 사진 엑스선", "ㅎㅂ 엑스레이", "gqnd dprxtmfdld"] 
    },
    { 
        code: "IM_XR02", 
        category: "imaging", 
        type: "xray", 
        name: "복부 X-ray (Abdomen)", 
        price: 20000, 
        isBenefit: true, 
        keywords: ["배 엑스레이", "위 엑스레이", "복부 통증", "가스", "소화불량", "엑스레이", "ㅂㅂ x-ray", "qndn x-ray", "복부단순촬영", "복부 단순촬영", "복부 촬영", "배 사진", "위장 엑스레이", "abdomen x-ray", "abdomen pa", "장 가스 엑스레이", "배 아플때 엑스선", "ㅂㅂ 엑스레이", "qndn dprxtmfdld"] 
    },
    { 
        code: "IM_XR03", 
        category: "imaging", 
        type: "xray", 
        name: "두부 X-ray (Skull)", 
        price: 25000, 
        isBenefit: true, 
        keywords: ["머리 엑스레이", "뇌 엑스레이", "머리 뼈", "머리 외상", "두통", "엑스레이", "ㄷㅂ x-ray", "enqn x-ray", "두부단순촬영", "두부 촬영", "두골 촬영", "머리 사진", "skull x-ray", "skull pa", "머리 뼈 사진", "두골 엑스선", "ㄷㅂ 엑스레이", "enqn dprxtmfdld"] 
    },
    { 
        code: "IM_XR04", 
        category: "imaging", 
        type: "xray", 
        name: "경추 X-ray (C-spine)", 
        price: 28000, 
        isBenefit: true, 
        keywords: ["목 엑스레이", "목뼈", "목디스크", "거북목", "일자목", "목 통증", "엑스레이", "ㄱㅊ x-ray", "rudcn x-ray", "c spine", "c라인", "c-spine", "경추단순촬영", "경추 촬영", "목뼈 사진", "경추 엑스선", "목디스크 엑스레이", "경추 x-ray", "c-spine x-ray", "ㄱㅊ 엑스레이", "rudcn dprxtmfdld"] 
    },
    { 
        code: "IM_XR05", 
        category: "imaging", 
        type: "xray", 
        name: "요추 X-ray (L-spine)", 
        price: 32000, 
        isBenefit: true, 
        keywords: ["허리 엑스레이", "허리뼈", "허리디스크", "척추 협착증", "허리 통증", "엑스레이", "ㅇㅊ x-ray", "dycn x-ray", "허리 ㅡ갸", "gjfl x-ray", "l spine", "l-spine", "요추단순촬영", "요추 촬영", "허리뼈 사진", "요추 엑스선", "요추 x-ray", "허리디스크 엑스레이", "l-spine x-ray", "ㅇㅊ 엑스레이", "dycn dprxtmfdld"] 
    },
    { 
        code: "IM_XR06", 
        category: "imaging", 
        type: "xray", 
        name: "골반 X-ray (Pelvis)", 
        price: 25000, 
        isBenefit: true, 
        keywords: ["골반 엑스레이", "엉덩이 뼈", "엉치뼈", "고관절 통증", "엑스레이", "ㄱㅂ x-ray", "rhfqks x-ray", "골반단순촬영", "골반 촬영", "골반 사진", "고관절 엑스레이", "pelvis x-ray", "엉덩이 엑스레이", "엉치 엑스레이", "pelvis pa", "ㄱㅂ 엑스레이", "rhfqks dprxtmfdld"] 
    },
    { 
        code: "IM_XR07", 
        category: "imaging", 
        type: "xray", 
        name: "견관절 X-ray (Shoulder)", 
        price: 22000, 
        isBenefit: true, 
        keywords: ["어깨 엑스레이", "어깨 뼈", "오십견", "어깨 회전근개", "어깨 통증", "엑스레이", "ㄱㄱㅈ x-ray", "ruosrhswjf x-ray", "견관절단순촬영", "견관절 촬영", "어깨 사진", "shoulder x-ray", "회전근개 엑스레이", "어깨관절 엑스레이", "ㄱㄱㅈ 엑스레이", "ruosrhswjf dprxtmfdld"] 
    },
    { 
        code: "IM_XR08", 
        category: "imaging", 
        type: "xray", 
        name: "수부 X-ray (Hand)", 
        price: 18000, 
        isBenefit: true, 
        keywords: ["손 엑스레이", "손가락 뼈", "손목 터널", "관절염", "손 통증", "엑스레이", "ㅅㅂ x-ray", "tnqn x-ray", "수부단순촬영", "수부 촬영", "손 사진", "손가락 사진", "hand x-ray", "손목 엑스레이", "손가락 엑스레이", "류마티스 손 사진", "ㅅㅂ 엑스레이", "tnqn dprxtmfdld"] 
    },
    { 
        code: "IM_XR09", 
        category: "imaging", 
        type: "xray", 
        name: "족부 X-ray (Foot)", 
        price: 18000, 
        isBenefit: true, 
        keywords: ["발 엑스레이", "발가락 뼈", "발목 뼈", "접질렸을때", "발 통증", "엑스레이", "ㅈㅂ x-ray", "whnqn x-ray", "족부단순촬영", "족부 촬영", "발 사진", "발목 사진", "foot x-ray", "발목 엑스레이", "발가락 엑스레이", "발가락 단순촬영", "ㅈㅂ 엑스레이", "whnqn dprxtmfdld"] 
    },

    // --- CT ---
    { 
        code: "IM_CT01", 
        category: "imaging", 
        type: "ct", 
        name: "뇌 CT (비조영)", 
        price: 100000, 
        isBenefit: true, 
        keywords: ["뇌 ct", "머리 ct", "뇌출혈", "두통", "의식 잃음", "머리 외상", "시티", "ㄴ ct", "shl ct", "뇌 시티", "shl tldxl", "두부 ct", "두부 전산화단층촬영", "뇌 전산화단층촬영", "뇌 컴퓨터단층촬영", "뇌ct 비조영", "머리시티 비조영", "brain ct", "brain non-contrast ct", "뇌졸중 ct", "뇌 시티 비조영"] 
    },
    { 
        code: "IM_CT02", 
        category: "imaging", 
        type: "ct", 
        name: "뇌 CT (조영증강)", 
        price: 150000, 
        isBenefit: true, 
        keywords: ["뇌 ct 조영제", "머리 ct 조영제", "뇌동맥류", "뇌종양", "정밀 시티", "뇌 조영제", "shl whdydwp", "두부 조영 ct", "뇌 전산화단층촬영 조영제", "brain contrast ct", "조영제 뇌 ct", "뇌 시티 조영제", "brain ct contrast", "머리 조영제 ct"] 
    },
    { 
        code: "IM_CT03", 
        category: "imaging", 
        type: "ct", 
        name: "흉부 CT (비조영)", 
        price: 150000, 
        isBenefit: true, 
        keywords: ["가슴 ct", "폐 ct", "폐암 검사", "기관지", "가슴 통증", "시티", "ㅎㅂ ct", "gqnd ct", "폐 시티", "vP tldxl", "흉부 전산화단층촬영", "흉부 컴퓨터단층촬영", "chest ct", "chest non-contrast ct", "폐ct 비조영", "가슴시티 비조영", "결핵 ct", "가슴 시티 비조영"] 
    },
    { 
        code: "IM_CT04", 
        category: "imaging", 
        type: "ct", 
        name: "흉부 CT (조영증강)", 
        price: 200000, 
        isBenefit: true, 
        keywords: ["가슴 ct 조영제", "폐 ct 조영제", "폐암 진단", "정밀 폐 시티", "흉부 조영제", "gqnd whdydwp", "흉부 전산화단층촬영 조영제", "chest contrast ct", "조영제 폐 ct", "가슴 시티 조영제", "폐선암 조영 ct", "가슴 조영제 시티"] 
    },
    { 
        code: "IM_CT05", 
        category: "imaging", 
        type: "ct", 
        name: "복부 CT (비조영)", 
        price: 180000, 
        isBenefit: true, 
        keywords: ["배 ct", "소화기 ct", "복부 통증", "간 ct", "위 ct", "췌장", "시티", "ㅂㅂ ct", "qndn ct", "배 시티", "qo tldxl", "복부 전산화단층촬영", "복부 컴퓨터단층촬영", "abdomen ct", "abdomen non-contrast ct", "배ct 비조영", "복부시티 비조영", "위ct", "대장ct", "배 시티 비조영"] 
    },
    { 
        code: "IM_CT06", 
        category: "imaging", 
        type: "ct", 
        name: "복부 CT (조영증강)", 
        price: 250000, 
        isBenefit: true, 
        keywords: ["배 ct 조영제", "복부 ct 조영제", "간암", "췌장암", "위암", "정밀 복부 시티", "복부 조영제", "qndn whdydwp", "복부 전산화단층촬영 조영제", "abdomen contrast ct", "조영제 복부 ct", "배 시티 조영제", "간 조영 ct", "배 조영제 시티"] 
    },
    { 
        code: "IM_CT07", 
        category: "imaging", 
        type: "ct", 
        name: "요추/경추 척추 CT (비조영)", 
        price: 130000, 
        isBenefit: true, 
        keywords: ["허리 ct", "목 ct", "척추 ct", "디스크 시티", "목디스크", "허리 디스크 ct", "gjfl ct", "yc ct", "척추 전산화단층촬영", "척추 컴퓨터단층촬영", "요추 ct 비조영", "경추 ct 비조영", "ㅅ 네ㅑㅜㄷ", "ㅅ 네ㅑㅜㄷ ct", "spine ct", "허리시티", "목시티", "척추시티", "디스크 ct", "목디스크 ct", "허리디스크 ct"] 
    },

    // --- MRI ---
    { 
        code: "IM_MR01", 
        category: "imaging", 
        type: "mri", 
        name: "뇌 MRI (비조영)", 
        price: 500000, 
        isBenefit: false, 
        keywords: ["뇌 mri", "머리 mri", "뇌경색", "중풍", "치매 검사", "어지럼증", "엠알아이", "ㄴ mri", "shl mri", "뇌 엠알", "shl dpafrkdl", "두부 mri", "뇌 자기공명영상", "뇌자기공명영상", "머리 mri 비조영", "brain mri", "brain non-contrast mri", "뇌엠알아이", "치매 mri", "뇌경색 mri", "뇌 엠알아이 비조영"] 
    },
    { 
        code: "IM_MR02", 
        category: "imaging", 
        type: "mri", 
        name: "뇌 MRI & MRA (조영증강)", 
        price: 600000, 
        isBenefit: false, 
        keywords: ["뇌 mra", "뇌혈관 mri", "뇌동맥류 mri", "머리 혈관", "정밀 엠알아이", "뇌 엠라", "shl dpaflfk", "뇌 자기공명혈관조영술", "뇌 mri mra", "뇌경색 정밀", "brain mra", "brain mri mra", "뇌혈관 엠알아이", "뇌동맥류 mra", "정밀 뇌혈관 mri", "뇌 mri 조영제"] 
    },
    { 
        code: "IM_MR03", 
        category: "imaging", 
        type: "mri", 
        name: "경추 MRI (C-spine)", 
        price: 450000, 
        isBenefit: false, 
        keywords: ["목 mri", "목디스크 mri", "목뼈 엠알아이", "경추 디스크", "ㄱㅊ mri", "목 엠알", "ahr dpafrkdl", "c spine mri", "c-spine mri", "ㅅ 네ㅑㅜㄷ mri", "경추 mri", "경추 자기공명영상", "경추디스크 mri", "목디스크엠알", "목 통증 mri", "경추 엠알아이", "목 엠알아이"] 
    },
    { 
        code: "IM_MR04", 
        category: "imaging", 
        type: "mri", 
        name: "요추 MRI (L-spine)", 
        price: 500000, 
        isBenefit: false, 
        keywords: ["허리 mri", "허리디스크 mri", "요추 디스크", "척추 협착증", "허리 통증 엠알아이", "ㅇㅊ mri", "허리 엠알", "gjfl mri", "허리 ㅡ갸 mri", "l spine mri", "l-spine mri", "요추 mri", "요추 자기공명영상", "요추디스크 mri", "ㅎㄹ mri", "gr mri", "허리디스크엠알", "척추 협착증 mri", "요추 엠알아이", "허리 엠알아이", "허리 ㅡ갸 엠알아이"] 
    },
    { 
        code: "IM_MR05", 
        category: "imaging", 
        type: "mri", 
        name: "슬관절 MRI (무릎)", 
        price: 400000, 
        isBenefit: false, 
        keywords: ["무릎 mri", "무릎 연골 mri", "도가니 mri", "십자인대 mri", "무릎 통증", "ㅁㄹ mri", "anfmq mri", "무릎 엠알", "슬관절 mri", "슬관절 자기공명영상", "무릎 관절경 mri", "knee mri", "무릎 연골판 mri", "무릎 인대 mri", "도가니 엠알아이", "무릎 관절 엠알아이"] 
    },
    { 
        code: "IM_MR06", 
        category: "imaging", 
        type: "mri", 
        name: "견관절 MRI (어깨)", 
        price: 400000, 
        isBenefit: false, 
        keywords: ["어깨 mri", "어깨 힘줄 mri", "오십견 mri", "회전근개 파열", "ㅇㄲ mri", "djro mri", "어깨 엠알", "견관절 mri", "견관절 자기공명영상", "shoulder mri", "회전근개 mri", "어깨 힘줄 엠알아이", "오십견 엠알아이", "회전근개파열 mri", "어깨 관절 엠알아이"] 
    },

    // --- 초음파 (Ultrasound) ---
    { 
        code: "IM_US01", 
        category: "imaging", 
        type: "ultrasound", 
        name: "상복부 초음파 (간/담낭/췌장/비장)", 
        price: 100000, 
        isBenefit: false, 
        keywords: ["간 초음파", "배 초음파", "담낭 초음파", "췌장 초음파", "쓸개 초음파", "지방간", "ㅅㅂㅂ 초음파", "tkdqnqsn chdmafk", "상복부초음파", "복부 초음파", "간초음파", "쓸개초음파", "췌장초음파", "abdomen ultrasound", "복부 초음파 검사", "상복부초음파 검사", "복강 초음파"] 
    },
    { 
        code: "IM_US02", 
        category: "imaging", 
        type: "ultrasound", 
        name: "하복부/골반 초음파 (방광/여성자궁)", 
        price: 100000, 
        isBenefit: false, 
        keywords: ["자궁 초음파", "방광 초음파", "골반 초음파", "산부인과 초음파", "생리통", "ㅎㅂㅂ 초음파", "gqdqn chdmafk", "하복부초음파", "골반 초음파", "여성 초음파", "자궁초음파", "방광초음파", "난소 초음파", "pelvis ultrasound", "자궁근종 초음파", "산부인과 초음파 검사", "방광 초음파 검사"] 
    },
    { 
        code: "IM_US03", 
        category: "imaging", 
        type: "ultrasound", 
        name: "심장 초음파 (심에코)", 
        price: 150000, 
        isBenefit: false, 
        keywords: ["심장 초음파", "심장 에코", "가슴 초음파", "부정맥", "협심증 초음파", "가슴 답답", "ㅅㅈ 초음파", "tla wkd chdmafk", "tla rhrh", "심초음파", "심장초음파", "echocardiography", "심장 에코 검사", "심전도 초음파", "판막 초음파", "심장초음파 검사"] 
    },
    { 
        code: "IM_US04", 
        category: "imaging", 
        type: "ultrasound", 
        name: "갑상선 초음파", 
        price: 80000, 
        isBenefit: false, 
        keywords: ["갑상선 초음파", "목 초음파", "목 혹 검사", "갑상선 결절", "ㄱㅅㅅ 초음파", "rqtqdtjd chdmafk", "갑상선초음파", "thyroid ultrasound", "갑상선 결절 초음파", "갑상선 암 초음파", "갑상선 초음파 검사"] 
    },
    { 
        code: "IM_US05", 
        category: "imaging", 
        type: "ultrasound", 
        name: "유방 초음파 (양측)", 
        price: 120000, 
        isBenefit: false, 
        keywords: ["유방 초음파", "가슴 초음파 여성", "유방암 검사", "가슴 멍울", "ㅇㅂ 초음파", "dnbkd chdmafk", "유방초음파", "breast ultrasound", "여성 가슴 초음파", "유방 멍울 초음파", "유방암 초음파", "가슴 멍울 초음파 검사"] 
    },
    { 
        code: "IM_US06", 
        category: "imaging", 
        type: "ultrasound", 
        name: "경동맥 초음파", 
        price: 80000, 
        isBenefit: false, 
        keywords: ["경동맥 초음파", "목 혈관 초음파", "뇌졸중 예방", "동맥경화", "혈관 벽 두께", "ㄱㄷㅁ 초음파", "rudehdahr chdmafk", "경동맥초음파", "carotid ultrasound", "경동맥 초음파 검사", "목 경동맥", "목 혈관 초음파 검사"] 
    },

    // --- 특수/핵의학 영상 ---
    { 
        code: "IM_SP01", 
        category: "imaging", 
        type: "pet_ct", 
        name: "전신 PET-CT (양전자방출단층촬영)", 
        price: 1100000, 
        isBenefit: false, 
        keywords: ["pet ct", "펫 시티", "전신 암검사", "암 전이 확인", "암 정밀검사", "vpt tldxl", "양전자방출단층촬영", "양전자 단층촬영", "펫시티", "pet-ct", "전신 pet", "암 pet-ct", "pet시티", "암 전신 스캔"] 
    },
    { 
        code: "IM_SP02", 
        category: "imaging", 
        type: "dexa", 
        name: "골밀도 검사 (DEXA)", 
        price: 45000, 
        isBenefit: true, 
        keywords: ["골밀도 검사", "골다공증 검사", "뼈 강도", "뼈 나이", "덱사", "ㄱㅁㄷ 검사", "rhfalfeh rjatk", "골밀도측정", "dexa", "골다공증 수치", "뼈밀도 검사", "뼈 밀도", "골조송증", "t score"] 
    },
    { 
        code: "IM_SP03", 
        category: "imaging", 
        type: "mammo", 
        name: "유방촬영 (Mammography)", 
        price: 40000, 
        isBenefit: true, 
        keywords: ["유방 엑스레이", "유방 촬영", "유방 단순촬영", "유방암 검진", "맘모", "ㅇㅂㅊㅇ", "dnbkdchdfud", "유방촬영술", "맘모그래피", "mammography", "유방 엑스선", "유방 기계 촬영", "가슴 촬영 엑스레이"] 
    },
    { 
        code: "IM_SP04", 
        category: "imaging", 
        type: "angio", 
        name: "심장 혈관조영술 (Coronary Angiography)", 
        price: 350000, 
        isBenefit: true, 
        keywords: ["심장 조영술", "혈관 조영술", "심장 혈관 검사", "스텐트 시술 전 검사", "협심증 조영", "ㅅㅈㅎㄱㅈㅇ", "관상동맥 조영술", "심혈관 조영술", "관상동맥조영술", "coronary angiography", "cag", "심장혈관 조영술", "심혈관 조영", "관상동맥 조영"] 
    },
    { 
        code: "IM_SP06", 
        category: "imaging", 
        type: "angio", 
        name: "뇌혈관조영술 (TFCA)", 
        price: 400000, 
        isBenefit: true, 
        keywords: ["뇌혈관조영술", "뇌 조영술", "뇌 혈관 검사", "tfca", "transfemoralcerebroangiography", "transfemoral cerebral angiography", "ㄴㅎㄱㅈㅇt", "shlghfrhwhdydtfnf", "뇌혈관", "뇌 조영", "뇌혈관 조영술", "뇌동맥류 검사", "뇌동맥 조영술"] 
    },
    { 
        code: "IM_SP05", 
        category: "imaging", 
        type: "nuclear_med", 
        name: "전신 뼈 스캔 (Bone Scan - 핵의학)", 
        price: 120000, 
        isBenefit: true, 
        keywords: ["뼈 스캔", "본 스캔", "골 전이 검사", "뼈 핵의학", "핵의학 검사", "ㅃ ㅅㅋ", "qhftwks", "전신 뼈 스캔", "뼈스캔", "본스캔", "bone scan", "뼈 전이 검사", "골스캔", "골 스캔", "뼈 전신 검사"] 
    },

    // ==========================================
    // 2. 검체검사 (category: "specimen")
    // ==========================================
    { 
        code: "SP_BL01", 
        category: "specimen", 
        type: "cbc", 
        name: "일반혈액검사 (CBC/전혈구)", 
        price: 5000, 
        isBenefit: true, 
        keywords: ["피검사", "혈액검사", "빈혈 검사", "백혈구 수치", "적혈구", "염증 수치 피", "ㅎㅇrjatk", "vfrjatk", "일반혈액검사", "cbc 검사", "혈구 검사", "기본 피검사", "백혈구 적혈구 피검사", "전혈구 검사", "cbc"] 
    },
    { 
        code: "SP_BL02", 
        category: "specimen", 
        type: "blood_type", 
        name: "혈액형 검사 (ABO+Rh 판정)", 
        price: 5000, 
        isBenefit: true, 
        keywords: ["혈액형 판정", "혈액형 검사", "내 피 종류", "수술 전 혈액형", "ㅎㅇㅎrjatk", "abo 식 혈액형", "혈액형 확인", "abo 혈액형", "Rh형 검사"] 
    },
    { 
        code: "SP_CH01", 
        category: "specimen", 
        type: "liver_func", 
        name: "간기능검사 패널 (AST/ALT/ALP/빌리루빈)", 
        price: 9000, 
        isBenefit: true, 
        keywords: ["간기능 피검사", "간 수치", "got gpt", "황달 검사", "피로", "간염 수치", "ㄱㄱㄴrjatk", "간기능검사", "간기능패널", "ast alt 검사", "간수치 검사", "got gpt 검사", "간기능 피", "ast", "alt", "alp", "빌리루빈"] 
    },
    { 
        code: "SP_CH02", 
        category: "specimen", 
        type: "renal_func", 
        name: "신기능검사 패널 (BUN/크레아티닌)", 
        price: 5000, 
        isBenefit: true, 
        keywords: ["콩팥 검사", "신장 수치", "크레아티닌", "bun 수치", "소변 거품 피검사", "ㅅㄱㄴrjatk", "신기능검사", "신장기능검사", "크레아티닌 검사", "콩팥 피검사", "신장 피검사", "bun", "creatinine", "요소질소"] 
    },
    { 
        code: "SP_CH03", 
        category: "specimen", 
        type: "glucose", 
        name: "공복혈당검사 (Glucose)", 
        price: 2000, 
        isBenefit: true, 
        keywords: ["당뇨 검사", "혈당 측정", "공복 혈당", "단내", "당 수치", "ㅎㄷrjatk", "공복혈당", "당뇨피검사", "공복당뇨", "glucose 피검사", "혈당 피검사"] 
    },
    { 
        code: "SP_CH04", 
        category: "specimen", 
        type: "hba1c", 
        name: "당화혈색소 검사 (HbA1c)", 
        price: 8000, 
        isBenefit: true, 
        keywords: ["당화혈색소", "3달 평균 혈당", "당뇨 관리", "당뇨 합병증", "ㄷㅎㅎㅅㅅ", "hba1c 검사", "당화 혈색소", "hba1c 당뇨", "hba1c", "평균 혈당 검사"] 
    },
    { 
        code: "SP_CH05", 
        category: "specimen", 
        type: "lipid", 
        name: "지질검사 패널 (콜레스테롤/HDL/LDL/중성지방)", 
        price: 11000, 
        isBenefit: true, 
        keywords: ["고지혈증 검사", "콜레스테롤 수치", "중성지방", "ldl 콜레스테롤", "피가 탁함", "ㄱㅈㅎㅈrjatk", "고지혈증 피검사", "이상지질혈증 검사", "지질 검사", "콜레스테롤 검사", "ldl hdl 검사", "지질패널", "ldl", "hdl", "tg"] 
    },
    { 
        code: "SP_CH08", 
        category: "specimen", 
        type: "crp", 
        name: "C-반응성단백 (CRP 정밀 염증검사)", 
        price: 5000, 
        isBenefit: true, 
        keywords: ["crp", "염증 단백질", "급성 염증 수치", "몸에 열날 때 피검사", "ㅇㅈtncl", "c 반응성 단백", "crp 검사", "염증 피검사", "crp 수치", "c 반응성 단백질", "c-반응성단백"] 
    },
    { 
        code: "SP_TM05", 
        category: "specimen", 
        type: "psa", 
        name: "PSA 종양표지자 (전립선암)", 
        price: 13000, 
        isBenefit: true, 
        keywords: ["psa 암수치", "전립선암 피검사", "남성암 표지자", "오줌 줄기 약함", "ㅈㄹㅅrjatk", "psa 검사", "전립선암 종양표지자", "전립선 특이항원", "남성 전립선 검사", "psa", "전립선 피검사"] 
    },
    { 
        code: "SP_UR01", 
        category: "specimen", 
        type: "urinalysis", 
        name: "일반소변검사 (Urinalysis 요정성)", 
        price: 3000, 
        isBenefit: true, 
        keywords: ["소변 검사", "오줌 검사", "요단백", "요당", "방광염 소변", "ㅅㅂrjatk", "thq बनानी", "요합성검사", "요정성검사", "소변검사", "소변 단백뇨", "피소변 검사", "요단백 요당 검사", "urinalysis"] 
    },

    // ==========================================
    // 3. 기능검사 (category: "functional")
    // ==========================================
    { 
        code: "FN_CD01", 
        category: "functional", 
        type: "ecg", 
        name: "심전도 검사 (ECG 12유도)", 
        price: 12000, 
        isBenefit: true, 
        keywords: ["심전도 검사", "가슴 통증 검사", "심장 뛰는 속도", "수술 전 기본검사", "맥박", "ㅅㅈㄷrjatk", "tlawjseh", "심전도검사", "ecg 검사", "ekg 검사", "수술전 심전도", "부정맥 심전도", "12유도 심전도", "ecg", "ekg"] 
    },
    { 
        code: "FN_CD03", 
        category: "functional", 
        type: "holter_24", 
        name: "24시간 홀터 심전도 (Holter)", 
        price: 55000, 
        isBenefit: true, 
        keywords: ["24시간 심전도", "홀터 검사", "부정맥 홀터", "심장 모니터링", "가슴 두근거림", "ㅎㅌrjatk", "ghfxj", "홀터심전도", "24시간 ekg", "24시간 ecg", "홀터 기계 검사", "하루 심전도", "holter", "홀터"] 
    },
    { 
        code: "FN_NS01", 
        category: "functional", 
        type: "eeg", 
        name: "뇌파 검사 (EEG)", 
        price: 70000, 
        isBenefit: true, 
        keywords: ["뇌파 검사", "간질 검사", "뇌전증", "경련 검사", "기절했을때 검사", "ㄴㅍrjatk", "shlvk", "뇌파검사", "eeg 검사", "뇌 전기 검사", "eeg", "뇌전증 뇌파"] 
    },
    { 
        code: "FN_NS02", 
        category: "functional", 
        type: "emg", 
        name: "침 근전도 검사 (EMG)", 
        price: 80000, 
        isBenefit: true, 
        keywords: ["근전도 검사", "바늘 근전도", "근육 마비 검사", "루게릭병 검사", "손발 저림 근전도", "ㄱㅈㄷrjatk", "rmswjseh", "근전도검사", "침근전도", "신경전도 검사", "근육 신경 검사", "emg 검사", "emg", "바늘 근육 검사"] 
    },
    { 
        code: "FN_NS04", 
        category: "functional", 
        type: "sleep_study", 
        name: "수면다원검사 (PSG)", 
        price: 450000, 
        isBenefit: true, 
        keywords: ["수면 다원 검사", "코골이 검사", "수면 무호흡증", "잠잘때 숨 안쉼", "수면 장애", "ㅅㅁㄷㅇ", "tnaksdwjdrj", "수면다원검사", "코골이 수면검사", "잠꼬대 검사", "psg 검사", "psg", "수면다원"] 
    },
    { 
        code: "FN_RP01", 
        category: "functional", 
        type: "pft", 
        name: "폐기능 검사 (PFT)", 
        price: 15000, 
        isBenefit: true, 
        keywords: ["폐 기능 검사", "폐활량 검사", "천식 폐검사", "숨찬 증상 검사", "pft", "ㅍㄱㄴrjatk", "vprlsmd", "폐기능검사", "폐활량측정", "pft 검사", "천식 폐활량", "숨 기능 검사"] 
    },
    { 
        code: "FN_HE01", 
        category: "functional", 
        type: "pta", 
        name: "순음청력검사 (PTA 이비인후과)", 
        price: 30000, 
        isBenefit: true, 
        keywords: ["귀 검사", "청력 검사", "이명 검사", "귀 안들릴때", "보청기 청력검사", "ㅊㄹrjatk", "cjdflrjatk", "순음청력검사", "청력검사", "이비인후과 귀검사", "pta 검사", "pta", "청음 검사"] 
    },
    { 
        code: "FN_OP03", 
        category: "functional", 
        type: "oct", 
        name: "안구광학단층촬영 (OCT)", 
        price: 50000, 
        isBenefit: true, 
        keywords: ["눈 ct", "안구 ct", "oct 검사", "황반변성 ct", "녹내장 ct", "ㅇㄱct", "dfrnct", "안구광학단층촬영", "안구 단층촬영", "망막 ct", "oct", "망막 단층촬영", "눈 정밀 검사", "안과 oct"] 
    },

    // ==========================================
    // 4. 내시경 및 천자 (category: "endoscopy")
    // ==========================================
    { 
        code: "EN_GS01", 
        category: "endoscopy", 
        type: "gastro", 
        name: "위내시경 검사 (상부위장관)", 
        price: 50000, 
        isBenefit: true, 
        keywords: ["위내시경", "위 검사", "위암 검사", "속쓰림 내시경", "식도염 검사", "ㅇㄴㅅㄱ", "dlnltdlrud", "위내시경 가격", "상부위장관 내시경", "상부위장관내시경", "위 내시경", "역류성 식도염 내시경", "위염 내시경", "위 구경", "위 카메라", "위 검사 내시경"] 
    },
    { 
        code: "EN_CL01", 
        category: "endoscopy", 
        type: "colono", 
        name: "대장내시경 검사 (전체 대장)", 
        price: 80000, 
        isBenefit: true, 
        keywords: ["대장내시경", "대장 검사", "대장암 검사", "설사 피똥 내시경", "장 검사", "ㄷㅈㄴㅅㄱ", "eowkdtlrud", "대장내시경 가격", "대장 내시경", "결장경 검사", "결장내시경", "용종 대장내시경", "대장 내시경 검사", "장 카메라", "항문 내시경", "대장 검사 내시경"] 
    },
    { 
        code: "EN_SL01", 
        category: "endoscopy", 
        type: "sleep_endo", 
        name: "수면 위내시경 마취 추가비용", 
        price: 50000, 
        isBenefit: false, 
        keywords: ["수면 위내시경 추가", "비수면 수면 전환", "수면 내시경 가격", "ㅅㅁ 위내시경", "수면위내시경", "수면 위내시경", "수면 위내시경 마취", "위내시경 수면비", "위내시경 수면 비용", "위내시경 마취비", "수면 위 엠알", "수면 위 검사"] 
    },
    { 
        code: "EN_SL02", 
        category: "endoscopy", 
        type: "sleep_endo", 
        name: "수면 대장내시경 마취 추가비용", 
        price: 80000, 
        isBenefit: false, 
        keywords: ["수면 대장내시경 추가", "대장 마취 비용", "안 아픈 대장내시경", "ㅅㅁ 대장내시경", "수면대장내시경", "수면 대장내시경", "수면 대장내시경 마취", "대장내시경 수면비", "대장내시경 수면 비용", "대장내시경 마취비", "수면 대장 엠알", "수면 대장 검사"] 
    },
    { 
        code: "EN_TX01", 
        category: "endoscopy", 
        type: "polypectomy", 
        name: "내시경 하 용종절제술 (추가 가산)", 
        price: 120000, 
        isBenefit: true, 
        keywords: ["용종 제거", "폴립 절제", "대장 용종 수술", "위 용종 수술", "ㅇㅈㅈㅈ", "dydwhdwjfwpe", "내시경하 용종절제술", "용종제거술", "대장 폴립 제거", "용종 절제술", "내시경 용종제거", "위 용종 제거", "대장 용종 제거", "용종 떼기", "대장 혹 떼기"] 
    },

    // ==========================================
    // 5. 수술/시술 (category: "surgery")
    // ==========================================
    // --- 뇌/신경 (head_neuro) ---
    { 
        code: "SU_HN01", 
        category: "surgery", 
        type: "head_neuro", 
        name: "개두술 및 뇌종양 제거수술", 
        price: 4000000, 
        isBenefit: true, 
        keywords: ["뇌수술", "개두술", "뇌종양 수술", "머리 여는 수술", "뇌암 수술", "ㄱㄷㅅ", "shltntnf", "개두술 및 뇌종양 제거수술", "뇌종양절제술", "뇌종양 제거술", "뇌종양 수술비", "craniotomy", "뇌종양적출술", "머리 수술", "뇌종양 떼기", "머리뼈 열고 수술"] 
    },
    { 
        code: "SU_HN03", 
        category: "surgery", 
        type: "head_neuro", 
        name: "뇌동맥류 코일색전술 (혈관내 시술)", 
        price: 4500000, 
        isBenefit: true, 
        keywords: ["뇌 코일 수술", "코일 색전술", "뇌혈관 시술", "허벅지 혈관 뇌수술", "ㅋㅇㅅㅈtntnf", "뇌동맥류 코일색전술", "코일색전술", "뇌동맥류 수술", "뇌혈관색전술", "뇌동맥류 코일", "뇌동맥류 색전술", "coil embolization", "뇌동맥류 시술", "뇌 혈관 꽈리", "뇌 혈관 풍선 시술"] 
    },
    { 
        code: "SU_HN06", 
        category: "surgery", 
        type: "head_neuro", 
        name: "두개골 천공술 (Burr hole 배액)", 
        price: 800000, 
        isBenefit: true, 
        keywords: ["머리 구멍 뚫기", "배액술 머리", "천공술", "만성 경막하혈종", "ㅊㄱㅅ", "cjdghstntnf", "두개골 천공술", "천공 배액술", "버홀 수술", "뇌 천공술", "뇌 배액술", "burr hole", "머리 피 빼기", "두개골 배액", "머리 구멍 수술"] 
    },

    // --- 안과 (ophthalmology) ---
    { 
        code: "SU_OP01", 
        category: "surgery", 
        type: "ophthalmology", 
        name: "백내장 수술 (단초점 인공수정체)", 
        price: 800000, 
        isBenefit: true, 
        isDRG: true, 
        keywords: ["백내장 단초점", "백내장 건강보험", "눈 렌즈 삽입", "노안 수술", "백내장 수술", "ㅂㄴㅈ tntnf", "qoranwkd tntnf", "백내장 수술 단초점", "수정체 재건술", "인공수정체 삽입술", "단초점 백내장", "백내장 급여", "백내장 단초점 렌즈", "백내장 인공수정체", "눈 렌즈 수술", "단초점 인공수정체 삽입"] 
    },
    { 
        code: "SU_OP02", 
        category: "surgery", 
        type: "ophthalmology", 
        name: "백내장 수술 (다초점 인공수정체 - 비급여)", 
        price: 3500000, 
        isBenefit: false, 
        keywords: ["백내장 다초점", "다초점 렌즈", "비급여 백내장", "노안 렌즈 삽입", "ㅂㄴㅈ 다초점", "qoranwkd eocjwwja", "비급여 백내장 수술", "다초점 인공수정체", "백내장 다초점 수술", "다초점 백내장", "백내장 비급여", "노안 백내장 다초점", "백내장 비급여 렌즈", "다초점 인공수정체 삽입", "비급여 다초점"] 
    },

    // --- 이비인후과 (ent) ---
    { 
        code: "SU_EN01", 
        category: "surgery", 
        type: "ent", 
        name: "편도선 전절제술 (Tonsillectomy)", 
        price: 400000, 
        isBenefit: true, 
        isDRG: true, 
        keywords: ["편도 수술", "편도 아데노이드", "목구멍 편도 제거", "목감기 자주 걸릴 때", "편도 결석", "ㅍㄷ tntnf", "vjeh tntnf", "편도선 전절제술", "편도 절제술", "편도아데노이드 절제술", "편도선 수술", "tonsillectomy", "편도절제", "아데노이드 수술", "편도 제거", "목 편도 수술"] 
    },
    { 
        code: "SU_EN02", 
        category: "surgery", 
        type: "ent", 
        name: "비중격 교정술 (Septoplasty 코뼈)", 
        price: 600000, 
        isBenefit: true, 
        keywords: ["코 뼈 휨 수술", "비중격 만곡증", "휜 코 교정", "코막힘 비중격", "ㅂㅈㄱ tntnf", "qndntjrtntnf", "비중격 교정술", "비중격 만곡증 수술", "코뼈 교정술", "비중격교정술", "septoplasty", "코 휜 수술", "비중격수술", "코뼈 바로잡기", "코 내부 수술"] 
    },

    // --- 흉부/심혈관 (thoracic) ---
    { 
        code: "SU_TH01", 
        category: "surgery", 
        type: "thoracic", 
        name: "관상동맥 우회술 (CABG 심장)", 
        price: 8000000, 
        isBenefit: true, 
        keywords: ["관상동맥 우회술", "심장 혈관 수술", "가슴 열고 심장수술", "협심증 우회로", "cabg", "ㄱㅅㄷㅁㅇㅎ", "rhkdtkdehdaorhghl", "관상동맥우회술", "심장우회수술", "관상동맥회선술", "cabg 수술", "관상동맥 우회수술", "심장 혈관 우회", "심장동맥 우회술"] 
    },
    { 
        code: "SU_TH06", 
        category: "surgery", 
        type: "thoracic", 
        name: "경피적 관상동맥 중재술 (스텐트 삽입술)", 
        price: 3500000, 
        isBenefit: true, 
        keywords: ["심장 스텐트", "스텐트 시술", "혈관 넓히기", "협심증 스텐트", "pci", "ㅅㅌㅌ 시술", "tmxepxltltnf", "경피적 관상동맥 중재술", "심혈관 스텐트 삽입술", "관상동맥 스텐트", "경피적관상동맥중재술", "스텐트 삽입술", "pci 시술", "스텐트 수술", "심장 스텐트 수술", "심장혈관 스텐트", "관상동맥 스텐트 시술", "심혈관 스텐트 시술"] 
    },

    // --- 복부/소화기 (abdominal) ---
    { 
        code: "SU_AB01", 
        category: "surgery", 
        type: "abdominal", 
        name: "충수절제술 - 복강경 (맹장수술)", 
        price: 1000000, 
        isBenefit: true, 
        isDRG: true, 
        keywords: ["맹장염 복강경", "맹장 수술", "충수 절제 복강경", "배에 구멍 뚫어 맹장", "ㅁㅈ 수술", "맹장수술", "맹장 수술비", "aodwkd tntnf", "ㅁㅈㅅㅅ", "충수절제술", "충수 절제술 복강경", "충수돌기염 수술", "복강경 맹장수술", "맹장염 수술", "충수염 수술", "막창자꼬리 절제술", "appendectomy", "꼬리뼈 맹장", "복강경 충수절제술"] 
    },
    { 
        code: "SU_AB02", 
        category: "surgery", 
        type: "abdominal", 
        name: "충수절제술 - 개복 (맹장수술)", 
        price: 800000, 
        isBenefit: true, 
        isDRG: true, 
        keywords: ["개복 맹장수술", "충수염 개복", "맹장 꼬였을때", "개복 맹장", "roqhraodwkd", "충수절제술 개복", "개복 충수절제술", "맹장 수술 개복", "충수염 개복 수술", "개복 맹장염", "개복 충수돌기염 수술", "충수돌기염 개복"] 
    },
    { 
        code: "SU_AB03", 
        category: "surgery", 
        type: "abdominal", 
        name: "담낭절제술 - 복강경 (쓸개 제거)", 
        price: 1200000, 
        isBenefit: true, 
        keywords: ["쓸개 제거", "담낭염 수술", "담석증 복강경", "담낭 절제", "ㄷㄴ절제", "ekaksdwjfwpe", "쓸개 수술", "Tfrptntnf", "담낭절제술 복강경", "복강경 담낭절제술", "담석증 수술", "cholecystectomy", "담석 수술", "쓸개 돌 수술", "쓸개염 수술", "담낭 용종 수술", "복강경 담낭 수술"] 
    },
    { 
        code: "SU_AB07", 
        category: "surgery", 
        type: "abdominal", 
        name: "치핵(치질) 수술", 
        price: 300000, 
        isBenefit: true, 
        isDRG: true, 
        keywords: ["치질 수술", "치핵 절제", "똥꼬 수술", "항문 피 수술", "똥꼬 혹", "ㅊㅈ 수술", "clwlf tntnf", "치핵절제술", "치질수술", "치핵수술", "항문 수술", "치핵 수술", "치루 수술", "치열 수술", "hemorrhoidectomy", "항문외과 수술", "항문 찢어짐 수술", "항문 괄약근 수술", "치질 수술비"] 
    },

    // --- 비뇨기과 (urology) ---
    { 
        code: "SU_UR02", 
        category: "surgery", 
        type: "urology", 
        name: "체외충격파쇄석술 (ESWL 요로결석)", 
        price: 500000, 
        isBenefit: true, 
        keywords: ["돌 깨기", "요로결석 쇄석", "체외 충격파 결석", "옆구리 통증 돌", "eswl", "ㅊㅇㅊ격파", "cpdhlcndrufvk", "체외충격파쇄석술", "요로결석 쇄석술", "쇄석술", "체외충격파 쇄석술", "eswl 시술", "신장결석 쇄석", "결석 수술", "요로결석 치료", "옆구리 돌 깨기", "결석 깨는 기계", "쇄석술 요로결석"] 
    },

    // --- 산부인과 (obstetrics) ---
    { 
        code: "SU_OB01", 
        category: "surgery", 
        type: "obstetrics", 
        name: "제왕절개 분만 수술 (2025년 본인부담 0%)", 
        price: 1500000, 
        isBenefit: true, 
        isDRG: true, 
        keywords: ["제왕절개", "제왕절개 수술비", "애기 낳는 수술", "출산 수술", "제왕 분만", "ㅈㅇㅈㄱ", "wpdkdwjfrp", "제왕절개술", "제왕절개분만", "산모 분만 수술", "제왕 절개 수술", "c section", "c-section", "제왕 분만 수술", "제왕 본인부담", "제왕절개 0프로", "제왕 본인부담금 면제", "산부인과 제왕 수술"] 
    },
    { 
        code: "SU_OB02", 
        category: "surgery", 
        type: "obstetrics", 
        name: "자궁 전체 적출술 - 복강경", 
        price: 1500000, 
        isBenefit: true, 
        isDRG: true, 
        keywords: ["자궁 들어내기", "자궁 적출 복강경", "자궁 떼어내기", "자궁근종 수술", "ㅈㄱ적출", "wkrdndwjfcnd", "자궁 전체 적출술", "자궁적출술 복강경", "복강경 자궁적출술", "자궁 전적출술", "hysterectomy", "자궁 적출", "자궁 혹 수술", "자궁 떼는 수술", "여성 자궁 수술", "자궁 떼어내기 수술"] 
    },

    // --- 정형외과/사지 (orthopedic) ---
    { 
        code: "SU_OR01", 
        category: "surgery", 
        type: "orthopedic", 
        name: "골절관혈적 정복술 및 내고정술 - 하지 (다리/발목)", 
        price: 1200000, 
        isBenefit: true, 
        keywords: ["다리 뼈 부러짐", "발목 핀 삽입", "다리 철판", "골절 수술 다리", "정복술", "ㄱㅈ 수술", "골절수술", "rhfjw tntnf", "ㄱㅈㅅㅅ", "골절관혈적정복술", "골절 내고정술", "핀 삽입 수술", "하지 정복술", "다리 골절 수술", "발목 골절 수술", "고관절 골절 수술", "open reduction and internal fixation", "orif", "다리 철심", "정형외과 골절 수술", "다리 내고정술"] 
    },
    { 
        code: "SU_OR02", 
        category: "surgery", 
        type: "orthopedic", 
        name: "골절관혈적 정복술 및 내고정술 - 상지 (팔/손목)", 
        price: 800000, 
        isBenefit: true, 
        keywords: ["팔 부러짐 수술", "손목 핀 박기", "팔 골절 핀", "정복술 상지", "팔 골절", "vkrwhfjw", "상지 정복술", "팔 골절 핀수술", "손목 골절 수술", "어깨 골절 수술", "손가락 골절 수술", "상지 정복술 수술", "팔 철심", "정형외과 팔 수술", "상지 내고정술"] 
    },
    { 
        code: "SU_OR03", 
        category: "surgery", 
        type: "orthopedic", 
        name: "슬관절 인공관절 전치환술 (TKR 무릎)", 
        price: 4000000, 
        isBenefit: true, 
        keywords: ["무릎 인공관절", "쇠 무릎 관절", "퇴행성 관절염 인공관절", "무릎 치환술", "tkr", "ㅇㄱ관절 무릎", "dlsrhdrhswjf", "슬관절 인공관절 전치환술", "무릎 인공관절 수술", "슬관절 치환술", "tkr 수술", "무릎 관절치환술", "total knee replacement", "tkr 무릎", "무릎 연골 인공관절", "tkr 수술비", "인공관절 수술 무릎"] 
    },
    { 
        code: "SU_OR05", 
        category: "surgery", 
        type: "orthopedic", 
        name: "전방/후방 십자인대 재건술 (무릎 관절경)", 
        price: 2000000, 
        isBenefit: true, 
        keywords: ["십자인대 수술", "인대 끊어짐 수술", "무릎 인대 이식", "십자 인대 재건", "관절경 수술", "무릎 관절경 수술", "ㅁㄹ 관절경", "anfmq rhswjfrnd", "ㅅㅈㅇㄷ", "십자인대 재건술", "관절경 십자인대 수술", "무릎 십자인대 수술", "acl 재건술", "pcl 재건술", "acl 수술", "십자인대 파열", "무릎 인대 파열 수술", "십자인대 수술 무릎관절경"] 
    },
    { 
        code: "SU_OR06", 
        category: "surgery", 
        type: "orthopedic", 
        name: "어깨 회전근개 봉합술 (관절경)", 
        price: 1200000, 
        isBenefit: true, 
        keywords: ["어깨 힘줄 꿰매기", "회전근개 수술", "어깨 내시경 수술", "회전근개 파열 수술", "어깨 관절경", "djro rhswjfrnd", "어깨 회전근개 봉합술", "회전근개 봉합술", "어깨 관절경 수술", "rotator cuff repair", "어깨 힘줄 수술", "회전근개 파열", "어깨 힘줄 봉합", "관절경 회전근개 수술"] 
    },
    { 
        code: "SU_OR07", 
        category: "surgery", 
        type: "orthopedic", 
        name: "추간판 절제술 (허리/목 디스크 수술)", 
        price: 1800000, 
        isBenefit: true, 
        keywords: ["디스크 제거 수술", "허리 디스크 수술", "추간판 절제", "신경 누르는 디스크 수술", "허리 수술", "디스크 수술", "ㄷㅅㅋ 수술", "디스크수술", "eletwktntnf", "허리 디스크 ㅡ갸", "추간판절제술", "추간판제거술", "추간판 절제술", "추간판 제거술", "디스크 절제술", "디스크 제거술", "허리디스크 수술", "목디스크 수술", "추간판탈출증 수술", "목 디스크 ㅡ갸", "discectomy", "허리 디스크 수술비", "척추디스크 수술", "허리디스크 제거"] 
    },
    { 
        code: "SU_OR10", 
        category: "surgery", 
        type: "orthopedic", 
        name: "금속 내고정물 제거술 (핀 제거 수술)", 
        price: 400000, 
        isBenefit: true, 
        keywords: ["철판 빼기", "핀 제거 수술", "뼈 핀 뽑기", "내고정물 제거", "핀제거", "핀 제거", "vlswjfrj", "ㅍㅈㄱ", "금속 내고정물 제거술", "내고정물 제거술", "골절 핀 제거", "다리 핀 빼기", "팔 핀 빼기", "외고정물 제거", "철심 제거", "철판 빼는 수술"] 
    },

    // --- 치과 (dental) ---
    { 
        code: "SU_DE01", 
        category: "surgery", 
        type: "dental", 
        name: "치석제거 (스케일링 - 연 1회 건강보험)", 
        price: 50000, 
        isBenefit: true, 
        keywords: ["스케일링", "치석 제거", "잇몸 청소", "이 스케일링", "ㅅㅋㅇㄹ", "스켈링", "tmwplffld", "치석제거", "잇몸 스케일링", "스케일링 치료", "치석제거술", "scaling", "치과 스케일링", "치아 스케일링", "연1회 스케일링"] 
    },
    { 
        code: "SU_DE02", 
        category: "surgery", 
        type: "dental", 
        name: "매복 사랑니 발치 수술 (완전매복 등)", 
        price: 100000, 
        isBenefit: true, 
        keywords: ["사랑니 발치", "매복치 발치", "사랑니 수술", "이 뽑기 사랑니", "ㅅㄹㄴ 발치", "tkfkdflqfcl", "매복 사랑니 발치", "사랑니 발치 수술", "완전매복 사랑니", "사랑니 빼기", "누운 사랑니 발치", "치과 사랑니", "매복 사랑니 빼기", "누워있는 사랑니 수술"] 
    },
    { 
        code: "SU_DE05", 
        category: "surgery", 
        type: "dental", 
        name: "임플란트 식립 수술 (1개당 비급여 기준)", 
        price: 1500000, 
        isBenefit: false, 
        keywords: ["임플란트 수술", "가짜 이빨 심기", "인공 치아", "비급여 임플란트", "ㅇㅍㄹㅌ", "dlaflffkdxn", "임플란트 식립", "임플란트수술", "치과 임플란트", "implant", "치아 임플란트", "임플란트 심기", "이빨 심는 수술"] 
    },

    // ==========================================
    // 6. 처치 및 기타 (category: "procedure")
    // ==========================================
    // --- 마취 (anesthesia) ---
    { 
        code: "PR_AN01", 
        category: "procedure", 
        type: "anesthesia", 
        name: "전신마취 (1시간 이내)", 
        price: 200000, 
        isBenefit: true, 
        keywords: ["전신 마취", "잠자는 마취", "큰 수술 마취", "ㅈㅅㅁㅊ", "wstlsakcl", "전신마취", "일반 전신마취", "수술 전신마취", "마취 가스 잠들기", "가스 마취", "인공 호흡 마취"] 
    },
    { 
        code: "PR_AN04", 
        category: "procedure", 
        type: "anesthesia", 
        name: "척추마취 (하반신마취)", 
        price: 100000, 
        isBenefit: true, 
        keywords: ["하반신 마취", "허리 주사 마취", "척수 마취", "다리 수술 마취", "ㅊㅊㅁㅊ", "cjrcnakcl", "척추마취", "하반신마취", "척수마취", "허리 척추마취", "하체 마취", "허리 주사 수술 마취"] 
    },
    { 
        code: "PR_AN06", 
        category: "procedure", 
        type: "anesthesia", 
        name: "의식하진정 마취 (수면마취)", 
        price: 50000, 
        isBenefit: true, 
        keywords: ["수면 마취", "의식하 진정", "졸린 주사 수술", "ㅅㅁㅁㅊ", "tnaksakcl", "수면마취", "의식하진정마취", "위내시경 수면마취", "대장내시경 수면마취", "수면 주사 마취", "의식하진정", "안아픈 수면 마취"] 
    },

    // --- 주사/수혈 (injection) ---
    { 
        code: "PR_IN01", 
        category: "procedure", 
        type: "injection", 
        name: "정맥 내 점적 주사 (IV 수액 라인)", 
        price: 5000, 
        isBenefit: true, 
        keywords: ["링거 주사", "수액 맞기", "정맥 주사", "iv 주사", "혈관 주사", "ㅈㅁㅈㅅ", "wjdakwntk", "정맥내 점적주사", "링거주사", "수액라인", "정맥 링겔", "iv 라인", "정맥주사 라인잡기"] 
    },
    { 
        code: "PR_IN03", 
        category: "procedure", 
        type: "injection", 
        name: "기본 생리식염수/포도당 수액 (500ml)", 
        price: 15000, 
        isBenefit: true, 
        keywords: ["포도당 링거", "식염수 수액", "수액 주입", "링겔", "ㅅㅇㅈㅇ", "tndorwndlq", "포도당 수액", "생리식염수 수액", "500ml 수액", "기본 영양수액", "생리 식염수 링겔", "포도당 수액 주사"] 
    },

    // --- 기본처치 (treatment) ---
    { 
        code: "PR_TR01", 
        category: "procedure", 
        type: "treatment", 
        name: "단순 상처봉합술 (피부 꿰매기)", 
        price: 50000, 
        isBenefit: true, 
        keywords: ["상처 봉합", "꼬매기 수술", "찢어진곳 꿰매기", "단순 봉합", "ㅂㅎㅅ", "qhdgqxtntnf", "단순상처봉합술", "상처 봉합술", "피부 꿰매기", "찢어진 피부 봉합", "실밥 수술", "봉합수술"] 
    },
    { 
        code: "PR_TR03", 
        category: "procedure", 
        type: "treatment", 
        name: "석고 깁스/석고 붕대 고정 (통깁스)", 
        price: 40000, 
        isBenefit: true, 
        keywords: ["통깁스", "반깁스", "깁스 하기", "석고 고정", "부목 고정", "ㄱㅅ", "rlqtm", "석고깁스", "석고붕대", "깁스고정", "다리 깁스", "팔 깁스", "반기브스", "통기브스", "정형외과 깁스"] 
    },
    { 
        code: "PR_TR08", 
        category: "procedure", 
        type: "treatment", 
        name: "일반 상처 소독 및 드레싱 (1회)", 
        price: 10000, 
        isBenefit: true, 
        keywords: ["소독 하기", "빨간약 소독", "상처 드레싱", "실밥 뽑기 전 소독", "ㅅㄷ", "thdegkrl", "상처소독", "소독및드레싱", "상처 소독", "포비돈 소독", "드레싱 소독", "외과적 드레싱", "상처 빨간약"] 
    },

    // --- 재활/물리치료 (rehab) ---
    { 
        code: "PR_RE01", 
        category: "procedure", 
        type: "rehab", 
        name: "기본 물리치료 (온열요법 및 한냉치료 1회)", 
        price: 5000, 
        isBenefit: true, 
        keywords: ["찜질 물리치료", "핫팩 쿨팩", "적외선 치료", "정형외과 찜질", "ㅁㄹㅊㄹ", "ansflclfy", "물리치료", "온열요법", "한냉치료", "전기 자극 치료", "정형외과 물리치료", "물리치료 온열", "정형외과 레이저"] 
    },
    { 
        code: "PR_RE04", 
        category: "procedure", 
        type: "rehab", 
        name: "도수치료 (비급여 손 치료 1회)", 
        price: 110000, 
        isBenefit: false, 
        keywords: ["도수 치료", "뼈 맞추기", "손으로 마사지 치료", "카이로프랙틱", "비급여 도수", "ㄷㅅclfy", "ehstclfy", "도수치료", "비급여도수치료", "체형 교정 도수치료", "손 척추 교정"] 
    },

    // --- 한방 (korean_med) ---
    { 
        code: "PR_KM01", 
        category: "procedure", 
        type: "korean_med", 
        name: "한방 침술 치료 (기본 침 1회)", 
        price: 8000, 
        isBenefit: true, 
        keywords: ["한의원 침", "침 맞기", "침 치료", "발목 삐었을때 침", "ㅊㅅ", "clatnf", "한방 침술", "침술치료", "한의원 침치료", "기본 침 치료", "한방 침 수술", "침술"] 
    },

    // ==========================================
    // 7. 신설: 다빈도 입원/패키지 및 응급실 3단계 수가 (MVP 맞춤 고도화)
    // ==========================================
    { 
        code: "PK_PN01", 
        category: "surgery", 
        type: "abdominal", 
        name: "폐렴 입원 치료 패키지 (5일 입원+약제+검사 기준)", 
        price: 450000, 
        isBenefit: true, 
        keywords: ["폐렴 입원", "폐렴 치료", "폐렴 병원비", "기침 입원", "폐렴 패키지", "폐렴", "ㅍㄹㅇㅇ", "vYfud eablqns", "폐렴입원치료", "폐렴 패키지 치료", "기침 가래 입원", "폐렴 증상 입원", "소아 폐렴 입원", "노인 폐렴 입원"] 
    },
    { 
        code: "ER_LG01", 
        category: "procedure", 
        type: "treatment", 
        name: "응급실 경증 진료 (응급의료 관리료 경증 환자)", 
        price: 20000, 
        isBenefit: true, 
        keywords: ["응급실 경증", "응급실 단순", "응급실 찰과상", "응급실 해열제", "응급실", "ㅇㄱㅅ", "dmarwqtfl", "응급의료관리료 경증", "경증 응급실", "단순 감기 응급실", "응급실 경증 환자", "응급실 감기 수납"] 
    },
    { 
        code: "ER_MD01", 
        category: "procedure", 
        type: "treatment", 
        name: "응급실 중등도 진료 (응급의료 관리료 중등도 환자)", 
        price: 60000, 
        isBenefit: true, 
        keywords: ["응급실 중등도", "응급실 복통", "응급실 골절", "응급실 찢어짐", "응급실 봉합", "ㅇㄱㅅ", "dmarwqtfl", "응급의료관리료 중등도", "중등도 응급실", "응급 꼬매기", "중등도 응급의료", "응급실 뼈 부러짐"] 
    },
    { 
        code: "ER_ST01", 
        category: "procedure", 
        type: "treatment", 
        name: "응급실 중증 진료 (응급의료 관리료 중증/응급 환자)", 
        price: 120000, 
        isBenefit: true, 
        keywords: ["응급실 중증", "응급실 호흡곤란", "응급실 의식불명", "응급실 심정지", "응급실 중상", "ㅇㄱㅅ", "dmarwqtfl", "응급의료관리료 중증", "중증 응급실", "응급실 CPR", "중증 응급의료관리료", "응급실 뇌출혈 수납"] 
    },
    { 
        code: "PR_TR09", 
        category: "procedure", 
        type: "treatment", 
        name: "중심정맥관 삽입술 (PICC)", 
        price: 150000, 
        isBenefit: true, 
        keywords: ["중심정맥관", "picc", "중심정맥관 삽입술", "peripherally inserted central catheter", "central line", "중심정맥", "피씨씨씨", "wndtla wdehfrhks", "vlr", "중심 정맥", "중심정맥 카테터", "팔 정맥 주사", "항암 주사 라인", "항암 포트", "중심정맥라인"] 
    }
];

const KCD_DATABASE = [
    { code: "A00", name: "콜레라", keywords: ["콜레라", "cholera", "ㅋㄹㄹ"] },
    { code: "A09", name: "감염성 및 상세불명 기원의 위장염 및 설사 (장염)", keywords: ["장염", "설사", "식중독", "gastroenteritis", "diarrhea", "ㅈㅇ"] },
    { code: "B02", name: "대상포진", keywords: ["대상포진", "피부 수포", "shingles", "herpes zoster", "ㄷㅅㅍㅈ"] },
    { code: "B18", name: "만성 바이러스간염", keywords: ["간염", "b형 간염", "c형 간염", "hepatitis", "ㄱㅇ"] },
    { code: "B35", name: "백선증 (무좀)", keywords: ["무좀", "백선증", "발 무좀", "tinea", "athlete's foot", "ㅁㅈ"] },
    { code: "C16", name: "위의 악성 신생물 (위암)", keywords: ["위암", "위장암", "stomach cancer", "gastric cancer", "ㅇㅇ"] },
    { code: "C18", name: "결장의 악성 신생물 (대장암)", keywords: ["대장암", "결장암", "colon cancer", "ㄷㅈㅇ"] },
    { code: "C34", name: "기관지 및 폐의 악성 신생물 (폐암)", keywords: ["폐암", "폐선암", "lung cancer", "ㅍㅇ"] },
    { code: "C50", name: "유방의 악성 신생물 (유방암)", keywords: ["유방암", "breast cancer", "ㅇㅂㅇ"] },
    { code: "C61", name: "전립선의 악성 신생물 (전립선암)", keywords: ["전립선암", "prostate cancer", "ㅈㄹㅅㅇ"] },
    { code: "C73", name: "갑상선의 악성 신생물 (갑상선암)", keywords: ["갑상선암", "thyroid cancer", "ㄱㅅㅅㅇ"] },
    { code: "D25", name: "자궁의 평활근종 (자궁근종)", keywords: ["자궁근종", "자궁종양", "uterine fibroid", "leiomyoma", "ㅈㄱㄱㅈ"] },
    { code: "E03", name: "기타 갑상선기능저하증", keywords: ["갑상선기능저하증", "갑상선저하증", "hypothyroidism", "ㄱㅅㅅㅈㅎ"] },
    { code: "E05", name: "갑상선독증 (갑상선기능항진증)", keywords: ["갑상선기능항진증", "갑상선항진증", "hyperthyroidism", "ㄱㅅㅅㅎㅈ"] },
    { code: "E11", name: "2형 당뇨병", keywords: ["당뇨병", "당뇨", "diabetes", "ㄷㄴ"] },
    { code: "E78", name: "고지혈증 (지질대사 장애)", keywords: ["고지혈증", "이상지질혈증", "콜레스테롤", "hyperlipidemia", "dyslipidemia", "ㄱㅈㅎ"] },
    { code: "F32", name: "우울에피소드 (우울증)", keywords: ["우울증", "우울감", "depression", "ㅇㅇㅈ"] },
    { code: "F41", name: "기타 불안장애 (공황장애)", keywords: ["공황장애", "불안장애", "공황 발작", "panic disorder", "anxiety", "ㄱㅎㅈㅇ"] },
    { code: "F51", name: "비기질성 수면장애 (불면증)", keywords: ["불면증", "수면장애", "insomnia", "ㅂㅁㅈ"] },
    { code: "G43", name: "편두통", keywords: ["편두통", "머리통증", "migraine", "ㅍㄷㅌ"] },
    { code: "G45", name: "일시적 대뇌허혈발작 (미니 뇌졸중)", keywords: ["미니 뇌졸중", "뇌허혈", "tia", "transient ischemic attack", "ㅁㄴㄴㅈㅈ"] },
    { code: "H04", name: "눈물계통의 장애 (안구건조증)", keywords: ["안구건조증", "눈마름증", "dry eye", "ㅇㄱㄱㅈ"] },
    { code: "H10", name: "결막염", keywords: ["결막염", "유행성 결막염", "conjunctivitis", "pink eye", "ㄱㅁㅇ"] },
    { code: "H25", name: "노년백내장", keywords: ["백내장", "눈 침침", "cataract", "ㅂㄴㅈ"] },
    { code: "H40", name: "녹내장", keywords: ["녹내장", "안압 상승", "glaucoma", "ㄴㄴㅈ"] },
    { code: "H65", name: "비화농성 중이염", keywords: ["중이염", "귀 염증", "otitis media", "ㅈㅇㅇ"] },
    { code: "H81", name: "전정기능의 장애 (이석증/메니에르)", keywords: ["이석증", "어지럼증", "메니에르", "vertigo", "meniere", "ㅇㅅㅈ"] },
    { code: "I10", name: "본태성(일차성) 고혈압", keywords: ["고혈압", "혈압", "hypertension", "ㄱㅎㅇ"] },
    { code: "I20", name: "협심증", keywords: ["협심증", "가슴통증", "angina pectoris", "ㅎㅅㅈ"] },
    { code: "I21", name: "급성 심근경색증", keywords: ["심근경색", "심장마비", "myocardial infarction", "ami", "ㅅㄱㄱㅅ"] },
    { code: "I48", name: "심방세동 및 조동", keywords: ["심방세동", "부정맥", "atrial fibrillation", "afib", "ㅅㅂㅅㄷ"] },
    { code: "I49", name: "기타 부정맥", keywords: ["부정맥", "심장 두근거림", "arrhythmia", "ㅂㅈㅁ"] },
    { code: "I61", name: "뇌내출혈", keywords: ["뇌출혈", "뇌동맥류 터짐", "intracerebral hemorrhage", "ㄴㅊㅎ"] },
    { code: "I63", name: "뇌경색증", keywords: ["뇌경색", "중풍", "뇌혈관 막힘", "cerebral infarction", "ischemic stroke", "ㄴㄱㅅ"] },
    { code: "I64", name: "뇌졸중", keywords: ["뇌졸중", "중풍", "뇌출혈 뇌경색", "stroke", "ㄴㅈㅈ"] },
    { code: "I84", name: "치핵 (치질)", keywords: ["치질", "치핵", "항문 피", "hemorrhoids", "ㅊㅈ"] },
    { code: "J00", name: "급성 비인두염 (감기)", keywords: ["감기", "코감기", "목감기", "cold", "rhinitis", "nasopharyngitis", "ㄱㄱ"] },
    { code: "J01", name: "급성 부비동염 (축농증)", keywords: ["축농증", "부비동염", "sinusitis", "ㅊㄴㅈ"] },
    { code: "J02", name: "급성 인두염", keywords: ["인두염", "목 염증", "pharyngitis", "ㅇㄷㅇ"] },
    { code: "J03", name: "급성 편도염", keywords: ["편도염", "목부음", "tonsillitis", "ㅍㄷㅇ"] },
    { code: "J10", name: "인플루엔자 (독감)", keywords: ["독감", "인플루엔자", "독감주사", "influenza", "flu", "ㄷㄱ"] },
    { code: "J18", name: "상세불명 원인의 폐렴", keywords: ["폐렴", "폐", "pneumonia", "ㅍㄹ"] },
    { code: "J20", name: "급성 기관지염", keywords: ["기관지염", "기관지", "bronchitis", "ㄱㄱㅈ"] },
    { code: "J30", name: "알레르기성 비염", keywords: ["비염", "알레르기 비염", "콧물", "rhinitis", "allergic rhinitis", "ㅂㅇ"] },
    { code: "J32", name: "만성 부비동염", keywords: ["만성 축농증", "부비동염", "sinusitis", "ㅂㅂㄷㅇ"] },
    { code: "J45", name: "천식", keywords: ["천식", "기침", "asthma", "ㅊㅅ"] },
    { code: "K21", name: "위-식도역류병 (역류성 식도염)", keywords: ["역류성 식도염", "식도염", "신물", "reflux esophagitis", "gerd", "ㅇㄹㅅ"] },
    { code: "K25", name: "위궤양", keywords: ["위궤양", "위통증", "gastric ulcer", "ㅇㄱㅇ"] },
    { code: "K29", name: "위염 및 십이지장염", keywords: ["위염", "소화불량", "gastritis", "ㅇㅇ"] },
    { code: "K35", name: "급성 충수염 (맹장염)", keywords: ["맹장염", "충수염", "맹장 수술", "appendicitis", "ㅁㅈㅇ"] },
    { code: "K58", name: "과민성 대장 증후군", keywords: ["과민성 대장 증후군", "과민성 대장", "ibs", "irritable bowel syndrome", "ㄱㅁㅅㄷㅈ"] },
    { code: "K70", name: "알코올성 간질환", keywords: ["알코올성 간경변", "지방간", "alcoholic liver", "ㅇㅋㅇㅅㄱ"] },
    { code: "K76", name: "지방간", keywords: ["지방간", "비알코올성 지방간", "fatty liver", "ㅈㅂㄱ"] },
    { code: "K80", name: "쓸개돌증 (담석증)", keywords: ["담석증", "담석", "쓸개 통증", "cholelithiasis", "gallstone", "ㄷㅅㅈ"] },
    { code: "L20", name: "아토피 피부염", keywords: ["아토피", "피부 가려움", "atopic dermatitis", "ㅇㅌㅍ"] },
    { code: "L23", name: "알레르기성 접촉피부염", keywords: ["접촉성 피부염", "접촉 피부염", "contact dermatitis", "ㅈㅊㅍㅂㅇ"] },
    { code: "L30", name: "기타 피부염 (습진)", keywords: ["습진", "피부염", "eczema", "dermatitis", "ㅅㅈ"] },
    { code: "L70", name: "여드름", keywords: ["여드름", "피부 트러블", "acne", "ㅇㄷㄹ"] },
    { code: "M17", name: "무릎관절증 (퇴행성 관절염)", keywords: ["관절염", "무릎 통증", "퇴행성 관절염", "osteoarthritis", "knee arthritis", "ㄱㅈㅇ"] },
    { code: "M48", name: "기타 척추병증 (척추협착증)", keywords: ["척추협착증", "협착증", "spinal stenosis", "척추 협착", "ㅎㅊㅈ"] },
    { code: "M50", name: "경추추간판장애 (목디스크)", keywords: ["목디스크", "경추디스크", "c-spine disc", "ㅁㄷㅅ"] },
    { code: "M51", name: "요추추간판장애 (허리디스크)", keywords: ["허리디스크", "디스크", "요추디스크", "herniated disc", "l-spine disc", "ㅎㄹ"] },
    { code: "M54", name: "등통증 (요통/허리통증)", keywords: ["허리통증", "요통", "등 통증", "back pain", "lumbago", "ㅇㅌ"] },
    { code: "M545", name: "요추통 (허리통증)", keywords: ["허리통증", "요통", "허리 아플때", "low back pain", "ㅇㅌ"] },
    { code: "M75", name: "어깨 병변 (오십견/회전근개)", keywords: ["오십견", "어깨 통증", "회전근개", "frozen shoulder", "rotator cuff", "ㅇㅅㄱ"] },
    { code: "M750", name: "어깨의 유착성 피막염 (오십견)", keywords: ["오십견", "어깨 통증", "유착성 피막염", "frozen shoulder", "ㅇㅅㄱ"] },
    { code: "M79", name: "기타 연조직 장애 (근육통)", keywords: ["근육통", "몸살", "myalgia", "ㄱㅇㅌ"] },
    { code: "M81", name: "골다공증", keywords: ["골다공증", "뼈 강도", "osteoporosis", "ㄱㄷㄱㅈ"] },
    { code: "N20", name: "신장 및 요관의 결석 (요로결석)", keywords: ["요로결석", "신장결석", "urolithiasis", "renal stone", "ㅇㄹㄱㅅ"] },
    { code: "N30", name: "방광염", keywords: ["방광염", "오줌 통증", "cystitis", "ㅂㄱㅇ"] },
    { code: "N40", name: "전립선 비대증", keywords: ["전립선 비대증", "전립선비대", "bph", "prostatic hyperplasia", "ㅈㄹㅅㅂㄷ"] },
    { code: "N60", name: "양성 유방형성장애", keywords: ["유방 선종", "유방 결절", "breast benign", "ㅇㅂㅅㅈ"] },
    { code: "O80", name: "단일 자연분만", keywords: ["자연분만", "애기 낳기", "vaginal delivery", "ㅈㅇㅂㅁ"] },
    { code: "O82", name: "제왕절개에 의한 분만", keywords: ["제왕절개", "분만", "c-section", "cesarean", "ㅈㅇㅈㄱ"] },
    { code: "R51", name: "두통", keywords: ["두통", "머리 아픔", "headache", "ㄷㅌ"] },
    { code: "R42", name: "어지럼증 및 현기증", keywords: ["어지럼증", "이석증 어지러움", "dizziness", "giddiness", "ㅇㅈㄹ"] },
    { code: "S00", name: "머리의 표재성 손상 (머리 상처)", keywords: ["머리 찢어짐", "머리 상처", "head injury", "ㅁㄹㅅㅊ"] },
    { code: "S33", name: "요추 및 골반의 염좌 (허리 삐끗)", keywords: ["허리 삐끗", "허리 염좌", "요추 염좌", "back sprain", "ㅎㄹㅇㅈ"] },
    { code: "S63", name: "손목 및 손가락의 염좌", keywords: ["손목 삐끗", "손목 염좌", "wrist sprain", "ㅅㅁㅇㅈ"] },
    { code: "S93", name: "발목 및 발부위의 염좌 (발목 삠)", keywords: ["발목 삠", "발목 접지름", "발목 염좌", "ankle sprain", "ㅂㅁㅇㅈ"] },
    { code: "Z00", name: "일반 검사 (건강검진)", keywords: ["건강검진", "검진", "general checkup", "ㄱㄱㄱㅈ"] },
    { code: "Z01", name: "기타 특수검사 및 조사 (안과/치과 검진)", keywords: ["치과 검진", "안과 검진", "special exam", "ㅌㅅㄱㅈ"] }
];
