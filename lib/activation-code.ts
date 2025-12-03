/**
 * 生成激活码工具函数
 * 格式：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX (25位字符，5组，每组5个字符)
 */

// 使用数字和大写字母，排除容易混淆的字符（0, O, 1, I, L）
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

/**
 * 生成一个25位的激活码
 * 格式：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
 */
export function generateActivationCode(): string {
  // 生成5组，每组5个字符
  const groups: string[] = []
  
  for (let i = 0; i < 5; i++) {
    let group = ''
    for (let j = 0; j < 5; j++) {
      const randomIndex = Math.floor(Math.random() * CHARSET.length)
      group += CHARSET[randomIndex]
    }
    groups.push(group)
  }
  
  // 用连字符连接
  return groups.join('-')
}

/**
 * 验证激活码格式
 * 支持两种格式：
 * 1. 有连字符：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
 * 2. 无连字符：25个连续字符
 */
export function validateActivationCodeFormat(code: string): boolean {
  const upperCode = code.toUpperCase()
  
  // 格式1：有连字符的格式
  const withDashPattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/
  if (withDashPattern.test(upperCode)) {
    return true
  }
  
  // 格式2：无连字符，25个连续字符
  const withoutDashPattern = /^[A-Z0-9]{25}$/
  if (withoutDashPattern.test(upperCode)) {
    return true
  }
  
  return false
}

/**
 * 格式化激活码（去除空格和连字符，转为大写，然后重新格式化）
 * 支持输入：有连字符或没有连字符的格式
 */
export function normalizeActivationCode(code: string): string {
  // 去除所有空格和连字符，转为大写
  const cleaned = code.replace(/[\s-]/g, '').toUpperCase()
  
  // 如果长度不是25，返回原样（让验证函数处理）
  if (cleaned.length !== 25) {
    return cleaned
  }
  
  // 重新格式化为标准格式：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
  const groups: string[] = []
  for (let i = 0; i < 5; i++) {
    groups.push(cleaned.slice(i * 5, (i + 1) * 5))
  }
  
  return groups.join('-')
}

