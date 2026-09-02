(function () {
    const state = {
        period: '7',
        activeTab: 'missing',
        stats: null,
        candidates: [],
        pendingDelete: null
    };

    const periodLabels = { today: '오늘', 7: '최근 7일', 30: '최근 30일' };
    const lowerLimbMriPresets = {
        hip: { code: 'FEE_HE118', name: '기본자기공명영상진단-근골격계-고관절-일반', keywords: ['하지 mri', '하지 자기공명', '고관절 mri'] },
        knee: { code: 'FEE_HE120', name: '기본자기공명영상진단-근골격계-슬관절-일반', keywords: ['하지 mri', '하지 자기공명', '무릎 mri'] },
        ankle: { code: 'FEE_HE121', name: '기본자기공명영상진단-근골격계-발목관절-일반', keywords: ['하지 mri', '하지 자기공명', '발목 mri'] },
        'extra-limb': { code: 'FEE_HE123', name: '기본자기공명영상진단-근골격계-관절외하지-일반', keywords: ['하지 mri', '하지 자기공명', '관절외 하지 mri'] }
    };
    const hiraMriSourceUrl = 'https://www.hira.or.kr/dummy.do?cmsurl=%2Fcms%2Fmedi_info%2F02%2F01%2F1343489_27565.html&pgmid=HIRAA050200000000&subject=MRI';

    function element(id) {
        return document.getElementById(id);
    }

    function rows(value) {
        return Array.isArray(value) ? value : [];
    }

    function numberValue(value) {
        const parsed = Number(value ?? 0);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatNumber(value) {
        return new Intl.NumberFormat('ko-KR').format(numberValue(value));
    }

    function formatDate(value) {
        if (typeof value !== 'string' || !value) return '-';
        const date = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat('ko-KR', {
            timeZone: 'Asia/Seoul',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    function setStatus(message, isError = false) {
        const status = element('admin-status');
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    }

    function setDialogStatus(id, message, isError = false) {
        const status = element(id);
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, { credentials: 'same-origin', ...options });
        let body = null;
        try {
            body = await response.json();
        } catch (error) {
            body = null;
        }
        if (!response.ok || !body?.ok) {
            throw new Error(body?.error || `요청에 실패했습니다. (${response.status})`);
        }
        return body;
    }

    function appendCell(row, text, className = '') {
        const cell = document.createElement('td');
        cell.textContent = String(text ?? '');
        if (className) cell.className = className;
        row.appendChild(cell);
        return cell;
    }

    function appendButtonCell(row, label, className, accessibleLabel, onClick) {
        const cell = document.createElement('td');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = label;
        button.setAttribute('aria-label', accessibleLabel);
        button.addEventListener('click', onClick);
        cell.appendChild(button);
        row.appendChild(cell);
    }

    function renderEmpty(body, colspan, message) {
        body.replaceChildren();
        const row = document.createElement('tr');
        const cell = appendCell(row, message, 'empty-cell');
        cell.colSpan = colspan;
        body.appendChild(row);
    }

    function openProcessDialog(term) {
        const dialog = element('process-dialog');
        element('process-form').reset();
        element('process-query').value = term;
        element('process-query-label').textContent = term;
        element('process-name').value = term;
        element('process-source-date').value = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
        setDialogStatus('process-status', '');
        dialog.showModal();
        element('process-code').focus();
    }

    function applyLowerLimbMriPreset() {
        const preset = lowerLimbMriPresets[element('process-mri-preset').value];
        if (!preset) return;
        const selectedQuery = element('process-query').value;
        element('process-code').value = preset.code;
        element('process-name').value = preset.name;
        element('process-category').value = 'imaging';
        element('process-group').value = 'test';
        element('process-type').value = 'HE';
        element('process-clinic-price').value = '276330';
        element('process-hospital-price').value = '242220';
        element('process-benefit').value = 'true';
        element('process-source-url').value = hiraMriSourceUrl;
        element('process-source-date').value = '2026-05-01';
        element('process-keywords').value = [...new Set([selectedQuery, ...preset.keywords].filter(Boolean))].join(', ');
        setDialogStatus('process-status', '공식 MRI 코드와 가격을 채웠습니다. 부위를 확인한 뒤 추가 완료를 누르세요.');
    }

    function openDeleteDialog(type, value, label, warning) {
        state.pendingDelete = { type, value, label };
        element('delete-message').textContent = `“${label}” 기록을 삭제합니다.`;
        element('delete-warning').textContent = warning;
        setDialogStatus('delete-status', '');
        element('delete-dialog').showModal();
        element('delete-confirm').focus();
    }

    function renderMissing() {
        const body = element('missing-table-body');
        const missing = rows(state.stats?.missingTerms);
        if (!missing.length) {
            renderEmpty(body, 5, '현재 처리할 미결과 검색어가 없습니다.');
            return;
        }
        body.replaceChildren(...missing.map((item) => {
            const term = String(item.query || '');
            const row = document.createElement('tr');
            appendCell(row, term, 'term-cell');
            appendCell(row, `${formatNumber(item.zero_result_count)}회`, 'number-cell');
            appendCell(row, formatDate(item.last_searched_at));
            appendButtonCell(row, '처리하기', 'row-button', `${term} 항목 처리`, () => openProcessDialog(term));
            appendButtonCell(row, '삭제', 'row-delete', `${term} 검색 기록 삭제`, () => {
                openDeleteDialog('search-term', term, term, '이 검색어의 수집된 검색 기록 전체가 삭제되며 되돌릴 수 없습니다.');
            });
            return row;
        }));
    }

    function approvedCandidates() {
        return state.candidates.filter((candidate) => candidate.status === 'approved');
    }

    function renderCompleted() {
        const body = element('completed-table-body');
        const completed = approvedCandidates();
        if (!completed.length) {
            renderEmpty(body, 5, '추가 완료 이력이 없습니다.');
            return;
        }
        body.replaceChildren(...completed.map((item) => {
            const term = String(item.query || item.normalized_query || '');
            const name = String(item.item_name || '-');
            const row = document.createElement('tr');
            appendCell(row, term, 'term-cell');
            appendCell(row, name);
            appendCell(row, item.item_id || '-');
            appendCell(row, formatDate(item.updated_at));
            appendButtonCell(row, '삭제', 'row-delete', `${term} 완료 이력 삭제`, () => {
                openDeleteDialog(
                    'candidate-history',
                    numberValue(item.id),
                    term,
                    '완료 이력만 삭제합니다. 이미 공개된 의료 항목과 검색 별칭은 삭제하지 않습니다.'
                );
            });
            return row;
        }));
    }

    function renderSearches() {
        const body = element('searches-table-body');
        const searches = rows(state.stats?.allSearchTerms);
        if (!searches.length) {
            renderEmpty(body, 5, '수집된 검색어가 없습니다.');
            return;
        }
        body.replaceChildren(...searches.map((item) => {
            const term = String(item.query || '');
            const row = document.createElement('tr');
            appendCell(row, term, 'term-cell');
            appendCell(row, `${formatNumber(item.search_count)}회`, 'number-cell');
            appendCell(row, `${formatNumber(item.zero_result_count)}회`);
            appendCell(row, formatDate(item.last_searched_at));
            appendButtonCell(row, '삭제', 'row-delete', `${term} 검색 기록 삭제`, () => {
                openDeleteDialog('search-term', term, term, '이 검색어의 수집된 검색 기록 전체가 삭제되며 되돌릴 수 없습니다.');
            });
            return row;
        }));
    }

    function renderVisitors() {
        const visitorStats = state.stats?.visitorStats || {};
        const daily = rows(visitorStats.daily);
        element('visitor-total').textContent = `${formatNumber(visitorStats.dailyVisitorTotal)}명`;
        element('pageview-total').textContent = `${formatNumber(visitorStats.pageViews)}회`;
        element('visitor-search-total').textContent = `${formatNumber(state.stats?.summary?.totalSearches)}회`;

        const chart = element('visitor-chart');
        if (!daily.length) {
            const empty = document.createElement('p');
            empty.className = 'chart-empty';
            empty.textContent = '아직 익명 방문 통계가 없습니다.';
            chart.replaceChildren(empty);
        } else {
            const maxVisitors = Math.max(1, ...daily.map((item) => numberValue(item.unique_visitors)));
            chart.replaceChildren(...daily.map((item) => {
                const visitors = numberValue(item.unique_visitors);
                const column = document.createElement('div');
                column.className = 'chart-column';
                column.setAttribute('aria-label', `${item.day} 익명 방문자 ${visitors}명, 페이지 조회 ${numberValue(item.page_views)}회, 검색 실행 ${numberValue(item.search_count)}회`);
                const value = document.createElement('span');
                value.className = 'chart-value';
                value.textContent = formatNumber(visitors);
                const track = document.createElement('span');
                track.className = 'chart-bar-track';
                const bar = document.createElement('span');
                bar.className = 'chart-bar';
                bar.style.height = `${Math.max(2, Math.round((visitors / maxVisitors) * 100))}%`;
                const label = document.createElement('span');
                label.className = 'chart-label';
                label.textContent = String(item.day || '').slice(5).replace('-', '/');
                track.appendChild(bar);
                column.append(value, track, label);
                return column;
            }));
        }

        const body = element('visitor-table-body');
        if (!daily.length) {
            renderEmpty(body, 4, '날짜별 방문 데이터가 없습니다.');
        } else {
            body.replaceChildren(...daily.slice().reverse().map((item) => {
                const row = document.createElement('tr');
                appendCell(row, item.day || '-');
                appendCell(row, `${formatNumber(item.unique_visitors)}명`, 'number-cell');
                appendCell(row, `${formatNumber(item.page_views)}회`);
                appendCell(row, `${formatNumber(item.search_count)}회`);
                return row;
            }));
        }
    }

    function renderSummary() {
        const summary = state.stats?.summary || {};
        const visitorStats = state.stats?.visitorStats || {};
        const missingCount = rows(state.stats?.missingTerms).length;
        const completedCount = approvedCandidates().length;
        const searchTermCount = numberValue(summary.uniqueTerms);
        element('summary-period').textContent = periodLabels[state.period] || state.stats?.periodLabel || '';
        element('metric-visitors').textContent = `${formatNumber(visitorStats.dailyVisitorTotal)}명`;
        element('metric-pageviews').textContent = `${formatNumber(visitorStats.pageViews)}회`;
        element('metric-searches').textContent = `${formatNumber(summary.totalSearches)}회`;
        element('metric-missing').textContent = `${formatNumber(missingCount)}개`;
        element('metric-completed').textContent = `${formatNumber(completedCount)}개`;
        element('count-missing').textContent = formatNumber(missingCount);
        element('count-completed').textContent = formatNumber(completedCount);
        element('count-searches').textContent = formatNumber(searchTermCount);
    }

    function renderAll() {
        renderSummary();
        renderMissing();
        renderCompleted();
        renderSearches();
        renderVisitors();
    }

    function activateTab(name, focus = false) {
        state.activeTab = name;
        document.querySelectorAll('[role="tab"][data-tab]').forEach((tab) => {
            const active = tab.dataset.tab === name;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            if (active && focus) tab.focus();
        });
        document.querySelectorAll('[role="tabpanel"][data-panel]').forEach((panel) => {
            const active = panel.dataset.panel === name;
            panel.hidden = !active;
            panel.classList.toggle('is-active', active);
        });
    }

    async function refreshData() {
        const refreshButton = element('refresh-button');
        refreshButton.disabled = true;
        refreshButton.setAttribute('aria-busy', 'true');
        setStatus('검색·방문 통계를 불러오는 중입니다.');
        try {
            const [stats, candidates] = await Promise.all([
                fetchJson(`/api/admin/search-stats?period=${encodeURIComponent(state.period)}`),
                fetchJson('/api/admin/search-candidates')
            ]);
            state.stats = stats;
            state.candidates = rows(candidates.candidates);
            renderAll();
            setStatus(`${periodLabels[state.period] || stats.periodLabel} 데이터입니다. 검색어와 방문 통계는 서로 연결되지 않습니다.`);
        } catch (error) {
            setStatus(error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.', true);
        } finally {
            refreshButton.disabled = false;
            refreshButton.removeAttribute('aria-busy');
        }
    }

    async function submitProcess(event) {
        event.preventDefault();
        const submitButton = element('process-submit');
        const clinicPrice = Number(element('process-clinic-price').value);
        const hospitalPrice = Number(element('process-hospital-price').value);
        if (!Number.isSafeInteger(clinicPrice) || clinicPrice < 0 || !Number.isSafeInteger(hospitalPrice) || hospitalPrice < 0) {
            setDialogStatus('process-status', '가격은 0 이상의 정수로 입력하세요.', true);
            return;
        }

        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
        submitButton.textContent = '반영 중';
        setDialogStatus('process-status', '공개 검색 DB에 반영하는 중입니다.');
        try {
            await fetchJson('/api/admin/search-candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: element('process-query').value,
                    itemId: element('process-code').value.trim(),
                    itemName: element('process-name').value.trim(),
                    itemCategory: element('process-category').value.trim(),
                    group: element('process-group').value,
                    type: element('process-type').value.trim(),
                    clinicPrice,
                    hospitalPrice,
                    isBenefit: element('process-benefit').value === 'true',
                    sourceUrl: element('process-source-url').value.trim(),
                    sourceDate: element('process-source-date').value,
                    keywords: element('process-keywords').value.split(',').map((value) => value.trim()).filter(Boolean),
                    status: 'approved'
                })
            });
            element('process-dialog').close();
            await refreshData();
            setStatus('항목을 추가 완료했습니다. 미결과 목록에서 제외했습니다.');
        } catch (error) {
            setDialogStatus('process-status', error instanceof Error ? error.message : '항목을 추가하지 못했습니다.', true);
        } finally {
            submitButton.disabled = false;
            submitButton.removeAttribute('aria-busy');
            submitButton.textContent = '추가 완료';
        }
    }

    async function confirmDelete() {
        if (!state.pendingDelete) return;
        const button = element('delete-confirm');
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = '삭제 중';
        setDialogStatus('delete-status', '삭제하는 중입니다.');
        try {
            await fetchJson('/api/admin/delete-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: state.pendingDelete.type, value: state.pendingDelete.value })
            });
            const deletedLabel = state.pendingDelete.label;
            state.pendingDelete = null;
            element('delete-dialog').close();
            await refreshData();
            setStatus(`“${deletedLabel}” 기록을 삭제했습니다.`);
        } catch (error) {
            setDialogStatus('delete-status', error instanceof Error ? error.message : '기록을 삭제하지 못했습니다.', true);
        } finally {
            button.disabled = false;
            button.removeAttribute('aria-busy');
            button.textContent = '삭제';
        }
    }

    function init() {
        document.querySelectorAll('[data-period]').forEach((button) => {
            button.addEventListener('click', () => {
                state.period = button.dataset.period;
                document.querySelectorAll('[data-period]').forEach((periodButton) => {
                    periodButton.setAttribute('aria-pressed', String(periodButton === button));
                });
                refreshData();
            });
        });

        const tabs = [...document.querySelectorAll('[role="tab"][data-tab]')];
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => activateTab(tab.dataset.tab));
            tab.addEventListener('keydown', (event) => {
                let nextIndex = index;
                if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
                else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
                else if (event.key === 'Home') nextIndex = 0;
                else if (event.key === 'End') nextIndex = tabs.length - 1;
                else return;
                event.preventDefault();
                activateTab(tabs[nextIndex].dataset.tab, true);
            });
        });

        element('refresh-button').addEventListener('click', refreshData);
        element('process-form').addEventListener('submit', submitProcess);
        element('process-mri-preset').addEventListener('change', applyLowerLimbMriPreset);
        element('delete-confirm').addEventListener('click', confirmDelete);
        document.querySelectorAll('[data-close-dialog]').forEach((button) => {
            button.addEventListener('click', () => element(button.dataset.closeDialog).close());
        });
        document.querySelectorAll('dialog').forEach((dialog) => {
            dialog.addEventListener('click', (event) => {
                if (event.target === dialog) dialog.close();
            });
        });

        activateTab(state.activeTab);
        refreshData();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
}());
