# Hola 语言规范

> 本文描述 `.hola` 文件的结构、词法和当前已实现的表达式语法。
> 表达式规范见 [expressions.md](./expressions.md)；内置对象和运行时语义见
> [builtin-objects.md](./builtin-objects.md)。
>
> 形式化语法见 [grammar.ebnf](./grammar.ebnf) 和 [grammar.peg](./grammar.peg)。

## 1. 基本约定

- **文件扩展名**：`.hola`
- **编码**：UTF-8
- **文件结构**：一个 Hola 文件由一个或多个「对象（Object）」构成。

```hola
Modal {
    name: "hello-world"
    title: "Hello Hola"
}

Page {
    route: "/"
}
```

- **对象名（TypeName）**区分大小写，通常使用 PascalCase，例如 `Modal`、`Page`、
  `PlainText`、`ObjectMeta`。
- **属性名（propertyName）**区分大小写，通常使用 snake_case，例如 `name`、
  `title`、`route`、`text`、`data_type`。
- **分隔符**：属性和列表元素可以用换行或逗号分隔。换行和逗号在多数位置等价。

## 2. 基本数据类型

Hola 的值类型：

1. **Null**
   ```hola
   foo: null
   ```

2. **Bool**
   ```hola
   trigger: false
   visible: true
   ```

3. **String**
   - 单引号或双引号包裹。
   - 支持转义：`\n`、`\r`、`\t`、`\v`、`\b`、`\f`、`\a`、`\\`、`\"`、`\'`。
   ```hola
   title: "Hello Hola"
   text: 'This is a Modal.'
   ```

4. **Number**
   - 整数或小数。
   - 数字内部允许 `_` 作为分隔符，编译时忽略。
   ```hola
   count: 100
   price: 99.9
   big_number: 1_000_000
   ```

5. **Color**
   - `#RGB`、`#RGBA`、`#RRGGBB`、`#RRGGBBAA`。
   ```hola
   color: #FF8800
   ```

6. **List**
   - 见第 5 节。

7. **Object**
   - 见第 4 节。

8. **Expression**
   - 只有 `{{ ... }}` 形式，见第 6 节。

## 3. 注释

- 单行注释：`//` 到行尾。
- 块注释：`/* ... */`，用于文档层，不能嵌套。
- 表达式块 `{{ ... }}` 内不使用块注释。

```hola
// 单行注释
/*
 * 块注释
 */
Modal {
    name: "comment-demo" // 行尾注释
}
```

## 4. 对象（Object）

### 4.1 对象定义

```hola
ObjectName {
    property1: value1
    property2: value2

    SubObjectName {
        // 子对象
    }
}
```

- 对象名可以省略，形成匿名对象 `{ ... }`。
- 对象名支持命名空间，见 [namespace.md](./namespace.md)。
- 左花括号 `{` 写在对象名之后；右花括号 `}` 结束对象。
- 对象的属性名和子对象可以混合出现。

### 4.2 属性

```hola
property_name: value
```

- 属性名可以是裸标识符（小写开头或 `_` 开头），也可以是字符串。
  ```hola
  "content-type": "text/plain"
  ```
- 属性值可以是：
  - 字面量：`null`、`true`、`false`、字符串、数字、颜色；
  - 列表：`[ ... ]`；
  - 对象：`ObjectName { ... }` 或匿名对象 `{ ... }`；
  - 表达式块：`{{ expression }}`。

示例：

```hola
Modal {
    name: "hello-world"
    title: "Hello Hola"
    confirm: {
        text: "OK"
        trigger: false
    }
}
```

这里 `confirm` 的值是一个匿名对象，内部包含 `text` 和 `trigger` 属性。

### 4.3 子对象

对象内部可以包含子对象：

```hola
Page {
    route: "/"

    Column {
        PlainText {
            text: "Hello Hola"
        }
        Button {
            text: "hello"
            events: {
                click: ShowModal {
                    name: "hello-world"
                }
            }
        }
    }
}
```

解析时区分属性和子对象的规则：

- 当前 token 是 `PropertyName` 或字符串，并且后面是 `:` → 属性；
- 当前 token 是 `Identifier` 或 `{` → 子对象；
- 子对象会被编译到父对象的 `elements` 列表中。

### 4.4 对象类型名与运行时类型

对象名在编译时通常转换为 kebab-case：

| Hola 写法 | 编译结果 |
|---|---|
| `Page` | `page` |
| `PlainText` | `plain-text` |
| `ObjectMeta` | `object-meta` |
| `DataFormat` | `data-format` |
| `ThingRouteConfig` | `thing-route-config` |

带命名空间的类型名（如 `System.String`）需要先拆分再逐段转换，当前 JS
编译器尚未完整处理，见 [namespace.md](./namespace.md)。

具体对象及其属性见 [builtin-objects.md](./builtin-objects.md)。

## 5. 列表（List）

列表使用方括号：

```hola
items: [
    "a",
    "b",
    "c"
]
```

- 元素之间可以用逗号或换行分隔。
- 元素可以是任意合法值：字面量、对象、嵌套列表等。
- 连续逗号或空位会产生 `null` 元素。
- 允许尾随逗号。

```hola
values: [1, 2, 3]
widgets: [
    PlainText { text: "A" },
    PlainText { text: "B" },
]
with_holes: [1, , 3]
```

## 6. 表达式

Hola 的**唯一规范表达式入口**是 `{{ ... }}`：

```hola
PlainText {
    text: "Hello"
    visible: {{ user.is_admin }}
}
```

需要先区分四种写法：

| 写法 | 含义 |
|---|---|
| `"1 + 2"` | 字符串字面量，不是表达式 |
| `{{ 1 + 2 }}` | 表达式块，编译期解析 |
| `Expr { expr: "1 + 2" }` | 保留的内置表达式对象，特殊场景使用 |
| `Format { format: "{user.name}" }` | 保留的模板对象，不是表达式 |

`Query.filter`、`Property.formula`、`hooks[].condition`、`ConditionCheck.condition`
是历史兼容槽位，需要按兼容模式解析。`Expr` 是保留的内置对象，常规代码仍应
直接使用 `{{ ... }}`。`filter` / `formula` / `condition` 的普通字符串属性本身
不会自动求值。

当前 Rust 解析器支持：

- 字面量：字符串、数字、布尔、`null`、颜色、列表；
- 变量：`user`、`it`、`meta`、`locals`、`field` 等（由上下文提供）；
- 成员访问：`user.name`；
- 函数调用：`fn.today()`、`len(items)`；
- 索引：`items[0]`；
- 算术：`+`、`-`、`*`、`/`；
- 比较：`==`、`!=`、`<`、`<=`、`>`、`>=`；
- 逻辑：`&&`、`||`；
- 一元：`!`、`-`；
- 分组：`( ... )`；
- 列表字面量：`[ ... ]`。

目标语法还包括 `%`、`**`、`in`、`and`/`or`/`not`、`??`、`?.`、`?:`、
切片和对象字面量。完整语法、优先级、求值语义和兼容规则见
[expressions.md](./expressions.md)。

表达式是**纯计算**，不包含赋值、分支语句、循环或函数定义。流程控制对象化属于
后续设计，尚未纳入本版规范。

## 7. 标识符、关键字与命名空间

- **关键字**：`null`、`true`、`false`。
- **属性名**：小写字母或 `_` 开头，后续为字母、数字、`_`。
- **类型名 / 标识符**：大写字母或 `_` 开头，后续为字母、数字、`_`。
- **命名空间**：类型名可以用 `.` 分隔，例如：

```hola
System.Collections.Generic.List {
    items: ["a", "b"]
}
```

规则：

```text
typeName = upperIdent { "." upperIdent }
```

详见 [namespace.md](./namespace.md)。

## 8. 空白、换行与格式

- 空格和制表符在大多数位置被忽略。
- 换行在对象体和列表中可以作为分隔符。
- 花括号、方括号、冒号周围的空格不是语法必须。

```hola
Column {
    style: {
        justify: "center"
    }
}
```

也可以写成：

```hola
Column {
    style: { justify: "center" }
}
```

## 9. 完整示例

```hola
Modal {
    name: "hello-world"
    title: "Hello Hola"
    confirm: {
        text: "OK"
        trigger: false
    }
    PlainText {
        text: "This is a Modal. Click OK to close."
    }
}

Page {
    route: "/"

    Column {
        style: {
            justify: "center"
        }
        PlainText {
            text: "Hello Hola"
        }
        Button {
            text: "hello"
            events: {
                click: ShowModal {
                    name: "hello-world"
                }
            }
        }
    }
}
```

这个示例包含：

- 两个顶层对象：`Modal` 和 `Page`；
- 简单属性：`name`、`title`、`route`、`text`；
- 匿名对象属性：`confirm`、`style`、`events`；
- 子对象：`PlainText`、`Button`、`Column`；
- 事件与命令对象：`events.click = ShowModal { ... }`。

## 10. 与 HighOrder 的关系

- Hola 语言本身定义**结构、值和表达式**。
- 对象名（`Page`、`Modal`、`Button`、`ObjectMeta` 等）的语义由 HighOrder
  运行时定义，见 [builtin-objects.md](./builtin-objects.md)。
- 编写 Hola 文件时：
  - 语法需符合本规范；
  - 语义需遵守内置对象和属性文档。

## 11. 当前实现状态

| 能力 | 状态 |
|---|---|
| 对象、属性、子对象、匿名对象 | 已实现 |
| 字符串、数字、布尔、null、颜色 | 已实现 |
| 列表、换行/逗号分隔、空位 | 已实现 |
| `//`、`/* */` 注释 | 已实现（块注释仅文档层） |
| 命名空间类型名 | 已实现 |
| `{{ }}` 表达式 | Rust 解析器已实现；JS 编译器尚不支持 |
| `%`、`**`、`in`、`and`/`or`/`not` | 语法草案，待实现 |
| 函数/流程对象 | 尚未纳入本版规范 |

---

本规范是迁移后的「草案版」。语法或编译器行为变更时，应同步更新本文、
`grammar.*` 以及 `builtin-objects.md`。
