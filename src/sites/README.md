# TEMPUS — React/TypeScript migration (work in progress)

This folder contains a typed React timeline component, event data contract, and isolated styling.

## Scope
- Four zoom levels, historical BCE/CE navigation, pinch gesture, period navigation.
- Timeline event points, event sheet, favorites, visit history, category filters, drawer.
- Visual palette inspired by the Sites export.

## Known gaps before parity
- The original Sites archive is a static build (HTML, CSS, JS), not React source.
- Current React timeline uses a finite 13-period window rather than the original continuous scroll and virtualized day/month engine.
- The complete 71-event 1789 dataset has not been imported yet.
- The React component is not yet connected to the Supabase API.
- Search, appearance and settings need full implementation.

Do not deploy as a faithful replacement until these differences are resolved and tested.
