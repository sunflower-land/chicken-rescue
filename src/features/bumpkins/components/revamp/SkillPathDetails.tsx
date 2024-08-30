import React, { useContext, useState } from "react";
import {
  BumpkinSkillRevamp,
  BumpkinRevampSkillTree,
  createRevampSkillPath,
} from "features/game/types/bumpkinSkills";
import { useActor } from "@xstate/react";
import { Context } from "features/game/GameProvider";
import { PIXEL_SCALE } from "features/game/lib/constants";

// Component imports
import { SplitScreenView } from "components/ui/SplitScreenView";
import { Label } from "components/ui/Label";
import { Box } from "components/ui/Box";
import { Button } from "components/ui/Button";
import { SquareIcon } from "components/ui/SquareIcon";
import { ConfirmationModal } from "components/ui/ConfirmationModal";

// Function imports
import { getAvailableBumpkinSkillPoints } from "features/game/events/landExpansion/choseSkill";
import { gameAnalytics } from "lib/gameAnalytics";

// Icon imports
import { SUNNYSIDE } from "assets/sunnyside";

interface Props {
  selectedSkillPath: BumpkinRevampSkillTree;
  skillsInPath: BumpkinSkillRevamp[];
  readonly: boolean;
  onBack: () => void;
}

export const SkillPathDetails: React.FC<Props> = ({
  selectedSkillPath,
  skillsInPath,
  readonly,
  onBack,
}) => {
  const { gameService } = useContext(Context);
  const [gameState] = useActor(gameService);
  const {
    context: { state },
  } = gameState;
  const { bumpkin } = state;

  // States
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<BumpkinSkillRevamp>(
    skillsInPath[0],
  ); // Default to first skill in path

  // Functions
  const availableSkillPoints = getAvailableBumpkinSkillPoints(bumpkin);
  const hasSelectedSkill = !!bumpkin?.skills[selectedSkill.name];
  const claimedSkillsFromPath = Object.keys(bumpkin?.skills || {}).filter(
    (skill) => {
      return skillsInPath.find((pathSkill) => pathSkill.name === skill);
    },
  );
  const missingPointRequirement =
    selectedSkill.requirements.points > availableSkillPoints;
  const missingSkillsRequirement =
    selectedSkill.requirements.skill > claimedSkillsFromPath.length;

  // Claim
  const handleClaim = () => {
    setShowConfirmationModal(false);
    const state = gameService.send("skill.chosen", {
      skill: selectedSkill.name,
    });

    // Analytics
    gameAnalytics.trackMilestone({
      event: `Bumpkin:SkillUnlocked:${selectedSkill.name}`,
    });

    if (Object.keys(state.context.state.bumpkin.skills).length === 1) {
      gameAnalytics.trackMilestone({
        event: `Tutorial:Skill:Completed`,
      });
    }
  };

  const confirmationModal: React.ReactNode = (
    <ConfirmationModal
      show={showConfirmationModal}
      onHide={() => setShowConfirmationModal(false)}
      messages={[
        `Are you sure you want to claim ${selectedSkill.name}?`,
        `This will cost ${selectedSkill.requirements.points} skill points.`,
      ]}
      onCancel={() => setShowConfirmationModal(false)}
      onConfirm={handleClaim}
      confirmButtonLabel="Claim Skill"
      disabled={missingPointRequirement || missingSkillsRequirement}
    />
  );

  const renderSkillTier = (skills: BumpkinSkillRevamp[]) => {
    return skills.map((skill) => {
      const hasSkill = !!bumpkin?.skills[skill.name];

      return (
        <Box
          key={skill.name}
          className="mb-1"
          image={skill.image}
          isSelected={selectedSkill === skill}
          onClick={() => setSelectedSkill(skill)}
          showOverlay={hasSkill}
          overlayIcon={
            <img
              src={SUNNYSIDE.icons.confirm}
              alt="claimed"
              className="relative object-contain"
              style={{
                width: `${PIXEL_SCALE * 12}px`,
              }}
            />
          }
        >
          {skill.name}
        </Box>
      );
    });
  };

  return (
    <SplitScreenView
      wideModal
      panel={
        <div className="flex flex-col h-full justify-between">
          {/* Header */}
          <div className="flex flex-col h-full px-1 py-0">
            <div className="flex space-x-2 justify-start items-center sm:flex-col-reverse md:space-x-0">
              <div className="sm:mt-2">
                <SquareIcon icon={selectedSkill.image} width={14} />
              </div>
              <span className="sm:text-center">{selectedSkill.name}</span>
            </div>
            <span className="text-xs mb-2 sm:mt-1 whitespace-pre-line sm:text-center py-2">
              {selectedSkill.boosts}
            </span>
          </div>

          {/* Claim Button */}
          <div className="flex space-x-1 sm:space-x-0 sm:space-y-1 sm:flex-col w-full">
            <Button
              disabled={
                missingPointRequirement ||
                missingSkillsRequirement ||
                hasSelectedSkill ||
                selectedSkill.disabled ||
                readonly
              }
              onClick={() => setShowConfirmationModal(true)}
            >
              {hasSelectedSkill ? "Claimed" : "Claim"}
            </Button>
          </div>

          {/* Confirmation Modal */}
          {confirmationModal}
        </div>
      }
      content={
        <div className="pl-1">
          {/* Header */}
          <div
            className="flex flex-row my-2 items-center"
            style={{ margin: `${PIXEL_SCALE * 2}px` }}
          >
            <img
              src={SUNNYSIDE.icons.arrow_left}
              className="cursor-pointer"
              alt="back"
              style={{
                width: `${PIXEL_SCALE * 11}px`,
                marginRight: `${PIXEL_SCALE * 4}px`,
              }}
              onClick={onBack}
            />
            <Label type="default">{selectedSkillPath + " Skills"}</Label>
          </div>

          {/* Skills */}
          {Object.entries(createRevampSkillPath(skillsInPath)).map(
            ([tier, skills]) => {
              const requirements = skills[0].requirements.skill;
              const tierUnlocked = requirements <= claimedSkillsFromPath.length;

              return (
                <div key={tier} className="flex flex-col">
                  {requirements !== 0 && !tierUnlocked && (
                    <Label
                      type="warning"
                      icon={SUNNYSIDE.icons.lock}
                      className="ml-2"
                    >
                      {requirements +
                        " " +
                        selectedSkillPath +
                        " Skills Required"}
                    </Label>
                  )}
                  {requirements !== 0 && tierUnlocked && (
                    <Label
                      type="default"
                      icon={SUNNYSIDE.icons.confirm}
                      className="ml-2"
                    >
                      {`Tier ${tier} unlocked`}
                    </Label>
                  )}
                  <div className="flex flex-wrap mb-2">
                    {renderSkillTier(skills)}
                  </div>
                </div>
              );
            },
          )}
        </div>
      }
    />
  );
};
