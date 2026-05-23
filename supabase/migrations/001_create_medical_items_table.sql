-- 001_create_medical_items_table.sql
-- 의료비 예상 범위 항목을 저장하는 테이블 정의

CREATE TABLE IF NOT EXISTS medical_items (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 영상검사(imaging), 응급실(emergency), 다빈도 입원/수술(inpatient_surgery) 등
    korean_name VARCHAR(100) NOT NULL, -- 공식 한글 명칭
    synonyms TEXT, -- 쉼표로 구분된 동의어 및 검색 키워드 (예: "허리 mri,요추 mri,L-spine mri")
    estimated_min_cost INT NOT NULL, -- 예상 총진료비 최소값 (원 단위)
    estimated_max_cost INT NOT NULL, -- 예상 총진료비 최대값 (원 단위)
    estimated_patient_cost_min INT NOT NULL, -- 예상 본인부담금 최소값 (원 단위)
    estimated_patient_cost_max INT NOT NULL, -- 예상 본인부담금 최대값 (원 단위)
    inpatient_outpatient VARCHAR(20) DEFAULT 'outpatient', -- 입원/외래 구분 ('inpatient', 'outpatient', 'er')
    hospital_level VARCHAR(30) DEFAULT 'clinic', -- 병원 규모 ('clinic': 의원, 'hospital': 병원, 'general': 종합병원, 'tertiary': 상급종합병원)
    insurance_applied BOOLEAN DEFAULT true, -- 건강보험(급여) 적용 여부
    description TEXT, -- 일반인을 위한 간단한 설명
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 검색 성능 향상을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_medical_items_korean_name ON medical_items (korean_name);
CREATE INDEX IF NOT EXISTS idx_medical_items_category ON medical_items (category);
