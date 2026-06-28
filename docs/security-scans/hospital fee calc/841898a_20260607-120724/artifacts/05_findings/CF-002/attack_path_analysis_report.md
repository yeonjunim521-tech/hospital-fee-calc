# Attack Path Analysis: CF-002

## Attack Path
1. Attacker enters a crafted string into a search input, or the public-data import pipeline contains an item/disease name with HTML payload.
2. The render function builds a template string containing that value.
3. The template string is assigned to `innerHTML`.
4. Browser parses the string as HTML on the site origin.
5. Script execution can interact with same-origin public/admin APIs reachable to that page.

## Counterevidence
- Some UI areas use `.text`, `.textContent`, or `escapeHtml`, but the affected lines do not.
- Runtime browser PoC was not executed, so payload-specific browser behavior is not proven here.
- Generated public-data values are operator/import controlled, not direct anonymous runtime input, but direct search query reflection is anonymous-user controlled.

## Severity
Medium. The direct reflected DOM XSS path is user-triggered and same-origin, but no credential/session theft path is proven in this static app. The imported-data path could become more serious if upstream data is untrusted or compromised.

## Policy Decision
Report.
