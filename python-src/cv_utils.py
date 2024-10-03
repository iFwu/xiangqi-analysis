import cv2
import numpy as np

def apply_canny_edge_detection(image, low_threshold=50, high_threshold=150, blur_kernel_size=(5, 5)):
    """
    对图像进行 Canny 边缘检测，支持高斯模糊处理，并在低分辨率图像中通过锐化增强边缘。
    """
    # 将图像转换为灰度
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 高斯模糊
    blurred = cv2.GaussianBlur(gray, blur_kernel_size, 0)
    
    # 图像锐化
    sharpened = sharpen_image(blurred)
    
    # 应用 Canny 边缘检测
    edges = cv2.Canny(sharpened, low_threshold, high_threshold)
    
    return edges

def sharpen_image(image):
    """
    对图像进行锐化处理，以提高边缘清晰度。
    """
    # 定义锐化核
    kernel = np.array([[0, -1, 0],
                       [-1, 5, -1],
                       [0, -1, 0]])
    
    # 使用滤波函数应用锐化
    sharpened = cv2.filter2D(image, -1, kernel)
    
    return sharpened

def find_largest_contour(image):
    """
    从图像中找到面积最大的轮廓，并返回其边界框。
    """
    contours, _ = cv2.findContours(image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    max_contour = max(contours, key=cv2.contourArea)
    return cv2.boundingRect(max_contour)

def extract_largest_contour_region(mask_image):
    """
    在给定的掩码图像中找到最符合条件的连通区域，并裁剪出该部分。
    条件：
    1. 连通区域应尽量接近正方形，过滤掉长宽比差异过大的区域。
    2. 连通区域面积应占整个图像面积的 50% 以上。
    3. 应用形态学闭操作来连接分散的边缘，但返回裁剪时使用原始图像。
    """
    # 保留原始掩码图像，以便在裁剪时使用
    original_mask = mask_image.copy()

    # 形态学闭操作：填补小孔，连接断开的边缘
    kernel = np.ones((3, 3), np.uint8)
    mask_image = cv2.morphologyEx(mask_image, cv2.MORPH_CLOSE, kernel, iterations=2)

    # 查找所有轮廓
    contours, _ = cv2.findContours(mask_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if len(contours) == 0:
        print("未找到任何轮廓。")
        return original_mask  # 如果没有找到轮廓，返回原图像

    # 获取原图像面积
    img_h, img_w = original_mask.shape[:2]
    img_area = img_w * img_h

    # 筛选符合正方形条件并且面积占比足够的连通区域
    valid_contours = []

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        
        # 计算宽高比，保留接近正方形的区域（宽高比在 0.9 到 1.1 之间，严格过滤）
        aspect_ratio = w / h
        if 0.9 <= aspect_ratio <= 1.1:
            # 计算连通区域的面积
            contour_area = w * h
            area_ratio = contour_area / img_area
            
            # 面积过滤：连通区域面积必须占整个图像的 50% 以上
            if area_ratio >= 0.5:
                valid_contours.append((contour, contour_area, x, y, w, h))

    if len(valid_contours) == 0:
        print("没有找到符合条件的轮廓。")
        return original_mask  # 如果没有符合条件的轮廓，返回原图像

    # 选择最大面积的轮廓
    valid_contours.sort(key=lambda x: x[1], reverse=True)
    best_contour = valid_contours[0]
    x, y, w, h = best_contour[2], best_contour[3], best_contour[4], best_contour[5]

    # 使用原始掩码图像进行裁剪，返回结果
    cropped_image = original_mask[y:y+h, x:x+w]
    
    return cropped_image

def resize_image(image, width=None, height=None):
    """
    重新调整图像大小，同时保持宽高比。
    """
    h, w = image.shape[:2]
    if width is None and height is None:
        return image
    if width is None:
        aspect_ratio = height / float(h)
        dim = (int(w * aspect_ratio), height)
    else:
        aspect_ratio = width / float(w)
        dim = (width, int(h * aspect_ratio))
    return cv2.resize(image, dim, interpolation=cv2.INTER_AREA)