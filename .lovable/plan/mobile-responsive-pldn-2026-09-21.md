# Mobile responsive PLDN

## Goal
Make onboarding and the document workspace comfortable on phones while leaving the desktop layout unchanged.

## Changes
- Keep the existing two-pane resizable workspace at desktop widths.
- Add a mobile workspace with a compact header and two clear views: **Analysis** and **Document**.
- Open the Document view automatically when a citation is tapped, preserving citation jumps and highlights.
- Make document controls, filenames, counters, cards, dialogs, question input, and onboarding actions fit narrow screens without clipping or overlap.
- Use full-width touch targets and tighter mobile spacing while retaining the current Desk & Thread visual design.

## Validation
- Test the full mobile flow at a phone viewport, including onboarding, sample document analysis, citation navigation, document controls, summary, and switching back to analysis.
- Confirm desktop still uses the current resizable split view and check the latest build output.

## Technical details
- Use the existing mobile breakpoint hook and conditionally render mobile-only workspace navigation.
- Reuse the existing AssistantPanel and DocumentViewer so behavior and grounding remain unchanged.
- Apply responsive utility classes only; no changes to document processing, AI, or MCP behavior.
