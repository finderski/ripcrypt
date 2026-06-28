# AGENTS.md — RipCrypt FoundryVTT System

## Project Goal

Build a Foundry VTT v14 game system for RipCrypt, including actor sheets, item sheets, data models, dice/roll automation, localization, and styling.

## Target Platform

- Foundry VTT: v14
- Use Foundry v14 APIs and documentation.
- Do not use deprecated v9/v10/v11-era sheet patterns unless explicitly needed.
- Prefer DataModel-based system data definitions for Actors and Items.

## Source of Truth

- Game rules source: RipCrypt Digital Core Rulebook v1.0.
- Foundry implementation source: official Foundry v14 API and Knowledge Base.
- When unsure, stop and ask rather than inventing game mechanics.

## Development Principles

- Keep changes small and reviewable.
- Prefer plain JavaScript ES modules.
- Use localization keys from the start.
- Separate game rules logic from sheet rendering where practical.
- Do not hard-code display text in templates when it belongs in lang/en.json.
- Avoid private Foundry APIs unless there is no supported public alternative.
- Prefer flex box over grid.

## Expected System Shape

Likely package structure:

- system.json
- lang/en.json
- scripts/
- scripts/documents/
- scripts/models/
- scripts/sheets/
- templates/
- templates/actor/
- templates/item/
- styles/

## Coding Rules

- Use clear, boring code.
- Do not introduce TypeScript, build tools, or frameworks unless requested.
- Do not rewrite large files unnecessarily.
- After code changes, summarize:
  1. files changed
  2. why they changed
  3. how to test in Foundry