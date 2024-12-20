# 象棋分析工具待办事项

## 棋子识别优化

- [ ] 混合识别方案实现
  - [x] 使用 OpenCV 进行基础棋子识别
  - [ ] 对于低置信度的识别结果，集成 OCR/视觉大模型 API
  - [ ] 添加识别结果反馈（Toast 提示）
  - [ ] 优化识别准确率

## 走子模式支持

- [ ] 实现基础走子功能
  - [ ] 添加走子规则验证
  - [ ] 实现走子有效性判断
  - [ ] 支持悔棋功能
- [ ] 多模式支持
  - [ ] 支持纯手动走子模式（不启用引擎）
  - [ ] 支持引擎辅助提示模式
  - [ ] 支持复盘分析模式

## 棋局分享功能

- [ ] 实现棋局分享机制
  - [ ] 将当前棋局编码为 FEN 格式
  - [ ] 生成包含 FEN 的分享链接
  - [ ] 支持通过链接还原棋局
  - [ ] 支持查看历史走子记录

## 优化建议

- [x] 添加走子历史记录
- [ ] 优化用户界面，提供更清晰的模式切换
- [ ] 添加复盘时的评估值显示
- [ ] 优化分享链接的展示形式
