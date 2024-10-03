import cv2
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans

def detect_and_extract_chessboard(image_path, expand_ratio_w=0.05, expand_ratio_h=0.05, show_grid_cells=False):
    """
    检测象棋棋盘区域，并对棋盘按网格进行均匀分割，返回所有棋盘格子图像。
    
    参数:
    - image_path: 棋盘图像路径
    - expand_ratio_w: 水平方向上的扩展比例，默认值为0.055
    - expand_ratio_h: 垂直方向上的扩展比例，默认值为0.055
    - show_grid_cells: 是否显示每个分割后的棋盘格子图像，默认不显示
    
    返回:
    - grid_cells: 包含所有分割后棋盘格子图像的列表
    """

    # 步骤 1：图像预处理和边缘检测
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 30, 150)

    # 形态学操作：膨胀与腐蚀
    kernel = np.ones((3, 3), np.uint8)
    dilated_edges = cv2.dilate(edges, kernel, iterations=3)
    final_edges = cv2.erode(dilated_edges, kernel, iterations=1)

    # 步骤 2：检测所有轮廓并提取最大轮廓区域
    contours, _ = cv2.findContours(final_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        print("未检测到任何轮廓。")
        return None
    max_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(max_contour)
    cropped_region = img[y:y+h, x:x+w]

    # 步骤 3：霍夫直线变换检测棋盘线条并使用 KMeans 聚类
    grid_cells = segment_chessboard(cropped_region, expand_ratio_w, expand_ratio_h, show_grid_cells)

    # 检查棋盘区域是否被有效分割
    if not grid_cells:
        print("无法分割棋盘区域，可能出错。")
        return None

    return grid_cells


def segment_chessboard(cropped_region, expand_ratio_w=0.06, expand_ratio_h=0.06, show_grid_cells=False):
    """
    对裁剪后的棋盘区域进行霍夫变换和 KMeans 聚类，按网格分割棋盘。
    返回棋盘格子图像的列表。
    """

    # 步骤 1：对棋盘区域进行预处理
    gray_cropped = cv2.cvtColor(cropped_region, cv2.COLOR_BGR2GRAY)
    blur_cropped = cv2.GaussianBlur(gray_cropped, (5, 5), 0)
    edges_cropped = cv2.Canny(blur_cropped, 50, 150)

    # 检测棋盘线条
    lines = cv2.HoughLinesP(edges_cropped, 1, np.pi / 180, threshold=80, minLineLength=100, maxLineGap=50)
    if lines is None:
        print("无法检测到棋盘线条。")
        return []

    horizontal_lines, vertical_lines = [], []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
        if abs(angle) < 10:
            horizontal_lines.append([x1, y1, x2, y2])
        elif abs(angle) > 80:
            vertical_lines.append([x1, y1, x2, y2])

    # 打印水平线和垂直线的数量以确认正确性
    # print(f"检测到的水平线数量: {len(horizontal_lines)}")
    # print(f"检测到的垂直线数量: {len(vertical_lines)}")

    # 检查线条数量是否足够用于 KMeans 聚类
    if len(horizontal_lines) < 10 or len(vertical_lines) < 9:
        print("线条不足，无法进行 KMeans 聚类。")
        return []

    # KMeans 聚类：检测棋盘的行和列
    horizontal_y_positions = [line[1] for line in horizontal_lines] + [line[3] for line in horizontal_lines]
    vertical_x_positions = [line[0] for line in vertical_lines] + [line[2] for line in vertical_lines]

    # 执行 KMeans 聚类
    kmeans_h = KMeans(n_clusters=10, random_state=0).fit(np.array(horizontal_y_positions).reshape(-1, 1))
    kmeans_v = KMeans(n_clusters=9, random_state=0).fit(np.array(vertical_x_positions).reshape(-1, 1))

    # 聚类中心排序
    horizontal_cluster_centers = np.sort(kmeans_h.cluster_centers_, axis=0)
    vertical_cluster_centers = np.sort(kmeans_v.cluster_centers_, axis=0)

    # 获取最小和最大的 x 和 y 值
    min_y, max_y = int(horizontal_cluster_centers[0][0]), int(horizontal_cluster_centers[-1][0])
    min_x, max_x = int(vertical_cluster_centers[0][0]), int(vertical_cluster_centers[-1][0])

    # 提取棋盘区域
    chessboard_region = cropped_region[min_y:max_y, min_x:max_x]

    # 检查扩展的棋盘区域是否有效
    if chessboard_region is None or chessboard_region.size == 0:
        print("棋盘区域无效，可能出错。")
        return []

    # 步骤 2：扩展棋盘区域
    region_h, region_w = chessboard_region.shape[:2]
    expand_w = region_w * expand_ratio_w
    expand_h = region_h * expand_ratio_h

    new_x = max(0, min_x - int(expand_w))
    new_y = max(0, min_y - int(expand_h))
    new_w = min(cropped_region.shape[1] - new_x, region_w + 2 * int(expand_w))
    new_h = min(cropped_region.shape[0] - new_y, region_h + 2 * int(expand_h))

    expanded_chessboard_region = cropped_region[new_y:new_y+new_h, new_x:new_x+new_w]

    if expanded_chessboard_region is None or expanded_chessboard_region.size == 0:
        print("扩展的棋盘区域无效，可能出错。")
        return []

    # 步骤 3：按网格分割棋盘格子
    rows, cols = 10, 9
    grid_height = new_h // rows
    grid_width = new_w // cols

    grid_cells = []

    for i in range(rows):
        for j in range(cols):
            y1, y2 = i * grid_height, (i + 1) * grid_height
            x1, x2 = j * grid_width, (j + 1) * grid_width
            grid_cell = expanded_chessboard_region[y1:y2, x1:x2]
            grid_cells.append(grid_cell)

            # 可视化每个提取出的格子（如果需要）
            if show_grid_cells:
                plt.figure(figsize=(3, 3))
                plt.imshow(cv2.cvtColor(grid_cell, cv2.COLOR_BGR2RGB))
                plt.title(f'Grid [{i}, {j}]')
                plt.axis('off')
                plt.show()

    # print(f"分割出的棋盘格子数量: {len(grid_cells)}")
    return grid_cells