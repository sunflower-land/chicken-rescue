import "lib/__mocks__/configMock";
import { TEST_FARM, INITIAL_BUMPKIN } from "features/game/lib/constants";
import { LEVEL_EXPERIENCE } from "features/game/lib/level";
import { pickSkill } from "./pickSkill";

describe("PickSkill", () => {
  const dateNow = Date.now();

  it("requires level 2 to pick first skill", () => {
    expect(() => {
      pickSkill({
        state: {
          ...TEST_FARM,
          bumpkin: {
            ...INITIAL_BUMPKIN,
            experience: 0,
            skills: {},
          },
        },
        action: { type: "skill.picked", skill: "Green Thumb" },
        createdAt: dateNow,
      });
    }).toThrow("You do not have enough skill points");
  });

  it("requires Bumpkin has enough skill points available for Cultivator", () => {
    expect(() => {
      pickSkill({
        state: {
          ...TEST_FARM,
          bumpkin: {
            ...INITIAL_BUMPKIN,
            experience: LEVEL_EXPERIENCE[1],
            skills: { "Green Thumb": 1 },
          },
        },
        action: { type: "skill.picked", skill: "Cultivator" },
        createdAt: dateNow,
      });
    }).toThrow("You do not have enough skill points");
  });

  it("requires Bumpkin has enough skill points available for Master Farmer", () => {
    expect(() => {
      pickSkill({
        state: {
          ...TEST_FARM,
          bumpkin: {
            ...INITIAL_BUMPKIN,
            experience: LEVEL_EXPERIENCE[3],
            skills: { "Green Thumb": 1, Cultivator: 1 },
          },
        },
        action: { type: "skill.picked", skill: "Master Farmer" },
        createdAt: dateNow,
      });
    }).toThrow("You do not have enough skill points");
  });

  it("requires Bumpkin meets all requirements for Master Farmers", () => {
    expect(() => {
      pickSkill({
        state: {
          ...TEST_FARM,
          bumpkin: {
            ...INITIAL_BUMPKIN,
            experience: LEVEL_EXPERIENCE[4],
            skills: { "Green Thumb": 1 },
          },
        },
        action: { type: "skill.picked", skill: "Master Farmer" },
        createdAt: dateNow,
      });
    }).toThrow("Missing previous skill requirement");
  });

  it("prevents Bumpkin from picking the same skill twice", () => {
    expect(() => {
      pickSkill({
        state: {
          ...TEST_FARM,
          bumpkin: {
            ...INITIAL_BUMPKIN,
            experience: LEVEL_EXPERIENCE[4],
            skills: { "Green Thumb": 1 },
          },
        },
        action: { type: "skill.picked", skill: "Green Thumb" },
        createdAt: dateNow,
      });
    }).toThrow("You already have this skill");
  });

  it("adds the Green Thumb skill to bumpkin", () => {
    const result = pickSkill({
      state: {
        ...TEST_FARM,
        bumpkin: {
          ...INITIAL_BUMPKIN,
          experience: LEVEL_EXPERIENCE[2],
          skills: {},
        },
      },
      action: { type: "skill.picked", skill: "Green Thumb" },
      createdAt: dateNow,
    });

    expect(result.bumpkin?.skills).toEqual({ "Green Thumb": 1 });
  });

  it("adds the Cultivator skill to bumpkin", () => {
    const result = pickSkill({
      state: {
        ...TEST_FARM,
        bumpkin: {
          ...INITIAL_BUMPKIN,
          experience: LEVEL_EXPERIENCE[3],
          skills: { "Green Thumb": 1 },
        },
      },
      action: { type: "skill.picked", skill: "Cultivator" },
      createdAt: dateNow,
    });

    expect(result.bumpkin?.skills).toEqual({ Cultivator: 1, "Green Thumb": 1 });
  });
});
