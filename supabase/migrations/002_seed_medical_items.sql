-- 002_seed_medical_items.sql
-- MVP 다빈도 항목(영상검사, 응급실, 다빈도 입원/수술) 기초 데이터 시딩

-- 기존 데이터 초기화 (필요시)
TRUNCATE TABLE medical_items;

-- 1. 영상검사 (Imaging)
-- 요추(허리) MRI (일반적으로 비급여 항목이 많음)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('imaging', '요추(허리) MRI', '허리 mri,요추 mri,L-spine mri,척추 mri,허리 엠알아이,L spine mri,l-spine mri,허리디스크 mri,허리 검사', 250000, 400000, 250000, 400000, 'outpatient', 'clinic', false, '허리 통증이나 디스크 의심 시 시행하는 자명한 영상 검사입니다. 의원급의 비급여 기준 비용입니다.'),
('imaging', '요추(허리) MRI', '허리 mri,요추 mri,L-spine mri,척추 mri,허리 엠알아이,L spine mri,l-spine mri,허리디스크 mri,허리 검사', 300000, 450000, 300000, 450000, 'outpatient', 'hospital', false, '병원급에서 시행하는 허리 MRI 검사 비용입니다.'),
('imaging', '요추(허리) MRI', '허리 mri,요추 mri,L-spine mri,척추 mri,허리 엠알아이,L spine mri,l-spine mri,허리디스크 mri,허리 검사', 350000, 550000, 350000, 550000, 'outpatient', 'general', false, '종합병원에서 시행하는 허리 MRI 검사 비용입니다.'),
('imaging', '요추(허리) MRI', '허리 mri,요추 mri,L-spine mri,척추 mri,허리 엠알아이,L spine mri,l-spine mri,허리디스크 mri,허리 검사', 450000, 750000, 450000, 750000, 'outpatient', 'tertiary', false, '대학병원 등 상급종합병원에서 시행하는 허리 MRI 검사 비용입니다.');

-- 뇌(머리) MRI (급여 적용 기준 - 특정 증상이나 의학적 필요성이 있을 때)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('imaging', '뇌(머리) MRI', '머리 mri,뇌 mri,Brain mri,뇌 엠알아이,머리 엠알아이,brain mri,두통 mri,어지럼증 mri', 300000, 400000, 900000, 120000, 'outpatient', 'clinic', true, '뇌 질환 의심 등 의학적 필요성이 인정되어 건강보험(급여)이 적용된 경우의 본인부담금 기준입니다. (본인부담률 30%)'),
('imaging', '뇌(머리) MRI', '머리 mri,뇌 mri,Brain mri,뇌 엠알아이,머리 엠알아이,brain mri,두통 mri,어지럼증 mri', 350000, 450000, 140000, 180000, 'outpatient', 'hospital', true, '병원급에서의 뇌 MRI 급여 적용 비용입니다. (본인부담률 40%)'),
('imaging', '뇌(머리) MRI', '머리 mri,뇌 mri,Brain mri,뇌 엠알아이,머리 엠알아이,brain mri,두통 mri,어지럼증 mri', 400000, 550000, 200000, 275000, 'outpatient', 'general', true, '종합병원급에서의 뇌 MRI 급여 적용 비용입니다. (본인부담률 50%)'),
('imaging', '뇌(머리) MRI', '머리 mri,뇌 mri,Brain mri,뇌 엠알아이,머리 엠알아이,brain mri,두통 mri,어지럼증 mri', 450000, 650000, 270000, 390000, 'outpatient', 'tertiary', true, '상급종합병원(대학병원)에서의 뇌 MRI 급여 적용 비용입니다. (본인부담률 60%)');

-- 복부 CT (조영제 사용, 급여 기준)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('imaging', '복부 CT', '배 ct,복부 ct,Abdomen ct,복부 씨티,배 씨티,복통 ct,위 ct,대장 ct', 80000, 120000, 24000, 36000, 'outpatient', 'clinic', true, '조영제를 사용하는 복부 CT 촬영 비용입니다. 급여 적용 기준입니다. (본인부담률 30%)'),
('imaging', '복부 CT', '배 ct,복부 ct,Abdomen ct,복부 씨티,배 씨티,복통 ct,위 ct,대장 ct', 100000, 150000, 40000, 60000, 'outpatient', 'hospital', true, '병원급 복부 CT 급여 적용 비용입니다. (본인부담률 40%)'),
('imaging', '복부 CT', '배 ct,복부 ct,Abdomen ct,복부 씨티,배 씨티,복통 ct,위 ct,대장 ct', 120000, 180000, 60000, 90000, 'outpatient', 'general', true, '종합병원 복부 CT 급여 적용 비용입니다. (본인부담률 50%)'),
('imaging', '복부 CT', '배 ct,복부 ct,Abdomen ct,복부 씨티,배 씨티,복통 ct,위 ct,대장 ct', 150000, 250000, 90000, 150000, 'outpatient', 'tertiary', true, '상급종합병원 복부 CT 급여 적용 비용입니다. (본인부담률 60%)');

-- 흉부 X-ray (일반 엑스레이, 급여 기준)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('imaging', '흉부 X-ray (가슴 엑스레이)', '가슴 엑스레이,가슴 x-ray,흉부 x-ray,흉부 엑스선,chest x-ray,chest xray,기침 엑스레이,폐 엑스레이', 15000, 25000, 4500, 7500, 'outpatient', 'clinic', true, '가슴 부위를 촬영하는 가장 기본적인 방사선 검사입니다. (본인부담률 30%)'),
('imaging', '흉부 X-ray (가슴 엑스레이)', '가슴 엑스레이,가슴 x-ray,흉부 x-ray,흉부 엑스선,chest x-ray,chest xray,기침 엑스레이,폐 엑스레이', 18000, 28000, 7200, 11200, 'outpatient', 'hospital', true, '병원급 흉부 X-ray 비용입니다. (본인부담률 40%)'),
('imaging', '흉부 X-ray (가슴 엑스레이)', '가슴 엑스레이,가슴 x-ray,흉부 x-ray,흉부 엑스선,chest x-ray,chest xray,기침 엑스레이,폐 엑스레이', 20000, 32000, 10000, 16000, 'outpatient', 'general', true, '종합병원 흉부 X-ray 비용입니다. (본인부담률 50%)'),
('imaging', '흉부 X-ray (가슴 엑스레이)', '가슴 엑스레이,가슴 x-ray,흉부 x-ray,흉부 엑스선,chest x-ray,chest xray,기침 엑스레이,폐 엑스레이', 25000, 40000, 15000, 24000, 'outpatient', 'tertiary', true, '상급종합병원 흉부 X-ray 비용입니다. (본인부담률 60%)');

-- 복부 초음파 (급여 기준)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('imaging', '복부 초음파', '배 초음파,복부 초음파,간 초음파,담낭 초음파,췌장 초음파,ultrasound,상복부 초음파', 60000, 90000, 18000, 27000, 'outpatient', 'clinic', true, '간, 담낭, 췌장 등 상복부 장기를 확인하는 초음파 검사입니다. 급여 기준입니다. (본인부담률 30%)'),
('imaging', '복부 초음파', '배 초음파,복부 초음파,간 초음파,담낭 초음파,췌장 초음파,ultrasound,상복부 초음파', 70000, 110000, 28000, 44000, 'outpatient', 'hospital', true, '병원급 복부 초음파 비용입니다. (본인부담률 40%)'),
('imaging', '복부 초음파', '배 초음파,복부 초음파,간 초음파,담낭 초음파,췌장 초음파,ultrasound,상복부 초음파', 90000, 140000, 45000, 70000, 'outpatient', 'general', true, '종합병원 복부 초음파 비용입니다. (본인부담률 50%)'),
('imaging', '복부 초음파', '배 초음파,복부 초음파,간 초음파,담낭 초음파,췌장 초음파,ultrasound,상복부 초음파', 110000, 180000, 66000, 108000, 'outpatient', 'tertiary', true, '상급종합병원 복부 초음파 비용입니다. (본인부담률 60%)');


-- 2. 응급실 (Emergency Room)
-- 응급실 경증 (단순 감기, 경미한 열 등)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('emergency', '응급 진료 (경증)', '경증 응급실,응급실 감기,응급실 열,가벼운 응급실,er 경증,소아과 응급실,야간 응급실,응급의료관리료', 60000, 100000, 30000, 60000, 'er', 'hospital', true, '야간이나 공휴일에 경미한 증상으로 응급실을 방문했을 때의 기본 진찰 및 기초 처치 비용입니다. 응급의료관리료가 부과됩니다.'),
('emergency', '응급 진료 (경증)', '경증 응급실,응급실 감기,응급실 열,가벼운 응급실,er 경증,소아과 응급실,야간 응급실,응급의료관리료', 80000, 130000, 50000, 90000, 'er', 'general', true, '종합병원 응급실 방문 시 경증 환자의 예상 비용 범위입니다. 응급관리료 비중이 큽니다.'),
('emergency', '응급 진료 (경증)', '경증 응급실,응급실 감기,응급실 열,가벼운 응급실,er 경증,소아과 응급실,야간 응급실,응급의료관리료', 120000, 180000, 80000, 130000, 'er', 'tertiary', true, '상급종합병원 응급실을 경증 증상으로 방문했을 때 부과되는 비용입니다. 비응급/경증 환자는 전액 본인부담되는 항목이 늘어납니다.');

-- 응급실 중등도 (골절 의심 처치, 심한 복통 및 수액/검사 동반)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('emergency', '응급 진료 (중등도)', '중등도 응급실,응급실 처치,응급실 골절,er 중등도,응급실 수액,응급실 검사,응급실 깁스', 150000, 250000, 70000, 130000, 'er', 'hospital', true, '뼈 골절, 심한 통증 등으로 응급실에서 기본적인 X-ray 검사, 혈액 검사 및 수액 처치를 받은 경우입니다.'),
('emergency', '응급 진료 (중등도)', '중등도 응급실,응급실 처치,응급실 골절,er 중등도,응급실 수액,응급실 검사,응급실 깁스', 200000, 350000, 100000, 200000, 'er', 'general', true, '종합병원 응급실 중등도 처치 및 검사 비용입니다.'),
('emergency', '응급 진료 (중등도)', '중등도 응급실,응급실 처치,응급실 골절,er 중등도,응급실 수액,응급실 검사,응급실 깁스', 280000, 480000, 160000, 280000, 'er', 'tertiary', true, '상급종합병원 응급실에서 중등도 환자 검사 및 처치 비용입니다.');

-- 응급실 중증 (심근경색, 뇌졸중 의심, 심각한 외상 등 중환자실 연계 및 긴급 수술 전 단계)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('emergency', '응급 진료 (중증)', '중증 응급실,심근경색 응급실,뇌졸중 응급실,er 중증,긴급 수술,응급 중환자,응급실 심폐소생술,중증 외상', 400000, 800000, 150000, 350000, 'er', 'hospital', true, '의식 장애, 심혈관 증상 등 긴박한 치료가 필요한 중증 상태의 응급실 집중 모니터링 및 치료 비용입니다.'),
('emergency', '응급 진료 (중증)', '중증 응급실,심근경색 응급실,뇌졸중 응급실,er 중증,긴급 수술,응급 중환자,응급실 심폐소생술,중증 외상', 600000, 1200000, 250000, 500000, 'er', 'general', true, '종합병원 권역응급센터 수준의 중증 응급 처치 비용입니다.'),
('emergency', '응급 진료 (중증)', '중증 응급실,심근경색 응급실,뇌졸중 응급실,er 중증,긴급 수술,응급 중환자,응급실 심폐소생술,중증 외상', 900000, 1800000, 400000, 800000, 'er', 'tertiary', true, '상급종합병원 권역응급의료센터에서의 중증 응급환자 진료비입니다. 각종 정밀 검사와 응급 집중 케어가 포함됩니다.');


-- 3. 다빈도 입원/수술 (Inpatient / Surgery)
-- 맹장수술 (충수절제술 - 3~4일 입원 기준, 포괄수가제 대상)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('inpatient_surgery', '맹장 수술 (충수절제술)', '맹장염,맹장 수술,충수염,충수절제술,아펜,appendectomy,맹장 입원', 1200000, 1500000, 200000, 300000, 'inpatient', 'clinic', true, '포괄수가제(DRG)가 적용되는 수술로, 의원급 입원 3박4일 기준 환자가 실제로 부담하는 예상 비용입니다.'),
('inpatient_surgery', '맹장 수술 (충수절제술)', '맹장염,맹장 수술,충수염,충수절제술,아펜,appendectomy,맹장 입원', 1400000, 1800000, 280000, 380000, 'inpatient', 'hospital', true, '병원급 맹장 수술 포괄수가 비용입니다.'),
('inpatient_surgery', '맹장 수술 (충수절제술)', '맹장염,맹장 수술,충수염,충수절제술,아펜,appendectomy,맹장 입원', 1600000, 2100000, 350000, 480000, 'inpatient', 'general', true, '종합병원급 맹장 수술 포괄수가 비용입니다.'),
('inpatient_surgery', '맹장 수술 (충수절제술)', '맹장염,맹장 수술,충수염,충수절제술,아펜,appendectomy,맹장 입원', 2000000, 2600000, 450000, 650000, 'inpatient', 'tertiary', true, '상급종합병원급 맹장 수술 포괄수가 비용입니다.');

-- 폐렴 입원 치료 (5~7일 입원, 항생제 및 수액/산소요법)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('inpatient_surgery', '폐렴 치료 입원', '폐렴 입원,폐렴 치료,pneumonia,폐질환 입원,기침 입원,열 입원', 800000, 1200000, 160000, 240000, 'inpatient', 'hospital', true, '병원급 5~7일 일반병실 입원하여 항생제 수액 치료를 받는 경우의 예상 범위입니다. (입원 본인부담률 20%)'),
('inpatient_surgery', '폐렴 치료 입원', '폐렴 입원,폐렴 치료,pneumonia,폐질환 입원,기침 입원,열 입원', 1200000, 1800000, 240000, 360000, 'inpatient', 'general', true, '종합병원 5~7일 입원 치료 기준 예상 비용입니다.'),
('inpatient_surgery', '폐렴 치료 입원', '폐렴 입원,폐렴 치료,pneumonia,폐질환 입원,기침 입원,열 입원', 1800000, 2600000, 360000, 520000, 'inpatient', 'tertiary', true, '상급종합병원 5~7일 입원 치료 기준 예상 비용입니다.');

-- 목/허리 디스크 수술 (추간판탈출증 제거술, 입원 5~7일 기준, 비급여 치료비 반영 포함)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('inpatient_surgery', '디스크 수술 (추간판절제술)', '허리 디스크,목 디스크,디스크 수술,추간판 탈출증,추간판 절제술,척추 수술,디스크 입원,spinal stenosis,협착증 수술', 2000000, 3200000, 500000, 800000, 'inpatient', 'hospital', true, '허리나 목 디스크 탈출증 치료를 위한 절제 수술 및 5~7일 입원 비용입니다. 일부 비급여 처치비가 포함될 수 있습니다.'),
('inpatient_surgery', '디스크 수술 (추간판절제술)', '허리 디스크,목 디스크,디스크 수술,추간판 탈출증,추간판 절제술,척추 수술,디스크 입원,spinal stenosis,협착증 수술', 2800000, 4200000, 700000, 1100000, 'inpatient', 'general', true, '종합병원 디스크 수술 및 입원 예상 비용입니다.'),
('inpatient_surgery', '디스크 수술 (추간판절제술)', '허리 디스크,목 디스크,디스크 수술,추간판 탈출증,추간판 절제술,척추 수술,디스크 입원,spinal stenosis,협착증 수술', 3800000, 5500000, 1000000, 1800000, 'inpatient', 'tertiary', true, '상급종합병원 디스크 수술 및 입원 예상 비용입니다.');

-- 골절 수술 (팔/다리 골절 정복술 및 내고정술, 7~10일 입원)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('inpatient_surgery', '골절 수술 (정복술 및 내고정술)', '뼈 부러짐,골절 수술,깁스 수술,철심 제거,철심 삽입,fracture,골절 입원,다리 부러짐,팔 부러짐', 1800000, 2600000, 360000, 520000, 'inpatient', 'hospital', true, '팔이나 다리 뼈 골절 부위에 금속 핀이나 판을 넣어 고정하는 수술과 약 7~10일 입원 비용입니다.'),
('inpatient_surgery', '골절 수술 (정복술 및 내고정술)', '뼈 부러짐,골절 수술,깁스 수술,철심 제거,철심 삽입,fracture,골절 입원,다리 부러짐,팔 부러짐', 2400000, 3500000, 480000, 700000, 'inpatient', 'general', true, '종합병원 골절 내고정 수술 및 입원 비용입니다.'),
('inpatient_surgery', '골절 수술 (정복술 및 내고정술)', '뼈 부러짐,골절 수술,깁스 수술,철심 제거,철심 삽입,fracture,골절 입원,다리 부러짐,팔 부러짐', 3200000, 4800000, 700000, 1100000, 'inpatient', 'tertiary', true, '상급종합병원 골절 내고정 수술 및 입원 비용입니다.');

-- 무릎 관절경 수술 (반월상연골판 절제술 또는 봉합술, 3~5일 입원)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('inpatient_surgery', '무릎 관절경 수술', '무릎 수술,관절경 수술,반월판 수술,무릎 내시경,arthroscopy,연골판 수술,무릎 연골 수술,도가니 수술', 1500000, 2200000, 350000, 500000, 'inpatient', 'hospital', true, '내시경 카메라를 무릎 관절에 넣어 찢어진 연골판 등을 정돈하거나 꿰매는 수술과 입원비입니다.'),
('inpatient_surgery', '무릎 관절경 수술', '무릎 수술,관절경 수술,반월판 수술,무릎 내시경,arthroscopy,연골판 수술,무릎 연골 수술,도가니 수술', 2000000, 2800000, 450000, 650000, 'inpatient', 'general', true, '종합병원 무릎 관절경 수술 비용입니다.'),
('inpatient_surgery', '무릎 관절경 수술', '무릎 수술,관절경 수술,반월판 수술,무릎 내시경,arthroscopy,연골판 수술,무릎 연골 수술,도가니 수술', 2600000, 3600000, 600000, 950000, 'inpatient', 'tertiary', true, '상급종합병원 무릎 관절경 수술 비용입니다.');

-- 수면 위내시경 검사 (외래 기준, 비급여 수면 비용 포함)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('inpatient_surgery', '수면 위내시경 검사', '위 내시경,수면 위내시경,위검사,egd,위장 내시경,수면 내시경', 80000, 120000, 40000, 70000, 'outpatient', 'clinic', true, '건강보험이 적용되는 일반 내시경 비용(급여)에 비급여인 수면 마취 비용(약 5~10만원)이 더해진 총 예상액입니다.'),
('inpatient_surgery', '수면 위내시경 검사', '위 내시경,수면 위내시경,위검사,egd,위장 내시경,수면 내시경', 100000, 150000, 60000, 90000, 'outpatient', 'hospital', true, '병원급 수면 위내시경 검사비입니다.'),
('inpatient_surgery', '수면 위내시경 검사', '위 내시경,수면 위내시경,위검사,egd,위장 내시경,수면 내시경', 120000, 180000, 80000, 120000, 'outpatient', 'general', true, '종합병원급 수면 위내시경 검사비입니다.'),
('inpatient_surgery', '수면 위내시경 검사', '위 내시경,수면 위내시경,위검사,egd,위장 내시경,수면 내시경', 150000, 240000, 110000, 170000, 'outpatient', 'tertiary', true, '상급종합병원(대학병원)급 수면 위내시경 검사비입니다.');

-- 수면 대장내시경 검사 (외래 기준, 비급여 수면 비용 포함)
INSERT INTO medical_items (category, korean_name, synonyms, estimated_min_cost, estimated_max_cost, estimated_patient_cost_min, estimated_patient_cost_max, inpatient_outpatient, hospital_level, insurance_applied, description) VALUES
('inpatient_surgery', '수면 대장내시경 검사', '대장 내시경,수면 대장내시경,대장검사,colonoscopy,대장 내시경 수면,대장 용종 검사', 130000, 180000, 80000, 120000, 'outpatient', 'clinic', true, '건강보험 적용 대장내시경 수가에 수면 관리료(약 7~12만원)를 포함한 금액입니다. 용종 절제 시 비용이 추가될 수 있습니다.'),
('inpatient_surgery', '수면 대장내시경 검사', '대장 내시경,수면 대장내시경,대장검사,colonoscopy,대장 내시경 수면,대장 용종 검사', 150000, 220000, 100000, 150000, 'outpatient', 'hospital', true, '병원급 수면 대장내시경 검사비입니다.'),
('inpatient_surgery', '수면 대장내시경 검사', '대장 내시경,수면 대장내시경,대장검사,colonoscopy,대장 내시경 수면,대장 용종 검사', 180000, 260000, 130000, 190000, 'outpatient', 'general', true, '종합병원급 수면 대장내시경 검사비입니다.'),
('inpatient_surgery', '수면 대장내시경 검사', '대장 내시경,수면 대장내시경,대장검사,colonoscopy,대장 내시경 수면,대장 용종 검사', 220000, 320000, 160000, 250000, 'outpatient', 'tertiary', true, '상급종합병원(대학병원)급 수면 대장내시경 검사비입니다.');
