def generate_fen_from_pieces(piece_layout):
    """
    将棋子的布局转换为 FEN 表示法
    """
    fen_rows = []
    for row in piece_layout:
        empty_count = 0
        fen_row = ""
        for piece in row:
            if piece == 'none':
                empty_count += 1
            else:
                if empty_count > 0:
                    fen_row += str(empty_count)
                    empty_count = 0
                piece_abbr = get_piece_abbreviation(piece)
                fen_row += piece_abbr
        if empty_count > 0:
            fen_row += str(empty_count)
        fen_rows.append(fen_row)
    fen_string = '/'.join(fen_rows)
    return fen_string

def get_piece_abbreviation(piece_name):
    """
    获取棋子的简写表示
    """
    abbreviations = {
        'red_king': 'K',
        'red_guard': 'A',
        'red_bishop': 'B',
        'red_knight': 'N',
        'red_rook': 'R',
        'red_cannon': 'C',
        'red_pawn': 'P',
        'black_king': 'k',
        'black_guard': 'a',
        'black_bishop': 'b',
        'black_knight': 'n',
        'black_rook': 'r',
        'black_cannon': 'c',
        'black_pawn': 'p',
    }
    return abbreviations.get(piece_name, '?')