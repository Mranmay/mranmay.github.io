export const projects = [
  {
    id: "visual-cortex",
    title: "Mapping inputs to visual cortex",
    field: "Functional connectomics",
    group: "Federico Rossi · IIT Rovereto",
    question:
      "Do the basal branches and apical tuft of a pyramidal neuron receive different visual information?",
    approach:
      "I use the MICrONS dataset to trace inputs onto layer 2/3 pyramidal cells in mouse V1. Pairing electron microscopy with visual responses lets me compare where synapses land on a cell with what its presynaptic partners respond to.",
    detail:
      "I compare the receptive fields of connected cells, map inputs by cortical depth, and test whether synapses with similar visual preferences cluster along a dendrite.",
  },
  {
    id: "spike-inference",
    title: "Inferring spikes from calcium",
    field: "Neural signal analysis",
    group: "Laurent Perrinet & Bruno Cessac · INT Marseille / Inria",
    question:
      "How accurately can we recover the timing of spikes from a slower fluorescence signal?",
    approach:
      "I compared spike-inference methods on mouse cortical recordings that pair two-photon fluorescence with electrophysiology. The electrical recording gives an independent reference for evaluating the inferred events.",
    detail:
      "I examined how the time window used to match events affects precision and recall, and compared event-level scores with correlations between binned spike trains.",
  },
  {
    id: "visual-memory",
    title: "Testing visual working memory",
    field: "Computational cognition",
    group: "Gabriel Kreiman · Kreiman Lab",
    question:
      "When a model recognizes a familiar image, can it also tell whether that image is the right answer now?",
    approach:
      "I study sequential recognition with a shared model across visual working-memory tasks. Changing which images recur lets me separate sensitivity to familiarity from the ability to identify the image a trial asks about.",
    detail:
      "I compare responses to exact matches, visually similar alternatives, and familiar distractors to identify which trial histories lead to recognition errors.",
  },
  {
    id: "retinal-computation",
    title: "Modeling the dynamic retina",
    field: "Retinal computation",
    group: "Bruno Cessac · Inria BIOVISION",
    question:
      "Which aspects of the retina’s response to a changing scene can a neural network capture?",
    approach:
      "At BIOVISION I reviewed how artificial neural networks model retinal responses over time. I compared the biological questions different models ask and how their predictions are evaluated.",
    detail:
      "This project grew out of my interest in the transformations that take place before a visual signal reaches cortex.",
  },
] as const;
export type ProjectId = (typeof projects)[number]["id"];
