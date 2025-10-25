# Project Brief: babel-plugin-use-ai

## Overview
A Babel plugin that generates function implementations using AI at compile time via a `'use ai'` directive.

## Core Concept
Developers write function signatures with a `'use ai'` directive, and the plugin automatically generates the implementation using OpenRouter AI during the Babel compilation step.

## Key Features
- AI-powered code generation at compile time
- Smart caching to avoid redundant API calls
- Per-function configuration via inline comments
- TypeScript support with full type preservation
- Dual ESM/CJS build output

## Target Audience
This is a proof-of-concept / troll project demonstrating the absurdity of taking React's directive pattern (`'use client'`, `'use server'`) to its logical extreme.

## Goals
1. Demonstrate AI code generation at compile time
2. Provide a working (if inadvisable) tool for lazy developers
3. Commentary on modern web development trends
4. Actually work well enough to be useful for simple utility functions

## Non-Goals
- Production use (this is explicitly discouraged)
- Complex business logic generation
- Mission-critical code generation
- Being taken seriously
