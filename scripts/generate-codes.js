/**
 * 生成激活码脚本
 * 
 * 使用方法：
 * pnpm generate-codes [count] [days]
 * 
 * 示例：
 * pnpm generate-codes 10 90  # 生成10个激活码，有效期90天（约3个月）
 * pnpm generate-codes 5 30   # 生成5个激活码，有效期30天
 */

const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

// 激活码字符集（排除容易混淆的字符：0, O, 1, I, L）
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

/**
 * 生成一个25位的激活码
 * 格式：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
 */
function generateActivationCode() {
  const groups = []
  
  for (let i = 0; i < 5; i++) {
    let group = ''
    for (let j = 0; j < 5; j++) {
      const randomIndex = Math.floor(Math.random() * CHARSET.length)
      group += CHARSET[randomIndex]
    }
    groups.push(group)
  }
  
  return groups.join('-')
}

async function generateCodes(count = 1, days = 90) {
  const codes = []
  
  console.log(`开始生成 ${count} 个激活码，有效期 ${days} 天...\n`)
  
  for (let i = 0; i < count; i++) {
    // 生成25位激活码格式: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
    const code = generateActivationCode()

    // 计算激活码过期时间（生成时的有效期，不是激活后的有效期）
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    try {
      const activationCode = await db.activationCode.create({
        data: {
          code,
          expiresAt
        }
      })

      codes.push({
        code: activationCode.code,
        expiresAt: activationCode.expiresAt.toLocaleDateString('zh-CN'),
        createdAt: activationCode.createdAt.toLocaleDateString('zh-CN')
      })
      
      console.log(`✓ ${i + 1}. ${code} (过期时间: ${activationCode.expiresAt.toLocaleDateString('zh-CN')})`)
    } catch (error) {
      console.error(`✗ 生成失败: ${code}`, error)
    }
  }

  console.log(`\n共生成 ${codes.length} 个激活码`)
  console.log('\n激活码列表:')
  codes.forEach((item, index) => {
    console.log(`${index + 1}. ${item.code}`)
  })
  
  return codes
}

// 从命令行参数获取
const count = parseInt(process.argv[2]) || 1
const days = parseInt(process.argv[3]) || 90

generateCodes(count, days)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('生成激活码失败:', error)
    process.exit(1)
  })
  .finally(() => {
    db.$disconnect()
  })

