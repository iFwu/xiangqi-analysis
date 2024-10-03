import cv2
import os
import matplotlib.pyplot as plt

# 用于显示图像的函数
def show_image(title, image, cmap=None):
    plt.figure()
    plt.title(title)
    if len(image.shape) == 2:  # 如果是灰度图像
        plt.imshow(image, cmap=cmap)
    else:  # 彩色图像
        plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.axis('off')
    plt.show()

def preprocess_template_image(template_image_path, cell_size):
    """
    对模板图像进行预处理：调整尺寸
    """
    template_image = cv2.imread(template_image_path, cv2.IMREAD_GRAYSCALE)
    resized_template = cv2.resize(template_image, cell_size)
    return resized_template

def preprocess_all_templates(template_dir='chess_templates', cell_size=(60, 60)):
    """
    预处理所有模板图像，调整尺寸并返回模板字典
    """
    templates = {}
    for filename in os.listdir(template_dir):
        if filename.endswith(".png"):
            piece_name = filename.split(".")[0]
            template_path = os.path.join(template_dir, filename)
            templates[piece_name] = preprocess_template_image(template_path, cell_size)
    return templates

def template_matching_for_piece(cell_image, templates, piece_color):
    """
    对单个棋盘格子进行模板匹配，返回匹配度最高的棋子类型，并显示相关调试信息。

    参数:
    - cell_image: 单个棋盘格子的图像
    - templates: 一个字典，包含棋子的模板图像，键为棋子名称，值为对应的模板图像
    - piece_color: 事先获取的棋子颜色，'red', 'black' 或 'unknown'

    返回:
    - 匹配到的棋子名称，如果没有匹配则返回 None
    """
    max_match_value = -1  # 初始化为负值，确保能够获取到最大匹配度
    matched_piece = None

    # 打印当前棋盘格子图像的尺寸
    cell_height, cell_width = cell_image.shape[:2]
    # print(f"当前棋盘格子图像大小: {cell_width} x {cell_height}")

    # 根据颜色过滤模板
    color_specific_templates = {}
    for piece_name, template in templates.items():
        if piece_color is True and piece_name.startswith('red_'):
            color_specific_templates[piece_name] = template
        elif piece_color is False and piece_name.startswith('black_'):
            color_specific_templates[piece_name] = template
        elif piece_color is None:
            color_specific_templates[piece_name] = template  # 如果颜色未知，使用所有模板

    # 如果没有对应颜色的模板，返回未知
    if not color_specific_templates:
        print("没有找到对应颜色的模板。")
        return None

    # 遍历所有过滤后的模板进行匹配
    for piece_name, template in color_specific_templates.items():
        # 调整模板的尺寸以匹配当前棋盘格子的大小
        resized_template = cv2.resize(template, (cell_width, cell_height))
        # print(f"模板 {piece_name} 调整后大小: {resized_template.shape[1]} x {resized_template.shape[0]}")

        # 使用模板匹配，采用相关性系数匹配方法
        result = cv2.matchTemplate(cell_image, resized_template, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, _ = cv2.minMaxLoc(result)

        # 打印当前模板的匹配值
        # print(f"与模板 {piece_name} 的匹配度: {max_val:.4f}")

        # 如果当前模板匹配的值更高，则更新匹配结果
        if max_val > max_match_value:
            max_match_value = max_val
            matched_piece = piece_name

    # 设置阈值，只有超过某个匹配度的结果才认为匹配成功
    matching_threshold = 0.3  # 可以根据需要调整此阈值
    if max_match_value > matching_threshold:
        # print(f"匹配到的棋子为: {matched_piece}，匹配度为: {max_match_value:.4f}")
        return matched_piece
    else:
        print("没有匹配到合适的棋子。")
        return None