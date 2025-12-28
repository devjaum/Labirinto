class Labirinto {
    constructor(tamanhoInicial) {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.WALL = 1;
        this.PATH = 0;
        this.RUNE_TELEPORT = 5; 
        this.RUNE_CHAOS = 6;    
        this.RUNE_INVERT = 7;
        this.FRUIT = 8;

        this.tamanhoBase = parseInt(tamanhoInicial);
        this.tamanho = this.tamanhoBase;
        if (this.tamanho % 2 === 0) this.tamanho++;
        
        this.nivel = 1;
        this.grid = [];
        this.rastro = [];
        this.player = { x: 1, y: 1 };
        this.goal = { x: 1, y: 1 };
        
        this.frutasTotal = 0;
        this.frutasColetadas = 0;
        
        this.animacaoIA = null;
        this.controlesInvertidos = false;
        this.timerInversao = null;
        
        this.larguraLogica = 0;
        this.alturaLogica = 0;

        this.init();
    }

    init() {
        if (this.animacaoIA) clearInterval(this.animacaoIA);
        
        this.controlesInvertidos = false;
        clearTimeout(this.timerInversao);
        this.mostrarMensagem("", "transparent");

        this.atualizarTamanhoTela();
        
        this.grid = [];
        this.rastro = [];
        for (let y = 0; y < this.tamanho; y++) {
            let linha = [];
            let linhaRastro = [];
            for (let x = 0; x < this.tamanho; x++) {
                linha.push(this.WALL);
                linhaRastro.push(0); 
            }
            this.grid.push(linha);
            this.rastro.push(linhaRastro);
        }

        this.gerarLabirintoIterativo();
        this.criarCiclos(0.1); 
        this.criarSalas(Math.floor(this.tamanho / 10));
        
        this.player = { x: 1, y: 1 };
        this.goal = { x: this.tamanho - 2, y: this.tamanho - 2 };
        
        this.grid[this.player.y][this.player.x] = this.PATH; 
        this.grid[this.goal.y][this.goal.x] = this.PATH; 
        this.rastro[1][1] = 1;

        this.criarRunasVariadas(Math.floor(this.tamanho / 3.5)); 
        this.criarFrutas(Math.floor(this.tamanho / 3) + this.nivel);

        this.atualizarUI();
        this.desenhar();
    }

    reiniciarTotal(novoTamanho) {
        this.tamanhoBase = parseInt(novoTamanho);
        this.tamanho = this.tamanhoBase;
        if (this.tamanho % 2 === 0) this.tamanho++;
        this.nivel = 1;
        this.init();
    }

    proximoNivel() {
        this.nivel++;
        this.tamanho += 2;
        if (this.tamanho > 51) this.tamanho = 51;
        this.mostrarMensagem(`NÍVEL ${this.nivel}`, "#f59e0b");
        setTimeout(() => { this.init(); }, 1000);
    }

    atualizarUI() {
        document.getElementById('levelValor').innerText = this.nivel;
        
        const fBadge = document.getElementById('fruitBadge');
        document.getElementById('frutasColetadas').innerText = this.frutasColetadas;
        document.getElementById('frutasTotal').innerText = this.frutasTotal;
        
        if (this.frutasColetadas >= this.frutasTotal) {
            fBadge.classList.add('complete');
        } else {
            fBadge.classList.remove('complete');
        }
    }

    caminhoExiste(startX, startY, endX, endY) {
        if(this.grid[startY][startX] === this.WALL || this.grid[endY][endX] === this.WALL) return false;
        let fila = [{x: startX, y: startY}];
        let visitado = new Set();
        visitado.add(`${startX},${startY}`);
        while(fila.length > 0) {
            let atual = fila.shift();
            if(atual.x === endX && atual.y === endY) return true;
            let dirs = [{x:0,y:-1}, {x:0,y:1}, {x:-1,y:0}, {x:1,y:0}];
            for(let dir of dirs) {
                let nx = atual.x + dir.x;
                let ny = atual.y + dir.y;
                if(nx >= 0 && nx < this.tamanho && ny >= 0 && ny < this.tamanho) {
                    if(this.grid[ny][nx] !== this.WALL && !visitado.has(`${nx},${ny}`)) {
                        visitado.add(`${nx},${ny}`);
                        fila.push({x: nx, y: ny});
                    }
                }
            }
        }
        return false;
    }
    verificarSegurancaTotal(px, py) {
        if (!this.caminhoExiste(px, py, this.goal.x, this.goal.y)) return false;
        for(let y=0; y<this.tamanho; y++) {
            for(let x=0; x<this.tamanho; x++) {
                if(this.grid[y][x] === this.FRUIT) {
                    if (!this.caminhoExiste(px, py, x, y)) return false;
                }
            }
        }
        return true;
    }

    gerarLabirintoIterativo() {
        const stack = [{x: 1, y: 1}];
        this.grid[1][1] = this.PATH;
        while (stack.length > 0) {
            let current = stack[stack.length - 1];
            let direcoes = [{ dx: 0, dy: -2 }, { dx: 2, dy: 0 }, { dx: 0, dy: 2 }, { dx: -2, dy: 0 }].sort(() => Math.random() - 0.5);
            let encontrou = false;
            for (let dir of direcoes) {
                let nx = current.x + dir.dx, ny = current.y + dir.dy;
                if (nx > 0 && nx < this.tamanho - 1 && ny > 0 && ny < this.tamanho - 1 && this.grid[ny][nx] === this.WALL) {
                    this.grid[current.y + dir.dy / 2][current.x + dir.dx / 2] = this.PATH;
                    this.grid[ny][nx] = this.PATH;
                    stack.push({x: nx, y: ny});
                    encontrou = true;
                    break;
                }
            }
            if (!encontrou) stack.pop();
        }
    }
    criarCiclos(densidade) {
        for (let y = 1; y < this.tamanho - 1; y++) {
            for (let x = 1; x < this.tamanho - 1; x++) {
                if (this.grid[y][x] === this.WALL) {
                    let neighbors = 0;
                    if(this.grid[y-1][x]===this.PATH) neighbors++;
                    if(this.grid[y+1][x]===this.PATH) neighbors++;
                    if(this.grid[y][x-1]===this.PATH) neighbors++;
                    if(this.grid[y][x+1]===this.PATH) neighbors++;
                    if (neighbors === 2 && Math.random() < densidade) this.grid[y][x] = this.PATH;
                }
            }
        }
    }
    criarSalas(qtd) {
        for (let i = 0; i < qtd; i++) {
            let rx = Math.floor(Math.random() * (this.tamanho - 4)) + 2;
            let ry = Math.floor(Math.random() * (this.tamanho - 4)) + 2;
            for(let y=0; y<3; y++) for(let x=0; x<3; x++) if(this.grid[ry+y]) this.grid[ry+y][rx+x] = this.PATH;
        }
    }
    criarRunasVariadas(qtd) {
        let count = 0;
        const tipos = [this.RUNE_TELEPORT, this.RUNE_CHAOS, this.RUNE_INVERT];
        let attempts = 0;
        while(count < qtd && attempts < 2000) {
            attempts++;
            let rx = Math.floor(Math.random() * (this.tamanho - 2)) + 1;
            let ry = Math.floor(Math.random() * (this.tamanho - 2)) + 1;
            if(this.grid[ry][rx] === this.PATH && 
               !(rx === this.player.x && ry === this.player.y) && 
               !(rx === this.goal.x && ry === this.goal.y)) {
                this.grid[ry][rx] = tipos[Math.floor(Math.random() * tipos.length)];
                count++;
            }
        }
    }
    criarFrutas(qtd) {
        this.frutasTotal = 0;
        this.frutasColetadas = 0;
        let count = 0;
        let attempts = 0;
        while(count < qtd && attempts < 2000) {
            attempts++;
            let rx = Math.floor(Math.random() * (this.tamanho - 2)) + 1;
            let ry = Math.floor(Math.random() * (this.tamanho - 2)) + 1;
            if(this.grid[ry][rx] === this.PATH && 
               !(rx === this.player.x && ry === this.player.y) && 
               !(rx === this.goal.x && ry === this.goal.y)) {
                if (this.caminhoExiste(this.player.x, this.player.y, rx, ry)) {
                    this.grid[ry][rx] = this.FRUIT;
                    this.frutasTotal++;
                    count++;
                }
            }
        }
    }

    ativarRuna(cx, cy, tipo) {
        this.grid[cy][cx] = this.PATH;
        if (tipo === this.RUNE_TELEPORT) {
            this.flashTela("#a855f7");
            this.mostrarMensagem("🔮 Teleporte Seguro!", "#a855f7");
            let teleportado = false;
            let tentativas = 0;
            while(!teleportado && tentativas < 50) {
                tentativas++;
                let rx = Math.floor(Math.random() * (this.tamanho - 2)) + 1;
                let ry = Math.floor(Math.random() * (this.tamanho - 2)) + 1;
                if(this.grid[ry][rx] === this.PATH) {
                    if (this.verificarSegurancaTotal(rx, ry)) {
                        this.player.x = rx;
                        this.player.y = ry;
                        teleportado = true;
                    }
                }
            }
            if(!teleportado) this.mostrarMensagem("Falha no Teleporte", "#555");
        } else if (tipo === this.RUNE_CHAOS) {
            this.flashTela("#ef4444");
            this.mostrarMensagem("🧱 Caos Calculado!", "#ef4444");
            let mudancas = 0;
            let tentativas = 0;
            while(mudancas < 12 && tentativas < 150) {
                tentativas++;
                let rx = Math.floor(Math.random() * (this.tamanho - 2)) + 1;
                let ry = Math.floor(Math.random() * (this.tamanho - 2)) + 1;
                if(Math.abs(rx - this.player.x) < 2 && Math.abs(ry - this.player.y) < 2) continue;
                if(Math.abs(rx - this.goal.x) < 2 && Math.abs(ry - this.goal.y) < 2) continue;
                if(this.grid[ry][rx] === this.FRUIT) continue;
                if (this.grid[ry][rx] === this.WALL) {
                    this.grid[ry][rx] = this.PATH;
                    mudancas++;
                } else if (this.grid[ry][rx] === this.PATH) {
                    this.grid[ry][rx] = this.WALL;
                    if (this.verificarSegurancaTotal(this.player.x, this.player.y)) {
                        mudancas++;
                    } else {
                        this.grid[ry][rx] = this.PATH;
                    }
                }
            }
        } else if (tipo === this.RUNE_INVERT) {
            this.flashTela("#22c55e");
            this.mostrarMensagem("🌀 Inversão!", "#22c55e");
            this.controlesInvertidos = true;
            if(this.timerInversao) clearTimeout(this.timerInversao);
            this.timerInversao = setTimeout(() => {
                this.controlesInvertidos = false;
                this.mostrarMensagem("Controles Normais", "#fff");
                this.desenhar();
            }, 5000);
        }
        this.desenhar();
    }

    moverJogador(dx, dy) {
        if (this.controlesInvertidos) { dx = -dx; dy = -dy; }
        this.mover(dx, dy);
    }
    mover(dx, dy) {
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;
        if (ny >= 0 && ny < this.tamanho && nx >= 0 && nx < this.tamanho) {
            let celula = this.grid[ny][nx];
            if (celula !== this.WALL) {
                this.player.x = nx;
                this.player.y = ny;
                this.rastro[ny][nx]++;
                if (celula === this.FRUIT) {
                    this.grid[ny][nx] = this.PATH;
                    this.frutasColetadas++;
                    this.atualizarUI();
                } else if (celula >= 5) {
                    this.ativarRuna(nx, ny, celula);
                }
                this.desenhar();
                this.checarVitoria();
            }
        }
    }
    checarVitoria() {
        if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
            if (this.frutasColetadas >= this.frutasTotal) {
                setTimeout(() => { this.proximoNivel(); }, 200);
            } else {
                this.mostrarMensagem(`Faltam ${this.frutasTotal - this.frutasColetadas} frutas!`, "#facc15");
            }
        }
    }

    flashTela(cor) {
        const flash = document.getElementById('screen-flash');
        flash.style.backgroundColor = cor;
        flash.style.opacity = 0.4;
        setTimeout(() => { flash.style.opacity = 0; }, 400);
    }
    mostrarMensagem(texto, corBorda) {
        const msg = document.getElementById('status-overlay');
        msg.innerText = texto;
        msg.style.borderColor = corBorda;
        msg.style.color = corBorda === "#fff" || corBorda === "transparent" ? "#fff" : corBorda;
        msg.style.opacity = 1;
        msg.style.transform = "translate(-50%, -50%) scale(1.1)";
        setTimeout(() => {
            if(msg.innerText === texto) {
                msg.style.opacity = 0;
                msg.style.transform = "translate(-50%, -50%) scale(1)";
            }
        }, 2000);
    }

    resolverComIA() {
        if (this.animacaoIA) clearInterval(this.animacaoIA);
        let objetivos = [];
        for(let y=0; y<this.tamanho; y++) {
            for(let x=0; x<this.tamanho; x++) {
                if(this.grid[y][x] === this.FRUIT) objetivos.push({x, y});
            }
        }
        let plano = [];
        let posAtual = { x: this.player.x, y: this.player.y };
        while (objetivos.length > 0) {
            let maisProximaIdx = -1;
            let menorDist = Infinity;
            for(let i=0; i<objetivos.length; i++) {
                let dist = Math.abs(objetivos[i].x - posAtual.x) + Math.abs(objetivos[i].y - posAtual.y);
                if (dist < menorDist) { menorDist = dist; maisProximaIdx = i; }
            }
            let alvo = objetivos[maisProximaIdx];
            let rotaParcial = this.calcularAStar(posAtual, alvo);
            if (!rotaParcial) { this.mostrarMensagem("IA: Presa!", "#555"); return; }
            plano = plano.concat(rotaParcial);
            posAtual = alvo;
            objetivos.splice(maisProximaIdx, 1);
        }
        let rotaSaida = this.calcularAStar(posAtual, this.goal);
        if (rotaSaida) plano = plano.concat(rotaSaida);
        this.animarCaminho(plano);
    }
    calcularAStar(start, end) {
        let gridNos = [];
        for(let y=0; y<this.tamanho; y++){
            gridNos[y] = [];
            for(let x=0; x<this.tamanho; x++){
                let isWall = this.grid[y][x] === this.WALL;
                gridNos[y][x] = { x, y, f:0, g:0, h:0, parent:null, wall: isWall };
            }
        }
        let openList = [gridNos[start.y][start.x]];
        let closedList = new Set();
        while(openList.length > 0) {
            let lowInd = 0;
            for(let i=0; i<openList.length; i++) if(openList[i].f < openList[lowInd].f) lowInd = i;
            let current = openList[lowInd];
            if(current.x === end.x && current.y === end.y) {
                let path = [];
                let temp = current;
                while(temp.parent) { path.push(temp); temp = temp.parent; }
                return path.reverse();
            }
            openList.splice(lowInd, 1);
            closedList.add(current);
            let dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
            for(let dir of dirs) {
                let nx = current.x + dir.x, ny = current.y + dir.y;
                if(nx>=0 && nx<this.tamanho && ny>=0 && ny<this.tamanho) {
                    let neighbor = gridNos[ny][nx];
                    if(neighbor.wall || closedList.has(neighbor)) continue;
                    let tempG = current.g + 1;
                    let newPath = false;
                    if(openList.includes(neighbor)) {
                        if(tempG < neighbor.g) { neighbor.g = tempG; newPath = true; }
                    } else {
                        neighbor.g = tempG; newPath = true; openList.push(neighbor);
                    }
                    if(newPath) {
                        neighbor.h = Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y);
                        neighbor.f = neighbor.g + neighbor.h;
                        neighbor.parent = current;
                    }
                }
            }
        }
        return null;
    }
    animarCaminho(path) {
        if (this.animacaoIA) clearInterval(this.animacaoIA);
        let i = 0;
        this.animacaoIA = setInterval(() => {
            if (i >= path.length) { clearInterval(this.animacaoIA); return; }
            let next = path[i];
            this.mover(next.x - this.player.x, next.y - this.player.y);
            i++;
        }, 40);
    }

    atualizarTamanhoTela() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.scale(dpr, dpr);
        this.larguraLogica = window.innerWidth;
        this.alturaLogica = window.innerHeight;
    }

    desenhar() {
        this.ctx.fillStyle = "#0f172a";
        this.ctx.fillRect(0, 0, this.larguraLogica, this.alturaLogica);

        const zoomAtivo = document.getElementById('zoomToggle').checked;
        let cellSize, offsetX, offsetY;

        if (zoomAtivo) {
            cellSize = this.alturaLogica / 15;
            offsetX = (this.larguraLogica/2) - (this.player.x * cellSize) - (cellSize/2);
            offsetY = (this.alturaLogica/2) - (this.player.y * cellSize) - (cellSize/2);
        } else {
            let menorLado = Math.min(this.larguraLogica, this.alturaLogica);
            cellSize = (menorLado - 60) / this.tamanho;
            offsetX = (this.larguraLogica - (this.tamanho * cellSize)) / 2;
            offsetY = (this.alturaLogica - (this.tamanho * cellSize)) / 2;
        }

        for (let y = 0; y < this.tamanho; y++) {
            for (let x = 0; x < this.tamanho; x++) {
                let val = this.grid[y][x];
                let dx = (x * cellSize) + offsetX;
                let dy = (y * cellSize) + offsetY;
                let cx = dx + cellSize/2;
                let cy = dy + cellSize/2;

                if (dx > -cellSize && dx < this.larguraLogica && dy > -cellSize && dy < this.alturaLogica) {
                    if (val !== this.WALL) {
                        this.ctx.fillStyle = "#1e293b";
                        this.ctx.fillRect(dx, dy, cellSize + 1, cellSize + 1);

                        if (this.rastro[y][x] > 0) {
                            let alpha = Math.min(this.rastro[y][x] * 0.2, 0.6);
                            this.ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`; 
                            this.ctx.fillRect(dx, dy, cellSize, cellSize);
                        }

                        if (val === this.FRUIT) {
                            let size = cellSize * 0.4;
                            this.ctx.shadowBlur = 15;
                            this.ctx.shadowColor = "#ef4444";
                            
                            this.ctx.fillStyle = "#ef4444";
                            this.ctx.beginPath();
                            this.ctx.arc(cx, cy + size*0.1, size, 0, Math.PI*2);
                            this.ctx.fill();

                            this.ctx.fillStyle = "rgba(255,255,255,0.4)";
                            this.ctx.beginPath();
                            this.ctx.arc(cx - size*0.3, cy - size*0.3, size*0.3, 0, Math.PI*2);
                            this.ctx.fill();

                            this.ctx.shadowBlur = 0;
                            this.ctx.fillStyle = "#4ade80";
                            this.ctx.beginPath();
                            this.ctx.ellipse(cx, cy - size, size*0.4, size*0.2, Math.PI/4, 0, Math.PI*2);
                            this.ctx.fill();
                        }
                        else if (val >= 5) {
                            let rSize = cellSize * 0.4;
                            this.ctx.shadowBlur = 20;

                            if (val === this.RUNE_TELEPORT) {
                                this.ctx.shadowColor = "#d946ef";
                                this.ctx.strokeStyle = "#d946ef";
                                this.ctx.lineWidth = 3;
                                this.ctx.beginPath();
                                this.ctx.arc(cx, cy, rSize, 0, Math.PI*2);
                                this.ctx.stroke();
                                this.ctx.beginPath();
                                this.ctx.arc(cx, cy, rSize*0.6, 0, Math.PI*2);
                                this.ctx.stroke();
                                this.ctx.fillStyle = "#a855f7";
                                this.ctx.beginPath();
                                this.ctx.arc(cx, cy, rSize*0.3, 0, Math.PI*2);
                                this.ctx.fill();
                            } 
                            else if (val === this.RUNE_CHAOS) {
                                this.ctx.shadowColor = "#f87171";
                                this.ctx.fillStyle = "#ef4444";
                                this.ctx.beginPath();
                                this.ctx.moveTo(cx, cy - rSize);
                                this.ctx.lineTo(cx + rSize, cy);
                                this.ctx.lineTo(cx, cy + rSize);
                                this.ctx.lineTo(cx - rSize, cy);
                                this.ctx.closePath();
                                this.ctx.fill();

                                this.ctx.strokeStyle = "#7f1d1d";
                                this.ctx.lineWidth = 2;
                                this.ctx.beginPath();
                                this.ctx.moveTo(cx - rSize/2, cy - rSize/2);
                                this.ctx.lineTo(cx + rSize/2, cy + rSize/2);
                                this.ctx.moveTo(cx + rSize/2, cy - rSize/2);
                                this.ctx.lineTo(cx - rSize/2, cy + rSize/2);
                                this.ctx.stroke();
                            } 
                            else if (val === this.RUNE_INVERT) {
                                this.ctx.shadowColor = "#4ade80";
                                this.ctx.strokeStyle = "#22c55e";
                                this.ctx.lineWidth = 4;
                                this.ctx.lineCap = "round";
                                this.ctx.beginPath();
                                for(let i=0; i<10; i++) {
                                    let angle = i * 0.5;
                                    let dist = (i/10) * rSize;
                                    let px = cx + Math.cos(angle)*dist;
                                    let py = cy + Math.sin(angle)*dist;
                                    if(i===0) this.ctx.moveTo(px, py);
                                    else this.ctx.lineTo(px, py);
                                }
                                this.ctx.stroke();
                            }
                            this.ctx.shadowBlur = 0;
                        }

                        if (this.grid[y-1] && this.grid[y-1][x] === this.WALL) {
                            this.ctx.fillStyle = "rgba(0,0,0,0.5)";
                            this.ctx.fillRect(dx, dy, cellSize, cellSize * 0.3);
                        }
                    } else {
                        this.ctx.fillStyle = "#334155"; 
                        this.ctx.fillRect(dx, dy, cellSize+1, cellSize+1);
                        
                        this.ctx.fillStyle = "#475569";
                        this.ctx.fillRect(dx, dy, cellSize, cellSize * 0.1);
                    }
                }
            }
        }

        let desenharQuadradoArredondado = (x, y, color, shadowColor, isGoal=false) => {
            let dx = (x * cellSize) + offsetX;
            let dy = (y * cellSize) + offsetY;
            let size = cellSize * 0.7;
            let margin = (cellSize - size) / 2;
            let r = size * 0.2;
            
            if (isGoal && this.frutasColetadas < this.frutasTotal) {
                color = "#475569";
                shadowColor = "transparent";
            }

            this.ctx.shadowBlur = 25;
            this.ctx.shadowColor = shadowColor;
            this.ctx.fillStyle = color;
            
            let px = dx + margin;
            let py = dy + margin;
            
            this.ctx.beginPath();
            this.ctx.moveTo(px + r, py);
            this.ctx.lineTo(px + size - r, py);
            this.ctx.quadraticCurveTo(px + size, py, px + size, py + r);
            this.ctx.lineTo(px + size, py + size - r);
            this.ctx.quadraticCurveTo(px + size, py + size, px + size - r, py + size);
            this.ctx.lineTo(px + r, py + size);
            this.ctx.quadraticCurveTo(px, py + size, px, py + size - r);
            this.ctx.lineTo(px, py + r);
            this.ctx.quadraticCurveTo(px, py, px + r, py);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            if (isGoal && this.frutasColetadas < this.frutasTotal) {
                this.ctx.fillStyle = "#94a3b8";
                this.ctx.fillRect(px + size*0.4, py + size*0.4, size*0.2, size*0.3);
                this.ctx.beginPath();
                this.ctx.arc(px + size*0.5, py + size*0.4, size*0.1, Math.PI, 0);
                this.ctx.stroke();
            }
        };

        desenharQuadradoArredondado(this.goal.x, this.goal.y, "#10b981", "#34d399", true);
        
        let corPlayer = this.controlesInvertidos ? "#f97316" : "#3b82f6";
        let shadowPlayer = this.controlesInvertidos ? "#fb923c" : "#60a5fa";
        desenharQuadradoArredondado(this.player.x, this.player.y, corPlayer, shadowPlayer);
    }
}

const tamanhoInput = document.getElementById('tamanho');
const tamanhoValor = document.getElementById('tamanhoValor');
let jogo = new Labirinto(tamanhoInput.value);

tamanhoInput.addEventListener('input', () => { tamanhoValor.innerText = tamanhoInput.value; });
document.getElementById('gerar').addEventListener('click', () => { jogo.reiniciarTotal(tamanhoInput.value); document.getElementById('gerar').blur(); });
document.getElementById('solveAI').addEventListener('click', () => { jogo.resolverComIA(); document.getElementById('solveAI').blur(); });
document.getElementById('zoomToggle').addEventListener('change', () => { jogo.desenhar(); document.getElementById('zoomToggle').blur(); });
document.getElementById('btnFullscreen').addEventListener('click', () => { if(!document.fullscreenElement) document.body.requestFullscreen(); else document.exitFullscreen(); });

const toggleBtn = document.getElementById('toggleUI');
const uiLayer = document.getElementById('ui-layer');
toggleBtn.addEventListener('click', () => {
    uiLayer.classList.toggle('minimized');
    if (uiLayer.classList.contains('minimized')) { toggleBtn.innerText = '▲'; toggleBtn.style.background = "rgba(255,255,255,0.1)"; }
    else { toggleBtn.innerText = '▼'; toggleBtn.style.background = "transparent"; }
    toggleBtn.blur();
});

window.addEventListener('resize', () => { jogo.atualizarTamanhoTela(); jogo.desenhar(); });
document.addEventListener('fullscreenchange', () => { jogo.atualizarTamanhoTela(); jogo.desenhar(); });

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': case 'w': jogo.moverJogador(0, -1); break;
        case 'ArrowDown': case 's': jogo.moverJogador(0, 1); break;
        case 'ArrowLeft': case 'a': jogo.moverJogador(-1, 0); break;
        case 'ArrowRight': case 'd': jogo.moverJogador(1, 0); break;
    }
});
document.getElementById('up').onclick = () => jogo.moverJogador(0, -1);
document.getElementById('down').onclick = () => jogo.moverJogador(0, 1);
document.getElementById('left').onclick = () => jogo.moverJogador(-1, 0);
document.getElementById('right').onclick = () => jogo.moverJogador(1, 0);