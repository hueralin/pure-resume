/**
 * 生成激活码脚本
 * 
 * 使用方法：
 * pnpm generate-codes [count]
 * 
 * 示例：
 * pnpm generate-codes 10  # 生成10个激活码
 * pnpm generate-codes 5   # 生成5个激活码
 * 
 * 注意：激活码不会过期，只有用户激活时才开始计算订阅过期时间
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

async function generateCodes(count = 1) {
  const codes = []
  
  console.log(`开始生成 ${count} 个激活码...\n`)
  
  for (let i = 0; i < count; i++) {
    // 生成25位激活码格式: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
    const code = generateActivationCode()

    try {
      const activationCode = await db.activationCode.create({
        data: {
          code
        }
      })

      codes.push({
        code: activationCode.code,
        createdAt: activationCode.createdAt.toLocaleDateString('zh-CN')
      })
      
      console.log(`✓ ${i + 1}. ${code}`)
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

