# 简历模块通用化封装技术设计文档

## 1. 背景与目标

当前简历编辑器中，【教育经历】和【基本信息】采用了两套不同的实现逻辑。
- **基本信息**：使用 `DynamicForm`，完全由 JSON 配置驱动。
- **教育经历**：使用 `EducationForm`，内部逻辑和 UI 均为硬编码。

随着【工作经历】、【项目经历】等更多列表型模块的加入，硬编码方式会导致大量重复代码，维护困难。
本设计旨在实现一套**通用的、配置驱动的列表编辑组件**，使得新增模块只需增加 JSON 配置文件即可。

## 2. 核心组件架构

我们将引入两个新的核心组件来替代 `EducationForm` 及其子组件。

### 2.1 `DynamicListForm` (容器组件)

负责管理列表数据结构、拖拽排序、增删操作。

- **Props**:
  - `moduleConfig`: 模块配置对象（包含字段定义、模块元数据）。
  - `initialData`: 初始数据（包含 `items` 数组）。
  - `onChange`: 数据变更回调。
- **职责**:
  - 维护 `items` 数组状态。
  - 集成 `dnd-kit` 实现拖拽排序。
  - 提供“添加一项”按钮，根据配置生成初始空对象。
  - 渲染 `SortableContext` 和子组件列表。

### 2.2 `DynamicItemAccordion` (列表项组件)

负责渲染单个列表项的折叠面板及内部的动态表单。

- **Props**:
  - `id`: 用于 dnd 的唯一标识。
  - `index`: 在列表中的索引。
  - `control`: React Hook Form 的 control 对象。
  - `moduleConfig`: 模块配置（用于获取字段定义）。
  - `onRemove`: 删除回调。
- **职责**:
  - 使用 `Collapse` 渲染折叠面板。
  - **智能标题生成**：动态读取表单当前值，选取配置中的前两个关键字段组合显示为面板标题（例如 "公司名 - 职位"）。
  - 遍历 `moduleConfig.fields`，复用 `DynamicForm` 中的字段渲染逻辑（Input, Select, DatePicker, TextArea 等）。

## 3. 数据结构变更

### 3.1 JSON 配置扩展 (`config/modules/*.json`)

现有的配置结构无需大改，利用 `allowMultiple: true` 即可标识列表模块。
建议在字段定义中隐式约定：
- 列表显示的标题默认取 `fields` 数组中前两个类型为 `text` 的字段。

### 3.2 存储数据结构

列表型模块的数据结构统一为：
```json
{
  "items": [
    {
      "_id": "unique-id",
      "field1": "value1",
      "field2": "value2"
    }
  ]
}
```

## 4. 迁移策略

1.  **保留**：`DynamicForm` (用于单例模块，如基本信息)。
2.  **新增**：`DynamicListForm` (用于所有列表模块)。
3.  **修改**：`ResumeModuleAccordion`，逻辑变更为：

```tsx
if (moduleConfig.allowMultiple) {
  return <DynamicListForm ... />
} else {
  return <DynamicForm ... />
}
```

## 5. 实现步骤

1.  实现 `DynamicItemAccordion`：复用 `DynamicForm` 的字段渲染逻辑。
2.  实现 `DynamicListForm`：复用 `EducationForm` 的拖拽逻辑，但将 item 渲染部分替换为 `DynamicItemAccordion`。
3.  添加 `work-experience.json` 验证通用性。
4.  切换 `ResumeModuleAccordion` 入口。

