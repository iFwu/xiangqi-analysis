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
            return file === 'pikafish.data'
              ? `/wasm/data/${file}`
              : `/wasm/${file}`;
          },
        });
        await this.engineInstance.ready;

        this.engineInstance.read_stdout = (output: string) => {
          console.log('> ', output);
          const bestMoveMatch = output.match(/bestmove\s(\S+)/);
          if (bestMoveMatch && this.currentResolve) {
            this.currentResolve(bestMoveMatch[1]);
            this.currentResolve = null;
          }
        };
        this.engineInstance.send_command('uci');

        this.engineReady = true;
      } catch (error) {
        console.error('Failed to initialize Pikafish:', error);
      }
    }
  }

  async getBestMove(fen: string): Promise<string> {
    if (!this.engineReady) {
      throw new Error('Engine is not ready');
    }

    return new Promise((resolve, reject) => {
      try {
        this.currentResolve = (value: string) => {
          if (value === '(none)') {
            // 检查是哪一方获胜
            const fenParts = fen.split(' ');
            const sideToMove = fenParts[1];
            resolve(sideToMove === 'w' ? 'red_wins' : 'black_wins');
          } else {
            resolve(value);
          }
        };
        this.engineInstance.send_command(`position fen ${fen}`);
        this.engineInstance.send_command('go depth 10');

        setTimeout(() => {
          if (this.currentResolve) {
            reject(new Error('Engine timeout'));
            this.currentResolve = null;
          }
        }, 5000);
      } catch (err) {
        reject(err);
      }
    });
  }
}