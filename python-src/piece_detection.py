import cv2
import matplotlib.pyplot as plt
import numpy as np

def extract_largest_contour_region(mask_image):
    """
    在给定的掩码图像中找到最符合条件的连通区域,并裁剪出该部分。
    条件:
    1. 连通区域应尽量接近正方形,过滤掉长宽比差异过大的区域。
    2. 连通区域面积应占整个图像面积的 50% 以上。
    3. 应用形态学闭操作来连接分散的边缘,但返回裁剪时使用原始图像。
    """
    # 保留原始掩码图像,以便在裁剪时使用
    original_mask = mask_image.copy()

    print(f"提取最大轮廓区域,输入图像尺寸: {mask_image.shape[1]}x{mask_image.shape[0]}")

    # 形态学闭操作:填补小孔,连接断开的边缘
    kernel = np.ones((3, 3), np.uint8)
    mask_image = cv2.morphologyEx(mask_image, cv2.MORPH_CLOSE, kernel, iterations=2)

    # 添加以下代码来输出形态学操作后的图像
    morph_image = cv2.cvtColor(mask_image, cv2.COLOR_GRAY2BGR)
    show_image("形态学操作后的图像", morph_image)

    # 查找所有轮廓
    contours, _ = cv2.findContours(mask_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    print(f"找到 {len(contours)} 个轮廓")

    if len(contours) == 0:
        print("未找到任何轮廓。")
        return original_mask  # 如果没有找到轮廓,返回原图像

    # 获取原图像面积
    img_h, img_w = original_mask.shape[:2]
    img_area = img_w * img_h

    # 筛选符合正方形条件并且面积占比足够的连通区域
    valid_contours = []

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        
        # 计算宽高比,保留接近正方形的区域(宽高比在 0.9 到 1.1 之间,严格过滤)
        aspect_ratio = w / h
        if 0.9 <= aspect_ratio <= 1.1:
            # 计算连通区域的面积
            contour_area = w * h
            area_ratio = contour_area / img_area
            
            # 面积过滤:连通区域面积必须占整个图像的 50% 以上
            if area_ratio >= 0.5:
                valid_contours.append((contour, contour_area, x, y, w, h))

    if len(valid_contours) == 0:
        print("没有找到符合条件的轮廓。")
        return original_mask  # 如果没有符合条件的轮廓,返回原图像

    # 选择最大面积的轮廓
    valid_contours.sort(key=lambda x: x[1], reverse=True)
    best_contour = valid_contours[0]
    x, y, w, h = best_contour[2], best_contour[3], best_contour[4], best_contour[5]

    print(f"最大轮廓区域: x={x}, y={y}, width={w}, height={h}")

    # 使用原始掩码图像进行裁剪,返回结果
    cropped_image = original_mask[y:y+h, x:x+w]
    print(f"裁剪后的图像尺寸: {cropped_image.shape[1]}x{cropped_image.shape[0]}")
    
    return cropped_image

# 用于显示图像的函数
def show_image(title, image, cmap=None):
    print(f"{title}:")
    plt.figure()
    if len(image.shape) == 2:  # 如果是灰度图像
        plt.imshow(image, cmap=cmap)
    else:  # 彩色图像
        plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.axis('off')
    plt.show()

def detect_piece_in_cell(cell, contrast_threshold=30):
    """
    检测单个格子是否有棋子,基于对比度阈值判断。
    """
    gray_cell = cv2.cvtColor(cell, cv2.COLOR_BGR2GRAY)
    contrast = np.std(gray_cell)
    print(f"检测棋子对比度: {contrast}")
    return contrast > contrast_threshold

def detect_piece_color(cell_image, index):
    """
    检测棋盘格子中的棋子颜色。返回 True 表示红色棋子,False 表示黑色棋子。
    """
    print(f"开始检测格子 {index} 的棋子颜色")
    hsv_image = cv2.cvtColor(cell_image, cv2.COLOR_BGR2HSV)
    print("HSV 转换完成")
    
    # 显示原始图像
    show_image(f"Original Cell Image (格子 {index})", cell_image)
    
    red_lower1 = np.array([0, 120, 120])
    red_upper1 = np.array([10, 255, 255])
    red_lower2 = np.array([160, 120, 120])
    red_upper2 = np.array([179, 255, 255])

    black_lower = np.array([0, 0, 0])
    black_upper = np.array([180, 255, 80])

    mask_red1 = cv2.inRange(hsv_image, red_lower1, red_upper1)
    mask_red2 = cv2.inRange(hsv_image, red_lower2, red_upper2)
    mask_red = cv2.bitwise_or(mask_red1, mask_red2)
    print("红色掩码创建完成")
    mask_black = cv2.inRange(hsv_image, black_lower, black_upper)
    print("黑色掩码创建完成")

    # 显示红色和黑色掩码
    show_image(f"Red Mask (格子 {index})", mask_red, cmap='gray')
    show_image(f"Black Mask (格子 {index})", mask_black, cmap='gray')

    # 显示掩码后的原始图像
    masked_red = cv2.bitwise_and(cell_image, cell_image, mask=mask_red)
    masked_black = cv2.bitwise_and(cell_image, cell_image, mask=mask_black)
    show_image(f"Masked Red Image (格子 {index})", masked_red)
    show_image(f"Masked Black Image (格子 {index})", masked_black)

    total_pixels = cell_image.shape[0] * cell_image.shape[1]
    red_ratio = np.count_nonzero(mask_red) / total_pixels
    black_ratio = np.count_nonzero(mask_black) / total_pixels

    print(f"Red ratio: {red_ratio}, Black ratio: {black_ratio}")

    if red_ratio > 0.05:
        return True  # 红色棋子
    elif black_ratio > 0.05:
        return False  # 黑色棋子
    return None

def process_piece(cell_image, piece_color, index):
    """
    处理单个棋盘格图像并返回裁剪后的连通部分。
    """
    print(f"开始处理格子 {index} 的棋子")
    if piece_color is True:
        mask = extract_red_piece_mask(cell_image)
    elif piece_color is False:
        mask = extract_black_piece_mask(cell_image)
    else:
        return cell_image

    return extract_largest_contour_region(mask)

def extract_red_piece_mask(cell_image):
    hsv_image = cv2.cvtColor(cell_image, cv2.COLOR_BGR2HSV)
    red_lower1 = np.array([0, 100, 100])
    red_upper1 = np.array([10, 255, 255])
    red_lower2 = np.array([160, 100, 100])
    red_upper2 = np.array([179, 255, 255])
    mask_red1 = cv2.inRange(hsv_image, red_lower1, red_upper1)
    mask_red2 = cv2.inRange(hsv_image, red_lower2, red_upper2)
    mask_red = cv2.bitwise_or(mask_red1, mask_red2)
    return mask_red

def extract_black_piece_mask(cell_image):
    hsv_image = cv2.cvtColor(cell_image, cv2.COLOR_BGR2HSV)
    black_lower = np.array([0, 0, 0])
    black_upper = np.array([180, 255, 100])
    mask_black = cv2.inRange(hsv_image, black_lower, black_upper)
    return cv2.inRange(hsv_image, black_lower, black_upper)