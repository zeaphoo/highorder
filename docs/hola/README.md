# Hola 语言文档

[English](./README.en.md) | 中文

Hola（HighOrder Language）是 HighOrder 平台的声明式应用描述语言。一个 `.hola`
文件由「对象（Object）」组成，对象包含属性（property）和子对象（children）。

本目录是从 `highorder-legacy/docs/docs/hola` 迁移并整理的规范与参考文档。

## 文档地图

| 文档 | 内容 | 状态 |
|---|---|---|
| [language-spec.md](./language-spec.md) | 词法、对象、属性、列表、字面量、`{{ }}` 表达式 | 已实现语法 |
| [grammar.ebnf](./grammar.ebnf) / [grammar.peg](./grammar.peg) | 语法形式化描述 | 与实现同步维护 |
| [namespace.md](./namespace.md) | 类型名中的命名空间（`System.String`） | 语法已实现，编译转换待完善 |
| [builtin-objects.md](./builtin-objects.md) | 核心对象、数据模型、命令、事件与内置函数 | 运行时参考 |
| [query-objects.md](./query-objects.md) | `Query`、`Foreach`、`Match`、`Expr`、`Format` 等 | 运行时参考 |
| [ui-objects.md](./ui-objects.md) | 界面容器、展示、输入对象与样式 | 运行时参考 |
| [examples/](./examples/) | 可直接阅读的语法示例 | 已实现语法 |

## 阅读顺序

1. 先读 `language-spec.md`，理解对象、属性和值。
2. 再读 `builtin-objects.md`、`query-objects.md`、`ui-objects.md`，了解
   `Page`、`Modal`、`Query`、`Foreach`、`UpdateObject`、`Column`、`Button`
   等默认对象分别做什么。

## 设计约定

- **文档层**只定义结构和值，不定义具体业务语义。
- **运行时对象**（`Page`、`Modal`、`Action`、`ObjectMeta` 等）由 HighOrder
  解释，名称通常从 PascalCase 编译为 kebab-case，例如 `ObjectMeta` →
  `object-meta`。
- **表达式**写在 `{{ ... }}` 中，是纯计算，不包含语句。
- **逻辑/流程**当前用现有对象表达，例如 `Action`、`DataProcess`、`events`、
  `hooks`。函数/脚本化表示仍在设计中，尚未纳入本版文档。
- **可序列化优先**：对象树应保持可 JSON 序列化、可分析、可视觉化编辑。

## 迁移说明

迁移自 `highorder-legacy/docs/docs/hola`：

- `language-spec.md`：修正了注释、命名空间、表达式范围的描述；
- `hola-grammar.ebnf` / `.peg`：原样迁移，作为语法形式化参考；
- `NAMESPACE_FEATURE.md`：迁移为 `namespace.md`；
- `examples/*.hola`：原样迁移。

`builtin-objects.md`、`query-objects.md`、`ui-objects.md` 为新增文档。
`README.en.md` 为英文版本。
