function clamp(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

const game = {
  state: {
    entities: []
  },

  scene: {
    stack: [],

    push(nextScene) {
      game.scene.stack.push(nextScene);
    },

    peek() {
      return game.scene.stack[game.scene.stack.length - 1];
    },

    pop() {
      return game.scene.stack.pop();
    },

    create(name) {
      const scene = {
        entities: [],
        addedEntities: [],
        removedEntities: [],
        get name() {
          return name;
        },
        add(entity) {
          const id = scene.entities.length + 1;
          entity.id = id;
          scene.addedEntities.push(entity);
          return id;
        },
        remove(entity) {
          if (!scene.entities || !entity || !entity.id) {
            return;
          }
          const index = scene.entities.findIndex(e => e.id === entity.id);
          if (index >= 0) {
            scene.removedEntities.push(entity);
          }
        },
        findFirstWithTag(tag) {
          if (!scene.entities || !tag) {
            return;
          }
          for (let i = 0; i < scene.entities.length; i++) {
            const entity = scene.entities[i];
            if (entity.tags.includes(tag)) {
              return entity;
            }
          }
        },
        findLastWithTag(tag) {
          if (!scene.entities || !tag) {
            return;
          }
          for (let i = scene.entities.length - 1; i >= 0; i--) {
            const entity = scene.entities[i];
            if (entity.tags.includes(tag)) {
              return entity;
            }
          }
        },
        findAllWithTag(tag) {
          if (!scene.entities || !tag) {
            return [];
          }
          const tagged = scene.entities.filter(e => e.tags.includes(tag));
          return tagged;
        }
      };
      return scene;
    }
  },

  renderer: {
    canvas: null,
    ctx: null,

    async init() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = 512;
      canvas.height = 392;

      game.renderer.canvas = canvas;
      game.renderer.ctx = ctx;

      document.body.appendChild(canvas);
    },

    render() {
      const { ctx } = game.renderer;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const scene = game.scene.peek();
      if (!scene) {
        return;
      }
      const visibleEntities = scene.entities.filter(e =>
        e.tags.includes('visible')
      );

      visibleEntities.forEach(e => {
        e.render && e.render();
      });
    }
  },

  input: {
    state: {
      key: {}
    },

    async init() {
      window.addEventListener(
        'keydown',
        e => {
          const { key } = e;
          e.preventDefault();
          game.input.state.key[key] = 1;
        },
        false
      );
      window.addEventListener(
        'keyup',
        e => {
          const { key } = e;
          e.preventDefault();
          delete game.input.state.key[key];
        },
        false
      );
    },

    get up() {
      const { key } = game.input.state;
      return 'ArrowUp' in key || 'w' in key;
    },

    get down() {
      const { key } = game.input.state;
      return 'ArrowDown' in key || 's' in key;
    },

    get left() {
      const { key } = game.input.state;
      return 'ArrowLeft' in key || 'a' in key;
    },

    get right() {
      const { key } = game.input.state;
      return 'ArrowRight' in key || 'd' in key;
    },

    get fire1() {
      const { key } = game.input.state;
      return ' ' in key || 'z' in key;
    },

    get fire2() {
      const { key } = game.input.state;
      return 'Control' in key || 'x' in key;
    }
  },

  async init() {
    await game.renderer.init();

    await game.input.init();
  },

  async start() {
    let lastTime = Date.now() * 0.001;
    let deltaTime = 0.33;
    let elapsedTime = 0;

    await game.setupScene();

    const mainLoop = () => {
      const currentTime = Date.now() * 0.001;
      deltaTime = currentTime - lastTime;
      elapsedTime += deltaTime;
      lastTime = currentTime;
      game.state.elapsedTime = elapsedTime;
      game.state.deltaTime = deltaTime;
      game.update();
      game.renderer.render();
      window.requestAnimationFrame(mainLoop);
    };

    mainLoop();
  },

  async setupScene() {
    // const titleScene = game.scene.create('title');
    // const optionsScene = game.scene.create('options');
    // const creditsScene = game.scene.create('credits');
    // const levelSelectScene = game.scene.create('levelSelect');
    // const levelScene = game.scene.create('level');
    // const gameOverScene = game.scene.create('gameOver');
    // const gameClearScene = game.scene.create('gameClear');

    const scene = game.scene.create('debug-room');
    game.scene.push(scene);

    const stars = {
      points: [],
      tags: ['active', 'visible', 'stars', 'background'],
      init() {
        const minSpeed = 160;
        const maxSpeed = 250;
        const minZ = 0;
        const maxZ = 100;
        const palette = ['#bbb', '#999', '#666', '#444', '#222'].reverse();
        for (let i = 0; i < 50; i++) {
          const p = {
            x: ~~(Math.random() * game.renderer.canvas.width),
            y: ~~(Math.random() * game.renderer.canvas.height),
            z: ~~(minZ + Math.random() * (maxZ - minZ)),
            yv: 1,
            ys: ~~(minSpeed + Math.random() * (maxSpeed - minSpeed))
          };
          p.ys = minSpeed + (p.z / maxZ) * (maxSpeed - minSpeed);
          p.color = palette[~~(p.z / (palette.length - 1))];
          stars.points.push(p);
        }
      },
      update() {
        const { points } = stars;
        points.forEach(p => {
          p.y += p.ys * p.yv * game.state.deltaTime;
          if (p.y > game.renderer.canvas.height) {
            p.y = 0;
            p.x = ~~(Math.random() * game.renderer.canvas.width);
          }
        });
      },
      render() {
        const { ctx } = game.renderer;
        const { points } = stars;
        points.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, 2, 3);
        });
      }
    };

    stars.init();

    scene.add(stars);

    // game.state.entities.push(stars);

    // const ball = {
    //   x: 10,
    //   y: 10,
    //   xv: 1,
    //   yv: 1,
    //   xs: 200,
    //   ys: 100,
    //   tags: ['active', 'visible', 'ball'],
    //   render() {
    //     game.renderer.ctx.fillStyle = '#fff';
    //     game.renderer.ctx.fillRect(ball.x, ball.y, 8, 8);
    //   },
    //   update() {
    //     ball.x += ball.xv * ball.xs * game.state.deltaTime;
    //     ball.y += ball.yv * ball.ys * game.state.deltaTime;
    //     if (ball.x < 0 || ball.x > game.renderer.canvas.width) {
    //       ball.xs = -ball.xs;
    //       ball.x += ball.xv * ball.xs * game.state.deltaTime;
    //     }
    //     if (ball.y < 0 || ball.y > game.renderer.canvas.height) {
    //       ball.ys = -ball.ys;
    //       ball.y += ball.yv * ball.ys * game.state.deltaTime;
    //     }
    //   }
    // };

    function createPlayerBullet(x, y) {
      const bullet = {
        tags: ['visible', 'active', 'bullet'],
        x,
        y,
        w: 4,
        h: 24,
        ys: 350,
        yv: -1,
        update() {
          bullet.y += bullet.ys * bullet.yv * game.state.deltaTime;
          if (bullet.y < -10) {
            bullet.ys = 0;
            bullet.tags = ['dead'];
          }
        },
        render() {
          const { ctx } = game.renderer;
          ctx.fillStyle = '#0f0';
          ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
        }
      };

      return bullet;
    }

    const playerShip = {
      tags: ['player', 'active', 'visible', 'solid'],
      x: ~~(game.renderer.canvas.width * 0.5),
      y: ~~(game.renderer.canvas.height * 0.7),
      w: 48,
      h: 24,
      xs: 250,
      ys: 250,
      fired: false,
      update() {
        const { x, y, w, h } = playerShip;

        const hw = ~~(w * 0.5);
        const hh = ~~(h * 0.5);

        if (game.input.fire1 && !playerShip.fired) {
          playerShip.fired = true;
          const bullet = createPlayerBullet(x, y - hh);
          scene.add(bullet);
        } else if (!game.input.fire1 && playerShip.fired) {
          playerShip.fired = false;
        }

        if (game.input.left) {
          playerShip.x -= playerShip.xs * game.state.deltaTime;
        } else if (game.input.right) {
          playerShip.x += playerShip.xs * game.state.deltaTime;
        }
        if (game.input.up) {
          playerShip.y -= playerShip.ys * game.state.deltaTime;
        } else if (game.input.down) {
          playerShip.y += playerShip.ys * game.state.deltaTime;
        }
        playerShip.x = clamp(playerShip.x, hw, game.renderer.canvas.width - hw);
        playerShip.y = clamp(
          playerShip.y,
          game.renderer.canvas.height * 0.1,
          game.renderer.canvas.height * 0.95
        );
        playerShip.updateBounds();
      },
      updateBounds() {
        const { x, y, w, h } = playerShip;

        const hw = ~~(w * 0.5);
        const hh = ~~(h * 0.5);

        const left = x - hw;
        const right = x + hw;
        const top = y - hh;
        const bottom = y + hh;

        playerShip.bounds = {
          left,
          right,
          top,
          bottom
        };
      },
      render() {
        const { ctx } = game.renderer;

        const { x, y, bounds, w, h } = playerShip;
        const { left, right, top, bottom } = bounds;

        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(left, bottom);
        ctx.lineTo(x, top);
        ctx.lineTo(right, bottom);
        ctx.fill();
      }
    };

    const debugSolids = {
      tags: ['visible'],
      render() {
        const { ctx } = game.renderer;
        const solidEntities = scene.entities.filter(e =>
          e.tags.includes('solid')
        );

        solidEntities.forEach(e => {
          const { bounds, x, y } = e;
          const { left, right, top, bottom } = bounds;
          ctx.strokeStyle = '#f00';
          ctx.strokeRect(left, top, right - left, bottom - top);
          ctx.strokeStyle = '#fa9';
          ctx.strokeRect(x, y - 4, 1, 9);
          ctx.strokeRect(x - 4, y, 9, 1);
        });
      }
    };

    const debugInput = {
      tags: ['visible'],
      render() {
        const { ctx } = game.renderer;
        ctx.fillStyle = '#ff0';
        let cy = 16;
        let lh = 16;
        ctx.fillText(`Up: ${game.input.up ? 'Y' : 'N'}`, 16, cy);
        cy += lh;
        ctx.fillText(`Down: ${game.input.down ? 'Y' : 'N'}`, 16, cy);
        cy += lh;
        ctx.fillText(`Left: ${game.input.left ? 'Y' : 'N'}`, 16, cy);
        cy += lh;
        ctx.fillText(`Right: ${game.input.right ? 'Y' : 'N'}`, 16, cy);
        cy += lh;
        ctx.fillText(`Fire1: ${game.input.fire1 ? 'Y' : 'N'}`, 16, cy);
        cy += lh;
        ctx.fillText(`Fire2: ${game.input.fire2 ? 'Y' : 'N'}`, 16, cy);
      }
    };

    const debugEntities = {
      tags: ['visible'],
      render() {
        const { ctx } = game.renderer;
        ctx.fillStyle = '#ff0';
        let cy = 16;
        let lh = 16;
        ctx.fillText(
          `Entity Count: ${scene.entities.length} +${
            scene.addedEntities.length
          } -${scene.removedEntities.length}`,
          16,
          cy
        );
        cy += lh;
      }
    };

    scene.add(playerShip);
    // scene.add(debugSolids);
    // scene.add(debugEntities);
  },

  update() {
    const scene = game.scene.peek();
    if (!scene) {
      return;
    }

    if (scene.addedEntities.length) {
      scene.entities = [...scene.entities, ...scene.addedEntities];
      scene.addedEntities = [];
    }

    const activeEntities = scene.entities.filter(e =>
      e.tags.includes('active')
    );

    activeEntities.forEach(e => {
      e.update && e.update();
    });

    const deadEntities = scene.entities.filter(e => e.tags.includes('dead'));
    deadEntities.forEach(e => scene.remove(e));

    if (scene.removedEntities.length) {
      scene.entities = scene.entities.filter(
        e => !scene.removedEntities.find(x => x.id === e.id)
      );
      scene.removedEntities = [];
    }
  }
};

async function boot() {
  await game.init();
  await game.start();
}

window.addEventListener('DOMContentLoaded', boot, false);
