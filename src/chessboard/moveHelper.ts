export function updateFEN(fen: string, move: string): string {
  // 解析 FEN 字符串
  const [ board_fen, side_to_move ] = fen.trim().split(/\s+/);
  const fen_ranks = board_fen.split('/');

  if (fen_ranks.length !== 10) {
    throw new Error("无效的 FEN：行数不正确");
  }

  // 构建棋盘数组
  const board: (string | null)[][] = [];
  for (const rank_str of fen_ranks) {
    const row: (string | null)[] = [];
    for (const c of rank_str) {
      if (c >= '1' && c <= '9') {
        const empty_squares = parseInt(c, 10);
        for (let j = 0; j < empty_squares; j++) {
          row.push(null);
        }
      } else {
        row.push(c);
      }
    }
    if (row.length !== 9) {
      throw new Error("无效的 FEN：某一行的列数不正确");
    }
    board.push(row);
  }

  // 解析走棋
  if (move.length !== 4) {
    throw new Error("无效的走棋格式");
  }

  const files = 'abcdefghi';
  const from_file_char = move.charAt(0);
  const from_rank_char = move.charAt(1);
  const to_file_char = move.charAt(2);
  const to_rank_char = move.charAt(3);

  const from_file = files.indexOf(from_file_char);
  const from_rank = 9 - parseInt(from_rank_char, 10);
  const to_file = files.indexOf(to_file_char);
  const to_rank = 9 - parseInt(to_rank_char, 10);

  if (from_file === -1 || to_file === -1 || isNaN(from_rank) || isNaN(to_rank)) {
    throw new Error("无效的走棋格式");
  }

  // 获取要移动的棋子
  const piece = board[ from_rank ][ from_file ];
  if (!piece) {
    console.error('fen:', fen);
    console.error('move:', move);
    throw new Error("起始位置没有棋子");
  }

  // 执行移动
  board[ to_rank ][ to_file ] = piece;
  board[ from_rank ][ from_file ] = null;

  // 切换行棋方
  const new_side_to_move = side_to_move === 'w' ? 'b' : 'w';

  // 生成新的 FEN 字符串
  const fen_ranks_new = board.map(rank => {
    let rank_str = '';
    let empty_count = 0;
    for (const square of rank) {
      if (square) {
        if (empty_count > 0) {
          rank_str += empty_count.toString();
          empty_count = 0;
        }
        rank_str += square;
      } else {
        empty_count += 1;
      }
    }
    if (empty_count > 0) {
      rank_str += empty_count.toString();
    }
    return rank_str;
  });

  const board_fen_new = fen_ranks_new.join('/');
  const new_fen = `${board_fen_new} ${new_side_to_move} - - 0 1`;

  return new_fen;
}

export function moveToChineseNotation(fen: string, move: string): string {
  const pieceSymbols: { [key: string]: string } = {
      'K': '帅', 'A': '仕', 'B': '相', 'N': '马', 'R': '车', 'C': '炮', 'P': '兵',
      'k': '将', 'a': '士', 'b': '象', 'n': '马', 'r': '车', 'c': '炮', 'p': '卒',
  };

  const files = 'abcdefghi';
  const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const chineseFilesRed = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
  const chineseFilesBlack = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

  // 解析 FEN，构建棋盘
  const [board_fen] = fen.trim().split(/\s+/);
  const fen_ranks = board_fen.split('/');
  const board: (string | null)[][] = [];

  for (const rank_str of fen_ranks) {
      const row: (string | null)[] = [];
      for (const c of rank_str) {
          if (c >= '1' && c <= '9') {
              const empty_squares = parseInt(c, 10);
              for (let j = 0; j < empty_squares; j++) row.push(null);
          } else {
              row.push(c);
          }
      }
      board.push(row);
  }

  // 解析 UCCI 格式的走棋
  const from_file = files.indexOf(move.charAt(0));
  const from_rank = 9 - parseInt(move.charAt(1), 10);
  const to_file = files.indexOf(move.charAt(2));
  const to_rank = 9 - parseInt(move.charAt(3), 10);

  // 获取要移动的棋子
  const piece = board[from_rank][from_file];
  if (!piece) {
    console.error('fen:', fen);
    console.error('move:', move);
    throw new Error("起始位置没有棋子");
  }

  const isRed = piece >= 'A' && piece <= 'Z';
  const pieceName = pieceSymbols[piece];
  const chineseFiles = isRed ? chineseFilesRed : chineseFilesBlack;

  // 获取中文列表示
  const from_file_chinese = chineseFiles[from_file];
  const to_file_chinese = chineseFiles[to_file];

  // 判断移动方向和步数
  let action = '';
  let actionNumber = '';

  // 处理马、象、士，不使用“平”，而是显示其移动的目标纵线
  if (pieceName === '马' || pieceName === '象' || pieceName === '仕' || pieceName === '士') {
      action = from_rank > to_rank ? '进' : '退';
      actionNumber = to_file_chinese;
  } else if (from_file === to_file) {
      // 直走，进或退
      if (isRed) {
          action = from_rank > to_rank ? '进' : '退'; // 红方的进是向下走
      } else {
          action = from_rank > to_rank ? '退' : '进'; // 黑方的进是向上走
      }
      actionNumber = chineseNumbers[Math.abs(from_rank - to_rank)];
  } else {
      // 横走，平
      action = '平';
      actionNumber = to_file_chinese;
  }

  // 构建中文走棋表示
  return `${pieceName}${from_file_chinese}${action}${actionNumber}`;
}