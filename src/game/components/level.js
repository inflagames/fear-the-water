import BaseObject from "./shared/base-object";
import { randomNumber, scale } from "../utils/math";
import { SCREEN_HEIGHT, SCREEN_WIDTH, GRID_SIZE } from "../utils/variables";
import Tile, { TILE_1X1, TILE_2X2, TILE_FLOOR } from "./tile";
import level1 from "./levels/level.001.json";
import Bubble from "./bubble";
import Hole from "./hole";

const ROW_TILE = 1; //         0001
const ROW_HOLE = 2; //         0010
const ROW_TILE_TREE_V1 = 4; // 0100
const ROW_PLAYER_START = 8; // 1000

const MAX_NUMBER_OF_BUBBLES = 40;

export default class Level extends BaseObject {
  /**
   * @param eventEmitter {Observable}
   * @param x {number}
   * @param y {number}
   * @param width {number}
   * @param height {number}
   * @param background {string}
   */
  constructor(
    eventEmitter,
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    background = ""
  ) {
    super(eventEmitter, x, y, width, height);
    this.backgroundColor = background;

    const bubble = this.newBubble();

    /** @member {BaseObject[]} */
    this.components = [];

    this.tiles = [];
    this.floor = [];
    this.bubbles = [];
    this.hole = undefined;

    this.currentLevel = { ...level1 };
    this.playerInitialPosition = { x: 0, y: 0 };

    this.loadLevel(this.currentLevel);
  }

  loadLevel(level) {
    // load level background
    this.backgroundColor = level.background;

    const map = level.map;
    const flags = new Array(map.length).fill(1).map(() => new Array(map[0].length).fill(true));
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const tile = map[row][col];
        if (flags[row][col] && ((tile & ROW_TILE) !== 0)) {

          let type = TILE_1X1;

          // check if 2x2 tile fit
          if (row + 1 < map.length && col + 1 < map[row].length &&
            (map[row][col + 1] & ROW_TILE) &&
            (map[row + 1][col] & ROW_TILE) &&
            (map[row + 1][col + 1] & ROW_TILE)
          ) {
            flags[row][col] = false;
            flags[row][col + 1] = false;
            flags[row + 1][col] = false;
            flags[row + 1][col + 1] = false;

            type = TILE_2X2;
          }

          const tile = new Tile(
            this.eventEmitter,
            col * GRID_SIZE,
            row * GRID_SIZE,
            type
          );
          this.tiles.push(tile);
          this.components.push(tile);
        } else if ((tile & ROW_TILE) === 0) {
          const tile = new Tile(
            this.eventEmitter,
            col * GRID_SIZE,
            row * GRID_SIZE,
            TILE_FLOOR
          );
          this.floor.push(tile);
        }

        if (tile & ROW_HOLE) {
          const hole = new Hole(
            this.eventEmitter,
            col * GRID_SIZE + GRID_SIZE * .5,
            row * GRID_SIZE + GRID_SIZE * .5
          );
          this.hole = hole;
          this.components.push(hole);
        }

        if (tile & ROW_PLAYER_START) {
          this.playerInitialPosition = {
            x: col * GRID_SIZE + GRID_SIZE * .5,
            y: row * GRID_SIZE + GRID_SIZE * .5
          };
        }
      }
    }
  }

  render(context) {
    this.cleanScreen(context);

    this.floor.forEach((component) => component.render(context));
    this.renderWatterColor(context);
    this.updateBubbles();

    this.components.forEach((component) => component.render(context));
  }

  updateBubbles() {
    const toRemove = new Set();
    for (const b of this.bubbles) {
      if (b.bubbleDead()) {
        toRemove.add(b.id);
      }
    }

    this.bubbles = this.bubbles.filter((b) => !toRemove.has(b.id));
    this.components = this.components.filter((c) => !toRemove.has(c.id));

    if (this.bubbles.length < MAX_NUMBER_OF_BUBBLES) {
      if (randomNumber(2) === 1) {
        const bubble = this.newBubble();
        this.components.unshift(bubble);
        this.bubbles.push(bubble);
      }
    }
  }

  newBubble() {
    const width = randomNumber(40, 10);
    const height = randomNumber(40, 10);
    const x = randomNumber(SCREEN_WIDTH);
    const y = randomNumber(SCREEN_HEIGHT);
    return new Bubble(this.eventEmitter, x, y, width, height);
  }

  renderWatterColor(context) {
    if (this.backgroundColor) {
      context.beginPath();
      context.fillStyle = this.backgroundColor;
      context.rect(0, 0, scale(this.width), scale(this.height));
      context.fill();
    }
  }

  cleanScreen(context) {
    context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
}
