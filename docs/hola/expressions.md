# Hola 表达式规范（草案）

> 状态：目标规范 + 实现现状。
>
> 本文定义 Hola 表达式的入口、语法、求值语义和兼容方式。
> 结构语法见 [language-spec.md](./language-spec.md)，内置对象见
> [builtin-objects.md](./builtin-objects.md)。

## 1. 结论：`{{ ... }}` 是唯一规范表达式入口

先明确几个概念：

- **`"..."` 本身只是字符串字面量，不是表达式。**
- **`{{ ... }}` 是唯一规范表达式入口。**
- **`Expr { expr: "..." }` 是保留的内置对象**，用于少数需要显式表达式节点的
  API 或兼容场景；它不是第二种规范表达式语法。
- **`Format { format: "..." }` 是保留的模板对象**，不是表达式。
- `filter: "..."`、`formula: "..."`、`condition: "..."` 是历史兼容槽位，
  最终应迁移到 `{{ ... }}`。
- 当前 JS 编译器既不支持 `{{ ... }}`，也不支持这些字符串表达式的语义。

| 写法 | 是什么 | 由谁解析 | 现状 |
|---|---|---|---|
| `"1 + 2"` | 字符串字面量 | Hola 解析器 | 已实现；不会自动求值 |
| `{{ 1 + 2 }}` | **唯一规范表达式** | Hola 解析器 | Rust 部分实现；JS 未实现 |
| `Expr { expr: "1 + 2" }` | 保留的内置表达式对象 | 运行时/统一 parser | 仅支持极小子集 |
| `filter: "it.done == true"` | 查询兼容槽位 | 查询引擎 | 独立实现，待统一 |
| `formula: "..."` | 派生字段兼容槽位 | 运行时/平台 | 不完整 |
| `condition: "..."` | 条件兼容槽位 | 运行时/平台 | 当前常为 TODO |
| `Format { format: "{it.name}" }` | 保留的模板对象 | 渲染器 | 模板，不是表达式 |

所以规范上只有**一种表达式语法**：`{{ ... }}`。
`Expr` 是对象层的特殊载体，`Format` 是模板；旧字符串槽位只用于兼容。

## 2. 表达式入口

### 2.1 `{{ ... }}`：唯一规范入口

```hola
PlainText {
    visible: {{ user.is_admin }}
    text: {{ user.profile?.display_name ?? user.name }}
}
```

- 只能作为**值**出现：属性值、列表元素、参数值等。
- 编译期解析为表达式 AST。
- 纯计算，不包含赋值、分支语句、循环或函数定义。
- 所有新代码都使用这一形式。

### 2.2 `Expr`：保留的内置对象

`Expr` 是内置对象，不是新的表达式语法：

```hola
value: Expr { expr: "it.done" }
```

适用场景：

- 某些既有 API 明确要求一个 `Expr` 对象，而不是直接值；
- 需要在对象树中显式保留一个表达式节点；
- 兼容旧应用。

约束：

- `expr` 字符串仍由**同一套表达式 parser**解析；
- 常规代码优先写 `{{ ... }}`，不要用 `Expr` 作为默认写法；
- `Expr` 不废弃，但也不再扩展为第二套语法。

### 2.3 `Format`：保留的模板对象

```hola
Format { format: "{it.name}" }
```

`{path}` 是字段占位符，不是完整表达式。模板可以理解为：

```text
"{it.name}"  ≈  "" + str(it.name)
```

`Format` 保留为模板对象。模板的正式语法可以后续扩展为 `{expression}`，
但应与表达式 parser 共用 AST，而不是继续用字符串替换。

### 2.4 旧字符串槽位：仅兼容

以下属性在历史对象中表示表达式：

| 对象/属性 | 上下文 | 说明 |
|---|---|---|
| `Query { filter: "..." }` | `it`、`meta`、`user` | 查询过滤 |
| `Property { formula: "..." }` | `meta`、`this` | 派生字段 |
| `hooks[].condition` | `route`、`user`、`page` | 页面钩子条件 |
| `ConditionCheck { condition: "..." }` | 当前上下文 | 条件检查 |

兼容规则：

- 用同一套表达式 parser 解析；
- 允许旧别名：`and` / `or` / `not`、`$var`、`a if cond else b`；
- 未加 `{{ }}` 的普通字符串仍然是字符串，不会自动变成表达式；
- 新代码迁移到 `{{ ... }}`；`Expr` 保留用于特殊情况。

## 3. 表达式语法（EBNF）

```ebnf
expression      = conditional ;

conditional     = nullCoalescing ,
                  [ "?" expression ":" expression ] ;   (* 右结合 *)

nullCoalescing  = logicalOr , { "??" logicalOr } ;          (* 左结合 *)

logicalOr       = logicalAnd , { ( "||" | "or" ) logicalAnd } ;

logicalAnd      = equality , { ( "&&" | "and" ) equality } ;

equality        = relational , { ( "==" | "!=" ) relational } ;

relational      = additive ,
                  { ( "<" | "<=" | ">" | ">="
                    | [ "not" ] "in" ) additive } ;

additive        = multiplicative , { ( "+" | "-" ) multiplicative } ;

multiplicative  = unary , { ( "*" | "/" | "%" ) unary } ;

unary           = ( "!" | "not" | "-" | "+" ) unary
                | power ;

power           = postfix , [ "**" unary ] ;                (* 右结合 *)

postfix         = primary , { memberSuffix } ;

memberSuffix    = "." identifier
                | "?." identifier
                | "[" expression "]"
                | "[" [ expression ] ":" [ expression ] "]"
                | "(" [ arguments ] ")" ;

primary         = literal
                | identifier
                | "(" expression ")"
                | listLiteral
                | objectLiteral ;

literal         = nullLiteral
                | boolLiteral
                | numberLiteral
                | stringLiteral
                | colorLiteral ;

listLiteral     = "[" [ expression { "," expression } ] "]" ;

objectLiteral   = "{" [ property { "," property } ] "}" ;

property        = ( identifier | stringLiteral ) ":" expression ;

arguments       = expression { "," expression } ;
```

### 运算符优先级

从高到低：

| 优先级 | 运算符 | 结合性 | 说明 |
|---|---|---|---|
| 1 | `.` `?.` `[]` `()` | 左 | 成员、索引、调用 |
| 2 | `**` | 右 | 幂 |
| 3 | `!` `not` `-` `+` | 右 | 一元 |
| 4 | `*` `/` `%` | 左 | 乘除 |
| 5 | `+` `-` | 左 | 加减 |
| 6 | `<` `<=` `>` `>=` `in` `not in` | 左 | 比较/成员 |
| 7 | `==` `!=` | 左 | 相等 |
| 8 | `&&` `and` | 左 | 逻辑与 |
| 9 | \|\| / `or` | 左 | 逻辑或 |
| 10 | `??` | 左 | 空值合并 |
| 11 | `?:` | 右 | 条件表达式 |

`-2 ** 2` 解析为 `-(2 ** 2)`；`2 ** 3 ** 2` 解析为 `2 ** (3 ** 2)`。

## 4. 值类型

| 类型 | 字面量示例 | 说明 |
|---|---|---|
| `null` | `null` | 空值 |
| `bool` | `true`、`false` | 布尔 |
| `int` | `42`、`1_000` | 64 位整数 |
| `float` | `3.14`、`0.5` | 浮点数 |
| `string` | `"hi"`、`'hi'` | UTF-8 字符串 |
| `color` | `#FF8800`、`#abc` | 颜色 |
| `list` | `[1, 2, 3]` | 有序列表 |
| `object` | `{ id: 1, done: false }` | 键值对象 |

数字不使用 JavaScript 的 number 语义；`int` 和 `float` 分开处理。
金额等高精度类型后续引入 `decimal`。

## 5. 语义约定

### 5.1 真值

以下值在条件中为 `false`：

- `null`
- `false`
- `0`、`0.0`
- `""`
- `[]`
- `{}`

其他值为 `true`。

### 5.2 空值传播

- `?.`：左侧为 `null` 时短路返回 `null`。
- 算术、比较、索引遇到 `null` 时返回 `null`（`==` / `!=` 除外）。
- `??`：左侧为 `null` 时返回右侧，否则返回左侧。
- 缺失字段返回 `null`；未知根变量是错误，不是 `null`。

```hola
{{ user.profile?.age ?? 0 }}
```

### 5.3 相等

- `null == null` 为 `true`；
- 不同基础类型不相等；
- `int` / `float` 按数值比较；
- 字符串按内容比较；
- 列表/对象按深度比较；
- `!=` 是 `==` 的反面。

### 5.4 运算

| 运算 | 规则 |
|---|---|
| `+` | 数字相加；字符串拼接；列表拼接；其他组合报错 |
| `-` `*` `/` `%` `**` | 只接受数字；`/` 返回浮点；除零报错 |
| `<` `<=` `>` `>=` | 数字或字符串比较；其他类型报错 |
| `in` | 列表成员、对象 key、字符串子串；`null` 为 `false` |
| `&&` / \|\| | 短路，返回布尔值 |
| `??` | 只判断 `null`，返回左值或右值 |
| `?:` | 条件为真时求值左分支，否则右分支；惰性求值 |

字符串与数字混合相加报错，需显式 `str(number)`。

### 5.5 索引与切片

- `list[i]`、`string[i]`、`object[key]`；
- 负索引从末尾开始；
- 越界或缺失返回 `null`；
- `list[start:end]`、`string[start:end]` 为切片，`end` 不包含；
- 切片暂列为目标语法，当前实现未完整支持。

### 5.6 调用

- 只能调用作用域中已注册的函数；
- 参数个数/类型由宿主函数定义；
- 未知函数是错误；
- 用户自定义函数不在本文范围（见后续函数设计）。

## 6. 上下文与作用域

| 变量 | 可用位置 | 说明 |
|---|---|---|
| `it` | `filter`、`Foreach`、事件 | 当前元素 |
| `meta` | `formula`、`lookup.filter` | 当前数据对象 |
| `locals` | Page / Modal / Action | 当前局部值 |
| `user` | 全局 | 当前登录用户 |
| `player` | 全局 | 应用用户档案（兼容） |
| `field` | `TableColumn` | 当前字段/单元格 |
| `app` | 全局 | 应用信息 |
| `route` | 全局 | 当前路由 |
| `platform` | 全局 | 平台信息 |
| `value` | 输入事件 | 当前输入值 |

解析规则：

- 根变量必须在作用域中，否则编译期报错；
- 对象缺失属性返回 `null`；
- 旧字符串槽位允许 `$var`，等价于 `var`；
- 旧 `filter`/`formula` 隐含 `it` / `meta`。

## 7. 求值与错误

- 表达式是纯计算，不能写状态、不能调用有副作用的操作；
- `now()`、`random()`、`today()` 等是不确定函数，由宿主提供；
  测试/回放时可注入固定时钟和随机源；
- 求值错误产生结构化诊断（位置、代码、消息）；
- 单个绑定失败不应导致整页崩溃，UI 应显示错误占位；
- 编译期能判定的错误（未知根变量、未知函数、类型明显不符）应尽早报错；
- 运行期错误（类型不匹配、除零、越界）由表达式边界捕获。

## 8. 兼容模式

旧字符串槽位按以下规则解析：

| 旧写法 | 规范写法 |
|---|---|
| `a and b` | `a && b` |
| `a or b` | `a` \|\| `b` |
| `not a` | `!a` |
| `x in list` | `x in list` |
| `a if cond else b` | `cond ? a : b` |
| `$user.name` | `user.name` |
| `it.done == true` | 同义 |

`Format` 不进入表达式 parser；它使用独立的模板语法。

## 9. 实现现状

| 入口 | Parser | Evaluator | 状态 |
|---|---|---|---|
| Rust `{{ ... }}` | 支持子集 | 未接入 VM | 部分实现 |
| JS `{{ ... }}` | 不支持 | 不支持 | 缺失 |
| `Expr.expr` | 字符串拆分 | 极简 ad-hoc | 保留对象，需接入统一 parser |
| `Query.filter` | 独立实现 | 查询引擎 | 部分实现 |
| `Property.formula` | 字符串 | 部分/TODO | 不完整 |
| `hooks[].condition` | 字符串 | TODO（常返回 true） | 缺失 |
| `Format.format` | 模板替换 | JS 字符串替换 | 可用，但非表达式 |

Rust 表达式 parser 当前支持：

- 字面量、变量、成员访问、函数调用、索引、列表；
- `+ - * /`、比较、`&& || !`、一元 `-`、分组；
- 不支持 `%`、`**`、`in`、`and/or/not`、`??`、`?.`、`?:`、切片、对象字面量。

旧字符串 evaluator 当前只处理字面量、`$var`、函数调用、属性访问和
`obj[key]`；不处理运算符，未知表达式会原样返回字符串。

## 10. 迁移建议

1. **一套 parser/AST**：Rust 实现，编译为 WASM 供浏览器使用。
2. **共用语义**：`{{ }}`、`Expr` 与旧字符串槽位都解析到同一 AST；
   旧槽位启用 compat 模式。
3. **先补纯表达式**：`%`、`**`、`in`、`??`、`?.`、`?:`、切片、对象字面量。
4. **替换 ad-hoc evaluator**：删除字符串拆分式求值。
5. **`Format` 独立**：模板编译为字符串拼接 + 表达式。
6. **一致性测试**：Rust 与 JS/WASM 跑同一批表达式用例。
7. **迁移旧槽位**：`filter`/`formula`/`condition` 新代码使用 `{{ }}`；
   `Expr` 保留为内置对象，用于特殊情况。

## 11. 示例

```hola
// UI 绑定
PlainText {
    visible: {{ user.is_admin }}
    text: {{ user.profile?.display_name ?? user.name }}
}

// 派生字段
Property {
    name: "progress"
    formula: {{ meta.total == 0 ? 0 : meta.done * 100 / meta.total }}
}

// 查询过滤（新写法）
Query {
    from: "object.todo"
    filter: {{ it.owner == user.user_id && !it.done }}
}

// 保留的模板对象：不是表达式
PlainText {
    text: Format { format: "{it.content}" }
}

// 保留的内置表达式对象：特殊场景使用
value: Expr { expr: "it.done" }

// 列表/对象字面量
value: {{ { id: it._id, done: it.done } }}
```

## 12. 相关文档

- [language-spec.md](./language-spec.md)：结构语法
- [builtin-objects.md](./builtin-objects.md)：对象、命令、内置函数
- [query-objects.md](./query-objects.md)：`Query`、`Filter`、`Formula` 等
- [ui-objects.md](./ui-objects.md)：界面对象
