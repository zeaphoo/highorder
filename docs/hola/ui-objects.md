# 默认 Hola UI Object 参考

> 本文列出 HighOrder 运行时默认的界面对象、常用属性和样式。
> 语法、核心对象、数据对象和内置函数见 [builtin-objects.md](./builtin-objects.md)。

## 1. 界面容器对象

| 对象 | 常用属性 | 说明 |
|---|---|---|
| `Column` | `elements`、`locals`、`style` | 纵向布局 |
| `Row` | `elements`、`locals`、`style` | 横向布局 |
| `Card` | `title`、`sub_title`、`text`、`image_src`、`elements`、`locals`、`show_border`、`style` | 卡片 |
| `CardSwiper` | `title`、`elements`、`style` | 横向滑动卡片 |
| `Header` | `elements`、`start_elements`、`end_elements`、`left_elements`、`right_elements`、`style` | 页头 |
| `Footer` | 同 `Header` | 页脚 |
| `Navbar` | `title`、`show_back`、`show_home`、`show_profile`、`elements`、`style` | 顶部导航 |
| `SideBar` | `elements`、`locals`、`style` | 侧边栏 |
| `Menu` | `label`、`icon`、`elements`（`MenuItem`）、`style` | 下拉菜单 |
| `MenuItem` | `label`、`text`、`icon`、`visible`、`disable`、`disable_text`、`events`、`route`、`open_url`、`open_modal` | 菜单项 |
| `NavMenu` | `elements` | 导航菜单列表 |
| `Toolbar` | `start_elements`、`elements`、`end_elements`、`style` | 工具栏 |
| `TabBar` | `tabs`（`text`、`href`、`checked`）、`style` | 标签栏 |
| `ActionBar` | `elements`、`style` | 动作栏 |
| `PopupMenu` | `icon`、`elements`（`MenuItem`） | 弹出菜单 |
| `DataTable` | `data`（`Query`）、`elements`（`TableColumn`）、`paginator`、`style` | 数据表格 |
| `TableColumn` | `field`、`label`、`elements`、`style` | 表格列 |
| `TableView` | `columns`、`rows`、`show`（`header`、`inner_column`、`inner_row`） | 静态表格 |
| `Divider` / `Separator` | `visible`、`style` | 分隔线 |

## 2. 内容展示对象

| 对象 | 常用属性 | 说明 |
|---|---|---|
| `PlainText` | `text`、`visible`、`style` | 纯文本 |
| `Title` | `title`、`sub_title`、`level`、`style` | 标题 |
| `Paragraph` | `text`、`align`、`isRich`、`style` | 段落 |
| `AnnotationText` | `text`、`annotation`、`style` | 带注解文本 |
| `StatusText` | `label`、`text`、`style` | 状态文本 |
| `BulletedList` | `texts`、`style` | 无序列表 |
| `Link` | `text`、`target_url`、`open_mode`、`style` | 链接 |
| `Image` | `image_url`、`size`、`style` | 图片 |
| `Video` | `video_url`、`video_type`、`poster_url`、`autoplay`、`muted`、`width`、`height`、`style` | 视频 |
| `Icon` | `icon`、`style` | 图标 |
| `IconText` | `icon`、`text`、`style` | 图标 + 文本 |
| `IconNumber` | `icon`、`number` | 图标 + 数字 |
| `IconTitle` | `icon`、`count` | 图标 + 标题 |
| `IconNumberText` | `icon`、`number`、`maxDigits` / `max_digits` | 图标 + 数字文本 |
| `IconNumberButton` | `icon`、`number`、`maxDigits`、`size`、`minClickDuration` | 带角标按钮 |
| `IconButton` | `icon`、`disable`、`size`、`events` | 图标按钮 |
| `StarRating` | `rating` | 星级 |
| `Avatar` | `image_src`、`label` / `text`、`style` | 头像 |
| `Tag` | `text`、`color`、`style` | 标签 |
| `Progressbar` | `percent`、`value`、`total`、`width_size`、`style` | 进度条 |
| `Clock` | `show_date`、`style` | 时钟 |
| `Qrcode` | `code`、`size`、`level`、`text`、`style` | 二维码 |
| `Hero` | `title`、`text`、`image_src`、`style` | 首屏区域 |
| `Logo` | `text`、`image_src`、`style` | Logo |
| `Decoration` | `style` | 装饰元素（渲染器相关） |

## 3. 输入对象

| 对象 | 常用属性 | 说明 |
|---|---|---|
| `Button` | `text`、`icon`、`href`、`open_new`、`disable`、`events`、`handlers`、`action`、`args`、`open_modal`、`style` | 按钮 |
| `Input` | `name`、`label`、`value`、`password`、`default`、`validate`、`events` | 单行输入 |
| `Textarea` | `name`、`label`、`value`、`rows`、`validate`、`events` | 多行输入 |
| `Dropdown` | `name`、`label`、`value`、`options`、`validate`、`events` | 下拉选择 |
| `MultiSelect` | `name`、`label`、`values`、`options`、`chips`、`events` | 多选 |
| `Checkbox` | `name`、`text`、`value`、`check_strike`、`events`、`handlers` | 复选框 |
| `InputSwitch` | `name`、`text`、`value`、`events` | 开关 |
| `Calendar` | `name`、`label`、`value`、`default`、`events` | 日期选择 |
| `TextOption` | `label`、`name`、`value` | 下拉选项 |
| `ElementOption` | `name`、`element` | 自定义选项 |

## 4. Style 对象

`style` 是自由属性对象，常用键：

| 键 | 说明 |
|---|---|
| `size` | 尺寸等级 |
| `size_hint` | 布局占比/权重 |
| `tags` | 样式标签，如 `["full"]`、`["status"]`、`["outlined"]` |
| `justify` | 主轴对齐，如 `start`、`center`、`space-between` |
| `align` | 交叉轴对齐，如 `start`、`center` |
| `content_tags` | 内容区域样式标签 |
| `padding` / `margin` | 内边距/外边距 |
| `color` / `background` | 颜色/背景 |
| `width` / `height` | 尺寸 |
| `border` / `shadow` | 边框/阴影 |

```hola
Card {
    style: {
        size_hint: 2
        tags: ["full"]
    }
}
```

## 5. 相关文档

- [language-spec.md](./language-spec.md)：语法
- [builtin-objects.md](./builtin-objects.md)：核心对象、数据对象、命令对象、内置函数
- [query-objects.md](./query-objects.md)：查询与模板对象
