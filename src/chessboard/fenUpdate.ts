import { PieceType } from './types';

const pieceMap: { [key: string]: string } = {
  'k': '将', 'a': '士', 'b': '象', 'n': '马', 'r': '车', 'c': '炮', 'p': '卒',
  'K': '帅', 'A': '仕', 'B': '相', 'N': '马', 'R': '车', 'C': '炮', 'P': '兵'
};

export function updateFEN(fen: string, move: string): string {
  const [board, turn, ...rest] = fen.split(' ');
  const rows = board.split('/');
  const [from, to] = [move.slice(0, 2), move.slice(2, 4)];
  
  const [fromCol, fromRow] = from.split('').map(c => parseInt(c, 36) - 10);
  const [toCol, toRow] = to.split('').map(c => parseInt(c, 36) - 10);

  let piece = '';
  let newRows = rows.map((row, i) => {
    let newRow = '';
    let skip = 0;
    for (let j = 0; j < row.length; j++) {
      if (i === 9 - fromRow && skip === fromCol) {
        piece = row[j];
        skip++;
      } else if (i === 9 - toRow && skip === toCol) {
        newRow += piece;
        skip++;
      } else if (isNaN(parseInt(row[j]))) {
        newRow += row[j];
        skip++;
      } else {
        const num = parseInt(row[j]);
        newRow += '1'.repeat(num);
        skip += num;
      }
    }
    return newRow;
  });

  // Compress consecutive '1's into numbers
  newRows = newRows.map(row => {
    return row.replace(/1+/g, match => match.length.toString());
  });

  const newBoard = newRows.join('/');
  const newTurn = turn === 'w' ? 'b' : 'w';

  return [newBoard, newTurn, ...rest].join(' ');
}

export function decodeBestMove(move: string): string {
  const [from, to] = [move.slice(0, 2), move.slice(2, 4)];
  const [fromCol, fromRow] = from.split('');
  const [toCol, toRow] = to.split('');

  const colMap = 'abcdefghi';
  const fromColChinese = colMap[colMap.indexOf(fromCol)];
  const toColChinese = colMap[colMap.indexOf(toCol)];

  return `${fromColChinese}${fromRow} 到 ${toColChinese}${toRow}`;
}