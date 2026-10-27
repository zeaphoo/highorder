# Hola 类型名中的命名空间

## 概述

Hola 的类型名（TypeName）支持用点号 `.` 组合多个标识符，用来表达层次化的
类型名称。命名空间只是**名字的一部分**，不改变对象、属性或值的语法。

```text
typeName = upperIdent { "." upperIdent }
```

- 必须以大写字母或 `_` 开头；
- 后续每一段也用 `.` 连接，且每段以大写字母或 `_` 开头；
- 不允许小写开头的命名空间段；
- 不允许空格或特殊字符。

## 示例

### 单段类型名

```hola
String {
    value: "hello world"
    length: 11
}
```

### 两段命名空间

```hola
System.String {
    value: "example"
    length: 7
}
```

### 三段命名空间

```hola
System.Collections.Generic.List {
    items: ["item1", "item2", "item3"]
    count: 3
}
```

### 四段命名空间

```hola
Microsoft.AspNetCore.Mvc.Controller {
    name: "HomeController"
    actions: ["Index", "About", "Contact"]
}
```

### 带属性的复杂对象

```hola
MyApp.Models.User {
    id: 1
    name: "John Doe"
    email: "john@example.com"
    profile: {
        firstName: "John"
        lastName: "Doe"
        age: 30
    }
}
```

### 嵌套对象中的命名空间

```hola
MyApp.Services.AuthService {
    provider: "OAuth2"
    config: {
        clientId: "abc123"
        redirectUri: "https://example.com/callback"
        scopes: ["openid", "profile", "email"]
    }
    providers: {
        "Google": {
            enabled: true
            clientId: "google-client-id"
        }
        "Microsoft": {
            enabled: true
            clientId: "microsoft-client-id"
        }
    }
}
```

## 编译行为

- 命名空间会保留在对象名中；具体转换由编译器决定。
- 普通类型名（如 `Page`、`ObjectMeta`）仍然是合法写法，保持向后兼容。
- **已知问题**：当前 JS 编译器的 PascalCase → kebab-case 转换只按单段
  类型名处理。带命名空间的类型名（如 `System.String`）需要先拆分命名空间
  再逐段转换，否则可能得到不符合预期的 `type`。迁移或新增命名空间对象时，
  请以实际编译结果为准。

## 命名建议

- 平台内置对象使用 PascalCase，例如 `Page`、`Modal`、`ObjectMeta`；
- 自定义/扩展对象使用有意义的命名空间，例如 `MyApp.Models.User`；
- 避免使用小写开头的命名空间段；
- 避免过深的命名空间，通常 2–4 段足够。

## 相关文档

- [language-spec.md](./language-spec.md)：对象、属性、值
- [builtin-objects.md](./builtin-objects.md)：默认 Hola Object
