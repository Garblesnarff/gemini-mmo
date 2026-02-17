export const QUEST_DEFINITIONS = [
  {
    id: 'q1',
    title: 'Cleansing the Plains',
    description: 'The boars are becoming aggressive. Thin their numbers to protect the camp.',
    objective: 'Kill Boars',
    required: 5,
    rewardXP: 150,
    type: 'kill',
    targetId: 'boar'
  },
  {
    id: 'q2',
    title: 'The Howling Pack',
    description: 'Wolves have been spotted stalking our hunters. Drive them back.',
    objective: 'Kill Wolves',
    required: 6,
    rewardXP: 250,
    type: 'kill',
    targetId: 'wolf'
  },
  {
    id: 'q3',
    title: 'Roots of the Earth',
    description: 'We need Earthroot to heal the wounded warriors. Gather them from the fields.',
    objective: 'Collect Earthroot',
    required: 5,
    rewardXP: 200,
    type: 'collect',
    targetId: 'earthroot'
  },
  {
    id: 'q4',
    title: 'Scout the Ruins',
    description: 'Strange energies emanate from the ancient ruins to the East. Go investigate.',
    objective: 'Visit Ruins',
    required: 1,
    rewardXP: 300,
    type: 'visit',
    targetCoordinates: { x: 60, z: -60, radius: 20 }
  },
  {
    id: 'q5',
    title: 'Ancestral Balance',
    description: 'The Kodo population is booming unchecked. We must restore balance.',
    objective: 'Kill Kodos',
    required: 5,
    rewardXP: 600,
    type: 'kill',
    targetId: 'kodo'
  },
  {
    id: 'q6',
    title: 'The Alpha Threat',
    description: 'A massive Alpha Wolf has been seen leading the pack. Defeat it to scatter them.',
    objective: 'Kill Alpha Wolf',
    required: 1,
    rewardXP: 800,
    type: 'kill',
    targetId: 'alpha_wolf'
  }
];