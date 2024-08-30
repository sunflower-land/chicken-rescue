import { TEST_FARM } from "features/game/lib/constants";
import { FactionName } from "features/game/types/game";
import Decimal from "decimal.js-light";
import { joinFaction } from "./joinFaction";

describe("joinFaction", () => {
  it("throws an error if the faction is invalid", () => {
    expect(() =>
      joinFaction({
        state: TEST_FARM,
        action: {
          type: "faction.joined",
          faction: "invalid" as FactionName,
          sfl: 10,
        },
      }),
    ).toThrow("Invalid faction");
  });

  it("throws an error the player already joined a faction", () => {
    expect(() =>
      joinFaction({
        state: {
          ...TEST_FARM,
          balance: new Decimal(20),
          faction: {
            name: "bumpkins",
            pledgedAt: Date.now() - 1000,
            points: 0,
            history: {},
          },
        },
        action: {
          type: "faction.joined",
          faction: "sunflorians",
          sfl: 10,
        },
      }),
    ).toThrow("You already pledged a faction");
  });

  it("joins a faction", () => {
    const state = joinFaction({
      state: { ...TEST_FARM, balance: new Decimal(20) },
      action: {
        type: "faction.joined",
        faction: "sunflorians",
        sfl: 10,
      },
    });

    expect(state.faction).toBeDefined();
    expect(state.faction?.name).toBe("sunflorians");
    expect(state.faction?.pledgedAt).toBeGreaterThan(0);
    expect(state.faction?.points).toEqual(0);
  });

  it("adds the faction banner to the players inventory", () => {
    const state = joinFaction({
      state: { ...TEST_FARM, balance: new Decimal(20) },
      action: {
        type: "faction.joined",
        faction: "sunflorians",
        sfl: 10,
      },
    });

    expect(state.inventory["Sunflorian Faction Banner"]).toEqual(
      new Decimal(1),
    );
  });

  it("deducts 10 SFL from the players inventory", () => {
    const state = joinFaction({
      state: {
        ...TEST_FARM,
        balance: new Decimal(100),
        inventory: {
          ...TEST_FARM.inventory,
        },
      },
      action: {
        type: "faction.joined",
        faction: "sunflorians",
        sfl: 10,
      },
    });

    expect(state.balance).toEqual(new Decimal(90));
  });

  it("throws an error if the player doesn't have enough SFL", () => {
    expect(() =>
      joinFaction({
        state: {
          ...TEST_FARM,
          balance: new Decimal(0),
        },
        action: {
          type: "faction.joined",
          faction: "sunflorians",
          sfl: 10,
        },
      }),
    ).toThrow("Not enough SFL");
  });
});
