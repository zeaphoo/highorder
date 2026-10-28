# 默认 Hola 查询、表达式与模板对象

> 本文列出 `Query`、`Foreach`、`Match`、`Expr`、`Format`、`DataFormat` 等
> 查询与模板对象。核心对象、命令对象和内置函数见
> [builtin-objects.md](./builtin-objects.md)。
>
> `Query.filter` 是**字符串兼容槽位**；`Expr` 是**保留的内置表达式对象**。
> 规范表达式入口是 `{{ ... }}`，统一表达式规范见
> [expressions.md](./expressions.md)。

## 1. 查询、表达式与模板对象

### 1.1 Query

数据查询。

```hola
Query {
    from: "object.todo"
    filter: "(it.owner == user.user_id) and it.priority == 'high'"
    order_by: "-created"
    group_by: "priority"
    limit: 30
}
```

| 属性 | 说明 |
|---|---|
| `from` | 数据源，如 `object.todo`、`player` |
| `filter` | 过滤表达式 |
| `order_by` | 排序，`-` 表示倒序 |
| `group_by` | 分组字段 |
| `limit` | 数量限制 |
| `offset` | 偏移 |

### 1.2 LocalValue

读取 `locals` 中的字段。

```hola
LocalValue {
    field: "it.tags"
}
```

### 1.3 Foreach

声明式遍历。

```hola
Foreach {
    model: Query { from: "object.todo" limit: 30 }
    alt: PlainText { text: "no todo" }
    ElementOption {
        name: Format { format: "{it._id}" }
        element: PlainText { text: Format { format: "{it.content}" } }
    }
}
```

| 属性 | 说明 |
|---|---|
| `model` | 数据源，通常是 `Query` 或 `LocalValue` |
| `elements` / 子对象 | 每个元素的模板 |
| `alt` | 空数据时的替代内容 |

### 1.4 Match / CaseValue

多分支取值。

```hola
Match {
    value: Expr { expr: "locals.tag" }
    default: ""
    CaseValue {
        case: "work"
        value: Format { format: "it.tags__contains('work')" }
    }
}
```

| 对象 | 属性 |
|---|---|
| `Match` | `value`、`elements`（`CaseValue`）、`default` |
| `CaseValue` | `case`、`value` |

### 1.5 Expr / Format / DatetimeFormat

| 对象 | 属性 | 说明 |
|---|---|---|
| `Expr` | `expr` | 保留的内置表达式对象，特殊场景使用 |
| `Format` | `format` | 字符串模板，如 `"{it.name}"` |
| `DatetimeFormat` | `value`、`format` | 日期格式化，如 `YYYY-MM-DD` |

新代码优先使用 `{{ ... }}`；`Expr` 保留用于需要显式表达式节点的特殊场景。

### 1.6 DataFormat / DataFilter / DataExtract

用于从当前数据生成 `locals`。

```hola
DataFormat {
    DataFilter { keys: ["title", "_id", "tags"] }
    DataExtract { key: "tags" expr: "it.name" }
}
```

| 对象 | 属性 |
|---|---|
| `DataFormat` | 子对象列表 |
| `DataFilter` | `keys` |
| `DataExtract` | `key`、`expr` |

### 1.7 Locals

传递局部值的对象，属性自由定义。

```hola
Locals {
    todo_id: Format { format: "{it._id}" }
    check: Expr { expr: "it.done" }
}
```

## 2. 相关文档

- [language-spec.md](./language-spec.md)：语法与 `{{ }}` 表达式
- [expressions.md](./expressions.md)：表达式规范与兼容规则
- [builtin-objects.md](./builtin-objects.md)：核心对象、数据对象、命令对象、内置函数
- [ui-objects.md](./ui-objects.md)：界面对象
