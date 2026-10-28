# Hola Language Documentation

English | [中文](./README.md)

Hola (HighOrder Language) is the declarative application description language of
the HighOrder platform. A `.hola` file is made of **objects**. Each object
contains properties and child objects.

This directory contains the language specification and reference documentation
migrated from `highorder-legacy/docs/docs/hola`. The detailed reference pages are
currently written in Chinese; this README is the English entry point.

## Document map

| Document | Contents | Status |
|---|---|---|
| [language-spec.md](./language-spec.md) | Lexing, objects, properties, lists, literals, `{{ }}` expressions | Implemented syntax |
| [expressions.md](./expressions.md) | Expression entry points, grammar, precedence, semantics, compatibility | Draft specification |
| [grammar.ebnf](./grammar.ebnf) / [grammar.peg](./grammar.peg) | Formal grammar | Maintained with the implementation |
| [namespace.md](./namespace.md) | Namespaces in type names (`System.String`) | Syntax implemented; compiler conversion needs work |
| [builtin-objects.md](./builtin-objects.md) | Core objects, data model, commands, events, built-in functions | Runtime reference |
| [query-objects.md](./query-objects.md) | `Query`, `Foreach`, `Match`, `Expr`, `Format`, etc. | Runtime reference |
| [ui-objects.md](./ui-objects.md) | UI containers, content, inputs, and styles | Runtime reference |
| [examples/](./examples/) | Small, directly readable Hola examples | Implemented syntax |

## Reading order

1. Read `language-spec.md` to learn objects, properties, and values.
2. Read `expressions.md` to understand `{{ ... }}`, legacy string expression
   slots, and templates.
3. Read `builtin-objects.md`, `query-objects.md`, and `ui-objects.md` to learn
   what default objects such as `Page`, `Modal`, `Query`, `Foreach`,
   `UpdateObject`, `Column`, and `Button` do.

## Design conventions

- **The document layer** defines structure and values only. Business semantics
  belong to runtime objects.
- **Runtime objects** (`Page`, `Modal`, `Action`, `ObjectMeta`, etc.) are
  interpreted by HighOrder. Type names are usually converted from PascalCase to
  kebab-case, e.g. `ObjectMeta` → `object-meta`.
- **Expressions** live inside `{{ ... }}`. This is the only canonical expression
  syntax; they are pure computations and do not contain statements. `Expr` and
  `Format` are retained built-in objects (expression node and template).
- **Logic and flow** are currently expressed with existing objects such as
  `Action`, `DataProcess`, `events`, and `hooks`. A function/script design is
  still in progress and is not part of this revision.
- **Serializable by default**: object trees should remain JSON-serializable,
  analyzable, and suitable for visual editing.

## Migration notes

Migrated from `highorder-legacy/docs/docs/hola`:

- `language-spec.md`: migrated with corrections for comments, namespaces,
  expression scope, and implementation status;
- `hola-grammar.ebnf` / `.peg`: migrated as-is as the formal grammar reference;
- `NAMESPACE_FEATURE.md`: migrated as `namespace.md`;
- `examples/*.hola`: migrated as-is.

`expressions.md`, `builtin-objects.md`, `query-objects.md`, and `ui-objects.md`
are new reference documents. `README.md` is the Chinese version of this file.
