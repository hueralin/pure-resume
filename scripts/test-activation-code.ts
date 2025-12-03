/**
 * 测试激活码生成函数
 * 运行: npx tsx scripts/test-activation-code.ts
 */

import { generateActivationCode, validateActivationCodeFormat, normalizeActivationCode } from '../lib/activation-code'

console.log('测试激活码生成和验证...\n')

// 生成10个激活码并验证
for (let i = 0; i < 10; i++) {
  const code = generateActivationCode()
  const isValid = validateActivationCodeFormat(code)
  const normalized = normalizeActivationCode(code)
  
  console.log(`${i + 1}. ${code}`)
  console.log(`   长度: ${code.length} (应该是29，包含4个连字符)`)
  console.log(`   格式验证: ${isValid ? '✓' : '✗'}`)
  console.log(`   规范化后: ${normalized}`)
  console.log('')
}

// 测试格式验证
console.log('\n测试格式验证:')
const testCases = [
  { code: 'ABCDE-FGHIJ-KLMNO-PQRST-UVWXY', expected: true },
  { code: '12345-67890-ABCDE-FGHIJ-KLMNO', expected: true },
  { code: 'ABCDE-FGHIJ-KLMNO-PQRST', expected: false }, // 缺少一组
  { code: 'ABCDE-FGHIJ-KLMNO-PQRST-UVWXY-12345', expected: false }, // 多一组
  { code: 'ABCDEFGHIJKLMNOPQRSTUVWXY', expected: false }, // 没有连字符
  { code: 'abcde-fghij-klmno-pqrst-uvwxy', expected: true }, // 小写应该被接受（会转为大写）
]

testCases.forEach(({ code, expected }) => {
  const result = validateActivationCodeFormat(code)
  const status = result === expected ? '✓' : '✗'
  console.log(`${status} "${code}" => ${result} (期望: ${expected})`)
})

console.log('\n测试完成！')

