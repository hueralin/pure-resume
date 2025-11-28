export function ResumeListSkeleton() {
  return (
    <div className="min-h-screen bg-black" suppressHydrationWarning>
      <div className="w-[1000px] mx-auto">
        {/* 标题区域 */}
        <div className="flex items-center justify-between my-6">
          <div className="flex flex-col justify-center h-[56px] text-4xl rounded">我的简历</div>
          <div className="flex gap-3">
            <div className="h-10 w-40 bg-[#27272A] rounded animate-pulse" />
          </div>
        </div>

        {/* 卡片网格 */}
        <div className="grid grid-cols-4 gap-[13px]">
          {/* 添加简历卡片骨架 */}
          <div className="w-[240px] h-[320px] bg-[#27272A] rounded border border-[#27272A] animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-dashed border-[#A1A1AA] rounded" />
          </div>
          
          {/* 简历卡片骨架 */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col justify-end w-[240px] h-[320px] bg-[#27272A] rounded border border-[#27272A] animate-pulse">
              
              {/* 底部信息区域 */}
              <div className="px-[16px] pb-[19px] space-y-[11px]">
                {/* 标题骨架 */}
                <div className="h-[23px] bg-[#09090B] rounded w-1/2 animate-pulse" />
                {/* 更新时间骨架 */}
                <div className="h-4 bg-[#09090B] rounded w-3/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

