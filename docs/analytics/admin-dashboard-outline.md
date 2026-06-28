# Admin Dashboard Outline

## Goal
- Help internal operators and content owners quickly see what visitors are searching for.
- Surface search terms with no results so missing content can be identified fast.
- Turn search demand into concrete content decisions, not passive reporting.
- Keep this dashboard separate from GA4 and focused on day-to-day operations.

## Primary Sections
1. Search Overview
   - Total searches
   - Searches with results
   - Searches with no results
   - Top searched terms

2. No-Result Searches
   - Search terms that returned zero matches
   - Repeated failed searches
   - Terms with high volume over the selected period

3. Content Gap Opportunities
   - Search terms that map to missing or weak content
   - Suggested content topics or pages
   - Priority queue for editorial follow-up

4. Drilldown Detail
   - Term-level history
   - Result availability over time
   - Related content currently available

## Key Metrics
- Total search queries
- Unique search terms
- Searches with results
- Searches with no results
- No-result rate
- Repeat no-result rate
- Search volume by term
- Trend change versus prior period
- Content gap count
- Terms with potential content matches but weak coverage

## Suggested Filters
- Date range
- Search result status: result / no result / partial result
- Search term
- Frequency threshold
- Content category or site section
- Device type
- Traffic source or entry point, if available
- Language or locale, if available
- New vs returning visitor, if available

## Table Columns
### Search Terms Table
- Search term
- Search count
- Unique visitors
- No-result count
- No-result rate
- First seen
- Last seen
- Trend direction
- Suggested content action

### No-Result Detail Table
- Search term
- Timestamp or date bucket
- Visitor count
- Session count
- Entry page or context
- Category or section
- Related content found: yes / no
- Suggested next step

### Content Gap Queue
- Topic or term
- Demand level
- Coverage status
- Proposed page or update
- Owner
- Priority
- Status
- Notes

## Decisions This Dashboard Should Support
- What search terms should become new content?
- Which existing pages need better coverage or clearer navigation?
- Which no-result terms are high-priority fixes?
- Which terms are noise and can be ignored?
- Which topics should be assigned to content, product, or support teams?
- What should be reviewed weekly versus handled immediately?

## Review Notes
- Keep the dashboard operational, not exploratory.
- Favor action-oriented language over analytics jargon.
- Prefer simple counts and rates that help owners decide what to do next.
