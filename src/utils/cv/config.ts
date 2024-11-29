export const ChessboardConfig = {
  // 棋盘检测参数
  EXPAND_RATIO_W: 0.055, // 棋盘区域水平扩展比例
  EXPAND_RATIO_H: 0.06, // 棋盘区域垂直扩展比例（基础值）
  BOTTOM_OFFSET_RATIO: 0.013, // 底部偏移比例（基础值）

  // 棋盘比例参数
  STANDARD_BOARD_RATIO: 1.08, // 标准棋盘高宽比
  RATIO_ADJUSTMENT_FACTORS: {
    EXPAND_H: -0.008, // 垂直扩展的固定调整因子（减小过高的扩展）
    BOTTOM: 0.004, // 底部偏移的固定调整因子（增加偏移）
  },

  // 格子高度渐变参数
  HEIGHT_VARIATION_RATIO: 0.0175, // 高度变化比例（相对于基础高度）

  // 图像处理参数
  GAUSSIAN_BLUR_SIZE: 5,
  CANNY_THRESHOLD1: 50,
  CANNY_THRESHOLD2: 150,
  HOUGH_THRESHOLD: 80,
  MIN_LINE_LENGTH: 100,
  MAX_LINE_GAP: 50,

  // 角度阈值
  HORIZONTAL_ANGLE_THRESHOLD: 10, // 水平线角度阈值（度）
  VERTICAL_ANGLE_THRESHOLD: 80, // 垂直线角度阈值（度）
} as const;
