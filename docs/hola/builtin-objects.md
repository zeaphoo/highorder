# 默认 Hola Object 参考

> 本文列出 HighOrder 运行时识别的默认对象、常用属性、事件和内置函数。
> 语法规则见 [language-spec.md](./language-spec.md)。
>
> 说明：Hola 的对象类型是开放的。本文描述的是**平台默认对象**；应用和插件
> 可以定义同名或新的对象类型。属性表列出常用属性，不保证穷尽所有渲染器实现。

## 1. 类型名与编译分类

对象名在编译时通常转换为 kebab-case：

| Hola 写法 | 编译结果 |
|---|---|
| `Page` | `page` |
| `PlainText` | `plain-text` |
| `ObjectMeta` | `object-meta` |
| `ThingRouteConfig` | `thing-route-config` |

顶层对象按类别分组：

| 类别 | 默认对象 |
|---|---|
| `interfaces` | `Page`、`Modal`、`Component` |
| `actions` | `Action`、`Task` |
| `objects` | `ObjectMeta`、`Attribute`、`Resource`、`Config`、`Currency`、`Variable`、`Item` 及其他 |

未在映射表中的对象默认归入 `objects`。

## 2. 上下文变量

表达式和命令对象可以读取以下上下文：

| 变量 | 出现位置 | 含义 |
|---|---|---|
| `it` | `Query.filter`、`Foreach`、事件处理 | 当前元素/当前行 |
| `meta` | `Property.formula`、`lookup.filter` | 当前数据对象 |
| `locals` | Page / Modal / Action | 当前表单或流程的局部值 |
| `user` | 全局 | 当前登录用户 |
| `player` | 全局 | 当前应用用户档案（兼容字段） |
| `field` | `TableColumn` | 当前单元格/字段 |
| `app` | 全局 | 应用信息 |
| `route` | 全局 | 当前路由 |
| `platform` | 全局 | 平台信息 |
| `value` | 输入事件 | 当前输入值 |

## 3. 核心文档对象

### 3.1 Page

页面，按 `route` 匹配。

```hola
Page {
    name: "home"
    route: "/"
    valid: { page_size: ["medium", "large"] }
    refresh: { interval: 6 }
    locals: { tab: "todo" }
    elements: [ ... ]   // 或直接写子对象
}
```

| 属性 | 说明 |
|---|---|
| `name` | 页面名 |
| `route` | 路由 |
| `valid` | 生效条件，如 `page_size`、`platform` |
| `refresh` | 定时刷新，如 `{ interval: 6 }` |
| `permissions` | 权限检查对象列表（`ConditionCheck`） |
| `locals` | 页面局部值 |
| `events` | 页面事件 |
| `hooks` | 页面级钩子 |
| `elements` | 子元素；源码中通常直接写子对象 |

`hooks` 是匿名对象列表：

```hola
Page {
    route: "/"
    hooks: [
        {
            name: "load"
            tag: "ready"
            condition: "user.authed"
            handlers: [ ... ]
        }
    ]
}
```

### 3.2 Modal

模态框。

```hola
Modal {
    name: "edit-todo"
    title: "Edit Todo"
    locals: { title: "" }
    confirm: { text: "Save" click: [ UpdateObject { name: "object.todo" } ] }
    cancel: { text: "Cancel" trigger: false }
    Input { name: "title" label: "Title" }
}
```

| 属性 | 说明 |
|---|---|
| `name` | 模态框名，供 `ShowModal` 引用 |
| `title` | 标题 |
| `style` | 样式 |
| `locals` | 局部值 |
| `locals_format` | 用 `DataFormat` 从当前数据生成 locals |
| `confirm` | 确认按钮配置 |
| `cancel` | 取消按钮配置 |
| `events` | 事件 |
| `elements` | 子元素 |

`confirm` / `cancel`：

| 属性 | 说明 |
|---|---|
| `text` | 按钮文字 |
| `trigger` | 是否触发关闭 |
| `click` | 命令对象或列表 |
| `action` | 动作名（兼容） |
| `args` | 动作参数 |

### 3.3 Component

可复用组件。

```hola
Component {
    name: "user-card"
    Column { ... }
}
```

| 属性 | 说明 |
|---|---|
| `name` | 组件名 |
| `elements` | 子元素 |

### 3.4 ComponentUse

使用组件。

```hola
ComponentUse {
    name: Format { format: "admin-page-{locals.selected}" }
}
```

| 属性 | 说明 |
|---|---|
| `name` | 组件名，可以是字符串、`Format` 或 `Expr` |

### 3.5 Action

服务端动作，可被 `InvokeAction` 调用。

```hola
Action {
    name: "make-todo-done"
    locals: { todo_id: "" check: false }
    DataProcess {
        UpdateObject {
            name: "object.todo"
            object_id: Expr { expr: "locals.todo_id" }
            value: { done: Expr { expr: "locals.check" } }
        }
    }
}
```

| 属性 | 说明 |
|---|---|
| `name` | 动作名 |
| `locals` | 局部值 |
| `elements` / 子对象 | 命令步骤，通常是 `DataProcess` |
| `handlers` | 兼容写法 |

## 4. 数据模型对象

### 4.1 ObjectMeta

定义数据对象（表）。

```hola
ObjectMeta {
    name: "todo"
    unique_keys: ["name"]
    Property { name: "content" data_type: "string" required: true }
    Property { name: "done" data_type: "bool" default: false }
}
```

| 属性 | 说明 |
|---|---|
| `name` | 对象名，后续可用 `object.todo` 引用 |
| `unique_keys` | 唯一键 |
| `elements` / 子对象 | `Property` 列表 |

### 4.2 Property

`ObjectMeta` / `Resource` 的字段定义。

```hola
Property {
    name: "owner"
    data_type: "user_id"
    lookup: {
        from: "player"
        filter: "it.user_id == meta.owner"
    }
}
```

| 属性 | 说明 |
|---|---|
| `name` | 字段名 |
| `data_type` | 类型，见下 |
| `required` | 是否必填 |
| `default` | 默认值，可以是字面量、`Expr`、`Format` |
| `max_length` | 字符串最大长度 |
| `unique` | 是否唯一 |
| `formula` | 派生字段表达式 |
| `lookup` | 关联查询 |

`data_type` 常见值：

- `string`、`text`、`number`、`bool`、`datetime`、`color`、`user_id`
- `list[string]`、`list[user_id]`、`list[object.todo]`
- 自定义对象：`object.todo`、`Avatar`、`Enum` 等

`lookup`：

```hola
lookup: {
    from: "object.todo"
    filter: "it.todo_list_id == meta._id"
    order_by: "created"
    limit: 30
}
```

### 4.3 Attribute

用户/应用属性。

```hola
Attribute {
    name: "display_name"
    data_type: "string"
    default: Expr { expr: "user.name" }
}
```

| 属性 | 说明 |
|---|---|
| `name` | 属性名 |
| `data_type` | 类型 |
| `default` | 默认值 |

### 4.4 Enum

枚举类型，通常作为 `data_type` 的值。

```hola
Property {
    name: "priority"
    data_type: Enum {
        enum: ["low", "normal", "high"]
        default: "normal"
    }
}
```

| 属性 | 说明 |
|---|---|
| `enum` / `values` | 可选值列表 |
| `default` | 默认值 |

### 4.5 Resource

资源/占用模型。

```hola
Resource {
    name: "room_reservation"
    res_key: "room_id"
    mutex: { start: "start" reserve: "duration" }
    Property { name: "staff" data_type: "user_id" }
}
```

| 属性 | 说明 |
|---|---|
| `name` | 资源名 |
| `res_key` | 资源键字段 |
| `mutex` | 互斥区间配置 |
| `elements` / 子对象 | `Property` 列表 |

### 4.6 Config / ThingRouteConfig

应用配置。

```hola
Config {
    ThingRouteConfig {
        device_type: "meetingroom"
        home_url: "/meetingroom"
    }
}
```

| 对象 | 属性 |
|---|---|
| `Config` | 子对象列表 |
| `ThingRouteConfig` | `device_type`、`home_url` |

## 5. 行为与命令对象

命令对象既可用于 `Action`，也可用于 `events` / `confirm.click` / `hooks.handlers`。

### 5.1 DataProcess

命令序列容器。

```hola
DataProcess {
    UpdateObject { ... }
    InvokeAction { ... }
}
```

### 5.2 数据命令

| 对象 | 常用属性 | 说明 |
|---|---|---|
| `UpdateObject` | `name`、`object_id`、`value` | 更新对象 |
| `CreateObject` | `name`、`value` | 创建对象 |
| `DeleteObject` | `name`、`object_id`、`confirm` | 删除对象 |
| `Query` | `from`、`filter`、`order_by`、`limit` | 查询 |

### 5.3 调用命令

| 对象 | 常用属性 | 说明 |
|---|---|---|
| `InvokeAction` | `name`、`args` | 调用 `Action` |
| `InvokeService` | `name`、`args` | 调用平台服务 |
| `ExecuteAction` | `action`、`args` | 兼容写法 |

### 5.4 校验与条件

```hola
ValidateLocals {
    name: { required: true min_length: 5 }
    password: { required: true min_length: 6 }
}
```

| 对象 | 常用属性 | 说明 |
|---|---|---|
| `ValidateLocals` | 字段名 → 规则 | 校验 locals |
| `ConditionCheck` | `condition`、`on_false` | 条件不满足时执行 |

`ValidateLocals` 规则可包含 `required`、`min_length`、`max_length`、`pattern`、`min`、`max` 等。

### 5.5 导航与界面命令

| 对象 | 常用属性 | 说明 |
|---|---|---|
| `RouteTo` | `route` | 跳转路由 |
| `ShowModal` | `name`、`args` | 打开模态框 |
| `ShowAlert` | `text`、`title`、`tags`、`duration` | 提示 |
| `Refresh` | `args` | 刷新当前页/组件 |
| `CloseModal` | — | 关闭模态框 |
| `SetSession` | `session`、`user` | 设置会话 |
| `ClearSession` | — | 清除会话 |

## 6. 事件

元素通过 `events` 绑定事件：

```hola
Button {
    text: "Done"
    events: {
        click: UpdateObject {
            name: "object.todo"
            object_id: Format { format: "{it._id}" }
            value: { done: true }
        }
    }
}
```

- 事件值可以是单个命令对象，也可以是命令列表。
- 常见事件名：`click`、`change`、`changed`、`check`、`toggle`、`select`、`input`。
- 兼容写法：`handlers: { click: ... }`。
- 页面级钩子使用 `hooks`，包含 `condition` 和 `handlers`。

## 7. 内置函数（`fn.*`）

> 这些是当前平台的遗留命名空间。新代码建议逐步迁移到 `std.*`；
> 过渡期内 `fn.*` 继续可用。

| 函数 | 说明 |
|---|---|
| `fn.random(start, end)` | 区间随机整数 |
| `fn.random_color()` | 主题随机颜色 |
| `fn.lastdays(count)` | 最近 N 天日期列表 |
| `fn.join(list, separator)` | 字符串连接 |
| `fn.version_greater_than(a, b)` | 版本比较 |
| `fn.format_datetime(format, datetime)` | 日期格式化 |
| `fn.now()` | 当前时间戳（毫秒） |
| `fn.now_iso()` | 当前 ISO 时间 |
| `fn.today()` | 今天日期 |
| `fn.is_empty(value)` | 是否为空 |
| `fn.coalesce(...)` | 第一个非空值 |
| `fn.clamp(value, min, max)` | 限制范围 |
| `fn.round_to(value, decimals)` | 四舍五入到指定小数位 |
| `fn.age(birthdate)` | 计算年龄 |
| `fn.abs(number)` | 绝对值 |
| `fn.len(value)` | 字符串/列表/对象长度 |
| `fn.int(value)` | 转整数 |
| `fn.float(value)` | 转浮点数 |
| `fn.str(value)` | 转字符串 |
| `fn.bool(value)` | 转布尔 |

### 集合辅助写法

旧代码中常见：

```hola
formula: "len(filter(meta.todos).done == true) * 100 / len(meta.todos)"
formula: "every(meta.todos).done == true"
```

这里的 `filter` / `every` 不是普通函数，而是**查询辅助写法**：

- `filter(collection).field == value`：筛选；
- `every(collection).field == value`：判断是否全部满足；
- `len(...)`：取长度。

新脚本建议使用更明确的集合方法（设计中的 `std.list.*`），例如
`meta.todos.where(...)` / `meta.todos.count(...)`。

## 8. 预留与兼容类型

以下类型在分类表或渲染器中被识别，但语义由平台扩展或旧版本定义。
编写新应用时不要依赖未列出的属性。

| 类型 | 说明 |
|---|---|
| `Task` | 平台任务（actions 类别） |
| `Currency` | 虚拟货币（objects 类别，预留） |
| `Variable` | 变量（objects 类别，预留） |
| `Item` | 道具/商品（objects 类别，预留） |
| `Playable` | 可玩内容配置（平台扩展） |
| `Advertisement` | 广告配置（平台扩展） |
| `Motion` | 动效（渲染器跳过） |
| `Thing` | 设备/终端（平台扩展） |
| `Player` | 应用用户档案（平台扩展） |

## 9. 已知实现差异

新的 `highorder` Web 客户端仍在迁移中，部分渲染器接受别名：

| 语言规范写法 | 兼容别名 |
|---|---|
| `Row` | `row_line` |
| `Navbar` / `NavBar` | `nav_bar` |
| `Progressbar` / `ProgressBar` | `progress_bar` |
| `Divider` | `separator` |
| `DataTable.elements` | 部分渲染器读取 `columns` |
| `Menu.elements` | 部分渲染器读取 `items` |

**语言层面的规范写法**是「子对象」；编译后统一落到 `elements`。别名只用于
兼容旧渲染器，不应在新代码中使用。

## 10. 相关文档

- [language-spec.md](./language-spec.md)：语法
- [expressions.md](./expressions.md)：表达式规范
- [query-objects.md](./query-objects.md)：查询、表达式与模板对象
- [ui-objects.md](./ui-objects.md)：界面对象
- [namespace.md](./namespace.md)：命名空间
