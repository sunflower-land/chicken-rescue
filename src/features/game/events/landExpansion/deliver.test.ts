import "lib/__mocks__/configMock";
import Decimal from "decimal.js-light";
import {
  QUEST_NPC_NAMES,
  QuestNPCName,
  TICKET_REWARDS,
  deliverOrder,
} from "./deliver";
import { INITIAL_BUMPKIN, TEST_FARM } from "features/game/lib/constants";
import { getSeasonalTicket } from "features/game/types/seasons";

const FIRST_DAY_OF_SEASON = new Date("2023-11-01T16:00:00Z").getTime();
const MID_SEASON = new Date("2023-08-15T15:00:00Z").getTime();

describe("deliver", () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  it("requires the order exists", () => {
    expect(() =>
      deliverOrder({
        state: {
          ...TEST_FARM,
        },
        action: {
          id: "123",
          type: "order.delivered",
        },
      }),
    ).toThrow("Order does not exist");
  });

  it("requires order has started", () => {
    expect(() =>
      deliverOrder({
        state: {
          ...TEST_FARM,
          delivery: {
            ...TEST_FARM.delivery,
            orders: [
              {
                id: "123",
                createdAt: 0,
                readyAt: MID_SEASON + 5000,
                from: "betty",
                items: {
                  Sunflower: 50,
                },
                reward: { sfl: 0.1 },
              },
            ],
          },
        },
        action: {
          id: "123",
          type: "order.delivered",
        },
        createdAt: MID_SEASON,
      }),
    ).toThrow("Order has not started");
  });

  it("requires player has the ingredients", () => {
    expect(() =>
      deliverOrder({
        state: {
          ...TEST_FARM,
          delivery: {
            ...TEST_FARM.delivery,
            orders: [
              {
                id: "123",
                createdAt: 0,
                readyAt: MID_SEASON,
                from: "betty",
                items: {
                  Sunflower: 50,
                },
                reward: { sfl: 0.1 },
              },
            ],
          },
        },
        action: {
          id: "123",
          type: "order.delivered",
        },
        createdAt: MID_SEASON,
      }),
    ).toThrow("Insufficient ingredient: Sunflower");
  });

  // SFL will be a potential requirement for quests (Legacy)
  it("requires player has the sfl", () => {
    const now = new Date("2024-05-09").getTime();

    expect(() =>
      deliverOrder({
        createdAt: now,
        state: {
          ...TEST_FARM,
          balance: new Decimal(0),
          delivery: {
            ...TEST_FARM.delivery,
            orders: [
              {
                id: "123",
                createdAt: 0,
                readyAt: new Date("2023-10-15T15:00:00Z").getTime(),
                from: "tywin",
                items: {
                  sfl: 10,
                },
                reward: {},
              },
            ],
          },
        },
        action: {
          id: "123",
          type: "order.delivered",
        },
      }),
    ).toThrow("Insufficient ingredient: sfl");
  });

  it("requires player has the coins", () => {
    expect(() =>
      deliverOrder({
        state: {
          ...TEST_FARM,
          coins: 0,
          delivery: {
            ...TEST_FARM.delivery,
            orders: [
              {
                id: "123",
                createdAt: 0,
                readyAt: MID_SEASON,
                from: "betty",
                items: {
                  coins: 50,
                },
                reward: {},
              },
            ],
          },
        },
        action: {
          id: "123",
          type: "order.delivered",
        },
        createdAt: MID_SEASON,
      }),
    ).toThrow("Insufficient ingredient: coins");
  });

  it("takes sfl from player is required in delivery", () => {
    const balance = new Decimal(100);
    const game = deliverOrder({
      state: {
        ...TEST_FARM,
        balance,
        delivery: {
          ...TEST_FARM.delivery,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: MID_SEASON,
              from: "tywin",
              items: {
                sfl: 50,
              },
              reward: {},
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: MID_SEASON,
    });

    expect(game.balance).toEqual(balance.sub(50));
  });

  it("rewards sfl", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        inventory: {
          Sunflower: new Decimal(60),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 0,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: MID_SEASON,
              from: "betty",
              items: {
                Sunflower: 50,
              },
              reward: { sfl: 0.1 },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: MID_SEASON,
    });

    expect(state.balance).toEqual(new Decimal(0.1));
  });

  it("rewards apron boost with Sunflower Cake", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        bumpkin: {
          ...INITIAL_BUMPKIN,
          equipped: {
            ...INITIAL_BUMPKIN.equipped,
            coat: "Chef Apron",
          },
        },
        inventory: {
          "Sunflower Cake": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 0,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: MID_SEASON,
              from: "betty",
              items: {
                "Sunflower Cake": 1,
              },
              reward: { coins: 320 },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: MID_SEASON,
    });

    expect(state.coins).toEqual(384);
  });

  it("rewards apron boost with Eggplant Cake", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        bumpkin: {
          ...INITIAL_BUMPKIN,
          equipped: {
            ...INITIAL_BUMPKIN.equipped,
            coat: "Chef Apron",
          },
        },
        inventory: {
          "Eggplant Cake": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 0,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: MID_SEASON,
              from: "betty",
              items: {
                "Eggplant Cake": 1,
              },
              reward: { coins: 320 },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: MID_SEASON,
    });

    expect(state.coins).toEqual(384);
  });

  it("rewards apron boost with Orange Cake", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        bumpkin: {
          ...INITIAL_BUMPKIN,
          equipped: {
            ...INITIAL_BUMPKIN.equipped,
            coat: "Chef Apron",
          },
        },
        inventory: {
          "Orange Cake": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 0,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: MID_SEASON,
              from: "betty",
              items: {
                "Orange Cake": 1,
              },
              reward: { coins: 320 },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: MID_SEASON,
    });

    expect(state.coins).toEqual(384);
  });

  it("rewards michellin star boost", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        bumpkin: {
          ...INITIAL_BUMPKIN,
          skills: {
            "Michelin Stars": 1,
          },
        },
        inventory: {
          "Sunflower Cake": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 0,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: MID_SEASON,
              from: "betty",
              items: {
                "Sunflower Cake": 1,
              },
              reward: { coins: 320 },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: MID_SEASON,
    });

    expect(state.coins).toEqual(336);
  });

  it("rewards 25% SFL when Crown is Active", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        bumpkin: {
          ...INITIAL_BUMPKIN,
          equipped: {
            ...INITIAL_BUMPKIN.equipped,
            hat: "Goblin Crown",
          },
        },
        faction: {
          name: "goblins",
          pledgedAt: 0,
          history: {},
          points: 0,
        },
        inventory: {
          "Eggplant Cake": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 0,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: Date.now(),
              from: "betty",
              items: {
                "Eggplant Cake": 1,
              },
              reward: { sfl: 320 },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
    });

    expect(state.balance).toEqual(new Decimal(400));
  });

  it("rewards 25% Coins when Crown is Active", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        bumpkin: {
          ...INITIAL_BUMPKIN,
          equipped: {
            ...INITIAL_BUMPKIN.equipped,
            hat: "Goblin Crown",
          },
        },
        faction: {
          name: "goblins",
          pledgedAt: 0,
          history: {},
          points: 0,
        },
        inventory: {
          "Eggplant Cake": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 0,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: Date.now(),
              from: "betty",
              items: {
                "Eggplant Cake": 1,
              },
              reward: { coins: 320 },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
    });

    expect(state.coins).toEqual(400);
  });

  it("Crown Boost won't apply if not in a faction", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        bumpkin: {
          ...INITIAL_BUMPKIN,
          equipped: {
            ...INITIAL_BUMPKIN.equipped,
            hat: "Goblin Crown",
          },
        },
        faction: {
          name: "nightshades",
          pledgedAt: 0,
          history: {},
          points: 0,
        },
        inventory: {
          "Eggplant Cake": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 0,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: Date.now(),
              from: "betty",
              items: {
                "Eggplant Cake": 1,
              },
              reward: { coins: 320 },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
    });

    expect(state.coins).toEqual(320);
  });

  it("Crown Boost won't apply if not in the right faction", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        bumpkin: {
          ...INITIAL_BUMPKIN,
          equipped: {
            ...INITIAL_BUMPKIN.equipped,
            hat: "Goblin Crown",
          },
        },
        faction: {
          name: "nightshades",
          pledgedAt: 0,
          history: {},
          points: 0,
        },
        inventory: {
          "Eggplant Cake": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 0,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: Date.now(),
              from: "betty",
              items: {
                "Eggplant Cake": 1,
              },
              reward: { coins: 320 },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
    });

    expect(state.coins).toEqual(320);
  });

  it("rewards season tickets", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        inventory: {
          Gold: new Decimal(60),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 0,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: MID_SEASON,
              from: "pumpkin' pete",
              items: {
                Gold: 50,
              },
              reward: {},
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: MID_SEASON,
    });

    const seasonTicket = getSeasonalTicket();

    expect(state.inventory[seasonTicket]).toEqual(new Decimal(1));
  });

  it("rewards items", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        inventory: {
          Sunflower: new Decimal(60),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 1,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: MID_SEASON,
              from: "betty",
              items: {
                Sunflower: 50,
              },
              reward: { items: { Carrot: 1 } },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: MID_SEASON,
    });

    expect(state.inventory["Carrot"]).toEqual(new Decimal(1));
  });

  it("increments npc delivery count", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        inventory: {
          Sunflower: new Decimal(60),
          "Beta Pass": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 3,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: Date.now(),
              from: "betty",
              items: {
                Sunflower: 50,
              },
              reward: { items: { "Dawn Breaker Ticket": 1 } },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
    });

    expect(state.npcs?.betty).toBeDefined();
    expect(state.npcs?.betty?.deliveryCount).toEqual(1);
  });

  it("increments npc friendship", () => {
    const now = new Date("2024-05-09").getTime();
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        inventory: {
          Sunflower: new Decimal(60),
          "Beta Pass": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 3,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: now,
              from: "pumpkin' pete",
              items: {
                Sunflower: 50,
              },
              reward: { sfl: 0, items: { "Dawn Breaker Ticket": 1 } },
            },
          ],
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
        friendship: true,
      },
      createdAt: now,
    });

    expect(state.npcs?.["pumpkin' pete"]).toBeDefined();
    expect(state.npcs?.["pumpkin' pete"]?.friendship).toEqual({
      points: 3,
      updatedAt: now,
      giftClaimedAtPoints: 0,
    });
  });

  it("does not complete order with ticket rewards when frozen", () => {
    expect(() =>
      deliverOrder({
        state: {
          ...TEST_FARM,
          inventory: {
            Sunflower: new Decimal(60),
          },
          delivery: {
            ...TEST_FARM.delivery,
            fulfilledCount: 3,
            orders: [
              {
                id: "123",
                createdAt: 0,
                readyAt: FIRST_DAY_OF_SEASON,
                from: "pumpkin' pete",
                items: {
                  Sunflower: 50,
                },
                reward: {},
              },
            ],
          },
          bumpkin: INITIAL_BUMPKIN,
        },
        action: {
          id: "123",
          type: "order.delivered",
        },
        createdAt: FIRST_DAY_OF_SEASON,
      }),
    ).toThrow("Ticket tasks are frozen");
  });

  it("completes coin and sfl deliveries when tasks are frozen", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        inventory: {
          Sunflower: new Decimal(60),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 3,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: FIRST_DAY_OF_SEASON,
              from: "betty",
              items: {
                Sunflower: 50,
              },
              reward: { sfl: 10 },
            },
          ],
        },
        bumpkin: INITIAL_BUMPKIN,
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: FIRST_DAY_OF_SEASON,
    });

    expect(state.balance).toEqual(new Decimal(10));
    expect(state.inventory.Sunflower).toEqual(new Decimal(10));
  });

  it("provides the correct amount of tickets for deliveries", () => {
    const seasonNPCs = QUEST_NPC_NAMES;

    seasonNPCs.forEach((name) => {
      const state = deliverOrder({
        state: {
          ...TEST_FARM,
          inventory: {
            Sunflower: new Decimal(60),
          },
          delivery: {
            ...TEST_FARM.delivery,
            fulfilledCount: 3,
            orders: [
              {
                id: "123",
                createdAt: 0,
                readyAt: new Date("2023-10-31T15:00:00Z").getTime(),
                from: name,
                items: {
                  Sunflower: 50,
                },
                reward: {},
              },
            ],
          },
          bumpkin: INITIAL_BUMPKIN,
        },
        action: {
          id: "123",
          type: "order.delivered",
        },
        createdAt: new Date("2024-05-10T16:00:00Z").getTime(),
      });

      expect(state.inventory[getSeasonalTicket()]).toEqual(
        new Decimal(TICKET_REWARDS[name as QuestNPCName]),
      );
    });
  });

  it("provides normal tickets for non banner holder", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        inventory: {
          Sunflower: new Decimal(60),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 3,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: new Date("2023-10-31T15:00:00Z").getTime(),
              from: "pumpkin' pete",
              items: {
                Sunflower: 50,
              },
              reward: {},
            },
          ],
        },
        bumpkin: INITIAL_BUMPKIN,
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: new Date("2024-05-10T16:00:00Z").getTime(),
    });

    expect(state.inventory[getSeasonalTicket()]).toEqual(new Decimal(1));
  });

  it("provides +2 tickets for banner holder", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        inventory: {
          Sunflower: new Decimal(60),
          "Clash of Factions Banner": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 3,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: new Date("2023-10-31T15:00:00Z").getTime(),
              from: "pumpkin' pete",
              items: {
                Sunflower: 50,
              },
              reward: {},
            },
          ],
        },
        bumpkin: INITIAL_BUMPKIN,
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: new Date("2024-05-10T16:00:00Z").getTime(),
    });

    expect(state.inventory[getSeasonalTicket()]).toEqual(new Decimal(3));
  });

  it("provides +2 tickets for Lifetime Farmer banner holder", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        inventory: {
          Sunflower: new Decimal(60),
          "Lifetime Farmer Banner": new Decimal(1),
        },
        delivery: {
          ...TEST_FARM.delivery,
          fulfilledCount: 3,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: new Date("2023-10-31T15:00:00Z").getTime(),
              from: "pumpkin' pete",
              items: {
                Sunflower: 50,
              },
              reward: {},
            },
          ],
        },
        bumpkin: INITIAL_BUMPKIN,
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
      createdAt: new Date("2024-05-10T16:00:00Z").getTime(),
    });

    expect(state.inventory[getSeasonalTicket()]).toEqual(new Decimal(3));
  });

  it("add 10% more SFL profit on completed deliveries if player has SFL Swindler", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        balance: new Decimal(0),
        inventory: {
          "Sunflower Cake": new Decimal(1),
        },
        coins: 0,
        delivery: {
          ...TEST_FARM.delivery,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: Date.now(),
              from: "betty",
              items: {
                "Sunflower Cake": 1,
              },
              reward: { sfl: 100 },
            },
          ],
        },
        bumpkin: {
          ...INITIAL_BUMPKIN,
          skills: {
            "SFL Swindler": 1,
          },
        },
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
    });

    expect(state.balance).toEqual(new Decimal(110));
  });

  it("does not add 10% more SFL profit on completed deliveries with SFL Swindler if reward is not SFL", () => {
    const state = deliverOrder({
      state: {
        ...TEST_FARM,
        balance: new Decimal(100),
        inventory: {
          "Sunflower Cake": new Decimal(1),
        },
        coins: 0,
        delivery: {
          ...TEST_FARM.delivery,
          orders: [
            {
              id: "123",
              createdAt: 0,
              readyAt: Date.now(),
              from: "betty",
              items: {
                "Sunflower Cake": 1,
              },
              reward: { coins: 320 },
            },
          ],
        },
        bumpkin: INITIAL_BUMPKIN,
      },
      action: {
        id: "123",
        type: "order.delivered",
      },
    });

    expect(state.coins).toEqual(320);
  });
});
