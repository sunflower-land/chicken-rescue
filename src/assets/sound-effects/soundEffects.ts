/**
 * Sound effects are not stored in this repository
 */

import { CONFIG } from "lib/config";

export type Footsteps = "dirt_footstep" | "wood_footstep" | "sand_footstep";

export const SOUNDS = {
  ui: {
    hud: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Menu_UI/Designed/Farm_Game_User_Interface_Designed_Slide_Bass_Hit_Thump_Click_1.mp3`,
    tab: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Menu_UI/Designed/Farm_Game_User_Interface_Designed_Tab_Click_Bass_HIt_Thump_Plastic_3.mp3`,
    button: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Menu_UI/Designed/Farm_Game_User_Interface_Designed_Tab_Click_Bass_HIt_Thump_Plastic_4.mp3`,
    close: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Menu_UI/Designed/Farm_Game_User_Interface_Designed_Slide_Bass_Hit_Thump_Click_2.mp3`,
    travel: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Notifications/Farm_Game_Notification_Alert_Dark_Deep_Bass_Negative_Tonal_Slide_1.mp3`,
    profile: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Notifications/Farm_Game_Notification_Alert_Positive_Successful_Cook_Minigame_Chime_Tone_Dishes.mp3`,
    inventory: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Household/Furniture/Farm_Game_Household_Furniture_Other_Place_1_Basket_House.mp3`,
    copypaste: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Menu_UI/Designed/Farm_Game_User_Interface_Designed_Tube_Tonal_Hit_3_Liquid_Low_Bass.mp3`,
    sfl: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Notifications/Farm_Game_Notification_Alert_Coins_Buy_1_Shop.mp3`,
    no: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Household/Inventory/Farm_Game_Household_Inventory_Item_Drop_Throw_Away_2.mp3`,
  },
  footsteps: {
    dirt: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Footsteps/Dirt/Farm_Game_Footsteps_Dirt_1_Soil_Walk_Run_Ground_Surface.mp3`,
    wood: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Footsteps/Wood/Farm_Game_Footsteps_Wood_5_House_Walk_Run_Ground_Surface.mp3`,
    sand: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Footsteps/Sand/Farm_Game_Footsteps_Sand_5_Beach_Walk_Run_Ground_Surface.mp3`,
  },
  loops: {
    fire: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Loops/Nature Loops/Farm_Game_Loop_Nature_Ambience_Fire_1_Crackle_Hum_Warm_Relaxing.mp3`,
    nature_1: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Loops/Nature Loops/ambience_birds_crickets.mp3`,
    engine: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Loops/Mechanical Loops/Farm_Game_Loop_Mechanical_Engine_Tractor_Drive_1.mp3`,
    shoreline: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Loops/Nature Loops/Farm_Game_Loop_Nature_Ambience_Beach_Waves_1_Water_Shoreline_Crashing_Soft.mp3`,
    windy: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Loops/Nature Loops/Farm_Game_Loop_Nature_Ambience_Windy_Gusty_Day_Atmosphere.mp3`,
    desert: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Loops/Nature Loops/Farm_Game_Loop_Nature_Ambience_Hot_Dry_Summer_Day_with_Bugs_Atmosphere.mp3`,
  },
  songs: {
    mountain_escape: `${CONFIG.PROTECTED_IMAGE_URL}/songs/mountain_escape.mp3`,
    royal_farms: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/songs/royal_farms.mp3`,
    willow_tree: `${CONFIG.PROTECTED_IMAGE_URL}/songs/willow_tree.mp3`,
  },
  doors: {
    open: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Farming/Door/Farm_Game_Farming_Door_Open_Chest_2_Wood_Creak_Storage_Hinge.mp3`,
  },
  notifications: {
    chime: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Notifications/Farm_Game_Notification_Alert_Magic_New_Order_Task_Alert_Chime_Tone.mp3`,
    crow_collected: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Notifications/crow_collected.mp3`,
    portal_travel: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Notifications/Farm_Game_Notification_Alert_Farming_Tool_Power_Charge_Up_Ding_2_Heavy_Flow_Transition.mp3`,
    maze_over: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Fishing/Notification/Farm_Game_Fishing_Notification_Negative_Unsuccessful_Catch_3_Fail_Capture_Sad_Complete_Fish.mp3`,
  },
  voices: {
    ouph: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Animals/Human/Farm_Game_Animal_Vocal_Human_Character_Voice_Farmer_Ouph_Pain.mp3`,
  },
  animals: {},
  buildings: {
    bank: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Buildings/bank.mp3`,
    barn: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Buildings/barn.mp3`,
    tailor: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Buildings/tailor.mp3`,
    blacksmith: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Buildings/blacksmith.mp3`,
    kitchen: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Buildings/kitchen.mp3`,
    shop: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Buildings/shop.mp3`,
    wishing_well: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Buildings/wishing_well.mp3`,
  },
  resources: {
    harvest: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Resources/harvest.mp3`,
    plant: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Resources/plant.mp3`,
    mining: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Resources/mining.mp3`,
    mining_fall: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Resources/mining_fall.mp3`,
    chop: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Resources/chop.mp3`,
    tree_fall: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Resources/tree_fall.mp3`,
    chicken_1: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Animals/Bird/Bird_Chicken_Cluck_Chirp_Vocalization_1.mp3`,
    chicken_2: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Animals/Bird/Bird_Chicken_Cluck_Chirp_Vocalization_2.mp3`,
    mushroom_1: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Menu_UI/Collects/Farm_Game_User_Interface_Collect_Item_1_Click_Pop_Fun_Cartoon.mp3`,
    mushroom_2: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Menu_UI/Collects/Farm_Game_User_Interface_Collect_Item_2_Click_Pop_Fun_Cartoon.mp3`,
    mushroom_3: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Menu_UI/Collects/Farm_Game_User_Interface_Collect_Item_3_Click_Pop_Fun_Cartoon.mp3`,

    chicken_collect_1: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Animals/Bird/Bird_Chicken_Yelp_Cluck_Chirp_Vocalization_1.mp3`,
    chicken_collect_2: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Animals/Bird/Bird_Chicken_Yelp_Cluck_Chirp_Vocalization_2.mp3`,
  },
  misc: {
    battle: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Misc/battle.mp3`,
    war_chant: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Misc/war_chant.mp3`,
    fountain: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Misc/fountain.mp3`,
    begger: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Misc/begger.mp3`,
    diary: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Misc/diary.mp3`,
    fire_crackling: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Misc/fire_crackling.mp3`,
    mom_observatory_animation_sounds: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Misc/mom_observatory_animation_sounds.mp3`,
    game_over: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Misc/game_over.mp3`,
  },
  greedy_goblin: {
    intro: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Games/GreedyGoblin/intro.mp3`,
    playing: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Games/GreedyGoblin/playing.mp3`,
    pick: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Games/GreedyGoblin/pick.mp3`,
  },
  chicken_fight: {
    playing: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Games/ChickenFight/playing.mp3`,
    punch: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Games/ChickenFight/punch.mp3`,
    hit: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Games/ChickenFight/hit.mp3`,
  },
  faction: {
    barlow: `${CONFIG.PROTECTED_IMAGE_URL}/sound-effects/bumpkin-recruiter.mp3`,
    graxle: `${CONFIG.PROTECTED_IMAGE_URL}/sound-effects/goblin-recruiter.mp3`,
    nyx: `${CONFIG.PROTECTED_IMAGE_URL}/sound-effects/nightshade-recruiter.mp3`,
    reginald: `${CONFIG.PROTECTED_IMAGE_URL}/sound-effects/sunflorian-recruiter.mp3`,
  },
  desert: {
    dig: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Farming/Dig/Farm_Game_Farming_Dig_Hoe_Soil_Dirt_1_Garden.mp3`,
    drill: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Farming/Engines/Farm_Game_Farming_Tool_Engine_Contraption_Other_Garden_Machine_1_Device_Craft.mp3`,
    reveal: `${CONFIG.PROTECTED_IMAGE_URL}/sfx/Menu_UI/Collects/Farm_Game_User_Interface_Collect_Item_1_Click_Pop_Fun_Cartoon.mp3`,
  },
};
