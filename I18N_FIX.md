# i18n 修复和语言支持更新

## 问题描述
之前 i18n 系统只在设置页面生效，其他页面仍然显示硬编码的英文文本。

## 修复内容

### 1. 扩展语言支持
- 添加了中文（zh）和日文（ja）翻译
- 现在支持 4 种语言：English, Bahasa Indonesia, 中文, 日本語

### 2. 更新的文件

#### `src/lib/i18n.tsx`
- 扩展 `Language` 类型：`'en' | 'id' | 'zh' | 'ja'`
- 添加完整的中文翻译（80+ 个翻译键）
- 添加完整的日文翻译（80+ 个翻译键）
- 修复语言检测逻辑，支持所有 4 种语言

#### `src/pages/Home.tsx`
- 更新配额指示器：`{t('quota.remaining', { count: quota.remaining })}`
- 更新拖放区域文本：使用 `t('hero.dropzone')`
- 更新选项标签：`{t('options.cutBorders')}`, `{t('options.anilistId')}`
- 更新搜索按钮：`{t('options.search')}`, `{t('options.searching')}`
- 更新结果卡片：`{t('results.episode')}`, `{t('results.saveWatchlist')}`
- 更新缓存标签：`{t('results.fromCache')}`
- 更新最近搜索标签：`{t('hero.recentSearches')}`
- 更新页脚：`{t('about.credits')}`, `{t('about.notAffiliated')}`

#### `src/pages/Settings.tsx`
- 更新语言选择器：4 个语言按钮（English, Bahasa Indonesia, 中文, 日本語）
- 使用网格布局：`grid-cols-2 md:grid-cols-4`
- 更新数据管理按钮：`{t('settings.export')}`, `{t('settings.import')}`
- 更新清除数据按钮：`{t('settings.clearData')}`, `{t('settings.clearConfirm')}`
- 更新确认对话框：`{t('misc.cancel')}`, `{t('misc.confirm')}`

#### `src/pages/History.tsx`
- 更新条目计数：`{searches.length} {t('misc.entries') || 'ENTRIES'}`
- 更新删除按钮：`{t('history.deleteAll')}`
- 更新确认对话框：`{t('history.confirmDelete')}`, `{t('misc.cancel')}`, `{t('misc.delete')}`

#### `src/pages/Watchlist.tsx`
- 更新筛选按钮：使用 `t('watchlist.filterAll')` 和 `t('watchlist.${opt.value}')`

### 3. 翻译覆盖范围

所有主要 UI 元素现在都使用 `t()` 函数：
- ✅ 导航菜单
- ✅ 英雄区域标题和副标题
- ✅ 拖放区域文本
- ✅ 搜索选项和按钮
- ✅ 结果卡片（相似度、集数、时间、操作按钮）
- ✅ 低置信度警告
- ✅ 配额指示器
- ✅ 历史记录页面
- ✅ 观看列表页面（状态筛选）
- ✅ 收藏页面
- ✅ 统计页面
- ✅ 设置页面（语言选择、数据管理）
- ✅ 关于页面
- ✅ 页脚文本

### 4. 语言切换

用户可以在设置页面选择语言：
- **English** - 默认语言
- **Bahasa Indonesia** - 印尼语
- **中文** - 简体中文
- **日本語** - 日语

选择后会立即保存到 localStorage，刷新页面后保持选择。

### 5. 测试建议

1. 切换到每种语言，验证所有页面文本是否正确翻译
2. 测试语言切换后刷新页面，确认语言保持
3. 检查中文和日文字符是否正确显示
4. 验证所有按钮、标签、提示文本都已翻译
5. 测试搜索功能在不同语言下的表现

### 6. 未来改进

- 添加更多语言（韩语、西班牙语等）
- 为缺失的翻译键添加 fallback 值
- 考虑添加语言自动检测（基于浏览器语言）
- 添加 RTL 语言支持（阿拉伯语、希伯来语）

## 构建状态
✅ 构建成功，无错误
