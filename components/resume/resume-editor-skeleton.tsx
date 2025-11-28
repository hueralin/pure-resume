export function ResumeEditorSkeleton() {
  return (
    <div className="h-screen bg-black overflow-auto" suppressHydrationWarning>
      {/* Header - 标题和保存按钮 */}
      <div className="w-[1200px] mx-auto my-6 flex justify-between items-center">
        <div className="flex flex-col justify-center h-[56px] text-4xl rounded">编辑简历</div>
        <div className="flex gap-2">
          <div className="h-10 w-40 bg-[#27272A] rounded animate-pulse" />
        </div>
      </div>

      {/* 整体容器 */}
      <div className="flex w-[1200px] mx-auto" style={{ height: 'calc(100vh - 150px)' }}>
        {/* 左栏：简历名称和模块列表 */}
        <div className="w-[250px] flex flex-col h-full pt-4 pb-4 pl-2 pr-2 bg-[#27272A] rounded-l-[4px]">
          {/* 简历名称 */}
          <div className="mb-6 flex-shrink-0 px-2">
            <div className="h-3 w-16 bg-[#09090B] rounded mb-2 animate-pulse" />
            <div className="h-10 w-full bg-[#09090B] rounded animate-pulse" />
          </div>

          {/* 简历模块 */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-shrink-0 px-2 mb-2">
              <div className="h-3 w-16 bg-[#09090B] rounded mb-2 animate-pulse" />
              <div className="h-10 w-full bg-[#09090B] rounded mb-2 animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-2 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-[#09090B] rounded border border-[#000000] animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* 中栏：模块编辑表单 */}
        <div className="w-[340px] flex flex-col h-full pt-9 pb-4 bg-[#27272A] rounded-r-[4px]">
          <div className="flex flex-col h-full px-2">
            <div className="flex-shrink-0 mb-4">
              <div className="bg-[#09090B] rounded-[4px] px-2 py-2 border-b border-[#27272A]">
                <div className="h-6 w-20 bg-[#27272A] rounded animate-pulse" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="bg-[#09090B] rounded-b-[4px] px-2 py-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-3 w-16 bg-[#27272A] rounded mb-2 animate-pulse" />
                    <div className="h-10 w-full bg-[#27272A] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右栏：预览区 */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-outside bg-black rounded ml-4">
          <div className="flex justify-center items-start">
            <div className="border shadow-lg bg-white" style={{ width: '595px', minHeight: '842px' }}>
              <div className="p-10 space-y-6">
                {/* 头部区域 */}
                <div className="flex gap-8 mb-5">
                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="h-[1px] bg-gray-200 mb-5" />
                
                {/* 内容区域 */}
                <div className="flex gap-[47px]">
                  <div className="flex-1 space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i}>
                        <div className="h-4 w-20 bg-gray-200 rounded mb-4 animate-pulse" />
                        <div className="space-y-3">
                          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

