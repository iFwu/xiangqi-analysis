export class ChessEngine {
  private engineInstance: any;
  private engineReady: boolean = false;
  private currentResolve: ((value: string) => void) | null = null;

  async initEngine() {
    if (!this.engineReady) {
      try {
        // @ts-ignore
        const PikafishModule = await import('pikafish');
        const Pikafish = PikafishModule.default || PikafishModule;
        (window as any).Pikafish = Pikafish;
        this.engineInstance = await Pikafish({
          locateFile: (file: string) => {
            if (import.meta.env.DEV) {
              return file === 'pikafish.data'
                ? `${import.meta.env.BASE_URL}wasm/data/${file}`
                : `${import.meta.env.BASE_URL}wasm/${file}`;
            }
            return file === 'pikafish.data'
              ? `https://xiangqiai.com/wasm/data/${file}`
              : `https://xiangqiai.com/wasm/single/${file}`;
          },
        });
        await this.engineInstance.ready;

        this.engineInstance.read_stdout = (output: string) => {
          // 只输出关键信息
          if (output.includes('id name') || output.includes('bestmove')) {
            console.log('[Engine] >', output);
          } else if (
            output.includes('info depth') &&
            output.includes('score')
          ) {
            // 只输出最终深度的评分
            const depthMatch = output.match(/depth\s(\d+)/);
            const scoreMatch = output.match(/score\s(cp|mate)\s(-?\d+)/);
            if (depthMatch && scoreMatch && depthMatch[1] === '14') {
              console.log(
                `[Engine] 深度 ${depthMatch[1]}, 评分 ${scoreMatch[1]} ${scoreMatch[2]}`
              );
            }
          }

          const bestMoveMatch = output.match(/bestmove\s(\S+)/);
          if (bestMoveMatch && this.currentResolve) {
            this.currentResolve(bestMoveMatch[1]);
            this.currentResolve = null;
          }
        };
        this.engineInstance.send_command('uci');
        console.log('[Engine] 引擎初始化完成');
        this.engineReady = true;
      } catch (error) {
        console.error('[Engine] 初始化失败:', error);
        throw error;
      }
    }
  }

  async getBestMove(fen: string, depth: number = 14): Promise<string> {
    if (!this.engineReady) {
      throw new Error('Engine is not ready');
    }

    console.log('[Engine] 开始分析:', { fen, depth });
    return new Promise((resolve, reject) => {
      try {
        this.currentResolve = (value: string) => {
          if (value === '(none)') {
            const fenParts = fen.split(' ');
            const sideToMove = fenParts[1];
            const result = sideToMove === 'b' ? 'red_wins' : 'black_wins';
            console.log('[Engine] 分析结束:', result);
            resolve(result);
          } else {
            console.log('[Engine] 分析结束:', value);
            resolve(value);
          }
        };
        this.engineInstance.send_command(`position fen ${fen}`);
        this.engineInstance.send_command(`go depth ${depth}`);
        setTimeout(() => {
          if (this.currentResolve) {
            console.error('[Engine] 分析超时');
            reject(new Error('Engine timeout'));
            this.currentResolve = null;
          }
        }, 5000);
      } catch (err) {
        console.error('[Engine] 分析错误:', err);
        reject(err);
      }
    });
  }
}
