/**
 * An Object containing:
 * @property {Number}  width         - The minefield width (1-based)
 * @property {Number}  height        - The minefield height (1-based)
 * @property {Number}  cells         - The minefield total cells number
 * @property {Number}  mines         - The minefield total mines number
 * @property {Object}  [X]           - Each minefield cell on its index ([0]..[99]+)
 * @property {Boolean} [X].isOpen    - Whether a cell is revealed
 * @property {Boolean} [X].isMine    - Whether a cell is a mine
 * @property {Boolean} [X].isFlagged - Whether a cell is flagged
 * @property {Number}  [X].mines     - Number of mines present around a cell
 */
export default class Minefield {
   /**
    * Creates a new minefield with the given width, height and mines number (and randomizes them)
    * @param {Number} width The width of the minefield (1-based)
    * @param {Number} height The height of the minefield (1-based)
    * @param {Number} mines The number of total mines (default: width*height/5). If an array is given, its values will represent the indexes where the mines will be placed
    * @param {Function} randomizer A function that returns a random decimal number between 0 and 1 (default: {@link Math.random})
    * @returns {Minefield} A new Minefield object
    * @throws An error if parameters are invalid
    */
   width: number
   height: number
   cells: any
   mines: any
   start_time: number

   constructor(width, height, mines = Math.floor(width * height / 5), randomizer = Math.random) {
      this.start_time = Date.now()
      let getNearbyCellsTemp = (cell) => {
         let nearbyCells = [cell];                                  //center

         let x = cell % this.width;
         let y = Math.floor(cell / this.width);

         let isNotFirstRow = y > 0;
         let isNotLastRow = y < this.height - 1;


         if (isNotFirstRow) nearbyCells.push(cell - this.width);      //up
         if (isNotLastRow) nearbyCells.push(cell + this.width);      //down

         if (x > 0) //if cell isn't on first column
         {
            nearbyCells.push(cell - 1);                               //left

            if (isNotFirstRow) nearbyCells.push(cell - this.width - 1); //up left
            if (isNotLastRow) nearbyCells.push(cell + this.width - 1); //down left
         }

         if (x < this.width - 1) //if cell isn't on last column
         {
            nearbyCells.push(cell + 1);                               //right

            if (isNotFirstRow) nearbyCells.push(cell - this.width + 1); //up right
            if (isNotLastRow) nearbyCells.push(cell + this.width + 1); //down right
         }

         return nearbyCells;
      }

      width = validateNumber(width, 0), height = validateNumber(height, 0);

      let cells = width * height;

      if (Array.isArray(mines)) {
         //assign properties to minefield
         Object.assign(this, { width: width, height: height, cells: cells, mines: mines.length });

         //assign properties to cells and add mines
         for (let i = 0; i < cells; i++) {
            this[i] = { mines: 0, isMine: false, isOpen: false, isFlagged: false };
         }

         //assign mines to cells and high up the cells' nearby mines number by one
         for (let i = 0; i < mines.length; i++) {
            this[mines[i]].isMine = true;

            let nearbyCells = getNearbyCellsTemp(mines[i]);

            for (let j = 0; j < nearbyCells.length; j++) {
               this[nearbyCells[j]].mines++;
            }
         }
      }
      else {
         mines = validateNumber(mines, 0, cells);

         //assign properties to minefield
         Object.assign(this, { width: width, height: height, cells: cells, mines: mines });

         //assign properties to cells and add mines
         for (let i = 0; i < cells; i++) {
            this[i] = { mines: 0, isMine: i < mines, isOpen: false, isFlagged: false };
         }

         //Durstenfeld shuffle algorithm
         for (let i = cells - 1; i > 0; i--) {
            let j = Math.floor(randomizer() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
         }

         //high up the cells' nearby-mines number by one
         for (let i = 0; i < cells; i++) {
            if (this[i].isMine) {
               let nearbyCells = getNearbyCellsTemp(i);

               for (let j = 0; j < nearbyCells.length; j++) {
                  this[nearbyCells[j]].mines++;
               }
            }
         }
      }

      return this;
   }


   /**
    * Converts the Minefield object to a Minefield2D object.
    *
    * WARNING! The two objects will share the same reference to the same cells so any changes made to one will be reflected in the other
    * @returns {Minefield2D} A Minefield2D object
    * @throws An error if object is already an instance of Minefield2D
    */
   toMinefield2D() {
      if (this instanceof Minefield2D) throw new Error("This object is already an instance of Minefield2D");

      let minefield2D = new Minefield2D(this.width, this.height)

      for (let i = 0; i < this.width; i++) {
         for (let j = 0; j < this.height; j++) {
            delete minefield2D[i][j];
            minefield2D[i][j] = this[i + j * this.width];
         }
      }

      return minefield2D;
   }


   /**
    * Returns a simplified version of the minefield.
    *
    *  - -1: A mine
    *  - [0-8]: A cell with the number of nearby mines
    *
    * @returns {Array.<number>>} A Number-Only array containing the numbers with meanings explained above
    */
   simplify() {
      let simplified = [];

      for (let i = 0; i < this.cells; i++) {
         simplified.push(this[i].isMine ? -1 : this[i].mines);
      }

      return simplified;
   }


   /**
    * Opens a given cell and may open nearby ones following the minesweeper game rules.
    * @example
    * minefield.openCell(20, false, {nearbyOpening: true, nearbyFlagging: false});
    * @param {Number} cell The index of the cell to open
    * @param {Boolean} firstclick If true, and a bomb is opened, it will be moved in another cell starting from 0 (default: {@link isNew()})
    * @param {Boolean} nearbyOpening Enables the opening of nearby cells if the given cell is already open and its nearby mines number matches the number of nearby flagged cells (default: true)
    * @param {Boolean} nearbyFlagging Enables the flagging of nearby cells if the given cell is already open and its nearby mines number matches the number of nearby closed cells (default: true)
    * @returns {Array.<number>} An array containing the indexes of the updated cells
    * @throws An error if parameters are invalid
    */
   openCell(cell, firstclick = this.isNew(), { nearbyOpening = true, nearbyFlagging = true } = {}) {
      cell = validateNumber(cell, 0, this.cells - 1);

      let updatedCells = [];

      let openIfEmptyZone = (cell) => {
         let emptyZone = this.getEmptyZone(cell);

         for (let i = 0; i < emptyZone.length; i++) {
            this[emptyZone[i]].isOpen = true;
            updatedCells.push(emptyZone[i]);
         }
      };

      if (this[cell].isOpen == false) {
         this[cell].isOpen = true;
         updatedCells.push(cell);

         if (this[cell].isMine) {
            if (firstclick) {
               this[cell].isMine = false;

               for (let i = 0; i < this.cells; i++) {
                  if (this[i].isMine == false && i != cell) {
                     this[i].isMine = true;
                     break;
                  }
               }

               this.resetMines();

               openIfEmptyZone(cell);
            }
         }

         else openIfEmptyZone(cell);
      }
      else if (this[cell].mines != 0 && (nearbyOpening || nearbyFlagging)) {
         let nearbyCells = this.getNearbyCells(cell);
         let closedCells = 0, flaggedCells = 0, unflaggedCells = [];

         for (let j = 0; j < nearbyCells.length; j++) {
            if (this[nearbyCells[j]].isOpen == false) {
               closedCells++;

               if (this[nearbyCells[j]].isFlagged) flaggedCells++;
               else unflaggedCells.push(nearbyCells[j]);
            }
         }

         if (this[cell].mines == flaggedCells && nearbyOpening) {
            for (let i = 0; i < unflaggedCells.length; i++) {
               this[unflaggedCells[i]].isOpen = true;
               updatedCells.push(unflaggedCells[i]);

               if (this[unflaggedCells[i]].isMine == false) {
                  openIfEmptyZone(unflaggedCells[i]);
               }
            }
         }
         else if (this[cell].mines == closedCells && nearbyFlagging) {
            for (let i = 0; i < unflaggedCells.length; i++) {
               this[unflaggedCells[i]].isFlagged = true;
               updatedCells.push(unflaggedCells[i]);
            }
         }
      }

      if (updatedCells.length >= 2 && updatedCells[0] == updatedCells[1]) updatedCells.shift();

      return updatedCells;
   }

   /**
    * Checks if a minefield is solvable from a given cell (by not guessing)
    *
    * WARNING! This method gets resource-intensive the more the minefield is big.
    * @param {Number} cell The index of the cell where to start
    * @param {Boolean} restore If true, the Minefield will be restored after the function ends (default: true)
    * @returns {Boolean} A Boolean value that indicates whether the minefield is solvable from the given cell
    * @throws An error if parameters are invalid
    */
   isSolvableFrom(cell, restore = true) {
      cell = validateNumber(cell, 0, this.cells - 1);

      let matrixIncludesArr = (matrix, arr) => JSON.stringify(matrix).includes(JSON.stringify(arr));

      let firstClick = this.openCell(cell)
      if (firstClick.length <= 1 && this[firstClick[0]].mines != 0) {
         if (restore) this[firstClick[0]].isOpen = false;
         return false;
      }


      let updates = true;

      while (updates) {
         let phantomGroups = [];
         updates = false;

         let importantCells = [];

         for (let i = 0; i < this.cells; i++) {
            if (this[i].isOpen == false && this[i].isFlagged == false) {
               let nearbyCells = this.getNearbyCells(i);

               for (let j = 0; j < nearbyCells.length; j++) {
                  if (this[nearbyCells[j]].isOpen == true) {
                     importantCells.push(nearbyCells[j]);
                  }
               }
            }
         }

         importantCells = [...importantCells];


         for (let i of importantCells) //1st try: open cells using flags
         {
            if (this[i].mines == 0) //all nearby cells are fine
            {
               let emptyCells = this.getEmptyZone(i);

               for (let j = 0; j < emptyCells.length; j++) {
                  if (this[emptyCells[j]].isOpen == false) {
                     this[emptyCells[j]].isOpen = true;
                     updates = true;
                  }
               }
            }
            else {
               let nearbyCells = this.getNearbyCells(i);

               let closedCells = 0, flaggedCells = 0, unflaggedCells = [];

               for (let j = 0; j < nearbyCells.length; j++) {
                  if (this[nearbyCells[j]].isOpen == false) {
                     closedCells++;

                     if (this[nearbyCells[j]].isFlagged) flaggedCells++;
                     else unflaggedCells.push(nearbyCells[j]);
                  }
               }

               if (unflaggedCells.length > 0) {
                  if (this[i].mines == flaggedCells) //all nearby cells are fine (except for the flagged cells) > open them
                  {
                     for (let x of unflaggedCells) this[x].isOpen = true;
                     updates = true
                  }

                  if (this[i].mines == closedCells) //all nearby closed cells are mines > flag them all
                  {
                     for (let x of unflaggedCells) this[x].isFlagged = true;
                     updates = true;
                  }

                  if (this[i].mines > flaggedCells) //all nearby not flagged cells have some mines > phantom flagging
                  {
                     let tempPhantomGroup = [this[i].mines - flaggedCells, ...unflaggedCells.sort((a, b) => a - b)];

                     if (matrixIncludesArr(phantomGroups, tempPhantomGroup) == false) phantomGroups.push(tempPhantomGroup);
                  }
               }
            }
         }

         if (updates == false) //2nd try: open cells using phantom bombs
         {
            let shiftUpdates = true;

            while (shiftUpdates) //shifting & adding phantom bombs
            {
               shiftUpdates = false;

               for (let i of importantCells) {
                  let nearbyCells = this.getNearbyCells(i);
                  let phantomGroupSum = [0];

                  let closedCells = [];
                  let flaggedCells = 0;

                  for (let k = 0; k < nearbyCells.length; k++) {
                     if (this[nearbyCells[k]].isFlagged) flaggedCells++;
                     else if (this[nearbyCells[k]].isOpen == false) closedCells.push(nearbyCells[k]);
                  }

                  for (let j = 0; j < phantomGroups.length; j++) {
                     if (phantomGroups[j].slice(1).every(x => closedCells.includes(x)) && closedCells.length != phantomGroups[j].length - 1) {
                        let shift = closedCells.filter(x => phantomGroups[j].includes(x, 1) == false).sort((a, b) => a - b);
                        let shiftMines = this[i].mines - phantomGroups[j][0] - flaggedCells;

                        let shiftPhantomGroup = [shiftMines, ...shift];

                        if (shift.length > 0 && shiftMines > 0 && matrixIncludesArr(phantomGroups, shiftPhantomGroup) == false) {
                           let push = true;

                           for (let k = 0; k < phantomGroups.length; k++) {
                              if (phantomGroups[k].every(x => shiftPhantomGroup.includes(x))) {
                                 push = false;
                                 break;
                              }
                           }

                           if (push) {
                              phantomGroups.push(shiftPhantomGroup)
                              shiftUpdates = true;
                           }
                        }

                        if (phantomGroups[j].slice(1).some(x => phantomGroupSum.includes(x, 1)) == false) {
                           phantomGroupSum[0] += phantomGroups[j][0];
                           phantomGroupSum.push(...phantomGroups[j].slice(1));
                        }
                     }
                  }

                  if (phantomGroupSum[0] > 0 && matrixIncludesArr(phantomGroups, phantomGroupSum) == false) {
                     phantomGroups.push(phantomGroupSum);
                     shiftUpdates = true;
                  }
               }
            }


            for (let i of importantCells) //open cells using phantom bombs
            {
               let nearbyCells = this.getNearbyCells(i);

               for (let j = 0; j < phantomGroups.length; j++) {
                  if (nearbyCells.some(x => phantomGroups[j].includes(x, 1))) {
                     let phantomGroupUncontainedCells = phantomGroups[j].slice(1).filter(x => nearbyCells.includes(x) == false).length;

                     let flaggedCells = 0, unknownCells = [];

                     for (let k = 0; k < nearbyCells.length; k++) {
                        if (this[nearbyCells[k]].isFlagged) flaggedCells++;
                        else if (this[nearbyCells[k]].isOpen == false && phantomGroups[j].includes(nearbyCells[k], 1) == false) {
                           unknownCells.push(nearbyCells[k]);
                        }
                     }

                     if (unknownCells.length > 0) {
                        if (this[i].mines == flaggedCells + phantomGroups[j][0] + unknownCells.length) //all unknown cells are mines > flag them all
                        {
                           for (let x of unknownCells) this[x].isFlagged = true;
                           updates = true;
                        }
                        if (this[i].mines == flaggedCells + phantomGroups[j][0] - phantomGroupUncontainedCells && updates == false) //all unknown cells are clear > open them
                        {
                           for (let x of unknownCells) {
                              if (this[x].isFlagged == false) {
                                 this[x].isOpen = true;
                                 updates = true;
                              }
                           }
                        }
                     }
                  }
               }
            }


            if (updates == false) //3th try: open cells using remaining flags count
            {
               if (this.usedFlags == this.mines) {
                  for (let i = 0; i < this.cells; i++) {
                     if (this[i].isOpen == false && this[i].isFlagged == false) {
                        this[i].isOpen = true;
                     }
                  }
               }
               else {
                  phantomGroups.sort((a, b) => a.length - b.length)
                  let remainingPhantomGroups = [0];

                  for (let i = 0; i < phantomGroups.length; i++) {
                     if (phantomGroups[i].slice(1).some(x => JSON.stringify(remainingPhantomGroups.slice(1)).includes(x)) == false) {
                        remainingPhantomGroups[0] += phantomGroups[i][0];
                        remainingPhantomGroups.push(...phantomGroups[i].slice(1));
                     }
                  }

                  if (remainingPhantomGroups[0] == this.mines - this.usedFlags) {
                     for (let i = 0; i < this.cells; i++) {
                        if (this[i].isOpen == false && this[i].isFlagged == false && remainingPhantomGroups.includes(i, 1) == false) {
                           this[i].isOpen = true;
                           updates = true;
                        }
                     }
                  }
               }
            }
         }
      }


      let isSolvable = false;
      if (this.isCleared()) isSolvable = true;

      if (restore) {
         for (let i = 0; i < this.cells; i++) {
            this[i].isOpen = false;
            this[i].isFlagged = false;
         }
      }

      return isSolvable;
   }

   /**
    * Checks the minefield to find hints about its state
    * @param {Boolean} accurateHint If false, the function will return the nearby cells around the hint. If true, it will only return the exact cells to open/flag. (default: false)
    * @param {Boolean} getOneHint If true, the function will only return a single hint (the first one found starting from the top) (default: true)
    * @returns {Array.<any>} An array containing arrays of the indexes of hint cells + a char value at index 0 of each (O/F) indicating if the hint is about opening or flagging cells
    * @example minefield.getHint(false, false) //returns [['O', 6, 7, 8], ['F', 15, 25, 35]]
    */
   getHint(accurateHint = false, getOneHint = true) {
      let matrixIncludesArr = (matrix, arr) => JSON.stringify(matrix).includes(JSON.stringify(arr));

      let hintCells = [];
      let accurateHintCells = [];

      let phantomGroups = [];
      let importantCells = [];

      for (let i = 0; i < this.cells; i++) {
         if (this[i].isOpen == false && this[i].isFlagged == false) {
            let nearbyCells = this.getNearbyCells(i);

            for (let j = 0; j < nearbyCells.length; j++) {
               if (this[nearbyCells[j]].isOpen == true) {
                  importantCells.push(nearbyCells[j]);
               }
            }
         }
      }

      importantCells = [...importantCells];


      for (let i of importantCells) //1st try: using flags
      {
         if (this[i].isOpen) {
            if (this[i].mines == 0) //all nearby cells are fine
            {
               let nearbyCells = this.getNearbyCells(i);
               let closedCells = nearbyCells.filter(x => this[x].isOpen == false)

               if (closedCells.length > 0) {
                  hintCells.push(["O", ...nearbyCells, i])
                  accurateHintCells.push(["O", ...closedCells]);
               }
            }
            else {
               let nearbyCells = this.getNearbyCells(i);

               let closedCells = 0, flaggedCells = 0, unflaggedCells = [];

               for (let j = 0; j < nearbyCells.length; j++) {
                  if (this[nearbyCells[j]].isOpen == false) {
                     closedCells++;

                     if (this[nearbyCells[j]].isFlagged) flaggedCells++;
                     else unflaggedCells.push(nearbyCells[j]);
                  }
               }

               if (unflaggedCells.length > 0) {
                  if (this[i].mines == flaggedCells) //all nearby cells are fine (except for the flagged cells) > open them
                  {
                     hintCells.push(["O", ...nearbyCells, i])
                     accurateHintCells.push(["O", ...unflaggedCells]);
                  }

                  if (this[i].mines == closedCells) //all nearby closed cells are mines > flag them all
                  {
                     hintCells.push(["F", ...nearbyCells, i])
                     accurateHintCells.push(["F", ...unflaggedCells]);
                  }

                  if (this[i].mines > flaggedCells) //all nearby not flagged cells have some mines > phantom flagging
                  {
                     let tempPhantomGroup = [this[i].mines - flaggedCells, ...unflaggedCells.sort((a, b) => a - b)];

                     if (matrixIncludesArr(phantomGroups, tempPhantomGroup) == false) phantomGroups.push(tempPhantomGroup);
                  }
               }
            }
         }
      }

      let shiftUpdates = true;
      while (shiftUpdates) //phantom bombs shifting
      {
         shiftUpdates = false;

         for (let i of importantCells) {
            let nearbyCells = this.getNearbyCells(i);
            let phantomGroupSum = [0];

            let closedCells = [];
            let flaggedCells = 0;

            for (let k = 0; k < nearbyCells.length; k++) {
               if (this[nearbyCells[k]].isFlagged) flaggedCells++;
               else if (this[nearbyCells[k]].isOpen == false) closedCells.push(nearbyCells[k]);
            }

            for (let j = 0; j < phantomGroups.length; j++) {
               if (phantomGroups[j].slice(1).every(x => closedCells.includes(x)) && closedCells.length != phantomGroups[j].length - 1) {
                  let shift = closedCells.filter(x => phantomGroups[j].includes(x, 1) == false).sort((a, b) => a - b);
                  let shiftMines = this[i].mines - phantomGroups[j][0] - flaggedCells;

                  let shiftPhantomGroup = [shiftMines, ...shift];

                  if (shift.length > 0 && shiftMines > 0 && matrixIncludesArr(phantomGroups, shiftPhantomGroup) == false) {
                     let push = true;

                     for (let k = 0; k < phantomGroups.length; k++) {
                        if (phantomGroups[k].every(x => shiftPhantomGroup.includes(x))) {
                           push = false;
                           break;
                        }
                     }

                     if (push) {
                        phantomGroups.push(shiftPhantomGroup)
                        shiftUpdates = true;
                     }
                  }

                  if (phantomGroups[j].slice(1).some(x => phantomGroupSum.includes(x, 1)) == false) {
                     phantomGroupSum[0] += phantomGroups[j][0];
                     phantomGroupSum.push(...phantomGroups[j].slice(1));
                  }
               }
            }

            if (phantomGroupSum[0] > 0 && matrixIncludesArr(phantomGroups, phantomGroupSum) == false) {
               phantomGroups.push(phantomGroupSum);
               shiftUpdates = true;
            }
         }
      }

      for (let i of importantCells) //2nd try: using phantom bombs
      {
         let nearbyCells = this.getNearbyCells(i);

         for (let j = 0; j < phantomGroups.length; j++) {
            if (nearbyCells.some(x => phantomGroups[j].includes(x, 1))) {
               let phantomGroupUncontainedCells = phantomGroups[j].slice(1).filter(x => nearbyCells.includes(x) == false).length;

               let flaggedCells = 0, unknownCells = [], pgCenterNearbyCells = [];

               for (let k = 0; k < nearbyCells.length; k++) {
                  let tempNearbyCells = this.getNearbyCells(nearbyCells[k]);

                  if (phantomGroups[j].slice(1).every(x => tempNearbyCells.includes(x)) && this[nearbyCells[k]].isOpen) {
                     pgCenterNearbyCells.push(...tempNearbyCells);
                  }

                  if (this[nearbyCells[k]].isFlagged) flaggedCells++;
                  else if (this[nearbyCells[k]].isOpen == false && phantomGroups[j].includes(nearbyCells[k], 1) == false) {
                     unknownCells.push(nearbyCells[k]);
                  }
               }

               if (unknownCells.length > 0) {
                  if (this[i].mines == flaggedCells + phantomGroups[j][0] + unknownCells.length) //all unknown cells are mines > flag them all
                  {
                     hintCells.push(["F", ...new Set([...nearbyCells, ...pgCenterNearbyCells, i])]);
                     accurateHintCells.push(["F", ...unknownCells]);
                  }
                  else if (this[i].mines == flaggedCells + phantomGroups[j][0] - phantomGroupUncontainedCells) //all unknown cells are clear > open them
                  {
                     unknownCells = unknownCells.filter(x => this[x].isFlagged == false);

                     if (unknownCells.length > 0) {
                        hintCells.push(["O", ...new Set([...nearbyCells, ...pgCenterNearbyCells, i])]);
                        accurateHintCells.push(["O", ...unknownCells]);
                     }
                  }
               }
            }
         }
      }

      if (this.usedFlags == this.mines) //3th try: using remaining flags count
      {
         let closedCells = [];

         for (let i = 0; i < this.cells; i++) {
            if (this[i].isOpen == false && this[i].isFlagged == false) {
               closedCells.push(i);
            }
         }

         if (closedCells.length > 0) {
            hintCells.push(["O", ...closedCells]);
            accurateHintCells.push(["O", ...closedCells]);
         }
      }
      else {
         phantomGroups.sort((a, b) => a.length - b.length)
         let remainingPhantomGroups = [0];

         for (let i = 0; i < phantomGroups.length; i++) {
            if (phantomGroups[i].slice(1).some(x => JSON.stringify(remainingPhantomGroups.slice(1)).includes(x)) == false) {
               remainingPhantomGroups[0] += phantomGroups[i][0];
               remainingPhantomGroups.push(...phantomGroups[i].slice(1));
            }
         }

         if (remainingPhantomGroups[0] == this.mines - this.usedFlags) {
            let safeCells = [];

            for (let i = 0; i < this.cells; i++) {
               if (this[i].isOpen == false && this[i].isFlagged == false && remainingPhantomGroups.includes(i, 1) == false) {
                  safeCells.push(i);
               }
            }

            if (safeCells.length > 0) {
               hintCells.push(["O", ...safeCells]);
               accurateHintCells.push(["O", ...safeCells]);
            }
         }
      }

      if (getOneHint) {
         hintCells = hintCells[0];
         accurateHintCells = accurateHintCells[0];
      }

      return (accurateHint ? accurateHintCells : hintCells) ?? [];
   }


   /**
    * Calculates nearby mines number for each cell and assigns the value*/
   resetMines() {
      for (let i = 0; i < this.cells; i++) this[i].mines = 0;

      for (let i = 0; i < this.cells; i++) {
         if (this[i].isMine) {
            let nearbyCells = this.getNearbyCells(i, true);

            for (let j = 0; j < nearbyCells.length; j++) {
               this[nearbyCells[j]].mines++;
            }
         }
      }
   }


   /**
    * Executes a given function for every cell (passing them as parameters along with the corresponding index, like a forEach)
    * @param {Function} fun A function to execute for each cell
    * @param {Boolean} returnBreak If true, the loop breaks whenever the given function returns a value that is not undefined and returns that value (default: false)
    * @param {Boolean} giveIndex If false, the method will replace the index of the cell with its corresponding coordinates (default: true)
    * @returns {any} Any value returned from the function if returnBreak is true
    */
   forEachCell(fun, returnBreak = false, giveIndex = true) {
      for (let i = 0; i < this.cells; i++) {
         let res = fun(this[i], giveIndex ? i : [i % this.width, Math.floor(i / this.width)]);
         if (returnBreak && res !== undefined) return res;
      }
   }
   /**
    * Finds the coordinates of the nearby cell at the given index
    * @param {Number} cell The index of the concerned cell
    * @param {Boolean} includeSelf If true, also include the index of the concerned cell (default: false)
    * @returns {Array.<number>} An Array containing the indexes of the cells directly around the given one
    * @throws An error if parameters are invalid
    */
   getNearbyCells(cell, includeSelf = false) {
      cell = validateNumber(cell, 0, this.cells - 1);

      let nearbyCells = [];

      let x = cell % this.width;
      let y = Math.floor(cell / this.width);

      let isNotFirstRow = y > 0;
      let isNotLastRow = y < this.height - 1;


      if (includeSelf) nearbyCells.push(cell)                   //center

      if (isNotFirstRow) nearbyCells.push(cell - this.width);      //up
      if (isNotLastRow) nearbyCells.push(cell + this.width);      //down

      if (x > 0) //if cell isn't on first column
      {
         nearbyCells.push(cell - 1);                               //left

         if (isNotFirstRow) nearbyCells.push(cell - this.width - 1); //up left
         if (isNotLastRow) nearbyCells.push(cell + this.width - 1); //down left
      }

      if (x < this.width - 1) //if cell isn't on last column
      {
         nearbyCells.push(cell + 1);                               //right

         if (isNotFirstRow) nearbyCells.push(cell - this.width + 1); //up right
         if (isNotLastRow) nearbyCells.push(cell + this.width + 1); //down right
      }

      return nearbyCells;
   }
   /**
    * Uses a flood fill algorithm to find all the cells that have 0 mines nearby
    * @param {Number} cell The index of the concerned cell
    * @param {Boolean} includeFlags Whether to include flagged cells in the empty zone (default: false)
    * @returns {Array.<number>} An Array containing the indexes of the empty cells zone starting from the given one
    * @throws An error if parameters are invalid
    */
   getEmptyZone(cell, includeFlags = false) {
      if (this[cell].mines != 0) return [];

      let emptyZone = new Set([cell]);

      for (let emptyCell of emptyZone) {
         if (this[emptyCell].mines == 0) {
            let nearbyCells = this.getNearbyCells(emptyCell);

            for (let j = 0; j < nearbyCells.length; j++) {
               if (includeFlags || this[nearbyCells[j]].isFlagged == false) {
                  emptyZone.add(nearbyCells[j])
               }
            }
         }
      }

      return [...emptyZone];
   }
   /**
    * Finds the indexes of all the square zone cells starting and ending at the specified indexes.
    * @param {Number} begIndex The index of the start of the square zone
    * @param {Number} endIndex The index of the end of the square zone
    * @return {Array<number>} An array containing the indexes of all the cells present in the square zone
    * @throws An error if parameters are invalid
    */
   getSquareZone(begIndex, endIndex) {
      begIndex = validateNumber(begIndex, 0, this.cells - 1), endIndex = validateNumber(endIndex, 0, this.cells - 1);

      let begCords = [begIndex % this.width, Math.floor(begIndex / this.width)];
      let endCords = [endIndex % this.width, Math.floor(endIndex / this.width)];

      if (endCords[0] < begCords[0]) [begCords[0], endCords[0]] = [endCords[0], begCords[0]];
      if (endCords[1] < begCords[1]) [begCords[1], endCords[1]] = [endCords[1], begCords[1]];

      let squareZone = [];

      for (let i = begCords[0]; i <= endCords[0]; i++) {
         for (let j = begCords[1]; j <= endCords[1]; j++) {
            squareZone.push(i + j * this.width);
         }
      }

      return squareZone;
   }


   /**
    * @param {Number} cell The index of the desired cell
    * @returns {Array<Number>} An array that has the x and y cords of the desired cell at index 0 and 1 respectively
    * @throws An error if parameters are invalid
    */
   getCellCords(cell) {
      cell = validateNumber(cell);

      return [cell % this.width, Math.floor(cell / this.width)];
   }
   /**
    * @param {Number} x The X coordinate of the desired cell
    * @param {Number} y The Y coordinate of the desired cell
    * @returns {Number} A Number that indicates the index of the cell that is in the specified row and column
    * @throws An error if parameters are invalid
    */
   getCellIndex([x, y]) {
      x = validateNumber(x), y = validateNumber(y);

      return x + y * this.width;
   }


   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is new (before the first move)
    */
   isNew() {
      return this.forEachCell(cell => { if (cell.isOpen) return false; }, true) ?? true;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is going on (after the first move, before game over)
    */
   isGoingOn() {
      let foundClosedEmpty = false;
      let foundOpen = false;

      return this.forEachCell(cell => {
         if (cell.isOpen && cell.isMine) return false;

         if (cell.isOpen) foundOpen = true;
         else if (cell.isOpen == false && cell.isMine == false) foundClosedEmpty = true;
      }, true) ?? (foundOpen && foundClosedEmpty);
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is over (both cleared or lost)
    */
   isOver() {
      let foundClosedEmpty = false;

      return this.forEachCell(cell => {
         if (cell.isOpen == false && cell.isMine == false) foundClosedEmpty = true;
         else if (cell.isOpen && cell.isMine) return true;
      }, true) ?? foundClosedEmpty == false;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the minefield has been cleared (no mines opened)
    */
   isCleared() {
      return this.forEachCell(cell => {
         if (cell.isOpen == false && cell.isMine == false) return false;
         if (cell.isOpen && cell.isMine) return false;
      }, true) ?? true;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether a mine has been opened in the current minefield
    */
   isLost() {
      return this.forEachCell(cell => { if (cell.isOpen && cell.isMine) return true; }, true) ?? false;
   }


   /**
    * Console logs the minefield in a visual way. Legend:
    *
    *  - ?: Unknown cells (neither opened or flagged)
    *  - F: Flagged cells
    *  - [N]: An open cell, with its nearby mines number
    *  - X: An open mine
    *
    * @param {Boolean} allsee If true, every cell will be showed as if they were open (default: false)
    */
   visualDebug(allsee = false) {
      let text = "";

      this.forEachCell((cell, i) => {
         let char = "";

         if (cell.isOpen == false && allsee == false) {
            if (cell.isFlagged) char += "F";
            else char += "?";
         }
         else if (cell.isMine == true) char += "X";
         else char += cell.mines;

         if ((i + 1) % this.width == 0) text += char + "\n";
         else text += char + " ";
      }, false, true);

      console.log(text);
   }


   /**
    * @returns {Number} A Number that indicates the used flags in the current minefield
    */
   get usedFlags() {
      let flags = 0;

      this.forEachCell(cell => {
         if (cell.isFlagged) flags++;
      });

      return flags;
   }
}


/**
 * An Object containing:
 * @property {Number}  width            - The minefield width (1-based)
 * @property {Number}  height           - The minefield height (1-based)
 * @property {Number}  cells            - The minefield total cells number
 * @property {Number}  mines            - The minefield total mines number
 * @property {Object}  [X][Y]           - Each minefield cell on its coordinates
 * @property {Boolean} [X][Y].isOpen    - Whether a cell is revealed
 * @property {Boolean} [X][Y].isMine    - Whether a cell is a mine
 * @property {Boolean} [X][Y].isFlagged - Whether a cell is flagged
 * @property {Number}  [X][Y].mines     - Number of mines present around a cell
 */
class Minefield2D extends Minefield {
   constructor(width, height, mines = Math.floor(width * height / 5), randomizer = Math.random) {
      super(width, height, mines, randomizer);

      let minefield2D = [];

      for (let i = 0; i < width; i++) {
         minefield2D.push([]);

         for (let j = 0; j < height; j++) {
            minefield2D[i][j] = this[i + j * width];
         }
      }

      for (let i = 0; i < this.cells; i++) delete this[i];
      Object.assign(this, minefield2D);

      return this;
   }


   /**
    * Converts the Minefield2D object to a Minefield object.
    *
    * WARNING! The two objects will share the same reference to the same cells so any changes made to one will be reflected in the other
    * @returns {Minefield} A Minefield object
    */
   toMinefield() {
      let minefield = new Minefield(this.width, this.height);

      for (let i = 0; i < this.width; i++) {
         for (let j = 0; j < this.height; j++) {
            delete minefield[i + j * this.width];
            minefield[i + j * this.width] = this[i][j];
         }
      }

      return minefield;
   }


   /**
    * Returns a simplified version of the minefield.
    *
    *  - -1: A mine
    *  - [0-8]: A cell with the number of nearby mines
    *
    * @returns {Array.<Array.<number>>} A Number-Only 2D-Array containing the numbers with meanings explained above
    */
   simplify() {
      let simplified = [];

      for (let i = 0; i < this.width; i++) {
         simplified.push([]);

         for (let j = 0; j < this.height; j++) {
            let cell = this[i][j];

            simplified[i].push(cell.isMine ? -1 : cell.mines);
         }
      }

      return simplified;
   }


   /**
    * Opens a given cell and may open nearby ones following the minesweeper game rules.
    * @example
    * minefield2D.openCell([5, 8], false, {nearbyOpening: true, nearbyFlagging: false});
    * @param {Number} x The X coordinate of the cell to open
    * @param {Number} y The Y coordinate of the cell to open
    * @param {Boolean} firstclick If true, and a bomb is opened, it will be moved in another cell starting from 0 (default: {@link isNew()})
    * @param {Boolean} nearbyOpening Enables the opening of nearby cells if the given cell is already open and its nearby mines number matches the number of nearby flagged cells (default: true)
    * @param {Boolean} nearbyFlagging Enables the flagging of nearby cells if the given cell is already open and its nearby mines number matches the number of nearby closed cells (default: true)
    * @returns {Array.<Array.<number>>} An array containing arrays with the coordinates of the updated cells
    * @throws An error if parameters are invalid
    */
   openCell([x, y], firstclick = this.isNew(), { nearbyOpening = true, nearbyFlagging = true } = {}) {
      x = validateNumber(x, 0, this.width - 1), y = validateNumber(y, 0, this.height - 1);

      let minefield = this.toMinefield();
      let cell = minefield.getCellIndex([x, y])

      let res = minefield.openCell(cell, firstclick, { nearbyOpening: nearbyOpening, nearbyFlagging: nearbyFlagging });

      let res2D = [];

      for (let i = 0; i < res.length; i++) {
         res2D.push(minefield.getCellCords(res[i]));
      }

      return res2D;
   }

   /**
    * Checks if a minefield is solvable from a given cell (by not guessing)
    *
    * WARNING! This method gets resource-intensive the more the minefield is big.
    * @param {Number} x The X coordinate of the cell where to start
    * @param {Number} y The Y coordinate of the cell where to start
    * @param {Boolean} restore If true, the Minefield will be restored after the function ends (default: true)
    * @returns {Boolean} A Boolean value that indicates whether the minefield is solvable from the given cell
    * @throws An error if parameters are invalid
    */
   isSolvableFrom([x, y], restore = true) {
      x = validateNumber(x, 0, this.width - 1), y = validateNumber(y, 0, this.height - 1);

      let minefield = this.toMinefield();
      let cell = minefield.getCellIndex([x, y])

      return minefield.isSolvableFrom(cell, restore);
   }

   /**
    * Checks the minefield to find hints about its state
    * @param {Boolean} accurateHint If false, the function will return the nearby cells around the hint. If true, it will only return the exact cells to open/flag. (default: false)
    * @param {Boolean} getOneHint If true, the function will only return a single hint (the first one found starting from the top) (default: true)
    * @returns {Array.<any>} An array containing arrays with the coordinates of hint cells + a char value at index 0 of each (O/F) indicating if the hint is about opening or flagging cells
    * @example minefield.getHint(true, false) //returns [['O', [2, 3], [2, 4]], ['F', [6, 5], [7, 5]]]
    * minefield.getHint(true, true) //returns ['O', [2, 3], [2, 4]]
    */
   getHint(accurateHint = false, getOneHint = true) {
      let minefield = this.toMinefield();

      let res = minefield.getHint(accurateHint, getOneHint);

      if (res.length == 0) return [];
      if (getOneHint) res = [res];


      let res2D = [];

      for (let i = 0; i < res.length; i++) {
         res2D.push([res[0][0]]);

         for (let j = 1; j < res[i].length; j++) {
            res2D[i].push(minefield.getCellCords(res[i][j]));
         }
      }

      return res2D;
   }

   /**
    * Calculates nearby mines number for each cell and assigns the value*/
   resetMines() {
      for (let i = 0; i < this.width; i++) {
         for (let j = 0; j < this.height; j++) {
            this[i][j].mines = 0;
         }
      }

      for (let i = 0; i < this.width; i++) {
         for (let j = 0; j < this.height; j++) {
            if (this[i][j].isMine) {
               let nearbyCells = this.getNearbyCells([i, j], true);

               for (let k = 0; k < nearbyCells.length; k++) {
                  this[nearbyCells[k][0]][nearbyCells[k][1]].mines++;
               }
            }
         }
      }
   }


   /**
    * Executes a given function for every cell (passing them as parameters along with the corresponding coordinates, like a forEach)
    * @param {Function} fun A function to execute for each cell
    * @param {Boolean} returnBreak If true, the loop breaks whenever the given function returns a value that is not undefined and returns that value (default: false)
    * @param {Boolean} giveIndex If true, the method will replace the coordinates of the cell with its corresponding index (default: false)
    * @returns {any} Any value returned from the function if returnBreak is true
    */
   forEachCell(fun, returnBreak = false, giveIndex = false) {
      for (let i = 0; i < this.height; i++) {
         for (let j = 0; j < this.width; j++) {
            let res = fun(this[j][i], giveIndex ? j + i * this.width : [j, i]);
            if (returnBreak && res !== undefined) return res;
         }
      }
   }
   /**
    * Finds the coordinates of the nearby cell at the given index
    * @param {Number} x The X coordinate of the concerned cell
    * @param {Number} y The Y coordinate of the concerned cell
    * @param {Boolean} includeSelf If true, also include the coordinates of the concerned cell (default: false)
    * @returns {Array.<Array.<number>>} An Array containing arrays with the coordinates of of the cells directly around the given one
    * @throws An error if parameters are invalid
    */
   getNearbyCells([x, y], includeSelf = false) {
      x = validateNumber(x, 0, this.width - 1), y = validateNumber(y, 0, this.height - 1);

      let nearbyCells = [];

      let isNotFirstRow = y > 0;
      let isNotLastRow = y < this.height - 1;


      if (includeSelf) nearbyCells.push([x, y])          //center

      if (isNotFirstRow) nearbyCells.push([x, y - 1]);      //up
      if (isNotLastRow) nearbyCells.push([x, y + 1]);      //down

      if (x > 0) //if cell isn't on first column
      {
         nearbyCells.push([x - 1, y]);                      //left

         if (isNotFirstRow) nearbyCells.push([x - 1, y - 1]); //up left
         if (isNotLastRow) nearbyCells.push([x - 1, y + 1]); //down left
      }

      if (x < this.width - 1) //if cell isn't on last column
      {
         nearbyCells.push([x + 1, y]);                      //right

         if (isNotFirstRow) nearbyCells.push([x + 1, y - 1]); //up right
         if (isNotLastRow) nearbyCells.push([x + 1, y + 1]); //down right
      }

      return nearbyCells;
   }
   /**
    * Uses a flood fill algorithm to find all the cells that have 0 mines nearby
    * @param {Number} x The X coordinate of the concerned cell
    * @param {Number} y The Y coordinate of the concerned cell
    * @param {Boolean} includeFlags If true, the flagged cells will be included in the empty zone (default: false)
    * @returns {Array.<Array.<number>>} An Array containing arrays with the coordinates of the empty cells zone starting from the given one
    * @throws An error if parameters are invalid
    */
   getEmptyZone([x, y], includeFlags = false) {
      let minefield = this.toMinefield();

      let cell = minefield.getCellIndex([x, y])

      let res = minefield.getEmptyZone(cell, includeFlags);


      let res2D = [];

      for (let i = 0; i < res.length; i++) {
         res2D.push(minefield.getCellCords(res[i]));
      }

      return res2D;
   }
   /**
    * Finds the coordinates of all the square zone cells starting and ending at the specified coordinates
    * @param {Number} begX The X coordinate of the start of the square zone
    * @param {Number} begY The Y coordinate of the start of the square zone
    * @param {Number} endX The X coordinate of the end of the square zone
    * @param {Number} endY The Y coordinate of the end of the square zone
    * @return {Array.<Array.<number>>} An array containing the coordinates of all the cells present in the square zone
    * @throws An error if parameters are invalid
    */
   getSquareZone([begX, begY], [endX, endY]) {
      begX = validateNumber(begX, 0, this.width - 1), begY = validateNumber(begY, 0, this.height - 1),
         endX = validateNumber(endX, 0, this.width - 1), endY = validateNumber(endY, 0, this.height - 1);

      if (endX < begX) [begX, endX] = [endX, begX];
      if (endY < begY) [begY, endY] = [endY, begY];

      let squareZone = [];

      for (let i = begX; i <= endX; i++) {
         for (let j = begY; j <= endY; j++) {
            squareZone.push([i, j]);
         }
      }

      return squareZone;
   }
}


function validateNumber(num, min = -Infinity, max = Infinity) {
   try {
      num = Math.trunc(min >= 0 ? Math.abs(+num) : +num);
      if (isNaN(num)) throw 0;
   }
   catch
   {
      throw new Error("Invalid parameter type");
   }

   if (num < min) throw new Error("Parameter value is too small");
   if (num > max) throw new Error("Parameter value is too big");

   return num;
}