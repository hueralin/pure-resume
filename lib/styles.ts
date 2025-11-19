/**
 * 自定义样式工具类
 * 用于统一管理项目的精细小巧风格
 */

export const styles = {
  // 间距
  spacing: {
    xs: 'space-y-1.5',      // 6px
    sm: 'space-y-2',        // 8px
    md: 'space-y-2.5',      // 10px
    lg: 'space-y-3',        // 12px
    xl: 'space-y-4',        // 16px
  },
  
  // 内边距
  padding: {
    xs: 'p-1.5',            // 6px
    sm: 'p-2',              // 8px
    md: 'p-2.5',            // 10px
    lg: 'p-3',              // 12px
    xl: 'p-4',              // 16px
  },
  
  // 卡片内边距
  cardPadding: {
    sm: 'p-2.5',            // 10px
    md: 'p-3',              // 12px
    lg: 'p-4',              // 16px
  },
  
  // 字体大小
  text: {
    xs: 'text-[11px]',      // 11px
    sm: 'text-xs',          // 12px
    base: 'text-sm',        // 14px
    lg: 'text-base',        // 16px
    xl: 'text-lg',          // 18px
  },
  
  // 标题字体
  heading: {
    sm: 'text-sm font-semibold',      // 14px
    base: 'text-base font-semibold',   // 16px
    lg: 'text-lg font-semibold',       // 18px
  },
  
  // 图标大小
  icon: {
    sm: 'h-3 w-3',          // 12px
    md: 'h-3.5 w-3.5',      // 14px
    base: 'h-4 w-4',        // 16px
  },
  
  // 按钮间距
  buttonGap: {
    sm: 'gap-1.5',          // 6px
    md: 'gap-2',            // 8px
  },
  
  // 卡片间距
  cardGap: {
    sm: 'gap-2',            // 8px
    md: 'gap-3',            // 12px
  },
} as const

