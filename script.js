const canvas = document.getElementById("drawing");
const ctx = canvas.getContext("2d");

const flagCount = document.getElementById("mines");

const endscreen = document.getElementById("endscreen");
const blur = document.getElementById("blur");

const dimension = 24;
const gutterSize = 2;
const cellSize = Math.trunc((canvas.clientWidth - 2) / dimension) - gutterSize;

let running = true;

const flagImg = new Image();
flagImg.src = "img/flag.png";

const mineImg = new Image();
mineImg.src = "img/mine.png";

let boardGenerated = false;

// const finalNumMines = Math.round((99 / (16 * 30)) * (dimension * dimension));
const finalNumMines = 1;
let flags = finalNumMines;
let numMines = finalNumMines;

let board = [];
for (let i = 0; i < dimension; i++) {
	board.push([]);
	for (let j = 0; j < dimension; j++) {
		board[i].push([0, 0]);
	}
}
drawBoard();

/**
 * [type, vision]
 *
 * n: >= 0
 * mine: -1
 *
 * revealed: 1
 * not revealed: 0
 * flag: -1
 */

function fillCell(x, y, color) {
	ctx.fillStyle = color;
	ctx.fillRect(
		x * cellSize + x * gutterSize + gutterSize,
		y * cellSize + y * gutterSize + gutterSize,
		cellSize,
		cellSize
	);
}

function drawBoard() {
	ctx.fillStyle = "#606060";
	ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
	ctx.fillStyle = "#000000";
	for (let x = 0; x < board.length; x++) {
		for (let y = 0; y < board[x].length; y++) {
			const [type, vision] = board[x][y];
			if (vision == 1) {
				switch (type) {
					case -1:
						let [posX, posY] = boardToDoc(x, y);
						ctx.drawImage(mineImg, posX, posY);
						break;
					default:
						fillCell(x, y, "#4d994d");
						if (board[x][y][0] > 0) {
							ctx.fillStyle = "#052613";
							ctx.font = "24px sans-serif";
							ctx.fillText(
								board[x][y][0],
								x * (cellSize + gutterSize) + 8,
								y * (cellSize + gutterSize) + cellSize - 3
							);
						}
						break;
				}
			} else {
				fillCell(x, y, "#808080");
				if (vision == -1) {
					let [posX, posY] = boardToDoc(x, y);
					ctx.drawImage(flagImg, posX, posY);
				}
			}
		}
	}

	flagCount.innerHTML = flags + '<img src="img/flag.png">';
}

function getBoardPos(event) {
	const rect = canvas.getBoundingClientRect();

	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;

	const boardX = Math.trunc(x / (cellSize + gutterSize));
	const boardY = Math.trunc(y / (cellSize + gutterSize));

	return [boardX, boardY];
}

function boardToDoc(boardX, boardY) {
	const x = boardX * (cellSize + gutterSize) + gutterSize;
	const y = boardY * (cellSize + gutterSize) + gutterSize;
	return [x, y];
}

function numBombsAround(x, y) {
	let num = 0;

	if (y > 0) {
		if (x > 0 && board[x - 1][y - 1][0] == -1) {
			num++;
		}
		if (board[x][y - 1][0] == -1) {
			num++;
		}
		if (x < dimension - 1 && board[x + 1][y - 1][0] == -1) {
			num++;
		}
	}

	if (x > 0 && board[x - 1][y][0] == -1) {
		num++;
	}
	if (x < dimension - 1 && board[x + 1][y][0] == -1) {
		num++;
	}

	if (y < dimension - 1) {
		if (board[x][y + 1][0] == -1) {
			num++;
		}
		if (x > 0 && board[x - 1][y + 1][0] == -1) {
			num++;
		}
		if (x < dimension - 1 && board[x + 1][y + 1][0] == -1) {
			num++;
		}
	}

	return num;
}

canvas.addEventListener("contextmenu", (event) => {
	event.preventDefault();
});

canvas.addEventListener("click", (event) => {
	if (!running) {
		return;
	}

	let [x, y] = getBoardPos(event);

	if (!boardGenerated) {
		// let tabu = [
		// 	[x, y],
		// 	[x - 1, y - 1],
		// 	[x, y - 1],
		// 	[x + 1, y - 1],
		// 	[x - 1, y],
		// 	[x + 1, y],
		// 	[x, y + 1],
		// 	[x - 1, y + 1],
		// 	[x + 1, y + 1],
		// ];

		let tabuX = [x, x - 1, x + 1];
		let tabuY = [y, y - 1, y + 1];

		while (numMines > 0) {
			let randomX = Math.floor(Math.random() * dimension);
			let randomY = Math.floor(Math.random() * dimension);

			while (
				board[randomX][randomY][0] == -1 ||
				(tabuX.includes(randomX) && tabuY.includes(randomY))
			) {
				randomX = Math.floor(Math.random() * dimension);
				randomY = Math.floor(Math.random() * dimension);
			}

			board[randomX][randomY][0] = -1;
			numMines--;
		}
		numMines = finalNumMines;

		for (let x = 0; x < dimension; x++) {
			for (let y = 0; y < dimension; y++) {
				if (board[x][y][0] == -1) {
					continue;
				}
				board[x][y][0] = numBombsAround(x, y);
			}
		}
		boardGenerated = true;
	}

	board[x][y][1] = 1;
	drawBoard();

	if (board[x][y][0] == -1) {
		flags--;
		endscreen.style.visibility = "visible";
		blur.style.filter = "blur(3px)";

		endscreen.querySelector("h1").innerText = "You lost.";

		running = false;
	}

	if (board[x][y][1] == -1) {
		flags++;
	}

	checkForWin();
});

canvas.addEventListener("auxclick", (event) => {
	let [x, y] = getBoardPos(event);
	if (board[x][y][1] == 0 && flags > 0) {
		board[x][y][1] = -1;
		flags--;
		drawBoard();
	}
	checkForWin();
});

function checkForWin() {
	let found = false;
	for (let x = 0; x < board.length || found; x++) {
		for (let y = 0; y < board.length || found; y++) {
			if (board[x][y][0] == -1 && board[x][y][1] != -1) {
				found = true;
			}
		}
	}
	if (!found) {
		endscreen.style.visibility = "visible";
		blur.style.filter = "blur(3px)";

		endscreen.querySelector("h1").innerText = "You won.";

		running = false;
	}
}
