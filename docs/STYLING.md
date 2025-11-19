# 样式系统使用指南

## 概述

项目使用 Tailwind CSS v4 的自定义变量系统，统一管理精细小巧的 UI 风格。所有尺寸、字体、间距都通过 CSS 变量定义，便于统一调整。

## 变量定义位置

所有样式变量定义在 `app/globals.css` 的 `@theme` 块中：

```css
@theme {
  /* 间距变量 */
  --spacing-xs: 0.375rem;      /* 6px */
  --spacing-sm: 0.5rem;         /* 8px */
  --spacing-md: 0.625rem;       /* 10px */
  --spacing-lg: 0.75rem;        /* 12px */
  --spacing-xl: 1rem;           /* 16px */

  /* 字体大小 */
  --font-size-xs: 0.6875rem;    /* 11px */
  --font-size-sm: 0.75rem;      /* 12px */
  --font-size-base: 0.875rem;   /* 14px */
  --font-size-lg: 1rem;         /* 16px */
  --font-size-xl: 1.125rem;      /* 18px */

  /* 图标大小 */
  --icon-size-sm: 0.75rem;      /* 12px */
  --icon-size-md: 0.875rem;     /* 14px */
  --icon-size-base: 1rem;       /* 16px */

  /* 卡片内边距 */
  --card-padding-sm: 0.625rem;  /* 10px */
  --card-padding-md: 0.75rem;   /* 12px */
  --card-padding-lg: 1rem;      /* 16px */
}
```

## 使用方式

### 1. 直接使用 Tailwind 类名（推荐）

由于变量已配置到 Tailwind，可以直接使用：

```tsx
// 间距
<div className="space-y-1.5">  {/* 6px */}
<div className="space-y-2">    {/* 8px */}
<div className="space-y-2.5">  {/* 10px */}
<div className="space-y-3">    {/* 12px */}

// 内边距
<div className="p-2.5">  {/* 10px */}
<div className="p-3">    {/* 12px */}
<div className="p-4">   {/* 16px */}

// 字体大小（使用自定义的 text-xs, text-sm 等）
<h1 className="text-lg font-semibold">标题</h1>
<p className="text-sm">正文</p>
<span className="text-[11px]">小字</span>

// 图标大小
<Icon className="h-3 w-3" />      {/* 12px */}
<Icon className="h-3.5 w-3.5" />  {/* 14px */}
<Icon className="h-4 w-4" />      {/* 16px */}
```

### 2. 使用样式工具类（lib/styles.ts）

```tsx
import { styles } from '@/lib/styles'

// 间距
<div className={styles.spacing.md}>

// 内边距
<div className={styles.padding.lg}>

// 字体
<h1 className={styles.heading.base}>
<p className={styles.text.sm}>

// 图标
<Icon className={styles.icon.md} />
```

## 统一调整样式

**以后只需要修改 `app/globals.css` 中的变量值，整个项目的样式就会统一改变！**

例如，如果想让整体更小：
```css
--font-size-base: 0.8125rem;  /* 从 14px 改为 13px */
--spacing-md: 0.5rem;          /* 从 10px 改为 8px */
```

如果想让整体稍大：
```css
--font-size-base: 0.9375rem;   /* 从 14px 改为 15px */
--spacing-md: 0.75rem;         /* 从 10px 改为 12px */
```

## 常用组合

### 卡片样式
```tsx
<Card className="p-2.5">  {/* 小卡片 */}
<Card className="p-3">    {/* 中等卡片 */}
<Card className="p-4">    {/* 大卡片 */}
```

### 标题样式
```tsx
<h1 className="text-lg font-semibold tracking-tight">主标题</h1>
<h2 className="text-base font-semibold">副标题</h2>
<h3 className="text-sm font-semibold">小标题</h3>
```

### 按钮样式
```tsx
<Button size="sm">小按钮</Button>
<Button size="default">默认按钮</Button>
```

### 表单样式
```tsx
<div className="space-y-1.5">
  <Label className="text-xs">标签</Label>
  <Input />
</div>
```

## 注意事项

1. **优先使用 Tailwind 类名**，而不是内联样式
2. **保持一致性**，相同类型的元素使用相同的尺寸
3. **修改变量后**，记得检查所有页面，确保视觉效果符合预期
4. **响应式设计**：目前不考虑移动端，但变量系统支持未来扩展

