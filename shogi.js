const WHITE = true;
const BLACK = false;

const PIECES = {
    PAWN: 'p',
    LANCE: 'l',
    KNIGHT: 'n',
    SILVER: 's',
    GOLD: 'g',
    ROOK: 'r',
    BISHOP: 'b',
    KING: 'k'
}


class Sfen {
    static toJSON(sfen){
        let [board, turn, hands] = sfen.split(' ');
        let next_turn;
        if(turn === 'b'){
            next_turn = BLACK;
        }else if(turn !== 'w'){
            next_turn = WHITE;
        }else{
            return null;
        }
        const w_p = ['p','l','n','s','g','b','r','k'];
        const b_p = ['P','L','N','S','G','B','R','K'];
        let new_board = this.board = [...Array(9)].map(x => Array(9).fill(null));
        let row = 0;
        let col = 0;
        let promoted = false;
        let kings = {
          w: null,
          b: null
        }
        for(let c of board){
            if(row >= 9 || col >= 9){
                return null;
            }
            let n = parseInt(c);
            if(c === '/'){
                col = 0;
                row += 1;
            }else if(c === '+'){
                promoted = true;
            }else if(w_p.indexOf(c) != -1){
                this.board[row][col] = {
                    promoted: promoted,
                    rank: c,
                    color: WHITE
                };
                if(c === 'k'){
                  kings.w = {row: row, col: col};
                }
                promoted = false;
                col += 1;
            }else if(b_p.indexOf(c) != -1){
                this.board[row][col] = {
                    promoted: promoted,
                    rank: c.toLowerCase(),
                    color: BLACK
                };
                if(c === 'K'){
                  kings.b = {row: row, col: col};
                }
                promoted = false;
                col += 1;
            }else if(n != NaN && 1 <= n && n <= 9){
                col += n;
            }else{
                //invalid
                return null;
            }
        }

        let white_hand = [];
        let black_hand = [];
        for(c of hands){
            if(w_p.indexOf(c) != -1){
                white_hand.append({
                    rank: c,
                    promoted: false,
                    color: WHITE
                });
            }else if(b_p.indexOf(c) != -1){
                black_hand.append({
                    rank: c.toLowerCase(),
                    promoted: false,
                    color: BLACK
                });
            }else{
                return null;
            }
        }

        return {
            board: new_board,
            kings: {
              true: kings.w,
              false: kings.b
            },
            turn: next_turn,
            white_hand: white_hand,
            black_hand: black_hand
        };
    }

}

class Shogi {
    const ATTACKS = [
     [64,  0,   0,   0,   0,   0,   0,   0,   130, 0,   0,   0,   0,   0,   0,   0,   64],
     [0,   64,  0,   0,   0,   0,   0,   0,   130, 0,   0,   0,   0,   0,   0,   64,  0],
     [0,   0,   64,  0,   0,   0,   0,   0,   130, 0,   0,   0,   0,   0,   64,  0,   0],
     [0,   0,   0,   64,  0,   0,   0,   0,   130, 0,   0,   0,   0,   64,  0,   0,   0],
     [0,   0,   0,   0,   64,  0,   0,   0,   130, 0,   0,   0,   64,  0,   0,   0,   0],
     [0,   0,   0,   0,   0,   64,  0,   0,   130, 0,   0,   64,  0,   0,   0,   0,   0],
     [0,   0,   0,   0,   0,   0,   64,  4,   130, 4,   64,  0,   0,   0,   0,   0,   0],
     [0,   0,   0,   0,   0,   0,   0,   120, 187, 120, 0,   0,   0,   0,   0,   0,   0],
     [128, 128, 128, 128, 128, 128, 128, 176, 0,   176, 128, 128, 128, 128, 128, 128, 128],
     [0,   0,   0,   0,   0,   0,   0,   104, 176, 104, 0,   0,   0,   0,   0,   0,   0],
     [0,   0,   0,   0,   0,   0,   64,  0,   128, 0,   64,  0,   0,   0,   0,   0,   0],
     [0,   0,   0,   0,   0,   64,  0,   0,   128, 0,   0,   64,  0,   0,   0,   0,   0],
     [0,   0,   0,   0,   64,  0,   0,   0,   128, 0,   0,   0,   64,  0,   0,   0,   0],
     [0,   0,   0,   64,  0,   0,   0,   0,   128, 0,   0,   0,   0,   64,  0,   0,   0],
     [0,   0,   64,  0,   0,   0,   0,   0,   128, 0,   0,   0,   0,   0,   64,  0,   0],
     [0,   64,  0,   0,   0,   0,   0,   0,   128, 0,   0,   0,   0,   0,   0,   64,  0],
     [64,  0,   0,   0,   0,   0,   0,   0,   128, 0,   0,   0,   0,   0,   0,   0,   64]
  ];
  const offsets = {
      'p':  0b1,
      'l':  0b10,
      'n':  0b100,
      's':  0b1000,
      'g':  0b10000,
      'k':  0b100000,
      'b':  0b1000000,
      'r':  0b10000000,
      'p+': 0b10000,
      'l+': 0b10000,
      'n+': 0b10000,
      's+': 0b10000,
      'r+': 0b10100000,
      'b+': 0b1100000
  }
  /*
  1: p
  2: l
  4: n
  8: s
  16: g
  32: k
  64: b
  128: r
  p+,l+,n+,s+: 16
  r+: 32 | 128
  b+: 32 | 64
  */
    constructor(sfen){
        if(sfen === undefined){
          sfen = "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";
        }
        this.board = null;
        this.history = [];
        this.initial = sfen;
        this.white_hand = null;
        this.black_hand = null;
        this.move_num = 1;
        load(sfen);
    }

    //clear board
    function clear(){
        this.board = [...Array(9)].map(x => Array(9).fill(null));
        this.history = [];
        this.kings[BLACK] = null;
        this.kings[WHITE] = null;
        this.move_num = 1;
    }

    //load a position
    function load(fen){
      let {board, kings, turn, white_hand, black_hand} = Sfen.toJSON(fen);
      this.board = board;
      this.turn = turn;
      this.kings = kings;
      this.white_hand = white_hand;
      this.black_hand = black_hand;

    }

    //reset board to initial configuration
    function reset(){
      load(this.initial);
      this.history = [];
      this.move_num = 1;
    }

    //true if game is over
    //through checkmate, stalemate, draw, repetition
    function game_over(){
      return in_checkmate() || in_stalemate() || in_draw();
    }

    //get piece at square
    function get(square){
      return {...this.board[square.row][square.col]};
    }

    //put piece at square
    //return true if succeeds
    function put(piece, square){
      if(square.row < 0 || square.row > 8 || square.col < 0 || square.col > 8){
        return false;
      }
      if(piece.type === PIECES.PAWN){
        for(let i = 0; i < 9; i++){
          let other = this.board[i][square.col];
          if(other != null && other.type === PIECES.PAWN){
            return false;
          }
        }
      } else if(piece.type === PIECES.KING){
        if(this.kings[piece.color]){
          return false;
        }else{
          this.kings[piece.color] = square;
        }
      }
      this.board[square.row][square.col] = piece;
      return true;
    }

    //remove and return the piece at square
    function remove(square){
      let p = get(square);
      this.board[square.row][square.col] = null;
      return {...p};
    }

    //the current side to move
    function turn(){
      return this.turn;
    }

    //list of moves this game
    function history(){
      return [...this.history];
    }

    function push(move) {
      this.history.push({
        move: move,
        kings: {...this.kings},
        turn: turn,
        move_number: this.move_number
      })
    }

    //undo the last turn
    function undo(){

    }

    //true if the side to move is in check
    function in_check(){

    }

    //true if the side to move is in checkmate
    function in_checkmate(){

    }

    function in_draw(){

    }

    function in_stalemate(){

    }

    //return true if move is successful, false otherwise
    function move(move){

    }

    //returns the board index of a square
    function squareToIndex(square){

    }

    function pieceToNum(piece){
        if(piece == null) return 0;
        let num = 0b100000;
        if(piece.color == WHITE){
            num |= 0b010000;
        }
        if(piece.promoted){
            num |= 0b001000;
        }
        let rankMap = {'p': 0,'l': 1,'n': 2,'s': 3,'g': 4,'k': 5,'b': 6,'r': 7};
        num |= rankMap[piece.rank];
        return num;
    }

    //true if a piece could promote in [square] for color
    function isPromoteSquare(color, square){
        let {row, col} = square;
        return color && (row == 6 || row == 7 || row == 8)
            || !color && (row == 0 || row == 1 || row == 2);
    }

    //true if a [piece] at square [cur] could move to [dest]
    function canMoveToSquare(piece, cur, dest){
        let other = getPieceAtSquare(dest);
        if(other != null && other.color == piece.color){
            return false; //friendly piece on square
        }
        let row = (dest.row - cur.row) * (piece.color==WHITE ? 1 : -1) + 9;
        let col = dest.col - cur.col + 9;
        let strOfPiece = piece.rank + (piece.promoted ? '+' : '');
        return ATTACKS[row][col] & offsets[strOfPiece] != 0;
    }

    //list of moves which the piece at square can make
    //a move is a square and an optional promotion and capture
    function moves(square){
        let piece = getPieceAtSquare(square);
        if(piece == null) return [];
        let possible = [];
        for(let i = 0; i < 9; i++){
            for(let j = 0; j < 9; j++){
                let dest = {row: i, col: j};
                if(canMoveToSquare(piece, square, dest)){
                    possible.append({
                        'square': dest,
                        'canPromote': canPromote(piece)
                            && isPromoteSquare(color, square)
                            || isPromoteSquare(color, dest),
                        'mustPromote': canPromote(piece)
                            && piece.rank == 'p'
                            && (piece.color == WHITE && dest.row = 8
                                || piece.color == BLACK && dest.row = 0),
                        'capture': getPieceAtSquare(dest)
                    });
                }
            }
        }
    }

    function move(piece, promote, from, to){
        if(this.turn != piece.color) return false;
        if(!canMoveToSquare(piece, from, to)) return false;
        this.turn = !this.turn;
        //capture piece
        //check promotion
        //update board
        putPieceAtSquare(null, from);
        putPieceAtSquare(piece, to);

    }

    //list of squares to which [piece] can be dropped
    function drops(piece){

    }
}

module.exports = {
  Shogi: Shogi,
  Sfen: Sfen,
  consts: {
    WHITE: WHITE,
    BLACK: BLACK,
    PIECES: PIECES
  }
}
